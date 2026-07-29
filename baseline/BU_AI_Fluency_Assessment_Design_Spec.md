# BU AI Fluency Assessment — Design Spec & Debug Reference

**Owner:** Fabia Bianco, Head of L&D — BetterUp  
**Date:** April 2026  
**Purpose:** Complete system design reference for debugging and optimization. Upload to Claude.ai to get a second opinion on architecture, course recommendation quality, and backend data capture.

---

## 1. What This System Is

A self-assessment tool that measures AI fluency across the **RANGE framework** (5 behavioral dimensions), maps each learner's profile to specific skill development priorities, and recommends Coursera courses from BetterUp's 350-license catalog. Results are captured in a Google Sheet for L&D program design decisions.

**Two audiences:**
- **Learner:** Understands where they are, what to build, and where to go next
- **Fabia (L&D):** Sees org-wide fluency distribution by function, top skill gaps, course demand data, and AFS Next readiness

---

## 2. The RANGE Framework

RANGE is the primary measurement language for AI behavioral fluency. Five dimensions, each scored 0–3:

| Dimension | Key | What it measures |
|-----------|-----|-----------------|
| **Reach** | R | Willingness to push AI into unfamiliar territory; scope of experimentation |
| **Autonomy** | A | Completing AI work end-to-end without hand-holding |
| **Navigation** | N | Orienting in ambiguity; knowing when to trust AI vs. override |
| **Generalization** | G | Applying AI skills across different contexts and teams |
| **Execution Fidelity** | E | Consistently producing high-quality AI outputs |

**Four proficiency levels (0–3):**
- **0 = Pre-Pilot** — Event-driven, not habit-driven; AI use is occasional and safe-only
- **1 = Pilot** — Active experimentation; builds workflows; some inconsistency
- **2 = Builder** — Systematized, reproducible, deployable AI work; starts enabling others
- **3 = Multiplier** — Scales AI capability across teams; sets standards; coaches others

---

## 3. Learner Journey (Step by Step)

### Step 1: Registration
Learner enters: name, email, team/function, primary AI tool, whether they are a people manager.

Functions available: Software & Engineering, Marketing, Finance, People & Community, Data & Analytics, Sales, Customer Success, Product, Legal, Leadership, Other.

AI tools: Claude (AI), Claude Code, Claude Co-work, Copilot, Cursor, ChatGPT, Bedrock, Gemma, Cora, Endgame, ROX, Other.

### Step 2: Assessment (adaptive)
- **Item bank:** 200 statements total — 10 per level × 4 levels × 5 dimensions
- **Adaptive logic:** Learner answers 5 statements per dimension. The engine starts at level 1 (Pilot) statements, then branches up (if confirmed) or down (if denied) to calibrate the final level.
- **Scoring:** Final level per dimension = highest level where learner confirmed ≥ 3 of 5 statements. If Pre-Pilot statements are denied, level = 0.
- **Flow:** One dimension at a time. Learner selects "This sounds like me" or "Not yet." The order of dimensions is randomized per session.

### Step 3: Results — Development Map
After completing all 5 dimensions, the learner sees:

**Overall RANGE score card:**
- Average score across 5 dimensions (e.g., 2.0 / 3.0)
- Level label (Pre-Pilot / Pilot-stage / Builder-stage / Multiplier-stage)
- Mini score per dimension (label, not number)

**Development Map (5 dimension cards):**
Each card shows:
1. Dimension name + current level badge
2. `soWhat` — 2-sentence behavioral interpretation: what this score means for their work right now
3. "Skills to build from here" — 3 named skills, each with a behavioral definition

For Multiplier dimensions: compact card, "What you're already demonstrating" (same 3 skills, different framing).

For Pre-Pilot dimensions: highlighted with rubine border + "Priority" tag.

**Skill content comes from `SKILL_FOCUS` constant** — 5 dimensions × 4 levels, each with:
- `soWhat`: 2 sentences (behavioral interpretation, not level description)
- `skills`: array of 3 objects — `{ name, desc }` — specific named skills with behavioral definitions

### Step 4: Where to Go Next
Two sub-sections:

**Program recommendation** (BetterUp programs, 1–2 cards):
Logic:
- All 5 dims at Multiplier → "Already at Multiplier"
- 3+ dims at Pilot+ AND at least 1 at Builder+ → "AI Builder Change Agent" (primary) + "AFS Next" (secondary)
- 3+ dims at Pilot+ → "AFS Next"
- 1–2 dims at Pilot+ → AFS Next progress bar ("you're close — X more dims to unlock")
- All Pre-Pilot → no program card (Coursera is the entry point)

**3 Coursera course recommendations:**
Courses are picked from a 584-course catalog via `pickCourses(levels)`. See Section 6 for the algorithm and its current issues.

**Function collection:**
A curated Coursera collection link for the learner's function (e.g., "People & Community" gets the HR/L&D AI collection).

### Step 5: Retake Reminder (optional)
Learner can click "Yes, email me a reminder" — sets a 90-day reminder, optimistically updates the UI, and sends a separate POST to the backend with type: 'reminder'.

---

## 4. L&D Backend Requirements

**What Fabia needs from the Google Sheet:**

| Data field | Why it matters |
|------------|---------------|
| Name + Email | Individual tracking |
| Team/Function | Segment by function |
| AI Tool | Understand tool distribution |
| People Manager (Y/N) | Separate manager path |
| Per-dimension RANGE scores | Individual fluency baseline |
| Avg RANGE score + level label | Org maturity tracking |
| Gap dimensions | Identify where org is behind |
| **Skill Priorities** (top 3) | Tells Fabia WHAT to build on Coursera — which skills to turn into learning paths and collections |
| **Course Recommendations** (top 3 shown to learner) | Tells Fabia WHICH courses are being surfaced — demand signal for collection building |
| AFS Next readiness status | Who to invite to AFS Next |
| Reminder date (separate tab) | Who will retake and when |

**What Fabia uses this for:**
1. **Individual tracking** — who is at what level, across which dimensions
2. **Function-level pattern analysis** — e.g., "Sales is Pre-Pilot on Navigation; L&D should build a navigation-focused Coursera collection for Sales"
3. **Coursera collection design** — skill priority columns tell her exactly what to work with Coursera to build
4. **AFS Next cohort planning** — filter by afsNextStatus = 'recommended' to identify cohort candidates
5. **Top-down course priority view** — aggregate the "Course Rec" columns to see what's being recommended most → informs catalog curation and license allocation

---

## 5. Technical Architecture

### Files

| File | Purpose |
|------|---------|
| `competency-model/BU_AI_Fluency_Interactive.html` | **Source of truth** — full app, GAS_URL is empty |
| `gas-deploy/index.html` | **Deployed copy** — identical to source but GAS_URL is filled in with the Apps Script URL |
| `gas-deploy/Code.gs` | **Google Apps Script backend** — serves the HTML, handles POST submissions, writes to Google Sheets |

### Deployment (Google Apps Script)
- URL: `https://script.google.com/macros/s/AKfycbyJHj4TjlhpStRGEKfjNL51VSHWpMU9VM7SlfJeh48F003m1HNmwsWb2fhYOOnMRrdqMA/exec`
- HTML file: `index.html` in Apps Script editor (paste content of `gas-deploy/index.html`)
- Code file: `Code.gs` in Apps Script editor (paste content of `gas-deploy/Code.gs`)
- **Every change requires creating a new deployment version** in Apps Script → Deploy → Manage Deployments → Edit → New version

### Data Flow
```
Learner completes assessment
  → buildPath() renders results in browser
  → submitResults() fires fetch POST to GAS_URL (mode: no-cors, no response possible)
    → doPost(e) in Code.gs receives payload
    → handleAssessment() writes row to "Responses" sheet
  → (optional) requestRetakeReminder() fires second fetch POST
    → handleReminder() writes row to "Reminders" sheet
```

**Critical constraint:** `mode: 'no-cors'` means the JavaScript in the browser never sees the response. The POST fires and forgets. If there's an error in Code.gs, the learner won't know. All debugging of the backend must be done in Apps Script's execution logs.

---

## 6. Course Recommendation Engine — Current Design + Known Issues

### Catalog
- **584 courses** from Coursera's GenAI catalog
- Each course has: `n` (name), `p` (provider), `u` (URL), `h` (hours), `r` (rating), `d` (difficulty: BEGINNER/INTERMEDIATE/ADVANCED), `rs` (RANGE relevance scores per dimension), `fn` (function tags), `t` (tool affinity)

### RS Scores (RANGE relevance per dimension)
Each course has a relevance score from 0–1 for each RANGE dimension (r, a, n, g, e). These were **auto-generated**, not human-curated.

**The core problem:** Almost every course in the catalog has `rs.r = 1.0` (full Reach relevance). This is because Reach is about "willingness to experiment with AI" and the auto-generation algorithm interpreted "AI course = involves experimentation = Reach = 1.0." Reach is effectively non-discriminating — it can't filter courses because everything scores max on Reach.

**Consequence:** When a learner has a Reach gap (even just one Pre-Pilot dimension out of 5), the scoring engine floods the results with high-Reach courses, including domain-specific and inappropriate courses like "Avoiding AI Harm" (an ethics course from a cancer center) and "Introduction to AI in Sports."

### Scoring Algorithm (`pickCourses`)
```
For each course:
  score = 0
  For each gap dimension (sorted lowest first):
    gapWeight = 3 - level (so Pre-Pilot = weight 3, Builder = weight 1)
    score += course.rs[dim] * gapWeight * 3
  +2 if course.fn includes learner's function
  +1 if course tool affinity matches learner's AI tool
  +1 if course difficulty matches expectedDiff
  -6 if course is BEGINNER and learner avg >= 1.5  (added recently)
  -2 if course is ADVANCED and learner avg < 1.5
  +0–0.5 for rating quality
```

**Why this still fails:**
- The -6 BEGINNER penalty helps but doesn't eliminate the problem. A course with rs.r = 1.0 and weight 3 scores 9 from the Reach dimension alone, which easily overcomes the -6 penalty.
- "Avoiding AI Harm" scores: 1.0 * 3 * 3 = 9 from Reach + good rating → surfaces even with -6 penalty
- The fix requires fixing the data (RS scores), not just the algorithm

### The Right Fix
**Short-term (algorithmic):** Filter out courses with titles/providers that are clearly domain-specific (healthcare, military, education-sector-specific) or that are ethics-only courses (not fluency-building). Add an `exclude` field to known bad courses.

**Medium-term (data quality):** Curate a short list of ~30 high-quality, BetterUp-context-appropriate courses with manually verified RS scores. Use this "curated set" for recommendations. Use the full 584-course catalog only for the function collection links (where learners browse rather than being algorithmically routed).

**Long-term:** Map SKILL_FOCUS skill names directly to courses. Each course gets tagged with which SKILL_FOCUS skills it develops (e.g., "Prompt Engineering for ChatGPT" → `autonomy.0.skills[1]` = "Prompt construction"). Route by skill match, not by dimension score.

---

## 7. Google Sheet — Current Schema

### Responses tab (21 columns — as of latest Code.gs)
1. Timestamp
2. Name
3. Email
4. Team (function)
5. AI Tool
6. People Manager (Yes/No)
7. R — Reach (level label)
8. A — Autonomy (level label)
9. N — Navigation (level label)
10. G — Generalization (level label)
11. E — Execution Fidelity (level label)
12. Avg RANGE Score (numeric, e.g., 2.0)
13. Overall Level (Pre-Pilot / Pilot / Builder / Multiplier)
14. Gap Dimensions (comma-separated dimension IDs below level 2)
15. Skill Priority 1
16. Skill Priority 2
17. Skill Priority 3
18. Course Rec 1 (name only)
19. Course Rec 2 (name only)
20. Course Rec 3 (name only)
21. AFS Next Status (not_yet / teaser / recommended)

### Reminders tab
1. Logged At
2. Name
3. Email
4. Retake Date (ISO date, 90 days after submission)

**Important:** The sheet that already exists was created by the old Code.gs and only has 12 columns. After deploying the new Code.gs, delete the old sheet or let the next submission auto-create a new one with the correct 21-column schema.

---

## 8. Known Bugs + Root Causes

### Bug 1: Wrong course recommendations for advanced learners
**Symptom:** Learner with R=Pre-Pilot, A=Multiplier, N=Builder, G=Builder, E=Multiplier (avg 2.0) receives beginner courses like "Avoiding AI Harm."

**Root cause:** RS scores in the catalog are auto-generated. Nearly every course has rs.r = 1.0. When the learner has any Reach gap, high-Reach courses flood the results. The -6 BEGINNER penalty added recently helps but doesn't fully solve it because the dimension scoring (score += 1.0 * 3 * 3 = 9) easily overcomes the penalty.

**What's needed:** Catalog curation — either fix RS scores for the top recurring courses, or maintain a curated shortlist of ~30 vetted courses for recommendation purposes.

### Bug 2: Sheet not capturing skills or courses
**Symptom:** Google Sheet has scores but no skill priority or course recommendation columns.

**Root cause:** The new Code.gs with 21 columns has been written but not yet deployed to Apps Script. The live backend is still the old 12-column version. **This is a deployment action, not a code fix.**

**Fix:** Paste new Code.gs into Apps Script → Deploy → New version. The next submission will auto-create a new sheet with the correct 21-column schema (or if old sheet exists, it will need to be deleted first).

### Bug 3: Reminder data lost
**Symptom:** When learner clicks "Yes, email me a reminder," nothing is captured in the sheet.

**Root cause:** Old Code.gs doPost didn't check for `data.type === 'reminder'` and had no Reminders tab. Fixed in new Code.gs.

**Fix:** Same as Bug 2 — deploy new Code.gs.

---

## 9. What "Fixed" Looks Like

**Course recommendations:**
- A learner with avg 2.0 (mostly Builder/Multiplier) sees 3 INTERMEDIATE or ADVANCED courses relevant to their specific gap dimension (e.g., if Reach is the gap: a structured experimentation course, a design thinking + AI course, or a strategic AI adoption course — not "Avoiding AI Harm")
- No domain-specific courses (healthcare, sports, university leadership) appear for general business learners
- The "why for you" explanation accurately describes what the course builds

**Google Sheet:**
- Every submission fills 21 columns
- Skill Priority 1–3 columns show: e.g., "Reach (Pre-Pilot): Exploratory experimentation · Tolerance for AI failure"
- Course Rec 1–3 columns show the names of the 3 courses shown to the learner
- Reminders tab captures retake requests separately

**L&D analysis Fabia can run:**
- Filter by function → see which functions are behind on which dimensions
- Pivot on Skill Priority columns → see which skills are most needed org-wide
- Pivot on Course Rec columns → see which courses are being recommended most → inform Coursera collection building

---

## 10. Design Questions for Claude.ai

Bring these to Claude.ai with this document:

1. **Course recommendation architecture:** Given the catalog quality problem (auto-generated RS scores, domain-specific courses, everything tagged r=1.0), what's the most practical path to get high-quality recommendations without manually curating 584 courses? Is there a way to use the course title/provider as a filter, or to re-score the courses using a better method?

2. **Skill-to-course mapping:** The learner journey delivers specific named skills (from SKILL_FOCUS). The right course recommendation would be: "here are 3 courses that teach the specific skills you need." What's the best way to create this skill-to-course mapping given the current catalog structure?

3. **Sheet schema for L&D analysis:** The current schema captures skills as strings (e.g., "Reach (Pre-Pilot): skill1 · skill2"). Is there a better structure for Fabia's analysis needs — e.g., separate columns per dimension-skill, or a JSON field?

4. **Catalog curation process:** What's the fastest way to identify and exclude clearly inappropriate courses (domain-specific, ethics-only, academic tools) from a 584-course catalog? Can this be done algorithmically using the course name and provider fields?

---

## Appendix: Key Constants

### LEVELS
```javascript
const LEVELS = ['Pre-Pilot', 'Pilot', 'Builder', 'Multiplier'];
```

### DOMAINS
```javascript
const DOMAINS = [
  { id: 'reach',          num: 'R', name: 'Reach',             tagline: 'How far you push AI' },
  { id: 'autonomy',       num: 'A', name: 'Autonomy',          tagline: 'How far you take it' },
  { id: 'navigation',     num: 'N', name: 'Navigation',        tagline: 'How well you orient' },
  { id: 'generalization', num: 'G', name: 'Generalization',    tagline: 'How widely it travels' },
  { id: 'execution',      num: 'E', name: 'Execution Fidelity', tagline: 'How consistently it lands' }
];
```

### PROGRAMS (index 1–3; index 0 is null/reserved)
- 1: AFS Next (Pilot-level learners; condition: any dim at level 1)
- 2: AI Builder Change Agent (Builder → Multiplier; condition: any dim at level 3 in old logic, now: 3+ dims Pilot+, 1+ Builder+)
- 3: Already at Multiplier (all dims at 3)

### SKILL_FOCUS structure
```javascript
SKILL_FOCUS[dimensionId][level] = {
  soWhat: "2-sentence behavioral interpretation",
  skills: [
    { name: "Skill name", desc: "Behavioral definition" },
    { name: "Skill name", desc: "Behavioral definition" },
    { name: "Skill name", desc: "Behavioral definition" }
  ]
}
```
5 dimensions × 4 levels = 20 entries. Each entry has 3 skills. Total: 60 named skills in the system.

### Course catalog structure (per course)
```javascript
{
  "n": "Course name",
  "p": "Provider",
  "u": "https://coursera.org/...",
  "h": 8.0,           // hours
  "r": 4.7,           // rating (0–5)
  "d": "BEGINNER",    // BEGINNER | INTERMEDIATE | ADVANCED
  "rs": {             // RANGE dimension relevance (0–1, auto-generated)
    "r": 1.0,         // Reach relevance
    "a": 0.92,        // Autonomy relevance
    "n": 0.0,         // Navigation relevance
    "g": 0.0,         // Generalization relevance
    "e": 0.63         // Execution Fidelity relevance
  },
  "fn": ["software", "finance", "data"],  // function tags
  "t": "other"        // tool affinity: "claude" | "copilot" | "other"
}
```

---

*Document generated April 2026. Code lives at: `/Users/fabiaj.bianco/Desktop/ai-learning-strategy/`*
