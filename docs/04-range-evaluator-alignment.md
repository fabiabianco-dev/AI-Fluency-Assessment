# RANGE Evaluator ↔ Fluency Assessment Alignment

**Date:** July 29, 2026
**Inputs:** `rangeevaluator_2.md`, `rangerubric_2.md` (AFS Next v2 shared infrastructure)
**Direction from Fabia:** *"Some of the ways I'm communicating RANGE domains in the fluency
assessment are not necessarily as aligned to how we are using them in the RANGE Evaluator… at
the very least, the language needs to be aligned."*

---

## The two instruments do different jobs — correctly

| | **Fluency Assessment** | **RANGE Evaluator** |
|---|---|---|
| Measures | Self-reported standing practice | Demonstrated output on a real artifact |
| Evidence | What you say you do | What the work shows |
| Scored by | Self | Claude, on cited evidence; coach calibrates |
| Scale | 4 levels — Pre-Pilot / Pilot / Builder / Multiplier | **1–5** — Nascent / Emerging / Developing / Solid / Advanced |
| Unit | The person | The artifact |
| Output | Skills to build | Score + evidence + one growth step |
| Audience | All employees | AFS Next participants |

**Keep both.** They are a self/other calibration pair, which is a genuine strength — the
evaluator's own guidance already exploits it: *"Use the gap between PW1 self-score and M1.5
evaluator score as the teaching moment."* Collapsing them into one instrument would lose that.

The problem is not that there are two instruments. It is that **they use the same five letters
to mean different things.**

---

## Divergence audit — ranked by severity

### 1. Autonomy — different constructs entirely ⛔

| | Definition |
|---|---|
| Fluency | **Workflow Design.** Building AI systems others depend on. The Still Running Test: *"if you disappeared tomorrow, would it keep running?"* |
| Evaluator | **Self-directed work without external scaffolding.** *"1 Nascent: Did not start without prompting. 4 Solid: Fully self-directed, self-corrected, completed everything without prompting."* |

These are not two phrasings of one idea. One is **system-building**; the other is
**independence and follow-through**. A person can score Evaluator A = 5 (highly self-directed,
finished everything unprompted) while sitting at Fluency A = Pre-Pilot (no repeatable workflow
anyone else can use). Both scores would be correct. A learner seeing both will reasonably
conclude one of the instruments is broken.

This is the most serious divergence and it needs a decision, not a wording tweak.

### 2. Generalization — peer enablement vs. technique transfer ⛔

| | Definition |
|---|---|
| Fluency | **Peer Enablement.** Developing others' AI capability. All 23 capability-map skills under G are about coaching, teaching, change management, culture. |
| Evaluator | **Transfer of techniques across contexts.** *"5 Advanced: Abstracted the general principle. Applied it in distant domains."* |

Framework v5 defines G as spanning *both* ("applying AI skills across different contexts…
**and** enabling others"), but each instrument has quietly picked a different half. The
capability map picked enablement; the evaluator picked transfer.

Note the evaluator's own calibration warning: *"Most participants… over-rate themselves on
Generalization."* That is a direct prediction about self-report bias in the fluency assessment.

### 3. Execution Fidelity — the evaluator has no Ownership dimension ⚠️

Fluency E = **E1 Voice + E2 Ownership**, where E2 carries verification, disclosure,
transparency, data ethics, security — 23 capability-map skills.

Evaluator E = *"Quality control and structured AI collaboration."* Prompting precision and
review thoroughness only. **Nothing about disclosure, ethics, data handling, or accountability.**

So the sub-competency that maps most directly to Labs' *calibration* factor — the strongest
predictor of actual AI literacy — is measurable in one instrument and invisible in the other.

### 4. Reach — the evaluator drops Continuous Adaptation ⚠️

Fluency R = **Experimentation Courage + Continuous Adaptation** ("your practice six months ago
looks different from today"). Evaluator R measures stretch-target selection on a single
artifact only. Adaptation over time is structurally unmeasurable in a one-artifact reading —
which is fine, but it should be stated rather than silently dropped.

### 5. Navigation — the halves have been reshuffled ⚠️

Fluency N = **N1 Intent + N2 Judgment**. Evaluator N = *"Problem framing, approach selection,
adaptation."*

- N1 Intent ≈ evaluator's framing. Aligned.
- **N2 Judgment** (evaluating AI output) has migrated into the evaluator's **E**.
- **Adaptation** ("strategic pivots when an approach fails") sits in the evaluator's **N**, but
  in the fluency model adaptation is **R**.

Two constructs cross dimensions in opposite directions. This is the kind of thing that looks
like a rounding error and produces genuinely contradictory feedback.

### 6. Scale vocabulary — no crosswalk exists ⚠️

Four named levels against a 1–5 numeric scale with different labels. The evaluator states *"a 3
means the participant met the bar for someone actively learning."* The fluency assessment's
level 1 is "Pilot." Nobody has defined how those relate, and learners will assume they do.

---

## Recommendation

### Do not unify the scales — separate them harder

The instinct is to force both onto one scale. That is the wrong move, because they measure
different units: the evaluator scores **an artifact**, the assessment scores **standing
practice**. Equating them would invite exactly the confusion of "I got a 4 on the evaluator so
why am I a Pilot?"

Instead make the distinction explicit and load-bearing in the naming:

| Instrument | Produces | Language |
|---|---|---|
| RANGE Evaluator | a **reading** — 1–5 on this artifact | "Your Navigation reading on this build was 3" |
| Fluency Assessment | a **standing** — where your regular practice sits | "Navigation is where your next move is" |

Then publish a one-page crosswalk stating plainly that a reading is not a standing, that a
single strong artifact does not move a standing, and that repeated readings are what evidence a
standing. That is also a truthful account of how capability actually works.

### Do unify the dimension definitions

One canonical definition per dimension, authored once, used verbatim by the framework, the
capability map, the assessment, the evaluator, and the rubric. The three decisions that need
Fabia's call:

| Dimension | Decision needed |
|---|---|
| **A — Autonomy** | Is Autonomy *system-building* (fluency) or *self-direction* (evaluator)? **Recommend: system-building.** It is what the capability map, the Still Running Test, and Augment & Automate all already mean. Self-direction then becomes evidence *within* Reach and Execution Fidelity rather than its own dimension. Requires editing the evaluator's A anchors. |
| **G — Generalization** | Enablement, transfer, or both? **Recommend: both, explicitly** — transfer is the Pilot→Builder behaviour, enablement is the Builder→Multiplier behaviour. That reconciles the two instruments as a progression rather than a conflict, and matches how the capability map is already tiered (4 skills at Pre-Pilot→Pilot rising to 8 at Builder→Multiplier). |
| **E — Execution Fidelity** | Does the evaluator gain an Ownership component? **Recommend: yes.** Add a verification-and-disclosure anchor to the evaluator's E. Without it, the strongest predictor of AI literacy is unmeasured in the instrument that looks at real work. |

And two smaller ones: move *adaptation* out of the evaluator's N into R to match the fluency
model, and move *output evaluation* out of the evaluator's E into N2 — or accept the
reshuffle and document it.

### Cost note

Changing the evaluator's anchors means editing AFS Next shared infrastructure, which Lee owns
and which is referenced by every session, both Solo Flights, and the async toolkit's
`range-evaluator` skill. This is a coordination cost, not a code cost. It is also cheaper now
than after the fluency assessment goes company-wide on August 5 and thousands of people learn
one vocabulary while a cohort learns another.

---

## One useful thing the evaluator gives us for free

The evaluator's calibration notes are **empirical self-report bias data**:

> *"Most participants under-rate themselves on Execution Fidelity and over-rate themselves on
> Generalization."*

The fluency assessment is pure self-report. That sentence is a testable prediction about its
bias direction, and it happens to match the diagnosis: G shows the *highest* Pre-Pilot rate
(18.5%) while E shows the *lowest* (7.4%) — the opposite pattern, which is what you would expect
if people over-claim G and under-claim E and the item wording is compensating unevenly.

Worth handing to Khoa alongside the band distribution as construct-validation input.
