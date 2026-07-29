# The Skill Diagnostic — Design

**Date:** July 29, 2026
**Direction from Fabia:** *"I don't want to think program. I want to think skill... help me identify
what skills are most prevalent for people to develop where they are."*

---

## 1. The reframe

This is **not a placement instrument.** It is a **skill gap diagnostic.**

The reason matters: Fabia is building programs *from* the results, not routing into programs that
already exist. *"I might end up building four or five new programs once I have all of the results."*
So the instrument's job is to tell her **which skills are missing, at which level, across the
population** — not to sort people into three buckets that exist today.

This changes what the output is:

| | Placement instrument (rejected) | Skill diagnostic (this) |
|---|---|---|
| Learner sees | "You're here → do this program" | "These are the skills to develop next, given where you are" |
| Fabia sees | Headcount per program | Where the gaps concentrate, by level and by skill |
| Determines | Enrollment | **What programs to build** |
| Fails if | It mis-routes someone | It can't distinguish one gap from another |

The whole point is that the aggregate view is the primary deliverable. Individual results are the
by-product, not the reverse.

---

## 2. The four levels — Fabia's words, locked

These are hers. Do not paraphrase them into RANGE language.

| Level | The sentence | The test |
|---|---|---|
| **Pre-Pilot** | *"I use AI in my work, and it helps me, but nothing outlives the conversation."* | Nothing persists past the session. |
| **Pilot** | *"I build something that keeps working and I still own it."* | It works, and it works because you're there. |
| **Builder** | *"Others depend on it."* | Someone else's work would break if yours stopped. |
| **Multiplier** | *"I've been able to re-engineer and change the work of an entire function based on my build."* | The unit of change is a function, not a task. |

Three jumps, each a single clean question:

1. Pre-Pilot → Pilot: **does anything survive the conversation?**
2. Pilot → Builder: **does it work without you?**
3. Builder → Multiplier: **did the shape of the work change, not just its speed?**

Note how high Multiplier is set. *Re-engineering the work of an entire function* is a much harder
bar than "shares templates with the team" — which is roughly what the current instrument's
Multiplier items ask. Expect very few, and that is correct.

---

## 3. The six lenses — derived from Fabia's twelve

Fabia named twelve places where gaps live: *strategy, approach, building, communication, alignment,
impact, management, quality assessment, quality management, ethical design, ethical management of
data, ethical management of results.*

Read together, these are not a competency matrix — they are **the arc of a build.** Twelve is too
many to ask about; they cluster cleanly into six:

| Lens | Fabia's items | The question it answers |
|---|---|---|
| **1. Decide** | strategy, approach | *Should this be built, and should AI be the thing that builds it?* |
| **2. Build** | building | *Can you actually make it?* |
| **3. Align** | communication, alignment | *Do the people around it come with you?* |
| **4. Sustain** | impact, management | *Does it survive contact with time and other people?* |
| **5. Quality** | quality assessment, quality management | *Is the output good, and do you know how you know?* |
| **6. Ethics** | ethical design, ethical data, ethical results | *Who does this affect, and what are you protecting?* |

**Every one of the seven problems Fabia has been hearing lands in one of these:**

| What she's hearing | Lens |
|---|---|
| "Are you thinking about the consequences of that build?" | Decide |
| "Is AI really the best way of going?" | **Decide** — restraint |
| "Is an automation or an agent the right approach?" | Decide |
| "Do you understand the consequences in a systemic way?" | Decide |
| "Have you considered other parts of the system your design touches?" | Align |
| "What's the impact on cross-functional collaborators when your team adopts and theirs doesn't?" | **Align** — adoption asymmetry |
| "User-centricity, quality, consistency, longevity, sustainability" | Quality + Sustain |
| "Protecting data quality by mitigating slop" | **Ethics** + Quality |

That the seven map without remainder is the evidence the six-lens cut is right.

### How this relates to RANGE

They are orthogonal, which is useful rather than conflicting:

- **RANGE describes kinds of capability.** It's established, it's the capability map's spine, and
  Lee's Evaluator uses it. It stays.
- **The six lenses describe stages of a build.** They are where *gaps* live.

So: RANGE remains the outer vocabulary; the lenses generate the questions. Six lenses × four
levels = a 24-cell grid, which is the diagnostic's actual structure. That is tractable. A 12 × 4
grid would not be.

---

## 4. The measurement mechanism

### What was wrong

The current scale runs from *disagree* to *agree*. Anyone can agree, so everyone picks 4, and
62–74% land at Pilot on every dimension. The scale, not the population, produced that result.

### What replaces it

Keep a five-to-six button row — same UI, same ten seconds. Change **what the options are**: each
one describes a *different thing you actually did*, and they are ordered by sophistication.

Fabia's own anchors for verification, which are better than my first draft (mine pitched too low
for this population):

| # | Anchor | Maps to |
|---|---|---|
| 1 | I trust it without revision | *below Pre-Pilot* |
| 2 | I look for mistakes, but I don't spend significant time | Pre-Pilot |
| 3 | I make sure the fidelity against the source is there before I ship | Pilot |
| 4 | I stop and pivot immediately if I see deviations that change the meaning of what I'm trying to achieve | Pilot → Builder |
| 5 | I build a check into the process | Builder |
| 6 | I spend time upfront defining the guardrails so the output represents the goals of my build and the needs of the business | Multiplier |

**Three properties make this work:**

1. **No option is shameful.** Option 1 is a description, not a confession. This removes the
   pressure to inflate — which is the actual cause of the clustering.
2. **The anchors *are* the scoring key.** Because each maps to a level, the answer is the
   measurement. No centroid, no weighted average of endorsement, no derived score to defend.
3. **There is a real progression underneath:** *react → inspect → verify → correct →
   systematize → prevent.* The move from 5 to 6 is the move from **detecting** problems to
   **preventing** them, and that is exactly the adaptive-capacity story — the shift from handling
   what comes to designing the conditions so less comes.

### The framing question

*"On a scale of these, what was most true over the last two weeks?"*

Two weeks, per Fabia — recent enough to remember honestly, long enough to have done something.
The instrument asks for **the most true recent behaviour**, not a self-assessment of character.
That distinction is doing most of the work.

### Six options, not five

Fabia's set has six and they are six genuinely distinct levels; collapsing loses information.
Six also has no midpoint, which removes the safe middle answer. Adding one radio button to the
existing row is a trivial change and does not touch the submit path.

---

## 5. Sample — the Decide lens, fully drafted

Illustrates the pattern. One question per lens, six anchors, anchors map to levels.

> **Over the last two weeks, when you had a recurring piece of work that was taking too long —
> what was most true?**
>
> 1. I didn't really look for a way to change it
> 2. I tried asking Claude to do the task faster
> 3. I worked out which part of it was actually slow before I changed anything
> 4. I mapped how the work actually runs today, then decided which step AI should touch
> 5. I concluded at least once that AI was the wrong tool and did something simpler instead
> 6. I redesigned the work around what AI makes possible, rather than speeding up the existing shape

Option 5 is the one to watch. **Restraint** — concluding AI is the wrong tool — is rated above
sophisticated use, not below it. That is deliberate, and it is what the London research means by
calibration: the people who get real value are the ones who know what to hand over and what to
keep. Almost no AI assessment measures restraint, and the person who says *"this doesn't need AI,
it needs a two-line rule"* is further along than the person who agents everything.

---

## 6. Open items

- **Six questions or twelve?** Six lenses at one question each is a ~90-second instrument. Two per
  lens roughly doubles confidence and still lands under four minutes. Recommend two per lens for
  the lenses where gaps are suspected to concentrate (Decide, Ethics), one elsewhere.
- **The four missing skills still need adding to the capability map:** systems thinking, process
  mapping, process design, and consequence design. Currently zero rows each — and they are what
  the Decide and Align lenses measure.
- **Fabia's data on who is actually a Multiplier** — she has said not everyone is a Pilot and
  offered to show the evidence. Needed to check whether the six anchors sort her known builders
  correctly.
