# BU AI Fluency Assessment

Rebuild of BetterUp's AI Fluency Assessment for scale — moving the output from **course
recommendations** to **skills**, and integrating BetterUp Labs' adaptive capacity research.

**Owner:** Fabia Bianco, Head of L&D

---

## Why this work exists

The assessment goes company-wide as a mandatory prerequisite for Coursera access on **August 5,
2026**, with a completion deadline of **August 14** and program starts on **September 1**.
Analysis of the 81 completed submissions to date shows the instrument cannot currently
differentiate learners well enough to place them — ~7 in 10 receive the same result.

Start with [`docs/01-diagnosis.md`](docs/01-diagnosis.md).

## Contents

**North Star:** place people into the right program by identifying the skills best suited to where
they are in their journey right now. The retake is removed — this is a single-sitting placement
instrument and makes no claims about movement over time.

| Path | What it is |
|---|---|
| `docs/00-role-and-charter.md` | Scope, ownership boundaries, and how this work runs |
| `docs/01-diagnosis.md` | Evidence-based diagnosis of the current instrument |
| `docs/02-design-decisions-v2.md` | Nomenclature, adaptive-capacity layering, placement bands, sequencing |
| `docs/03-capability-map-as-driver.md` | Revised architecture; adaptive capacity alignment audit |
| `docs/04-range-evaluator-alignment.md` | Divergence between the two RANGE instruments |
| `docs/05-partner-spec-assessment.md` | Critical review of the external alignment spec |
| `analysis/analyze_responses.py` | Reproduces every statistic in the diagnosis |
| `analysis/build_skill_spine.py` | Generates assessment content from the capability map |
| `content/skill-spine.json` | Generated skill spine — the single source of truth for items |
| `baseline/` | Snapshot of the working system as of July 29, 2026 |

## Before August 5 — verify this

`GAS_URL` is set from an Apps Script template expression
(`'<?= ScriptApp.getService().getUrl() ?>'`, `BU_AI_Fluency_Interactive.html:2066`). If the page
is not served as a GAS HTML template it stays a literal string, `fetch` fails, and
`.catch(() => {})` at `:2970` swallows the error. With `mode: 'no-cors'` there is **no signal
that submissions are being lost** — and a lost baseline sitting cannot be re-derived.

Test end-to-end against the real deployment and add a visible confirmation state on success.

### Baseline snapshot

- `BU_AI_Fluency_Interactive.html` — the app (source of truth; `GAS_URL` empty)
- `BU_AI_Fluency_Backend.gs` — Apps Script backend, sheet writes, learner email, reminders
- `BU_AI_Fluency_Framework_v5.md` — RANGE framework v5.0
- `BU_AI_Fluency_Assessment_Design_Spec.md` — original design + debug reference
- `BU_Course_RANGE_Mapping.xlsx` — 584-course catalog with RANGE relevance scores
- `PROGRAMS.md` — program & audience reference (FY27 Q3)

## Running the analysis

```bash
python3 analysis/analyze_responses.py /path/to/AI_Fluency_Assessment_Responses.xlsx
```

No dependencies — reads `.xlsx` via `zipfile` + `ElementTree`.

## Data handling

Response exports contain employee names, email addresses and individual assessment results.
They are **not committed** to this repository and are covered by `.gitignore`. Keep local
copies only. Individual results are private to the learner and L&D — the learner-facing email
states they are never shared with managers or used in performance evaluation, and that promise
constrains what this system may expose.
