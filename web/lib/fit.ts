import { isNonAnswer } from "@/lib/format";
import type { ClinicalVariable, DatasetRecord, Evidence } from "@/lib/types";

/**
 * Can this dataset answer your question?
 *
 * Six classes of analysis a researcher most often needs, each judged from the
 * repository's own field completeness rather than from what the catalog says the
 * dataset contains. The rules and thresholds are the ones in the executed workbook
 * "Can I answer this question with this dataset?", so a verdict on a page can be
 * reproduced against the live API in about a minute.
 *
 * Three honest outcomes and one honest non-answer:
 *
 *   supported  the fields the analysis depends on are informative for enough cases
 *   limited    present, but for too few cases to carry the analysis on its own
 *   blocked    present in name only, or absent from the harmonized records
 *   unknown    we did not measure it for this record, so nothing should be assumed
 *
 * "Unknown" is deliberately not folded into "blocked". Most records in the corpus
 * come from repositories whose clinical tables we have not yet probed field by field,
 * and an agent that read "unknown" as "no" would discard usable cohorts.
 */

export type FitStatus = "supported" | "limited" | "blocked" | "unknown";

export interface FitVerdict {
  key: string;
  /** The analysis, as a researcher would name it. */
  label: string;
  status: FitStatus;
  /** One sentence naming the field and the number behind the verdict. */
  reason: string;
  /** Harmonized field names the verdict read, for the agent and for the JSON. */
  fields: string[];
  /** The share of cases the decisive field is informative for, when measured. */
  pct: number | null;
  evidence: Evidence[];
}

export const FIT_STATUS_LABELS: Record<FitStatus, string> = {
  supported: "Supported",
  limited: "Limited",
  blocked: "Not supported",
  unknown: "Not measured",
};

export const FIT_STATUS_MEANING: Record<FitStatus, string> = {
  supported: "The fields this analysis depends on hold real values for enough of the cohort.",
  limited: "The fields exist and hold some real values, but for too few cases to carry the analysis alone.",
  blocked: "The fields are absent from the harmonized records, or filled only with 'not reported'.",
  unknown: "Field completeness has not been measured for this record. Do not read this as 'no'.",
};

/** The thresholds, in one place, so the Methods page and the verdicts cannot drift. */
export const FIT_RULES = [
  {
    key: "survival",
    label: "Overall survival",
    fields: "vital status with days to death or last follow-up",
    supported: "vital status informative for at least 20 cases, with at least 10 deaths and a usable time",
    limited: "vital status informative, but too few events or no time field",
  },
  {
    key: "progression",
    label: "Progression or recurrence",
    fields: "progression_or_recurrence at diagnosis or follow-up",
    supported: "informative for 30% of cases or more",
    limited: "informative for 5% to 30% of cases",
  },
  {
    key: "treatment",
    label: "Treatment response",
    fields: "treatment_outcome or disease_response at follow-up",
    supported: "populated for 30% of cases or more",
    limited: "populated for 5% to 30% of cases",
  },
  {
    key: "agents",
    label: "Which drug was given",
    fields: "therapeutic_agents",
    supported: "recorded for 25% of cases or more",
    limited: "recorded for 5% to 25% of cases",
  },
  {
    key: "stage",
    label: "Stage-adjusted modelling",
    fields: "AJCC pathologic or clinical stage",
    supported: "informative for 50% of cases or more",
    limited: "informative for 20% to 50% of cases",
  },
  {
    key: "race",
    label: "Analysis by race or ethnicity",
    fields: "race, or ethnicity",
    supported: "informative for 50% of cases or more",
    limited: "informative for 20% to 50% of cases",
  },
] as const;

/**
 * Index the measured variables by every name a verdict might look them up under.
 *
 * Each repository names its clinical fields its own way - `demographic.vital_status`
 * in GDC, `pdc:vital_status` in PDC, `cbioportal:OS_STATUS` in cBioPortal - and every
 * one of them also carries the harmonized name of the concept. The verdicts read the
 * harmonized name, so one set of rules covers the whole corpus.
 *
 * Where two fields claim the same concept - PDC serves both `ajcc_pathologic_stage`
 * and a legacy `tumor_stage` - the one informative for more of the cohort wins, because
 * the question is whether the analysis is possible at all, not which column to use.
 */
function byName(vars: ClinicalVariable[]): Map<string, ClinicalVariable> {
  const m = new Map<string, ClinicalVariable>();
  const share = (v: ClinicalVariable) => v.coverage_pct ?? v.populated_pct ?? 0;
  for (const v of vars) {
    m.set(v.name.toLowerCase(), v);
    const h = v.harmonized_name?.toLowerCase();
    if (!h) continue;
    const cur = m.get(h);
    if (!cur || share(v) > share(cur)) m.set(h, v);
  }
  return m;
}

/** Share of cases a field is informative for; falls back to populated for 1:n fields. */
function informative(v: ClinicalVariable | undefined): number | null {
  if (!v) return null;
  if (v.coverage_pct !== null && v.coverage_pct !== undefined) return v.coverage_pct;
  if (v.populated_pct !== null && v.populated_pct !== undefined) return v.populated_pct;
  return null;
}

function populated(v: ClinicalVariable | undefined): number | null {
  if (!v) return null;
  if (v.populated_pct !== null && v.populated_pct !== undefined) return v.populated_pct;
  if (v.coverage_pct !== null && v.coverage_pct !== undefined) return v.coverage_pct;
  return null;
}

function pctText(p: number): string {
  return `${p < 1 && p > 0 ? p.toFixed(1) : Math.round(p)}%`;
}

/**
 * The field name as its repository spells it, without the routing prefix.
 *
 * Every adapter namespaces its fields - `pdc:vital_status`, `cbioportal:OS_STATUS`,
 * `demographic.vital_status` - so a reader can find the field in the source API. The
 * prefix is noise in a sentence, and the sentence is capitalised by CSS, which turned
 * `pdc:progression_or_recurrence` into `Pdc:progression_or_recurrence`.
 */
function short(name: string): string {
  const withoutNamespace = name.includes(":") ? name.slice(name.indexOf(":") + 1) : name;
  return withoutNamespace.split(".").pop() || withoutNamespace;
}

/**
 * Pick the best of several candidate fields and grade it against two thresholds.
 * Returns null when none of the candidates was measured.
 */
function grade(
  vars: Map<string, ClinicalVariable>,
  candidates: string[],
  read: (v: ClinicalVariable | undefined) => number | null,
  supportedAt: number,
  limitedAt: number,
  verb: string,
): { status: FitStatus; reason: string; fields: string[]; pct: number; evidence: Evidence[] } | null {
  let best: { v: ClinicalVariable; pct: number } | null = null;
  const seen: string[] = [];
  for (const name of candidates) {
    const v = vars.get(name.toLowerCase());
    const p = read(v);
    if (v && p !== null) {
      seen.push(v.name);
      if (!best || p > best.pct) best = { v, pct: p };
    }
  }
  if (!best) return null;
  const status: FitStatus = best.pct >= supportedAt ? "supported" : best.pct >= limitedAt ? "limited" : "blocked";
  const reason =
    best.pct === 0
      ? `${short(best.v.name)} is ${verb} for no case in the harmonized records`
      : `${short(best.v.name)} is ${verb} for ${pctText(best.pct)} of cases`;
  return { status, reason, fields: seen, pct: best.pct, evidence: best.v.evidence };
}

function informativeShare(values: Record<string, number>): number | null {
  const entries = Object.entries(values);
  if (entries.length === 0) return null;
  const total = entries.reduce((a, [, n]) => a + n, 0);
  if (total === 0) return null;
  const good = entries.filter(([k]) => !isNonAnswer(k)).reduce((a, [, n]) => a + n, 0);
  return (100 * good) / total;
}

/**
 * A repository that ships one table per topic rather than harmonized fields (HTAN)
 * tells us only that a table exists for some share of cases. That earns "limited" at
 * best, with the reason saying why.
 */
function tableOnly(
  vars: Map<string, ClinicalVariable>,
  table: string,
  what: string,
): { status: FitStatus; reason: string; fields: string[]; pct: number | null; evidence: Evidence[] } | null {
  const v = vars.get(table.toLowerCase());
  if (!v) return null;
  const p = populated(v);
  if (p === null) {
    return {
      status: "unknown",
      reason: `a ${what} table is listed for this atlas, but how many cases it covers was not measured`,
      fields: [v.name],
      pct: null,
      evidence: v.evidence,
    };
  }
  if (p === 0) {
    return { status: "blocked", reason: `no ${what} table is attached to any case`, fields: [v.name], pct: 0, evidence: v.evidence };
  }
  return {
    status: "limited",
    reason: `a ${what} table exists for ${pctText(p)} of cases; its individual fields were not measured`,
    fields: [v.name],
    pct: p,
    evidence: v.evidence,
  };
}

const unknown = (key: string, label: string, why: string): FitVerdict => ({
  key,
  label,
  status: "unknown",
  reason: why,
  fields: [],
  pct: null,
  evidence: [],
});

export function fitVerdicts(r: DatasetRecord): FitVerdict[] {
  const vars = byName(r.clinical_variables);
  const measured = r.clinical_variables.length > 0;
  const notMeasured = measured
    ? "this field was not among those probed for this repository"
    : "clinical field completeness has not been measured for this record";
  const L = r.longitudinal;
  const out: FitVerdict[] = [];

  // 1. overall survival ---------------------------------------------------------
  {
    const label = "Overall survival";
    const vital = vars.get("demographic.vital_status");
    const vitalPct = informative(vital) ?? informativeShare(r.cohort.demographics.vital_status);
    // The question is overall survival specifically, so the endpoint list has to contain
    // it. A cohort whose only endpoint is progression-free was reading as "overall
    // survival: supported" while its vital status was "unknown" for every case.
    const hasOverallSurvival = L.survival_endpoints.some((e) => /overall survival/i.test(e));
    if (L.has_survival_endpoint === true && hasOverallSurvival) {
      const bits = [
        L.median_followup_months ? `median follow-up ${(L.median_followup_months / 12).toFixed(1)} years` : null,
        L.n_cases_with_followup ? `${L.n_cases_with_followup.toLocaleString("en-US")} cases with follow-up` : null,
        L.survival_endpoints.length
          ? `${L.survival_endpoints.length === 1 ? "endpoint" : "endpoints"}: ${L.survival_endpoints.join(", ")}`
          : null,
      ].filter(Boolean);
      out.push({
        key: "survival",
        label,
        status: "supported",
        reason: bits.length ? `vital status and time are populated; ${bits.join("; ")}` : "vital status and a time to event are populated",
        fields: ["demographic.vital_status", "demographic.days_to_death", "diagnoses.days_to_last_follow_up"],
        pct: vitalPct,
        evidence: L.evidence,
      });
    } else if (L.has_survival_endpoint !== null) {
      // No trailing period: the renderer adds one, and two read as a typo.
      const otherEndpoints = L.survival_endpoints.length
        ? `; the cohort does carry ${L.survival_endpoints.join(" and ")}`
        : "";
      out.push({
        key: "survival",
        label,
        status: vitalPct !== null && vitalPct > 0 ? "limited" : "blocked",
        reason:
          (vitalPct === null
            ? "no usable overall-survival endpoint: vital status or follow-up time is missing"
            : vitalPct === 0
              ? "vital status is recorded for every case and informative for none"
              : `vital status is informative for ${pctText(vitalPct)} of cases, but too few events or no time to event`) +
          otherEndpoints,
        fields: ["demographic.vital_status", "demographic.days_to_death", "diagnoses.days_to_last_follow_up"],
        pct: vitalPct,
        evidence: L.evidence.length ? L.evidence : (vital?.evidence ?? r.cohort.demographics.evidence),
      });
    } else if (vitalPct !== null) {
      out.push({
        key: "survival",
        label,
        status: vitalPct >= 50 ? "limited" : "blocked",
        reason:
          vitalPct === 0
            ? "vital status is recorded and informative for no case"
            : `vital status is informative for ${pctText(vitalPct)} of cases; a time to event was not measured`,
        fields: ["demographic.vital_status"],
        pct: vitalPct,
        evidence: vital?.evidence ?? r.cohort.demographics.evidence,
      });
    } else {
      const t = tableOnly(vars, "htan:FollowUp", "follow-up");
      out.push(t ? { key: "survival", label, ...t } : unknown("survival", label, notMeasured));
    }
  }

  // 2. progression or recurrence -------------------------------------------------
  {
    const label = "Progression or recurrence";
    // A measured progression or recurrence endpoint is direct evidence that the analysis
    // runs, and it is stronger than the yes/no field: the field says the event was
    // recorded, the endpoint says a time to it was too.
    const progressionEndpoints = L.survival_endpoints.filter((e) =>
      /recurrence-free|progression-free|disease-free/i.test(e),
    );
    const g =
      grade(vars, ["diagnoses.progression_or_recurrence", "follow_ups.progression_or_recurrence"], informative, 30, 5, "informative") ??
      tableOnly(vars, "htan:FollowUp", "follow-up");
    if (progressionEndpoints.length > 0) {
      out.push({
        key: "progression",
        label,
        status: "supported",
        reason: `a time to event is derivable: ${progressionEndpoints.join(", ")}${
          g && g.pct !== null ? `; progression_or_recurrence is informative for ${pctText(g.pct)} of cases` : ""
        }`,
        fields: g?.fields ?? ["diagnoses.days_to_recurrence"],
        pct: g?.pct ?? null,
        evidence: L.evidence.length ? L.evidence : (g?.evidence ?? []),
      });
    } else {
      out.push(g ? { key: "progression", label, ...g } : unknown("progression", label, notMeasured));
    }
  }

  // 3. treatment response ----------------------------------------------------------
  {
    const label = "Treatment response";
    const g = grade(vars, ["diagnoses.treatments.treatment_outcome", "follow_ups.disease_response"], populated, 30, 5, "populated");
    if (L.has_treatment_response === true) {
      out.push({
        key: "treatment",
        label,
        status: "supported",
        reason: g
          ? g.reason + (L.response_criteria.length ? `; criteria: ${L.response_criteria.slice(0, 2).join(", ")}` : "")
          : `treatment given and a response field are recorded${L.response_criteria.length ? ` (${L.response_criteria.slice(0, 2).join(", ")})` : ""}`,
        fields: g?.fields ?? ["diagnoses.treatments.treatment_outcome"],
        pct: g?.pct ?? null,
        evidence: L.evidence,
      });
    } else if (L.has_treatment_response === false) {
      out.push({
        key: "treatment",
        label,
        status: g && g.pct >= 5 ? "limited" : "blocked",
        reason: g ? g.reason : "no treatment response is recorded in the harmonized records",
        fields: g?.fields ?? ["diagnoses.treatments.treatment_outcome"],
        pct: g?.pct ?? null,
        evidence: L.evidence.length ? L.evidence : (g?.evidence ?? []),
      });
    } else {
      const t = g ?? tableOnly(vars, "htan:Therapy", "therapy");
      out.push(t ? { key: "treatment", label, ...t } : unknown("treatment", label, notMeasured));
    }
  }

  // 4. which drug was given ------------------------------------------------------
  {
    const label = "Which drug was given";
    const g =
      grade(vars, ["diagnoses.treatments.therapeutic_agents"], populated, 25, 5, "recorded") ??
      tableOnly(vars, "htan:Therapy", "therapy");
    out.push(g ? { key: "agents", label, ...g } : unknown("agents", label, notMeasured));
  }

  // 5. stage ---------------------------------------------------------------------
  {
    const label = "Stage-adjusted modelling";
    const g =
      grade(vars, ["diagnoses.ajcc_pathologic_stage", "diagnoses.ajcc_clinical_stage"], informative, 50, 20, "informative") ??
      tableOnly(vars, "htan:Diagnosis", "diagnosis");
    out.push(g ? { key: "stage", label, ...g } : unknown("stage", label, notMeasured));
  }

  // 6. race or ethnicity -----------------------------------------------------------
  {
    const label = "Analysis by race or ethnicity";
    const g = grade(vars, ["demographic.race", "demographic.ethnicity"], informative, 50, 20, "informative");
    if (g) {
      out.push({ key: "race", label, ...g });
    } else {
      const share = informativeShare(r.cohort.demographics.race) ?? informativeShare(r.cohort.demographics.ethnicity);
      if (share !== null) {
        out.push({
          key: "race",
          label,
          status: share >= 50 ? "supported" : share >= 20 ? "limited" : "blocked",
          reason: share === 0 ? "race is 'not reported' for every case" : `race is informative for ${pctText(share)} of cases`,
          fields: ["demographic.race"],
          pct: share,
          evidence: r.cohort.demographics.evidence,
        });
      } else {
        const t = tableOnly(vars, "htan:Demographics", "demographics");
        out.push(t ? { key: "race", label, ...t } : unknown("race", label, notMeasured));
      }
    }
  }

  return out;
}

/** How many of the six are settled either way, for a one-line summary. */
export function fitSummary(verdicts: FitVerdict[]): {
  supported: number;
  limited: number;
  blocked: number;
  unknown: number;
  sentence: string;
} {
  const count = (s: FitStatus) => verdicts.filter((v) => v.status === s).length;
  const supported = count("supported");
  const limited = count("limited");
  const blocked = count("blocked");
  const unk = count("unknown");
  const names = (s: FitStatus) => verdicts.filter((v) => v.status === s).map((v) => v.label.toLowerCase());
  let sentence: string;
  if (unk === verdicts.length) {
    sentence = "Clinical field completeness has not been measured for this record, so none of these analyses can be confirmed or ruled out from here.";
  } else {
    // Each clause is a predicate of "this dataset", so the limited clause is phrased as
    // one too. Written as a bare list it produced "This dataset overall survival ... are
    // possible only for part of the cohort" whenever nothing was supported or blocked.
    const parts: string[] = [];
    if (supported) parts.push(`supports ${names("supported").join(", ")}`);
    if (blocked) parts.push(`cannot support ${names("blocked").join(", ")}`);
    if (limited) parts.push(`can support ${names("limited").join(", ")} only for part of the cohort`);
    sentence = `This dataset ${parts.join("; ")}.`;
    if (unk) sentence += ` ${unk} of ${verdicts.length} ${unk === 1 ? "was" : "were"} not measured.`;
  }
  return { supported, limited, blocked, unknown: unk, sentence };
}

/** A verdict without its evidence array, for payloads where the evidence is already present elsewhere. */
export type FitVerdictSlim = Omit<FitVerdict, "evidence">;

export function slimVerdict(v: FitVerdict): FitVerdictSlim {
  return { key: v.key, label: v.label, status: v.status, reason: v.reason, fields: v.fields, pct: v.pct };
}
