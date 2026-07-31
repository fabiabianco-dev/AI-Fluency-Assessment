# The Capability Map as the Driver

**Date:** July 29, 2026
**Supersedes:** Decision 4 in `02-design-decisions-v2.md` (the invented skill spine — no longer needed)
**Direction from Fabia:** *"The biggest unlock is to use the capability matrix as the driver, not
anything else. But the capability matrix in some way needs to be better aligned to our adaptive
capacity research."* And: *"Our work really is more in the content of the assessment rather than
on the mechanisms of it."*

---

## 1. Why this is the right driver

`BetterUp_AI_Capability_Map_FY27` already contains what the assessment has been missing.
**139 skills**, organized as:

| | Pre-Pilot → Pilot | Pilot → Builder | Builder → Multiplier | Total |
|---|---|---|---|---|
| **R** — Experimentation Courage + Continuous Adaptation | 6 | 7 | 4 | **17** |
| **A** — Workflow Design | 6 | 9 | 7 | **22** |
| **N** — N1 Intent (17) + N2 Judgment (18) | 10 | 14 | 11 | **35** |
| **G** — Peer Enablement | 4 | 11 | 8 | **23** |
| **E** — E1 Voice (19) + E2 Ownership (23) | 12 | 18 | 12 | **42** |

Every row carries: `Skill to Develop`, **`In Practice`** (the observable behaviour), `Cert
Pathway`, `Relevant Functions`, plus reviewer columns for Lee (RANGE) and Gail (TPS priority).

**The critical insight: the `In Practice` column is already an item bank.** These are
first-person observable behaviours — *"Verify before you share, present, or act — every time,
not just when stakes feel obvious"* — written at a specific transition, tied to a named skill,
and currently being validated by Lee and Gail.

The assessment has been maintaining a **parallel, unvalidated** 200-statement `ITEM_BANK` and a
separate 60-skill `SKILL_FOCUS` taxonomy. Neither is reviewed by anyone. That is the root of
Finding 2 in the diagnosis, and it is why the current instrument recommends things like
"Workflow documentation" to 74% of the company.

### Three structural upgrades that come free

1. **Seven sub-competencies, not five dimensions.** The map's real granularity is R, A, N1, N2,
   G, E1, E2. Notably, the current assessment's two blind spots — E and G — hold **65 of 139
   skills (47%)**. The map is heavily weighted exactly where the instrument cannot see.
2. **Transitions, not levels.** The map is organized as `Pre-Pilot → Pilot`, not `Pilot`. That
   is the correct output shape for an assessment: *here is the move you're facing*, not *here is
   your rank*. It also removes the ranking feel Fabia flagged.
3. **Routing metadata already present.** `Cert Pathway` and `Relevant Functions` mean the map
   can drive path direction without a separate 584-course scoring engine. The course engine can
   be deleted, not fixed.

---

## 2. The path mapping falls out of the sub-competencies

The three Expand Your RANGE foundations Fabia named map directly onto sub-competencies:

| Expand Your RANGE foundation | Sub-competency |
|---|---|
| Rethink How You Decide with AI | **N1 — Intent** |
| Systems Thinking for AI & Automation | **A — Workflow Design** |
| Trustworthy Generative AI | **E2 — Ownership** |

And the progression Fabia described — *"people learning how to use Claude as an augmentation
tool… helps me know they would go on to expand to Running with Claude"*:

| Path | Sub-competencies it builds | Signal that routes someone here |
|---|---|---|
| **Expand Your RANGE** | N1, A, E2 at Pre-Pilot → Pilot | No repeatable practice yet; weakest in N1 or E2 |
| **Running with Claude** | E1 Voice, A at Pilot → Builder | Uses Claude regularly, output quality inconsistent; weakest in E1 |
| **Augment & Automate** | A, G, E at Pilot → Builder | Consistent practice **and owns a recurring multi-step process**; weakest in A |

So the learner sees **named skills from the map**. The path is what L&D derives from which
sub-competency is weakest. Skills to the learner, band to the sheet — no program named in the
product, exactly as directed.

---

## 3. Adaptive capacity alignment audit

This is the substantive answer to *"the matrix needs to be better aligned to our adaptive
capacity research."* Khoa Le Nguyen's six individual readiness factors, audited against all 139
skills:

| Labs readiness factor | Coverage in the map | Verdict |
|---|---|---|
| **Engagement** (learning + experimentation) | R: Curiosity, Experimentation, Emerging Technologies, Adaptability | ✅ **Strong** |
| **Championing** (enabling others) | G: all 23 skills | ✅ **Strong** |
| **Calibration — verification half** | N: Critical Thinking, Verification habits, Risk Assessment, Model Evaluation; E2: Trustworthiness, Accountability, Responsible AI | ✅ **Strong** |
| **Calibration — routing half** ("using AI thoughtfully *with other people in mind*") | Only N1 Goal Setting, obliquely | ⚠️ **Thin** |
| **Job crafting** (rethinking work so AI makes it more meaningful) | A: Business Process Improvement, Automation — but framed mechanically, as process efficiency | ⚠️ **Reframe needed** |
| **AI optimism** (intrinsic motivation; finds AI genuinely interesting) | Nothing. "Curiosity" is scoped as courage-to-start, not intrinsic pull | ❌ **Missing** |
| **Identity as an effective AI user** | Nothing | ❌ **Missing** |

### The most important gap

Khoa's finding: **calibration is the single strongest predictor of actual AI literacy** — *"it
doesn't matter how confident you are… whether you self-report using it thoughtfully is what
predicts actually knowing about AI."*

The map covers calibration's **verification** half well and its **routing** half barely. And
the London keynote's headline Calibrator behaviour has no skill at all:

> *"When leaders substitute AI for a human development conversation, team coordination drops
> 12%, burnout goes up 26%. When they use AI to* prepare *for that conversation, coordination
> goes up 6%. Same tool. Opposite direction. The routing decision is everything."*

There is no skill in the map for **deciding what to route to AI, what to a person, and what to
both.** That is BetterUp's own flagship research finding, and it is absent from BetterUp's own
capability map.

### Proposed additions (7 skills)

| Dim | Transition | Skill | In Practice |
|---|---|---|---|
| N1 | Pre-Pilot → Pilot | **Human/AI routing** | Decide deliberately what goes to AI, what goes to a person, and what needs both — and say why. |
| N1 | Pilot → Builder | **Relational calibration** | Route work with the other person's experience in mind, not just the output — know which conversations require you present. |
| R | Pre-Pilot → Pilot | **Intrinsic pull** | Explore AI because you find it genuinely interesting, not because you were asked to. |
| R | Pilot → Builder | **AI-user identity** | Treat being effective with AI as part of how you work, not a separate initiative you participate in. |
| A | Pre-Pilot → Pilot | **Work redesign** | Rethink what a part of your job is *for* — not just how to do the existing version faster. |
| A | Pilot → Builder | **Time reinvestment** | Decide deliberately where AI-saved time goes; protect some of it for people and development. |
| G | Pilot → Builder | **Conditions setting** *(managers)* | Make it safe and worth it for your team to experiment — encouraged, not mandated. |

`Conditions setting` currently only exists at Builder → Multiplier ("Create conditions for
others to experiment — make it feel safe and worth it, not mandated"). The London research says
managers are the wedge at **every** level, so this belongs earlier.

### Where conditions data must not go

Conditions — org signals, team norms, psychological safety, agency — are **organizational, not
individual.** Labs is explicit that they are the biggest predictor of workslop, above skill,
motivation, and fluency. They must be reported **in aggregate by function only** and must never
appear as a score on a learner's own result. Scoring an individual on their environment would be
both wrong and a breach of the privacy promise the results email already makes.

---

## 3b. The non-AI skill layer — measured, and the result is worse than expected

Fabia's list of *"skills that are not necessarily AI-related but yield better AI builds"*, tagged
across all 139 skills by `analysis/build_skill_spine.py`:

| Non-AI skill | Skills tagged | |
|---|---|---|
| Workflow design | 14 | ✅ |
| Quality assurance | 9 | ✅ |
| Systemic adoption | 5 | ⚠️ thin |
| Change management | 4 | ⚠️ thin |
| User accessibility | 1 | ⚠️ near-absent |
| **Systems thinking** | **0** | ❌ |
| **Process mapping** | **0** | ❌ |
| **Process design** | **0** | ❌ |

### Why the three zeros matter more than they look

These are not obscure omissions. They are **the skills the live programs actually teach**:

- **"Systems Thinking for AI & Automation"** is one of the three foundations inside
  *Expand Your RANGE* — the entry-point program. Systems thinking appears **nowhere** in the
  capability map.
- **"Map before you automate — automate before you go agentic"** is the stated core sequence of
  *Augment & Automate*. Neither process mapping nor process design exists in the map.

So the capability map cannot describe what two of the three Coursera paths develop. If the map
drives the assessment, the assessment cannot tell someone they need the very skill the program
they're being routed into exists to build.

This is the strongest argument yet for Fabia's instinct. The gap is not that the assessment
recommends the wrong courses — it is that the underlying skill model has no vocabulary for the
foundational, non-AI competencies that determine whether an AI build is any good.

### Recommended additions

| Dim | Transition | Skill | In Practice |
|---|---|---|---|
| A | Pre-Pilot → Pilot | **Process mapping** | Draw how a recurring process actually runs today — every step, handoff and decision — before changing any of it. |
| A | Pre-Pilot → Pilot | **Systems thinking** | Trace how a change in one step affects the steps downstream, before you automate anything. |
| A | Pilot → Builder | **Process design** | Redesign a process around what AI makes possible, rather than bolting AI onto the existing shape. |
| A | Pilot → Builder | **Second-order consequences** | Name what your automation breaks or shifts for someone else before you deploy it. |
| G | Pilot → Builder | **User accessibility** | Build so that someone with less context than you can use it without asking you how. |
| G | Pilot → Builder | **Adoption design** | Plan how a build gets adopted — not just how it gets finished. |

`User accessibility` currently has exactly one tagged skill (`Usability Testing`, N Pilot →
Builder), which is about *testing before deploying* rather than *designing for the user*. Given
that Autonomy's whole standard is the Still Running Test — can someone else run it without you —
accessibility is load-bearing and under-represented.

### Readiness factor coverage, measured

Same script, against Khoa's factors:

| Labs factor | Skills tagged | |
|---|---|---|
| Championing | 26 | ✅ |
| Calibration — verification | 17 | ✅ |
| Engagement | 7 | ✅ |
| Job crafting | 7 | ⚠️ framed as process efficiency |
| **Calibration — routing** | **4** | ⚠️ thin, and it's the strongest predictor |
| **AI optimism** | **0** | ❌ |
| **AI-user identity** | **0** | ❌ |

Confirms the audit in §3 with counts rather than assertion. Calibration's verification half
outweighs its routing half more than 4:1, and the routing half is what Khoa's data says predicts
actual AI literacy.

### Other defects the extraction found

- **`Decision Making` is duplicated** in N, Pre-Pilot → Pilot — identical skill name and
  identical `In Practice` text on two rows. Confirmed programmatically.
- **32 of 139 skills still reference AFS** in `Cert Pathway`. Since programs are coming out of
  learner-facing output, this field needs rewriting or suppressing before the map feeds the
  assessment.
- **`ChatGPT`** was the only vendor-named skill; renamed to **`Applied AI delivery`** with the
  behaviour rewritten to reference Claude.

---

## 4. Inconsistencies found in the map

1. **`ChatGPT` is a named skill** (E1, Pre-Pilot → Pilot): *"Complete a real work task using
   ChatGPT (or equivalent)."* Meanwhile the `Excluded` tab of `BU_Course_RANGE_Mapping.xlsx`
   excludes ~dozens of courses with the reason **"ChatGPT/OpenAI branded — BU policy."** A
   Claude-based organization should not name ChatGPT as a skill while excluding ChatGPT courses
   by policy. **Recommend renaming to "Applied AI delivery"** with Claude as the reference tool.
2. **`Decision Making` is duplicated** in N, Pre-Pilot → Pilot — same skill name, same
   `In Practice` text, listed twice.
3. **`Cert Pathway` for A, Pre-Pilot → Pilot** reads *"AFS Next prerequisite: 20 days consistent
   usage."* Programs are coming out of the assessment; this field will need to stop referencing
   AFS if the map feeds learner-facing output.
4. **E1 at Pre-Pilot → Pilot is thin on Claude specifically.** Given Fabia's point that Claude
   augmentation fluency is the signal that predicts readiness for Running with Claude, the map
   would benefit from Claude-specific craft skills — Projects, Skills, artifact reuse — which
   currently appear only as generic "Prompt Engineering Tools" at Pilot → Builder.

---

## 5. A useful connection: Continuous Reinvention

`BetterUp_Leveling_Expectations` already carries an org-wide expectation theme —
**Continuous Reinvention** — defined per level from S2 through P6:

> *"The ability to continually learn, unlearn, and re-imagine ways of working to unlock
> innovative solutions and maximize emerging tools (e.g., AI)."*

This is also the attribute Gail cited as already live in the balloon interviews. It is the
closest existing BetterUp construct to job crafting, and it is language managers already use.

**Development check-ins launch Tuesday, August 4** — one day before the Coursera announcement.
If assessment output names skills that ladder to Continuous Reinvention at the learner's level,
managers can coach against it in a conversation they are already scheduled to have. That is a
much stronger integration than a program invitation.

---

## 6. What actually changes in the code — content only

Per Fabia: preserve the mechanisms. Nothing below touches intake, the queue engine, results
rendering, the sheet write, the learner email, or the reminder trigger.

### Replace (content)

| Constant | Location | Change |
|---|---|---|
| `ITEM_BANK` | `:1468` | Regenerate from the map's `In Practice` column — validated content replaces 200 unreviewed statements |
| `SKILL_FOCUS` | `:1891` | Regenerate from `Skill to Develop` + `In Practice` — 139 real skills replace 60 invented ones |
| `PROBE_TRIGGERS` | `:1722` | Re-point at the new items |

### Delete

| Constant / function | Location | Why |
|---|---|---|
| `PROGRAMS` | `:1441` | Programs out of learner-facing output |
| `BU_CATALOG` | `:1738` | 584-course catalog — replaced by `Cert Pathway`. **This is ~90% of the file's 305KB** |
| `pickSkillCourses`, `pickFunctionCourses`, `pickManagerCourses`, `getCourseWhy` | `:2760`–`:2908` | Course engine retired |
| `FUNCTION_COLLECTIONS` | `:1740` | Keep only if the collection links stay useful for browsing |

### Fix (small, high-impact)

| Item | Location | Change |
|---|---|---|
| Priority truncation | `:2925` | Sort by gap magnitude; make all seven sub-competencies reachable. **Changes the output for ~70% of learners.** |
| `gapDimensions` | `:2916` | `level < 3` fires for everyone — scope to role-relevant standard |
| `Overall Level` | `.gs:77` | `Math.round` labels a 1.6 composite as "Builder" — remove the single composite label |
| Item draw | `:2136` | `dist = [2,2,2,1]` is too thin to resolve a level |

### Preserved, untouched

Intake and validation · `SUBFUNCTION_MAP` · the assessment shell (`buildQueue`,
`renderStatementCard`, `handleRating`, `autoOpenNext`) · `buildPath` rendering and layout ·
sidebar and progress · `submitResults` transport · `appendToSheet` · `sendLearnerEmail` ·
`logReminder` / `sendDueReminders` · `triggerWeeklyDigest` · all brand and visual styling.

**Note:** deleting `BU_CATALOG` shrinks the file from ~305KB to roughly 30KB, which will make
every future edit and Apps Script paste dramatically easier.

---

## 7. Open questions

1. **Does the map's reviewer validation gate this work?** Lee's `RANGE` and Gail's
   `TPS Priority` columns are both empty. If the assessment now depends on the map's content,
   their review becomes the critical path. Do we build on the current draft and revise, or wait?
2. **All 139 skills, or a subset?** 139 skills across 7 sub-competencies × 3 transitions is a
   lot of assessment surface. Recommend measuring at sub-competency level and surfacing 2–3
   named skills per gap — but that means selecting which skills represent each cell.
3. **Do the 7 proposed adaptive-capacity skills go to Khoa first?** They are my reading of the
   preliminary factors from a meeting summary, not validated wording. Low cost to check.
4. **Are the four proficiency level names staying?** The map uses transitions, which reads
   better and removes the ranking feel. `PROGRAMS.md` still uses levels as FY27 target language.
