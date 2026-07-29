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

| Path | What it is |
|---|---|
| `docs/01-diagnosis.md` | Evidence-based diagnosis of the current instrument |
| `docs/02-design-decisions-v2.md` | Proposed v2 architecture — awaiting direction |
| `analysis/analyze_responses.py` | Reproduces every statistic in the diagnosis |
| `baseline/` | Snapshot of the working system as of July 29, 2026 |

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
