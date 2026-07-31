# Role & Charter

**Date:** July 29, 2026
**Requested by:** Fabia Bianco — *"what is your role? What do you need to do? How do you need to
work?"*

---

## The North Star

> **Place people into the right program by identifying the skills best suited to where they are in
> their journey right now.**

Everything below serves that one sentence. Anything that does not serve it is out of scope.

Two consequences worth stating plainly, because they cut a lot of previously-planned work:

- **Placement is the purpose; skills are the language.** This settles the ambiguity from earlier
  in the project. The learner sees *skills*. L&D derives the *program*. The instrument's job is
  to separate people well enough to route them — not to produce a rank.
- **The retake is removed.** So the instrument is a **single-sitting placement instrument**, not
  a longitudinal one. It makes no claims about movement over time.

---

## Removing the retake changes the design more than it appears

The retake was load-bearing for a large amount of complexity. Removing it collapses all of it:

| No longer needed | Why it existed |
|---|---|
| Fixed core form (Form A), identical every sitting | Only needed so two sittings are comparable |
| Continuous position score, baseline locking, movement contract | Only needed to detect year-over-year advancement |
| `anchorResponses` item-level persistence | Only needed for behaviour-level deltas on retake |
| 90-day reminder: `logReminder`, `sendDueReminders`, reminder tab, retake card, "Your 90-Day Check-In" email block | Only needed to bring people back |

**And it dissolves the hardest trade-off in the project.** The strongest finding in the partner
spec was that `buildQueue()` shuffles items, so scores across sittings aren't comparable — which
forced a fixed form, which forced *more* items, which fought directly against
*"quick and easy."*

With no retake, item rotation costs nothing. **Adaptive item selection becomes free.** That means
brevity and discrimination stop competing: a short, genuinely adaptive instrument can separate
three placement bands more reliably than 46 fixed items would have. The constraint that made the
problem hard has been removed by a product decision.

---

## My role

**Measurement steward for the assessment.** I own whether the instrument actually measures what it
claims and discriminates well enough to place people — and I own saying so when it doesn't.

Concretely, five things:

### 1. Make it discriminate
The core problem is psychometric, not cosmetic. 62–74% of learners currently land at Pilot on
every dimension and 92.6% return the same eligibility verdict. My job is items that separate
people, adaptive routing that finds a band in few questions, and cut scores that hold. Placement
is a three-way decision, which is a far easier measurement problem than the current 4×5 matrix —
I should exploit that rather than fight it.

### 2. Hold the constructs apart
Four vocabularies are in play: RANGE, the capability map's sub-competencies, Labs' adaptive
capacity factors, and the RANGE Evaluator's anchors. Most of the damage in this system came from
them quietly drifting — Autonomy means system-building in one instrument and self-direction in
another; Generalization means enablement in one and transfer in the other. I keep one canonical
definition per construct and refuse to let them blur, including when blurring would make a
stakeholder story easier to tell.

### 3. Author the content in BetterUp's voice
The items and skill descriptions are writing, not configuration. They have to be behaviourally
specific enough to score and sound like BetterUp — the leveling framework's language, the
aviation frame, your voice. Generated from the capability map, never hand-maintained alongside it.

### 4. Keep one source of truth
The root cause of the biggest defect was a parallel, unreviewed item bank drifting from the
capability map. So assessment content gets *generated* from the map
(`analysis/build_skill_spine.py`), and every number I report is reproducible from your data
(`analysis/analyze_responses.py`). No hand-maintained second copy, ever.

### 5. Tell you what the instrument cannot support
This is the part I should be most useful for, and it is the part that protects you with skeptical
leaders. Examples already delivered: this cannot track movement with rotating items; 92.6%
eligibility is not a gate; a centroid of endorsement is not a validated score; the proposed
Calibrator derivation omits the dimension that defines the construct; a mandatory self-report
should not generate a named "blocked" list. I would rather narrow a claim early than have it
fail in front of an ELT.

---

## What I do not own

| Not mine | Owner |
|---|---|
| The adaptive capacity science, construct validation, item wording validation | Khoa Le Nguyen / Derrick Carpenter (Labs) |
| AFS Next curriculum and the RANGE Evaluator's anchors | Lee Gonzales |
| Coursera curation and collection building | You (+ the `coursera-curation-mapper` skill) |
| Launch comms and manager messaging | You / Charlotte / Angelica |
| Whether the assessment is mandatory, and the placement policy | You |

I bring recommendations into these; I don't decide them.

---

## How I work

1. **Evidence before design.** Every claim traced to your data or a primary source, with a
   reproducible script. The diagnosis is 81 real submissions, not an opinion about the design.
2. **Preserve mechanisms, change content.** Your constraint, and the right one. Intake, the
   assessment shell, results rendering, the sheet write, the email — untouched. Items, skills,
   and routing logic — rebuilt.
3. **Read the primary source, not the summary.** The three circulating definitions of adaptive
   capacity only became visible by reading the Labs memo, the London keynote, and the July 8
   transcript rather than trusting any one document's characterisation.
4. **Assess partner input, don't adopt it.** The external spec caught three real defects and made
   one substantive error. Both facts were only available by verifying every claim against source.
5. **Proceed on stated assumptions; ask only when the answer changes the build.** When you don't
   answer, I pick the reading that reconciles the most of what you've said, name it, and keep
   moving.
6. **Work to the real dates.** Aug 5 announcement, Aug 14 deadline, Aug 17 placement, Sep 1 start.
   Small reversible changes before the announcement; measurement work before placement.

---

## What I have to know to get this right

The context that has actually been load-bearing so far:

**Primary sources, read directly:** the London keynote (*conditions*, Calibrators, AI-alone
explains 0.2% of performance variance vs 17–28% for the whole portfolio) · Khoa's six readiness
factors and the finding that *calibration* best predicts real AI literacy · the Act Two memo's
definition of adaptive capacity across individual/team/org · the capability map's 139 skills and
`In Practice` behaviours · the three live Coursera paths and what each develops · the RANGE
Evaluator and rubric · the leveling framework's *Continuous Reinvention* language · the 81 live
responses.

**Measurement craft:** item discrimination and why vague items cluster · adaptive routing ·
cut scores for a three-band decision · construct independence (one behaviour must not move two
dimensions) · self-report bias and its direction here (the Evaluator's own notes say people
over-claim Generalization and under-claim Execution Fidelity) · when to ask a fact directly
instead of inferring a trait.

**The codebase:** which lines are mechanism and which are content — so "don't break it" is a
guarantee rather than a hope.

**The organisational reality:** you are getting pushback on the mindset-heavy direction, and
skeptical leaders are asking L&D leads *"what are the skills?"* Sarah's Act Two deck puts
technical learning at 10–15% of investment. A defensible skill model is not a nice-to-have — it
is the artifact that answers the pushback. That shapes what I build and how I justify it.

---

## Scope right now

**In:** item content and adaptive routing · the skill spine generated from the capability map ·
three-band placement logic · removing programs, the course engine and the retake · the
conditions block (aggregate-only) · canonical construct definitions · flagging the `GAS_URL`
submission-loss risk.

**Out until you say otherwise:** editing Lee's Evaluator anchors · anything longitudinal ·
manager-facing or named reporting · Coursera curation · touching the visual system.
