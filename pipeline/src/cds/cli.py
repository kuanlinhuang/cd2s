"""Command line entry point: `cds <command>`."""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table

from cds.http import Client
from cds.paths import ensure_dirs

app = typer.Typer(add_completion=False, help="CD2S (Cancer Data to Study) pipeline")
console = Console()

SOURCES = ["gdc", "pdc", "htan", "idc", "cbioportal"]


@app.command()
def ingest(
    source: str = typer.Argument(..., help=f"One of: {', '.join(SOURCES)}, or 'all'"),
    limit: int | None = typer.Option(None, help="Only the N largest datasets (for smoke tests)"),
    shallow: bool = typer.Option(False, help="Skip per-dataset deep profiling"),
    max_age_days: float = typer.Option(7.0, help="Reuse cached responses younger than this"),
) -> None:
    """Fetch a source and write records to pipeline/data/raw/."""
    ensure_dirs()
    from cds import store

    targets = SOURCES if source == "all" else [source]
    for s in targets:
        if s == "gdc":
            from cds.sources import gdc as mod
        elif s == "pdc":
            from cds.sources import pdc as mod  # type: ignore[no-redef]
        elif s == "htan":
            from cds.sources import htan as mod  # type: ignore[no-redef]
        elif s == "idc":
            from cds.sources import idc as mod  # type: ignore[no-redef]
        elif s == "cbioportal":
            from cds.sources import cbioportal as mod  # type: ignore[no-redef]
        else:
            console.print(f"[yellow]no adapter for '{s}' yet, skipping[/yellow]")
            continue
        with Client(s, max_age_days=max_age_days) as c:
            console.print(f"[bold]ingest {s}[/bold] limit={limit} deep={not shallow}")
            records, manifest = mod.build(c, limit=limit, deep=not shallow)
            manifest["http_live"] = c.n_live
            manifest["http_cached"] = c.n_cached
        p = store.save_source(s, records, manifest)
        console.print(f"  wrote [green]{len(records)}[/green] records -> {p}")


@app.command("list")
def list_records(source: str = typer.Option("", help="Limit to one source file")) -> None:
    """Show what has been ingested."""
    from cds import store

    recs = store.load_source(source) if source else store.load_all_sources()
    t = Table(title=f"{len(recs)} records")
    for col in ("id", "cases", "assays", "access", "followup_mo", "tx_resp", "program"):
        t.add_column(col, overflow="fold")
    for r in sorted(recs, key=lambda r: -(r.cohort.n_cases or 0))[:60]:
        t.add_row(
            r.id,
            f"{r.cohort.n_cases:,}" if r.cohort.n_cases else "-",
            str(len(r.assays)),
            r.access.tier.value,
            str(r.longitudinal.median_followup_months or "-"),
            {True: "yes", False: "no", None: "?"}[r.longitudinal.has_treatment_response],
            r.program_name or "-",
        )
    console.print(t)


@app.command("merge")
def merge_cmd() -> None:
    """Merge per-source records into one record per cohort."""
    from cds import store
    from cds.normalize.merge import merge_records

    recs = store.load_all_sources()
    merged, stats = merge_records(recs)
    for k, v in stats.items():
        console.print(f"  {k}: {v}")
    store.save_source("merged", merged, {"stage": "merge", **stats})
    console.print(f"[green]{len(merged)}[/green] merged records written")


@app.command("trace-index")
def trace_index(
    limit: int | None = typer.Option(None),
    max_age_days: float = typer.Option(21.0),
    start: int = typer.Option(0, help="Resume from this offset"),
) -> None:
    """Index pass: comparable Europe PMC reuse counts for every dataset."""
    from cds import store
    from cds.reuse import trace

    # `corpus` is always the whole thing and is always what gets written; `targets` is
    # the window this invocation traces. Slicing the corpus down to the window and
    # saving that was a resume flag that destroyed what it resumed from: `--start 300`
    # wrote a "traced" stage holding records 300 onward and nothing before them.
    # Resuming continues the partially traced corpus; a run from the top starts again
    # from `merged`, so a regenerated corpus is never traced through a stale one.
    resuming = start > 0
    corpus = (
        (store.load_source("traced") if resuming else [])
        or store.load_source("merged")
        or store.load_all_sources()
    )
    targets = corpus[start : start + limit] if limit else corpus[start:]
    done = 0
    with Client("epmc", max_age_days=max_age_days) as c:
        for r in targets:
            r.reuse_metrics = trace.index_pass(c, r)
            done += 1
            if done % 25 == 0:
                console.print(
                    f"  {done}/{len(targets)} live={c.n_live} cached={c.n_cached} "
                    f"last={r.short_title} t3={r.reuse_metrics.n_by_tier.get('t3_analyzed')}"
                )
                store.save_source("traced", corpus, {"stage": "trace-index-partial"})
    store.save_source(
        "traced", corpus, {"stage": "trace-index", "n": len(corpus), "n_traced": len(targets)}
    )
    console.print(f"[green]traced {len(targets)}[/green] of {len(corpus)} records")


@app.command("gap")
def gap_cmd() -> None:
    """Fit the Reuse Gap Index over the traced corpus and label underexplored datasets."""
    import json

    from cds import store
    from cds.metrics import reuse_gap
    from cds.paths import DIST_DIR, WEB_DATA_DIR

    recs = store.load_source("traced")
    if not recs:
        console.print("[red]no traced records; run trace-index first[/red]")
        raise typer.Exit(1)
    frame, diag = reuse_gap.fit(recs)
    n_flagged = reuse_gap.apply_to_records(recs, frame, diag)
    for k, v in diag.items():
        console.print(f"  {k}: {v}")
    console.print(f"  n_flagged_underexplored: {n_flagged}")
    # Write back in place: curation runs after this and is the final stage, so the gap
    # model must not claim the output slot that expert overlays write to.
    store.save_source("traced", recs, {"stage": "gap", **diag})
    # The site links this file from /agents and the Methods page reads it at build time,
    # so it goes to both targets like every other export.
    for target in (DIST_DIR, WEB_DATA_DIR):
        target.mkdir(parents=True, exist_ok=True)
        (target / "reuse_gap_model.json").write_text(json.dumps(diag, indent=2, default=str))


@app.command("calibrate")
def calibrate_cmd(
    token: str = typer.Option(
        "", help="Accession to calibrate on; defaults to the most-reused one in the corpus"
    ),
    stage: str = typer.Option("traced", help="Stage to pick the reference accession from"),
    max_age_days: float = typer.Option(21.0),
) -> None:
    """Re-measure which Europe PMC fields discriminate reuse, and publish the numbers.

    The Methods page explains why the narrow DATA_AVAILABILITY field is used and the
    broad AVAILABILITY field is not. That explanation rests on a measurement, so the
    measurement is re-run and shipped rather than quoted from memory.
    """
    import json

    from cds import store
    from cds.paths import DIST_DIR, WEB_DATA_DIR
    from cds.reuse import epmc

    reference = token
    if not reference:
        from cds.reuse import trace

        recs = store.load_source(stage) or store.load_all_sources()
        # Calibrate on the most-reused accession in the corpus: the comparison is only
        # informative where the broad field has enough articles to be wrong about.
        candidates = [
            (r, trace.tokens_for(r, limit=1)) for r in recs if r.reuse_metrics.has_citable_accession
        ]
        best = max(
            ((r, toks[0]) for r, toks in candidates if toks),
            key=lambda pair: pair[0].reuse_metrics.n_by_tier.get("t3_analyzed") or 0,
            default=None,
        )
        if best is None:
            console.print("[red]no record with a citable accession to calibrate on[/red]")
            raise typer.Exit(1)
        reference = best[1]
        console.print(f"  reference accession: {reference} (from {best[0].id})")

    with Client("epmc", max_age_days=max_age_days) as c:
        result = epmc.calibrate_fields(c, reference)
    for k, v in result.items():
        if k != "note":
            console.print(f"  {k}: {v}")
    if not result["sentinel_passes"]:
        console.print(
            "[red]sentinel field returned hits: section-scoped counts cannot be trusted[/red]"
        )
        raise typer.Exit(1)
    for target in (DIST_DIR, WEB_DATA_DIR):
        target.mkdir(parents=True, exist_ok=True)
        (target / "field_calibration.json").write_text(json.dumps(result, indent=2, default=str))
    console.print("[green]wrote field_calibration.json[/green]")


@app.command("export")
def export_cmd(stage: str = typer.Option("enriched", help="Which stage to export")) -> None:
    """Write site data, structured metadata and agent packages."""
    from cds import store
    from cds.export import site

    recs = store.load_source(stage)
    if not recs:
        for fallback in ("enriched", "traced", "merged"):
            recs = store.load_source(fallback)
            if recs:
                console.print(f"[yellow]stage '{stage}' empty, using '{fallback}'[/yellow]")
                break
    if not recs:
        console.print("[red]nothing to export[/red]")
        raise typer.Exit(1)
    result = site.write_all(recs, extra_manifest={"stage": stage})
    for k, v in result.items():
        console.print(f"  {k}: {v}")


@app.command("enrich")
def enrich_cmd(
    limit: int | None = typer.Option(None),
    max_age_days: float = typer.Option(21.0),
    only_citable: bool = typer.Option(True, help="Skip datasets with no citable accession"),
) -> None:
    """Date availability, fetch exemplar reuse studies, and link funded reuse."""
    from cds import store
    from cds.reuse import enrich

    recs = store.load_source("traced")
    if not recs:
        console.print("[red]no traced records; run trace-index first[/red]")
        raise typer.Exit(1)
    targets = [r for r in recs if (not only_citable) or r.reuse_metrics.has_citable_accession]
    if limit:
        targets = targets[:limit]
    console.print(f"enriching {len(targets)} of {len(recs)} records")
    done = 0
    with Client("epmc", max_age_days=max_age_days) as c:
        for r in targets:
            try:
                enrich.enrich_record(c, r)
            except Exception as exc:  # noqa: BLE001 - one bad record must not stop the pass
                console.print(f"[yellow]{r.id}: {type(exc).__name__}: {exc}[/yellow]")
            done += 1
            if done % 20 == 0:
                console.print(
                    f"  {done}/{len(targets)} live={c.n_live} cached={c.n_cached} "
                    f"last={r.short_title} anchor={r.release_date} reuse={len(r.reuse)}"
                )
                store.save_source("traced", recs, {"stage": "enrich-partial"})

    # Corpus-level check, after every record has been enriched: a machine-nominated
    # marker paper claimed by more than one dataset is wrong for all but one of them.
    withdrawn = enrich.drop_ambiguous_inferred_primaries(recs)
    for k, v in withdrawn.items():
        if k != "withdrawn_pmids":
            console.print(f"  marker_papers.{k}: {v}")

    store.save_source(
        "traced",
        recs,
        {"stage": "enrich", "n_enriched": len(targets), "marker_papers": withdrawn},
    )
    console.print(f"[green]enriched {len(targets)}[/green]")


@app.command("curate")
def curate_cmd(
    stage_in: str = typer.Option("traced", help="Stage to read"),
    stage_out: str = typer.Option("enriched", help="Stage to write"),
    strict: bool = typer.Option(True, help="Fail if an overlay references an unknown id"),
) -> None:
    """Apply expert overlays from pipeline/data/curated/ onto the records."""
    from cds import store
    from cds.normalize import curate

    recs = store.load_source(stage_in)
    if not recs:
        console.print(f"[red]no records at stage '{stage_in}'[/red]")
        raise typer.Exit(1)
    applied, stats = curate.apply_all(recs)

    # Overlays are where a reviewer names the marker paper, and for GDC and PDC that is
    # the only place it exists - their APIs return no publication. The index pass counted
    # citations before any of that was known, so the count is refreshed here against the
    # publications the record now actually has.
    from cds.reuse import trace as trace_mod

    n_recounted = 0
    with Client("epmc", max_age_days=30.0) as c:
        for r in recs:
            if not r.primary_publications:
                continue
            try:
                n_recounted += trace_mod.refresh_citation_metrics(c, r)
            except Exception as exc:  # noqa: BLE001 - one bad lookup must not stop curation
                console.print(f"[yellow]{r.id}: citation refresh failed: {exc}[/yellow]")
    console.print(f"  citation counts refreshed: {n_recounted}")

    from cds.metrics import reuse_gap

    n_basis = reuse_gap.refresh_underexplored_basis(recs)
    console.print(f"  underexplored labels gaining the citation sentence: {n_basis}")

    # A route to the data for every record, not only the twenty a reviewer wrote up.
    # This runs after overlays so a reviewed route is never overwritten by a generated
    # one, and generated steps are excluded from the completeness score: a derived route
    # is repository policy, not curation.
    from cds.normalize import access as access_mod

    access_stats = access_mod.apply_all(recs)
    for k, v in access_stats.items():
        console.print(f"  access.{k}: {v}")

    wb_stats = curate.attach_workbooks(recs)
    for k, v in wb_stats.items():
        console.print(f"  workbooks.{k}: {v}")
    for r in recs:
        r.completeness_score = curate.completeness(r)
    console.print(f"  overlays found: {stats['n_overlays_found']}")
    console.print(f"  applied: {stats['n_applied']}")
    if stats["n_unmatched"]:
        console.print(f"  [yellow]unmatched: {stats['unmatched_ids']}[/yellow]")
        if strict:
            raise typer.Exit(2)
    showcase = [r for r in recs if r.is_showcase]
    reviewed = [r for r in recs if r.review.status.value == "expert_reviewed"]
    console.print(f"  showcase: {len(showcase)}  expert reviewed: {len(reviewed)}")
    store.save_source(
        stage_out,
        recs,
        {
            "stage": "curate",
            **{k: v for k, v in stats.items() if k != "fields_changed"},
            "access_routes": access_stats,
        },
    )
    console.print(f"[green]wrote {len(recs)} records to '{stage_out}'[/green]")


@app.command("workbooks")
def workbooks_cmd(
    only: str | None = typer.Option(None, help="Substring match on workbook name"),
    timeout: int = typer.Option(1200, help="Per-notebook execution timeout in seconds"),
) -> None:
    """Build and execute the analysis workbooks, writing an execution receipt for each."""
    from cds import workbooks as wb

    receipts = wb.execute_all(only=only, timeout=timeout)
    ok = 0
    for r in receipts:
        status = "[green]ran[/green]" if r.executed else "[red]failed[/red]"
        console.print(
            f"  {status} {r.workbook}  {r.runtime_seconds}s  cells {r.n_cells_executed}/{r.n_cells}"
        )
        if r.error:
            console.print(f"      [yellow]{r.error[:400]}[/yellow]")
        ok += bool(r.executed)
    console.print(f"[bold]{ok}/{len(receipts)} Python workbooks executed successfully[/bold]")
    unrun = wb.r_workbooks()
    if unrun:
        console.print(
            f"  [yellow]{len(unrun)} R workbook(s) present but not executed "
            f"(no R kernel here): {', '.join(p.name for p in unrun)}[/yellow]"
        )
    if ok < len(receipts):
        raise typer.Exit(1)


@app.command("verify")
def verify_cmd(
    stage: str = typer.Option("enriched"),
    limit: int | None = typer.Option(None),
    showcase_only: bool = typer.Option(False, help="Only verify showcase datasets"),
) -> None:
    """Check that the links on each page still resolve, and record when."""
    import json

    from cds import store
    from cds.paths import DIST_DIR
    from cds.verify import check

    recs = store.load_source(stage)
    if not recs:
        console.print(f"[red]nothing at stage '{stage}'[/red]")
        raise typer.Exit(1)
    report = check.run(recs, limit=limit, showcase_only=showcase_only)
    for k, v in report.items():
        if k != "broken_examples":
            console.print(f"  {k}: {v}")
    if report["broken_examples"]:
        console.print(f"  [yellow]broken ({len(report['broken_examples'])} shown):[/yellow]")
        for b in report["broken_examples"][:12]:
            console.print(f"    {b['status']} {b['url'][:88]}  ({b['dataset']})")
    store.save_source(
        stage,
        recs,
        {"stage": "verify", **{k: v for k, v in report.items() if k != "broken_examples"}},
    )
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    (DIST_DIR / "verification_report.json").write_text(json.dumps(report, indent=2, default=str))


if __name__ == "__main__":
    app()
