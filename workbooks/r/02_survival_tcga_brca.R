#!/usr/bin/env Rscript
# Overall survival on TCGA breast cancer from open data, using the survival package.
#
# R counterpart of ../python/02_survival_tcga_brca.py.
# Requires: jsonlite, survival. No credentials.
#
# NOT independently executed - see README.md in this directory.
#
# The endpoint derivation is the part worth reading. GDC stores follow-up time in three
# different places and uses a different one depending on the project: for TCGA-BRCA the
# obvious field, diagnoses.days_to_last_follow_up, is null for 1,097 of 1,098 cases, while
# follow_ups.days_to_follow_up is populated for 1,096. Reading only the obvious field
# yields a cohort of about 150, almost all deaths, and a badly wrong survival curve.

suppressPackageStartupMessages({
  library(jsonlite)
  library(survival)
})

GDC <- "https://api.gdc.cancer.gov"
PROJECT_ID <- "TCGA-BRCA"
SENTINEL_FLOOR <- -35000   # GDC uses large negatives as placeholders

gdc_get <- function(endpoint, params) {
  query <- paste0(names(params), "=", vapply(params, URLencode, "", reserved = TRUE),
                  collapse = "&")
  fromJSON(paste0(GDC, "/", endpoint, "?", query), simplifyVector = FALSE)
}

as_number <- function(x) {
  if (is.null(x)) return(NA_real_)
  v <- suppressWarnings(as.numeric(x))
  if (is.na(v) || v <= SENTINEL_FLOOR) NA_real_ else v
}

filters <- toJSON(list(op = "in",
                       content = list(field = "project.project_id",
                                      value = list(PROJECT_ID))),
                  auto_unbox = TRUE)

hits <- gdc_get("cases", list(
  filters = filters,
  fields = paste(c("submitter_id",
                   "demographic.vital_status", "demographic.days_to_death",
                   "demographic.age_at_index",
                   "diagnoses.days_to_last_follow_up",
                   "follow_ups.days_to_follow_up",
                   "diagnoses.ajcc_pathologic_stage"), collapse = ","),
  size = "5000", format = "json"))$data$hits

cat(sprintf("retrieved %d cases\n", length(hits)))

# Latest contact evidenced by ANY of the three fields.
last_contact <- function(h) {
  cand <- c()
  for (d in h$diagnoses)  cand <- c(cand, as_number(d$days_to_last_follow_up))
  for (f in h$follow_ups) cand <- c(cand, as_number(f$days_to_follow_up))
  cand <- c(cand, as_number(h$demographic$days_to_death))
  cand <- cand[!is.na(cand) & cand >= 0]
  if (length(cand) == 0) NA_real_ else max(cand)
}

stage_of <- function(h) {
  for (d in h$diagnoses) {
    s <- d$ajcc_pathologic_stage
    if (!is.null(s)) return(tolower(s))
  }
  "unknown"
}

df <- data.frame(
  vital_status = vapply(hits, function(h) {
    v <- h$demographic$vital_status; if (is.null(v)) NA_character_ else tolower(v) }, ""),
  days_to_death = vapply(hits, function(h) as_number(h$demographic$days_to_death), 0),
  last_contact  = vapply(hits, last_contact, 0),
  age           = vapply(hits, function(h) as_number(h$demographic$age_at_index), 0),
  stage         = vapply(hits, stage_of, ""),
  stringsAsFactors = FALSE
)

df$event <- as.integer(df$vital_status == "dead")
df$time_days <- ifelse(df$event == 1 & !is.na(df$days_to_death),
                       df$days_to_death, df$last_contact)
df$time_months <- df$time_days / 30.44

before <- nrow(df)
df <- df[df$vital_status %in% c("alive", "dead") &
           !is.na(df$time_days) & df$time_days > 0, ]
cat(sprintf("usable for survival: %d of %d cases (%d events)\n",
            nrow(df), before, sum(df$event)))

# ---- Kaplan-Meier ---------------------------------------------------------------------
fit <- survfit(Surv(time_months, event) ~ 1, data = df)
print(fit)
cat("\nSurvival at 12 / 36 / 60 months:\n")
print(summary(fit, times = c(12, 36, 60)))

# ---- stage groups ---------------------------------------------------------------------
simplify_stage <- function(s) {
  s <- sub("^stage ", "", s)
  for (g in c("iv", "iii", "ii", "i")) {
    if (startsWith(s, g)) return(paste0("stage ", toupper(g)))
  }
  "unknown"
}
df$stage_group <- vapply(df$stage, simplify_stage, "")
print(table(df$stage_group))

staged <- df[df$stage_group != "unknown" & !is.na(df$age), ]
if (nrow(staged) > 50) {
  cat("\nLog-rank across stage groups:\n")
  print(survdiff(Surv(time_months, event) ~ stage_group, data = staged))

  cat("\nMultivariable Cox model:\n")
  cox <- coxph(Surv(time_months, event) ~ age + factor(stage_group), data = staged)
  print(summary(cox))
} else {
  cat("\ntoo few staged cases for a model\n")
}

cat("\nNote: median follow-up here is under three years for the median patient, while\n")
cat("breast cancer recurs over ten to twenty. Late-recurrence questions are underpowered,\n")
cat("and treatment is not adjusted for in this model.\n")
