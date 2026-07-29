# AI Fluency Assessment — Diagnosis

**Date:** July 29, 2026
**Analyst input:** 925-row response export (81 completed submissions), `BU_AI_Fluency_Interactive.html`,
`BU_AI_Fluency_Backend.gs`, `BU_Course_RANGE_Mapping.xlsx`
**Reproduce:** `python3 analysis/analyze_responses.py <responses.xlsx>`

---

## Summary

The RANGE framework is sound. The **instrument** built on top of it has lost the ability to
tell people apart, which means it cannot do the job it is about to be given — placing every
employee into one of three Coursera learning paths by August 14.

Placement today is driven by Claude usage data, which Fabia has already flagged as biased
against early adopters who maintain rather than build. The assessment was meant to replace
that signal. In its current state it cannot, because ~7 in 10 people receive the same result.

---

## Finding 1 — The instrument does not discriminate

Of 925 rows exported, **81 are completed submissions.** Level distribution:

| Dimension | Pre-Pilot | Pilot | Builder | Multiplier |
|---|---|---|---|---|
| R — Reach | 12.3% | **61.7%** | 9.9% | 16.0% |
| A — Autonomy | 11.1% | **74.1%** | 8.6% | 6.2% |
| N — Navigation | 16.0% | **66.7%** | 12.3% | 4.9% |
| G — Generalization | 18.5% | **71.6%** | 6.2% | 3.7% |
| E — Execution Fidelity | 7.4% | **69.1%** | 16.0% | 7.4% |

- Mean composite score **1.13 / 3.00**, SD **0.38**
- **79%** of learners fall inside a 0.8-wide band (0.8–1.6) on a 0–3 scale
- **19.8%** are Pilot on all five dimensions — byte-identical output

### Root cause

Two compounding causes, both in `BU_AI_Fluency_Interactive.html`.

**a) Too few items per level to resolve a level.** `buildQueue` (`:2134`) draws
`dist = [2, 2, 2, 1]` — two Pre-Pilot, two Pilot, two Builder, one Multiplier item per
dimension. A level verdict therefore rests on a 1–2 item mean. The item bank holds 10 per
level; 87.5% of it goes unused each session.

**b) The inflation guards are working as designed, and that is the problem.**
`getFinalLevel` (`:2197`) requires the winning level mean to be ≥ 3.0 *and* to beat the level
below by ≥ 0.4. With 1–2 items per level, noise rarely clears both gates, so results collapse
toward the middle. The guards were the right fix for score inflation; combined with a thin
draw they suppress genuine signal too.

**Consequence:** the design spec describes an adaptive engine that "branches up or down to
calibrate." The shipped engine does not branch — it draws a fixed 7-item shuffled queue and
averages by level. `PROBE_TRIGGERS` (`:1722`) adds one consistency probe. There is no
adaptive routing.

---

## Finding 2 — Generalization and Execution Fidelity can never be recommended

`submitResults` (`:2925`) builds `skillPriorities` by mapping `DOMAINS` in fixed R‑A‑N‑G‑E
order. The sheet has three priority columns. **G and E are silently truncated for every
learner who has ever taken the assessment.**

Observed in the data — only four distinct values ever appear per slot:

| Slot | Most common value | Share of learners |
|---|---|---|
| Priority 1 | REACH (Pilot): Failure diagnosis | **61.7%** |
| Priority 2 | AUTONOMY (Pilot): Workflow documentation | **74.1%** |
| Priority 3 | NAVIGATION (Pilot): Decision framework design | **66.7%** |

This is the most consequential defect in the system. Execution Fidelity carries Voice and
**Ownership** (verification before sharing); Generalization carries **Peer Enablement**. In
BetterUp's own Labs research these map to *calibration* — the strongest single predictor of
actual AI literacy — and *championing*. The two highest-value dimensions are structurally
unreachable in the output.

Priorities are also not sorted by gap size, so even within R/A/N the learner is not shown
their weakest area first.

---

## Finding 3 — `gapDimensions` and AFS eligibility are inert

- `gapDimensions` (`:2916`) flags any dimension where `level < 3`. Since almost nobody is
  Multiplier, **91% of completed rows flag 4–5 dimensions as gaps.** The field carries no
  information.
- `afsNextStatus` requires `pilotPlusDims >= 3`. Because nearly everyone is Pilot,
  **92.6% return "Eligible — Apply for AFS Next."** A gate that admits 93% is not a gate.
- `Overall Level` rounds the composite (`Math.round`), so a learner averaging 1.6 — mid-Pilot
  — is labelled **"Builder."** 11 of 81 learners are labelled Builder this way.

---

## Finding 4 — The course engine recommends implausible courses

Actual recommendations from the live data:

| Course | Share of learners |
|---|---|
| Deploy AI Apps with Cloudflare | **19.8%** |
| AI Agent Architecture in Java with Generative AI | **19.8%** |
| Foundations of Responsible AI Strategy | 21.0% |
| AI in National Security | 4.9% |
| GenAI for Compensation Analysis in Law Firms | — routed to Finance |

Cloudflare deployment and Java agent architecture went to HR, CS, and Sales staff.

### Root cause is the catalog, not the algorithm

From the `Gap Analysis` tab of `BU_Course_RANGE_Mapping.xlsx`:

| RANGE dimension | Courses available |
|---|---|
| **R — Reach** | **7** |
| A — Autonomy | 249 |
| N1 — Navigation (Intent) | 56 |
| N2 — Navigation (Judgment) | 80 |
| **G — Generalization** | **14** |
| E1 — Execution (Voice) | 31 |
| E2 — Execution (Ownership) | 61 |

| Proficiency band | Share of catalog |
|---|---|
| Pre-Pilot → Pilot | 41.7% |
| Pilot → Builder | 53.0% |
| **Builder → Multiplier** | **5.3%** |

A 20:1 skew toward tooling, and almost nothing above Pilot. `pickSkillCourses` (`:2760`)
selects on the two lowest dimensions; when one is Reach it is choosing from 7 courses, so it
reaches for whatever scores highest on a thin, auto-generated `rs` vector.

**No weighting change fixes this.** The catalog cannot serve the mindset and enablement
dimensions, which is the structural argument for moving from course recommendations to skill
recommendations.

---

## Finding 5 — "Adaptive capacity" is absent, and three definitions are in circulation

The phrase appears **zero times** in the framework, the design spec, the HTML, or the backend.

Meanwhile three incompatible definitions are live in BetterUp documents:

| Source | Model | Level |
|---|---|---|
| `PROGRAMS_1.md` | Curiosity · Pilot mindset · Courage — mapped 1:1 onto RANGE | Individual |
| Labs (Khoa Le Nguyen, Jul 8) | AI optimism · identity · engagement · job crafting · **calibration** · championing | Individual |
| Act Two memo (Yost/Baker/Hatfield) | Navigate uncertainty, integrate new information, adjust behavior; flexibility vs. discipline | Individual + team + org |

`PROGRAMS_1.md` asserts *"Grow your RANGE and you're growing your Adaptive Capacity — same
story, measured two ways."* That claim will not survive a skeptical reader of the Labs
material, for two reasons:

1. Khoa's model contains two factors RANGE does not measure at all — **AI optimism** and
   **identity as an effective AI user** — and Labs finds these are both malleable and
   predictive.
2. The London keynote's headline finding is that the biggest predictors of workslop are
   *conditions* — mandates, low psychological safety, low agency — **"not individual traits,
   not skill level, not motivation, not even AI fluency."** AI behaviours alone explain
   **0.2%** of variance in basic performance; AI plus human investment explains **17–28%**.

RANGE measures individual behaviour. Adaptive capacity, as BetterUp's own science defines it,
is substantially conditional and partly organizational. Equating them concedes the argument
Fabia is already having with skeptical leaders.

This is the nomenclature problem Fabia raised with Labs on July 8: readiness, literacy, and
fluency are being used interchangeably. Proposed resolution in `02-design-decisions-v2.md`.

---

## Finding 6 — Sample caveat

n = 81. Enough to establish that the instrument does not discriminate — the central clustering
is far too strong to be sampling noise — but **not** enough to calibrate new item difficulty
or validate cut scores. Any rebuilt scoring needs a re-baseline once volume arrives after the
August 14 deadline.

The export also contains **duplicate submissions** — 5 email addresses submitted more than
once, one of them three times. In the clearest case, two submissions 5 minutes apart returned
*different* levels on Reach (Builder vs. Pilot). Test–retest reliability is unestablished and
on this evidence looks poor. Two rows also use non-standard domains (one personal address, one
`@betterup.com` rather than `.co`), so dedupe and domain validation are worth adding before
the mandatory push drives volume.

> **Note on data handling.** The response export contains employee names, email addresses and
> individual assessment results. It is deliberately **not** committed to this repository and
> is listed in `.gitignore`. Run `analysis/analyze_responses.py` against a local copy.
