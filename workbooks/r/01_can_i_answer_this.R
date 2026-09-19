#!/usr/bin/env Rscript
# Can I answer this question with this dataset?
#
# R counterpart of ../python/01_can_i_answer_this.py. Given an NCI Genomic Data Commons
# project, report which classes of analysis the clinical records actually support.
#
# Requires: jsonlite. No credentials.
#
# NOT independently executed - see README.md in this directory.

suppressPackageStartupMessages({
  library(jsonlite)
})

GDC <- "https://api.gdc.cancer.gov"
PROJECT_ID <- "CGCI-HTMCP-CC"   # try FM-AD, REBC-THYR, TCGA-BRCA, MP2PRT-ALL

# Values that are present but carry no information. A field populated entirely with
# these blocks an analysis just as surely as an absent one.
NON_ANSWERS <- c("not reported", "unknown", "not allowed to collect", "unspecified",
                 "not otherwise specified", "indeterminate", "not applicable")

gdc_get <- function(endpoint, params) {
  query <- paste0(names(params), "=", vapply(params, URLencode, "", reserved = TRUE),
                  collapse = "&")
  fromJSON(paste0(GDC, "/", endpoint, "?", query), simplifyVector = FALSE)
}

cat(sprintf("Auditing %s\n\n", PROJECT_ID))

# ---- 1. cohort size and assay coverage ------------------------------------------------
proj <- gdc_get(paste0("projects/", PROJECT_ID),
                list(expand = "summary,summary.experimental_strategies", format = "json"))$data
n_cases <- proj$summary$case_count
cat(sprintf("%s\n  cases: %s\n  files: %s\n\n", proj$name,
            format(n_cases, big.mark = ","),
            format(proj$summary$file_count, big.mark = ",")))

for (es in proj$summary$experimental_strategies) {
  cat(sprintf("  %-28s %5d cases (%.0f%% of cohort)\n",
              es$experimental_strategy, es$case_count, 100 * es$case_count / n_cases))
}

# ---- 2. clinical field completeness ---------------------------------------------------
probes <- c(
  "demographic.vital_status"               = "Vital status",
  "demographic.race"                       = "Race",
  "diagnoses.ajcc_pathologic_stage"        = "AJCC pathologic stage",
  "diagnoses.progression_or_recurrence"    = "Progression or recurrence",
  "diagnoses.treatments.treatment_type"    = "Treatment type",
  "diagnoses.treatments.therapeutic_agents" = "Therapeutic agents",
  "diagnoses.treatments.treatment_outcome" = "Treatment outcome",
  "follow_ups.ecog_performance_status"     = "ECOG performance status"
)

filters <- toJSON(list(op = "in",
                       content = list(field = "project.project_id",
                                      value = list(PROJECT_ID))),
                  auto_unbox = TRUE)

agg <- gdc_get("cases", list(filters = filters,
                             facets = paste(names(probes), collapse = ","),
                             size = "0", format = "json"))$data$aggregations

cat("\nClinical field completeness\n")
cat(sprintf("%-30s %10s %12s %s\n", "field", "populated", "informative", "note"))
coverage <- list()
for (field in names(probes)) {
  node <- agg[[field]]
  if (is.null(node)) next
  buckets <- node$buckets
  missing <- 0
  values <- list()
  for (b in buckets) {
    if (identical(b$key, "_missing")) missing <- b$doc_count
    else values[[as.character(b$key)]] <- b$doc_count
  }
  if (length(values) == 0 && missing == 0) next

  total <- n_cases
  populated <- max(total - missing, 0)
  # Counts exceeding the cohort size mean the field is one-to-many, so per-case
  # percentages cannot be inferred from the value counts.
  one_to_many <- (sum(unlist(values)) + missing) > total * 1.05
  not_reported <- sum(unlist(values[tolower(names(values)) %in% NON_ANSWERS]))
  informative <- if (one_to_many) NA else max(populated - not_reported, 0)

  coverage[[probes[[field]]]] <- list(
    populated_pct = 100 * populated / total,
    informative_pct = if (is.na(informative)) NA else 100 * informative / total
  )
  cat(sprintf("%-30s %9.1f%% %11s %s\n", probes[[field]],
              100 * populated / total,
              if (is.na(informative)) "1:n" else sprintf("%.1f%%", 100 * informative / total),
              paste(head(names(values)[order(-unlist(values))], 2), collapse = ", ")))
}

# ---- 3. is a survival endpoint derivable? ---------------------------------------------
cases <- gdc_get("cases", list(
  filters = filters,
  fields = "demographic.vital_status,demographic.days_to_death,follow_ups.days_to_follow_up,diagnoses.days_to_last_follow_up",
  size = as.character(min(max(n_cases, 1), 12000)),
  format = "json"))$data$hits

status <- vapply(cases, function(h) {
  v <- h$demographic$vital_status
  if (is.null(v)) NA_character_ else tolower(v)
}, "")

informative_status <- sum(status %in% c("alive", "dead"), na.rm = TRUE)
n_dead <- sum(status == "dead", na.rm = TRUE)

cat(sprintf("\ncases retrieved          : %d\n", length(cases)))
cat(sprintf("informative vital status : %d (%.1f%%)\n", informative_status,
            100 * informative_status / max(length(cases), 1)))
cat(sprintf("  of which deceased      : %d\n", n_dead))

survival_possible <- informative_status >= 20 && n_dead >= 10

# ---- 4. verdict -----------------------------------------------------------------------
pick <- function(label, field = "informative_pct") {
  x <- coverage[[label]]
  if (is.null(x)) return(0)
  v <- x[[field]]
  if (is.na(v)) v <- x[["populated_pct"]]
  if (is.null(v) || is.na(v)) 0 else v
}

cat(sprintf("\nVERDICT FOR %s\n%s\n", PROJECT_ID, strrep("=", 62)))
verdict <- list(
  "Overall survival"            = survival_possible,
  "Stage-adjusted modeling"     = pick("AJCC pathologic stage") >= 50,
  "Treatment-response analysis" = pick("Treatment outcome", "populated_pct") >= 30,
  "Agent-specific analysis"     = pick("Therapeutic agents", "populated_pct") >= 25,
  "Race-stratified analysis"    = pick("Race") >= 50,
  "Progression-free endpoints"  = pick("Progression or recurrence") >= 30
)
for (nm in names(verdict)) {
  cat(sprintf("%-4s %s\n", if (verdict[[nm]]) "YES" else "NO", nm))
}
cat(strrep("=", 62), "\n")
