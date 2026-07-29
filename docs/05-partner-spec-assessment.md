# Assessment of the Partner Alignment Spec

**Date:** July 29, 2026
**Reviewing:** `aifluencyassessmentalignmentspec.md` (external partner)
**Instruction from Fabia:** don't take it at face value; assess whether it can enhance the work.

Treated as input to evaluate, not instructions to follow.

---

## Verdict

**Adopt most of it.** It is a better document than its provenance would predict — technically
specific, traceable to real code, and intellectually honest where it is speculating (it labels
its own position score "not an IRT ability estimate" and its archetype derivation "a hypothesis,
not an established finding," which is the right instinct).

It caught **three defects I missed**, one of which is serious enough to invalidate a promise the
product already makes. It also makes **one substantive error** and **conflicts with your
direction in four places**, mostly because it does not know about the August launch timeline.

One flag on provenance: it is addressed to a rebuild of *"BetterUp AI Fluency Framework (v3.0 →
v4.0)."* The framework in this repo is **v5.0**. The partner may have been working from an older
copy — worth checking what they were given before trusting version-specific claims.

---

## Adopt — three things it caught that I did not

### 1. Rotating items invalidate the retake ⛔ (§4.1)

**This is the best finding in the document and I missed it.**

`buildQueue()` calls `shuffle(pool)` then slices. Every sitting draws a **different subset** of
the 200-item bank. Meanwhile the results card and the reminder email both promise a 90-day
retake to *"see how far you've come"* and *"track how your RANGE scores have shifted."*

With rotating items, a score change cannot be attributed to the person rather than to item
difficulty variance. **The retake comparison the product already promises is not currently
interpretable.** Every reminder email sent so far has promised something the instrument cannot
deliver.

The fix — a fixed core form, with presentation order randomized but item *selection* fixed — is
correct. See the trade-off section below for how to reconcile it with your length constraint.

### 2. Construct collision lets one behaviour move two dimensions ⛔ (§4.4)

Confirmed against the capability map:

| Behaviour | Scored in | Consequence |
|---|---|---|
| Documenting / handing off a workflow | Autonomy (`Workflow Management (systems level)`) **and** Generalization (`Developing Training Materials`, `Technical Documentation`) | One behaviour change moves two dimensions |
| Verifying AI output before acting | Navigation (`Verification habits`, `Critical Thinking`) **and** Execution E2 (`Trustworthiness`) | Same |

Under a movement target this is a validity failure — a learner could satisfy "advance in two
domains" from a single change. It also plausibly contributes to the central clustering in the
diagnosis, since correlated items inflate agreement across dimensions.

Their assignment rule is right: Generalization keeps transfer, Autonomy keeps reliability;
Navigation keeps the epistemic question (*is this correct?*), Execution keeps the accountability
question (*would I put my name on it?*). That split also happens to resolve part of the RANGE
Evaluator divergence in `04-range-evaluator-alignment.md`.

### 3. Consistency probes exist only at Pilot ⚠️ (§4.6)

Verified: every entry in `PROBE_TRIGGERS` is `level: 1`. Over-claiming at Builder and Multiplier
is entirely unchecked — and those are the levels where a false positive is most expensive,
because an inflated baseline makes future advancement look impossible.

Their proposed probes are well-formed because they demand a dated, verifiable instance:
*"Someone other than me has run one of my AI workflows in the last month without asking me how."*

---

## Adopt with modification

### Conditions block (§6.1–6.3) — converges with our own conclusion

Independently arrived at the same recommendation in `02-design-decisions-v2.md`: ask conditions,
never score the individual on them. Their six items are better worded than mine — adopt theirs.

Their framing is the sharpest articulation of *why*: without conditions data, a Pre-Pilot Reach
score cannot distinguish a **skill gap** from a **permission gap**, and *"no development content
fixes a permission gap."* Given that the assessment is now mandatory, that distinction is not
academic — it is the difference between a fair instrument and one that reads structural
constraint as personal shortfall.

Their two-axis grid is better than what I had and should be adopted:

|  | Low conditions | High conditions |
|---|---|---|
| **High RANGE** | Plateauing | Compounding |
| **Low RANGE** | **Blocked** — management conversation | **Ready** — best return on development |

One caution: §8 proposes listing the Blocked population **by name** as an intervention list.
That sits in direct tension with their own §4.7 privacy correction and with the learner-facing
promise that results are not shared with managers. A named list of "blocked" employees derived
from a mandatory self-report is a governance question, not a reporting feature. Recommend
aggregate-only at launch.

### Continuous position score (§4.3) — adopt, keep it internal

Sound solution to a real problem: integer levels make movement all-or-nothing, and most people
won't cross a boundary in a year. Their `positionScore()` is a centroid of endorsement and they
say so plainly. Their movement contract — requiring *both* a label change and a ≥0.30 position
change to call it an advance — correctly prevents boundary flapping.

Adopt, with their own caveat enforced: **not shown to learners as a score**, and never described
externally as psychometrically validated.

### Privacy language (§4.7) — adopt, and treat as urgent

The intake card says L&D uses *"only anonymized, function-level averages."* The payload
transmits name, email, function, manager status and full scores. The policy intent is fine; the
word "anonymized" is not true at the point of collection.

This matters more than it did last week. The assessment becomes **mandatory** on August 5, and
placement invitations follow from individual results. Their warning is exactly right: if program
enrollment involves manager awareness, *"not shared with your manager"* cannot appear on that
card. **Fix the copy before the announcement, not after.**

### Item content additions (§5.1–5.3) — adopt the E2 items

Their E2 Ownership items are good and trace to real map rows. The underlying finding is one the
diagnosis reached independently: the item bank's Execution items are almost entirely E1 Voice,
with nothing on what must not go into a tool, disclosure, sensitive data, or exposure. Their
line lands — *"the instrument built to diagnose that gap currently reproduces it."*

The resistance items in §5.3 are the most BetterUp-specific thing in the document. *"I share what
I learn"* and *"I can bring a skeptic along without making it adversarial"* are genuinely
different capabilities and only the first is measured today.

---

## Reject — conflicts with your direction

### 1. "Program routing is out of scope entirely" (§1) ⛔

The document reframes the instrument's purpose as a twelve-month movement tracker and drops
routing. That is a coherent product — but it is **not the product the August 14 deadline
needs.** The assessment is the mandatory prerequisite for placement; those decisions get made
the week of August 17.

Your direction was that programs come out of the **learner-facing output** — not that routing
disappears. The private band signal still has to exist or placement falls back to Claude usage
data, which you have already flagged as biased.

**Movement tracking is the right destination. It cannot be the August 5 deliverable.**

### 2. Retiring `intakeTool` and `intakeSubFunction` (§3)

The document removes these because they "existed to drive course routing." But you said
explicitly that knowing whether people use Claude as an augmentation tool is a signal you want:
*"People learning how to use Claude as an augmentation tool would be a big, big plus for me to
understand, because it helps me know they would go on to expand to Running with Claude."*

In a Claude-based org, tool capture *is* that signal. Sub-function drives the function-level
analysis you actually run. **Keep both.**

### 3. "Four proficiency levels — do not rename or add" (§2.3)

Asserted as a non-negotiable without argument, and it conflicts with the capability map, which is
organized as **transitions** (`Pre-Pilot → Pilot`), and with your interest in dropping the
ranking feel. Transitions are the better output shape — *here is the move you're facing* rather
than *here is your rank*. This should stay an open decision, not a constraint.

### 4. "The existing instrument is well-built — preserve the 200-item bank" (§0)

The document treats the item bank as an asset to select from. It is not reviewed by anyone, and
it contains mis-filed content — `ITEM_BANK.reach[1]` holds *"I have built evaluation criteria for
AI output in my domain and I teach them to others,"* which is Builder-level Execution Fidelity
sitting in Pilot-level Reach.

The document's own checklist requires every item to trace to a capability-map row, which is
right. But the cleaner path is what you directed: **generate items from the map's `In Practice`
column**, which is reviewed content, rather than curating an unreviewed bank down to 40.

---

## One substantive error

### The Calibrator derivation is wrong (§6.4)

Their formula:

```js
craft     = positionScore('autonomy');
adaptive  = (positionScore('reach') + positionScore('navigation')) / 2;
signature = adaptive - craft;
```

They correctly label this a hypothesis. But it is not merely unvalidated — it **omits the
defining variable.** The London research defines Calibrators by AI investment paired with
**human and relational investment**: relationship building, coaching, alignment, and reinvesting
AI-saved time into people. The survey items behind the finding are explicitly relational —
*"I invest time in creating high-quality relationships with my colleagues," "I work with team
members to support their ongoing growth,"* *"I provide team members with timely and actionable
feedback."*

In RANGE terms that is **Generalization**, plus the routing half of calibration. Their formula
uses Reach and Navigation and **excludes G entirely.** A derivation that omits the relational
dimension cannot identify a construct defined by relational investment.

A closer approximation would weight G and E2 against A. But better than fixing the formula:
don't derive the archetype at all until Khoa confirms it. It is BetterUp's flagship research
finding; an incorrect internal derivation circulating in L&D data is worse than no derivation.

---

## The unavoidable trade-off, and how to resolve it

The document optimizes for **measurement precision.** You asked for **brevity**:

> *"We also don't want people to take this assessment for 20 minutes. It needs to be something
> quick and easy."*

Their prescription totals **40 items + 6 conditions items, ~12–15 minutes** — *longer* than
today's 35. Fixed form, two items minimum per level, balanced E1/E2, probes at every level, and
a conditions block all add length. You cannot have maximum retake precision and minimum length.

### Proposed resolution: anchor items plus adaptive resolution

The document rejects adaptive item selection because it breaks retake comparability (§4.1). That
argument is valid but the conclusion is too strong — standard practice solves exactly this with
**anchor-item equating**:

| Layer | Items | Purpose | Fixed? |
|---|---|---|---|
| **Anchors** | 2 per dimension = **10** | Movement tracking across sittings | **Fixed** — identical every sitting |
| **Adaptive** | ~6–8, routed by response | Level resolution | Selected per sitting |
| **Direct facts** | 2 | Process ownership, function bypass — asked, not inferred | Fixed |
| **Conditions** | 6, not scored into RANGE | Skill gap vs. permission gap | Fixed |

**~24–26 items, and genuinely adaptive** — versus 46 fixed. Movement is measured on the
comparable anchors; precision comes from routing rather than volume. The current instrument has
*no* branching at all despite the design spec claiming it does, so this is untapped headroom.

The direct-fact items do disproportionate work: whether someone owns a recurring multi-step
process is a **fact**, not a trait, and asking it once outperforms inferring it from many Likert
items.

---

## Act on this before August 5

**§9 — silent submission loss.** `GAS_URL` is set from an Apps Script template expression. If
the page is not served as a GAS template, it stays a literal string, `fetch` fails, and
`.catch(() => {})` swallows it. Combined with `mode: 'no-cors'` there is **no signal that
submissions are being lost.**

The repo copy has `GAS_URL = ''`; the deployed copy differs. Given the assessment goes mandatory
company-wide on August 5, this is the highest-severity operational risk in the system — and as
they note, a lost **baseline** sitting cannot be re-derived after the fact. **Verify end-to-end
against the real deployment, and add a visible confirmation state on success.**

Also worth fixing: the Overview cites *"85.7% of effective AI interactions involve multiple
refinement cycles."* One-decimal precision on an unsourced figure invites the question. Cite it
or make it directional.
