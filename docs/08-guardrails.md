# Guardrails for this project

**Date:** July 29, 2026
**Prompted by Fabia:** *"this, for example, makes me think that I may not have set up enough
guardrails for this project with you."*

She's right, and the observation is worth taking seriously rather than deflecting. Applying her own
level-6 anchor — *define the guardrails upfront so the output represents the goals of the build and
the needs of the business* — to this project.

## What actually went wrong

I produced five analysis documents, an alignment audit, a partner-spec review, and a content
extraction script **before** the frame was confirmed. Then the frame changed: the instrument is a
skill diagnostic, not a placement tool. Most of the analysis survives that change, but a real
amount of it was written against an assumption Fabia had not endorsed — I had inferred "placement
into three programs" from the existing code and the live Coursera paths, and asked about it once
without waiting for the answer.

The failure was not the volume. It was **building past an unconfirmed premise** instead of
resolving the premise first. Asking and then proceeding on my own assumption when no answer came
is defensible for a small reversible choice; it was not defensible for the question that defines
what the instrument *is*.

## The guardrails

**1. Confirm the frame before building on it; proceed on assumptions only where reversal is cheap.**
Wording, item order, doc structure — my call, proceed. What the instrument measures, what it
outputs, what it claims — hers, and I stop and ask. If I do proceed under an assumption, it gets
stated in the message, not buried in a file.

**2. Nothing reaches an employee or a stakeholder without her reading it.** Every item, skill
description, results string and email line is voice-critical and politically live. I draft; she
approves. No exceptions, including for changes that look purely technical.

**3. I don't touch the working mechanism without flagging it first.** Intake, the assessment shell,
results rendering, the sheet write, the email. Her constraint, and it is the right one.

**4. Every number is reproducible.** Any statistic I report traces to a script in this repo. She
can always say *"show me"* and get the code, not a restatement. Already true of
`analyze_responses.py` and `build_skill_spine.py`; it stays true.

**5. I say what a claim cannot support, unprompted.** Standing obligation, not something to be
asked for. This is the guardrail that protects her with skeptical leaders: better to narrow a
claim now than have it fail in front of an ELT.

**6. Labs' science and Lee's curriculum get recommendations, never edits.** Construct validation is
Khoa's and Derrick's. The RANGE Evaluator's anchors are Lee's. I document divergence and propose;
they decide.

**7. Plain language by default.** Fabia asked for this explicitly. If a psychometric term is
genuinely needed, it gets defined in the same sentence. No term that only makes sense to someone
who already designs assessments.

## The one that would have caught this

Guardrail 1. The question *"is the output a program or a skill list?"* was the goal of the build,
and I should have held there until it was answered rather than picking the reading that reconciled
the most evidence and moving on.
