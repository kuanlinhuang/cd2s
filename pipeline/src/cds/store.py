"""Persistence for the record corpus.

Records are stored as newline-delimited JSON so a partial build is still readable and a
single dataset can be diffed without rewriting the world. Merging is explicit: a later
source never silently clobbers an earlier one, it appends identifiers and evidence.
"""

from __future__ import annotations

from collections.abc import Iterable
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import orjson

from cds.model import DatasetRecord, RecordStore
from cds.paths import DIST_DIR, RAW_DIR, ensure_dirs


def _dump(obj: Any) -> bytes:
    return orjson.dumps(obj, option=orjson.OPT_SERIALIZE_NUMPY | orjson.OPT_NON_STR_KEYS)


def write_jsonl(records: Iterable[DatasetRecord], path: Path) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    n = 0
    with path.open("wb") as fh:
        for r in records:
            fh.write(_dump(r.model_dump(mode="json")))
            fh.write(b"\n")
            n += 1
    return n


def read_jsonl(path: Path) -> list[DatasetRecord]:
    if not path.exists():
        return []
    out: list[DatasetRecord] = []
    with path.open("rb") as fh:
        for line in fh:
            line = line.strip()
            if line:
                out.append(DatasetRecord.model_validate(orjson.loads(line)))
    return out


def source_path(source: str) -> Path:
    ensure_dirs()
    return RAW_DIR / f"{source}.records.jsonl"


def save_source(source: str, records: list[DatasetRecord], manifest: dict[str, Any]) -> Path:
    p = source_path(source)
    write_jsonl(records, p)
    (RAW_DIR / f"{source}.manifest.json").write_bytes(_dump(manifest))
    return p


def load_source(source: str) -> list[DatasetRecord]:
    return read_jsonl(source_path(source))


# Stages written by the pipeline itself, excluded when loading upstream sources so a
# rerun never folds its own output back into the input.
DERIVED_STAGES = {"merged", "traced", "enriched", "final"}


def load_all_sources(sources: list[str] | None = None) -> list[DatasetRecord]:
    ensure_dirs()
    if sources:
        paths = [source_path(s) for s in sources]
    else:
        paths = [
            p
            for p in sorted(RAW_DIR.glob("*.records.jsonl"))
            if p.name.removesuffix(".records.jsonl") not in DERIVED_STAGES
        ]
    out: list[DatasetRecord] = []
    for p in paths:
        out.extend(read_jsonl(p))
    return out


def save_store(records: list[DatasetRecord], manifest: dict[str, Any]) -> Path:
    ensure_dirs()
    store = RecordStore(
        generated_at=datetime.now(UTC),
        n_records=len(records),
        records=records,
        source_manifest=manifest,
    )
    p = DIST_DIR / "records.json"
    p.write_bytes(orjson.dumps(store.model_dump(mode="json"), option=orjson.OPT_INDENT_2))
    write_jsonl(records, DIST_DIR / "records.jsonl")
    return p


def load_store() -> RecordStore | None:
    p = DIST_DIR / "records.json"
    if not p.exists():
        return None
    return RecordStore.model_validate(orjson.loads(p.read_bytes()))
