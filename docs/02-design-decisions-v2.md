# AI Fluency Assessment v2 — Design Decisions

**Status:** Proposal for Fabia's direction. Nothing built yet.
**Date:** July 29, 2026
**Depends on:** `01-diagnosis.md`

---

## The constraint that shapes everything

From the L&D × Comms sync (July 29):

| Date | Event |
|---|---|
| Fri Jul 31 | Manager communication sends |
| Tue Aug 4 | Development check-in email |
| **Wed Aug 5** | **Company-wide Coursera announcement — assessment named as mandatory prerequisite** |
| **Thu Aug 14** | **Assessment completion deadline for all employees** |
| Week of Aug 17 | Program orientations — placement decisions get made here |
| Tue Sep 1 | Programs start |

So the instrument has **~5 working days** before it is announced to the whole company, and
**~12** before it has to produce placement signal for 350 licences.

Two things follow. First, a full psychometric rebuild does not fit before Aug 5 — but it does
fit before Aug 17, which is when the output actually gets *used*. Second, the assessment is
now mandatory, which raises the stakes on Finding 2: shipping a mandatory instrument that
gives 70% of the company the same three skills is a credibility cost that is hard to walk
back.

---

## Decision 1 — Nomenclature: three distinct words, three distinct things

Resolves the question Fabia put to Labs on July 8. Faithful to Khoa's framing that Labs
deliberately measures *"mindsets and behaviors people can control that are more evergreen,
rather than AI literacy — something that would change tomorrow."*

| Term | What it means | Property | Who owns it |
|---|---|---|---|
| **AI literacy** | What you *know* about AI — tools, capabilities, terms | Perishable; changes with each model release | Not measured here |
| **AI readiness** | The mindsets and behaviours that predict whether you'll grow — optimism, identity, engagement, job crafting, calibration, championing | Evergreen; malleable; predictive | Labs (Khoa) |
| **AI fluency** | What you can demonstrably *do* with AI in your actual work | Observable; behavioural; what RANGE measures | L&D (this instrument) |

One sentence for comms: **literacy is what you know, readiness is whether you'll grow, fluency
is what you can show.**

---

## Decision 2 — Adaptive capacity integrates as a *layer*, not a relabel

Recommendation: stop asserting RANGE and adaptive capacity are the same story. Stack them.

```
LEARNER-FACING LANGUAGE     Curiosity  ·  Pilot mindset  ·  Courage
  (from PROGRAMS_1.md — keep; it is simple and already published)
        ▲
READINESS SUBSTRATE         optimism · identity · engagement · job crafting
  (Labs / Khoa — why fluency grows)      · calibration · championing
        ▲
MEASUREMENT SPINE           R · A · N · G · E
  (RANGE — what we actually observe)
        ▲
CONDITIONS                  org signals · team norms · psychological safety · agency
  (Labs / London keynote — NOT an individual score; never scored on an individual)
```

Why this ordering matters: it lets you say "adaptive capacity is integrated" and defend it,
because each layer does different work. It also keeps **conditions out of the individual
score**, which is the one thing the Labs research is unambiguous about — conditions are
organizational, and scoring an individual on them would be both wrong and unsafe.

**Change to `PROGRAMS_1.md` §1 recommended:** replace *"same story, measured two ways"* with
*"RANGE is what we measure; adaptive capacity is why it grows."* One line, removes an
indefensible claim.

### Where conditions data goes instead

Ask 3–4 conditions items, report them **only in aggregate by function** — never on the
learner's own result card, never in their row as a score. That gives you the org-level read
the London research says predicts everything, without turning it into a personal verdict.
It also gives you the Labs partnership artifact Derrick and Khoa asked for.

---

## Decision 3 — Programs out of the learner-facing output entirely

Per Fabia's direction: no AFS, no program names, no eligibility badges, no `PROGRAMS`
constant, no AFS card in the results email.

This reconciles cleanly with the mandatory-prerequisite comms plan, because the sync already
decided the invitation arrives **separately**: *"once the assessment is completed, the team
will reach out with further placement details."* So:

| Audience | What they receive |
|---|---|
| **Learner** | Skills to build, split behavioural vs. technical, and a learning path direction. No program name. |
| **L&D (sheet)** | A placement band, private, used to send the invitation. |

The learner never sees a gate. The placement happens in your outreach. Same mechanism, no
turnstile in the product — which also blunts the mandate risk the Labs research flags.

---

## Decision 4 — ~~The skill spine~~ — SUPERSEDED

> **Superseded by [`03-capability-map-as-driver.md`](03-capability-map-as-driver.md).** Fabia's
> direction: the AI Capability Map is the driver. It already holds 139 reviewed skills with an
> `In Practice` observable behaviour per skill — there is no need to invent a spine. The
> behavioural/technical split below is retained only as a *presentation* idea for the result
> card. Read doc 03 instead.

<details>
<summary>Original Decision 4 (kept for reference)</summary>

### The skill spine (replaces `SKILL_FOCUS`)

Answers "what do people need to build to get more efficient with AI?" and gives learners the
lean-in signal Fabia asked for. Every skill is tagged **B**ehavioural or **T**echnical.

| RANGE | Behavioural skills (readiness) | Technical skills (craft) |
|---|---|---|
| **R — Reach** | Intrinsic pull toward AI · AI-user identity · Deliberate experimentation | Capability scouting · Structured experiment design |
| **A — Autonomy** | Job crafting — rethinking what your work *is* | Workflow mapping · Automation design · Artifact building (Projects, Skills) · Agentic delegation & human-in-the-loop design |
| **N — Navigation** | Calibration *(routing)* — knowing when AI belongs and when it doesn't | Intent framing & task decomposition · Tool & mode selection |
| **G — Generalization** | Championing — enabling others without being asked | Documentation & handoff · Reusable asset design |
| **E — Execution Fidelity** | Calibration *(ownership)* — verifying before you ship | Direction & context engineering · Evaluation & quality checks |

Two deliberate choices:

- **Calibration appears twice** — as routing (N) and as ownership (E). That is faithful to
  Khoa's construct, which bundles thoughtful use *and* output verification, and it is the
  strongest predictor of actual AI literacy. Under the current code it is the one thing that
  can never be recommended. Fixing that is the single highest-value change in the rebuild.
- **Evaluation & quality checks (E)** is the hook for the separate engineering track Fabia is
  building with Lee. Same skill, deeper treatment for R&D.

### The lean-in output

Rather than one composite level, the result card leads with:

> *"You lean **technical**. Your craft is ahead of your calibration — you can direct AI well,
> but you verify inconsistently, and you don't yet share what you've learned. Your two highest
> leverage skills right now are **verification before shipping** and **championing**."*

That is a sentence a learner can act on and a manager can coach against. "You are a Pilot" is
not.

</details>

---

## Decision 5 — Placement is a 3-band signal, not a 20-cell matrix

The instrument does not need to resolve 4 levels × 5 dimensions. It needs to separate three
groups, matching the three live Coursera paths:

| Band | Path | Discriminator |
|---|---|---|
| 1 | **Expand Your RANGE** | No repeatable AI practice yet; gaps in Navigation + Reach |
| 2 | **Running with Claude** | Uses AI regularly, output quality inconsistent; gap in Execution Fidelity |
| 3 | **Augment & Automate** | Consistent personal practice **and owns a recurring multi-step process**; gap in Autonomy |

Separating three bands reliably is a far easier measurement problem than the current design
attempts, and it is the only output the September 1 cohorts actually need.

**One recommendation that will do more work than any scoring change:** bands 2 and 3 are
distinguished by whether the person owns a recurring, multi-step process worth rebuilding.
That is a fact, not a trait. **Ask it directly** rather than inferring it from Likert items —
one question does more placement work than 25 inferred ones. Same for the R&D track: ask, do
not infer.

Engineering is excluded from these three per the comms sync, so the band logic needs a
function-based bypass to Lee's technical track.

---

## Decision 6 — Scoring rebuild

| Change | From | To |
|---|---|---|
| Items drawn per dimension | 7 (`dist = [2,2,2,1]`) | 10–12, weighted toward the boundary being tested |
| Routing | None — fixed shuffled queue | Genuinely adaptive: start at Pilot, branch on response |
| Level verdict | Peak mean ≥ 3.0 **and** ≥ 0.4 above the level below | Recalibrated once n is large enough to set real cut scores |
| Priority selection | Fixed R‑A‑N‑G‑E order, truncated to 3 | Sorted by gap magnitude; all five reachable |
| `gapDimensions` | `level < 3` (fires for ~everyone) | Below the level the person's role requires |
| `Overall Level` | `Math.round(composite)` — inflates 1.6 to "Builder" | Remove the single composite label entirely |

Note the item bank needs content review too, not just more sampling. `ITEM_BANK.reach[1]`
currently contains *"I have built evaluation criteria for AI output in my domain and I teach
them to others"* — that is Builder-level Execution Fidelity sitting in Pilot-level Reach.
Mis-levelled and mis-dimensioned items will corrupt any scoring model built over them.

---

## Decision 7 — What is preserved, untouched

Per Fabia: the delivery works, do not rebuild it.

- Visual design, brand system, layout, animation, the full HTML shell
- The `.gs` backend architecture, `doPost` routing, sheet auto-creation
- The results email template and its styling
- The 90-day retake reminder and its daily trigger
- Registration flow, function/sub-function taxonomy, tool list
- RANGE itself, and the four level names

Changes are to **content and logic inside** these — the `PROGRAMS` constant, `SKILL_FOCUS`,
`ITEM_BANK`, the scoring functions, the program cards in `buildPath`, the AFS card in the
email builder, and the sheet columns.

---

## Proposed sequencing against the real dates

**Before Aug 5 (announcement) — small, safe, high-value.** No new measurement model.
1. Remove all program references: `PROGRAMS`, program cards, AFS card in the email, AFS
   eligibility column.
2. Fix the priority truncation so all five dimensions can surface, sorted by gap. *This alone
   changes the output for ~70% of learners.*
3. Retire the misleading `Overall Level` label and the inert `gapDimensions` field.
4. Replace course recommendations with skill recommendations plus a learning-path direction.
5. Add the direct process-ownership question for band separation.

**Before Aug 17 (placement) — the measurement work.**
6. Rebuild `SKILL_FOCUS` on the behavioural/technical spine.
7. Widen the item draw, audit the item bank for mis-levelled content, implement real adaptive
   routing.
8. Implement 3-band placement output in the sheet, with the engineering bypass.
9. Add conditions items, aggregate-only reporting.

**After volume arrives.** Re-baseline cut scores on real n. Check test–retest against the
duplicate-submission problem. Take the band distribution to Khoa for construct validation.

---

## Open questions for Fabia

1. **Does the learner see a path name at all?** "Programs out" — but is *"Expand Your RANGE"*
   a program (out) or a learning path (in)? It is named on Coursera as a program. My reading
   is the learner sees a skill set and a direction, and the named path arrives in your
   outreach email. Confirm.
2. **Levels — keep or retire?** Pre-Pilot/Pilot/Builder/Multiplier is program vocabulary and
   carries a ranking feel. The skill spine works without it. `PROGRAMS_1.md` still uses it as
   the FY27 target language ("move 2–3 domain levels this year"), so retiring it has
   downstream cost.
3. **Do we ask conditions items at launch,** or hold them until Labs validates wording?
4. **Role-relevant standards.** Fixing `gapDimensions` properly needs to know what each role
   *requires*, not just where the person is. Framework v5 has a role table — is it current
   enough to drive logic, or does it need your review first?
5. **Sheet rewrite.** Fixing the truncation changes the column schema. Old rows will not match
   new columns. New tab, or accept the break?
