#!/usr/bin/env python3
"""Build the v2 assessment from the baseline HTML + content/items-v2.json.

Changes, all confined to the measurement layer:
  1. ITEM_BANK (agreement statements)  -> ITEM_BANK_V2 (behavioural anchors)
  2. Averaged-agreement scoring        -> gated anchor scoring
  3. 1-5 "Not like me / Most like me"  -> 6 labelled behaviour options
  4. Retake button removed             (retake is out of scope)
  5. Skill-gap output added            (the actual deliverable)

Untouched: intake, assessment shell, results rendering, sheet write, email.

Usage: python3 analysis/build_v2_html.py
"""

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "baseline" / "BU_AI_Fluency_Interactive.html"
ITEMS = ROOT / "content" / "items-v2.json"
DEST = ROOT / "BU_AI_Fluency_v2.html"

SCORING_JS = """
    // ─── Assessment Engine (v2 — gated anchor scoring) ────────────────────────
    //
    // The anchor a person picks IS the measurement. No averaging of agreement.
    //
    // Gate (Fabia): "I shouldn't be a pilot if I'm not using systems thinking,
    // process design, quality assessment, guardrails, ethics." Level is earned by
    // the craft underneath, not by how much AI you use. So a dimension level is
    // the level demonstrated on at least HALF that dimension's questions — one
    // high answer cannot carry you — and the overall level must hold across 4 of
    // the 5 dimensions.

    function buildQueue(dimId) {
      // Fixed order. No shuffle: with 6 ordered anchors, order carries meaning.
      return ITEM_BANK_V2[dimId].questions.map((q, i) => ({ qIdx: i, ...q }));
    }

    function initAssessment(dimId) {
      dimState[dimId] = { queue: buildQueue(dimId), responses: [], count: 0 };
    }

    function getCurrentItem(dimId) {
      const state = dimState[dimId];
      if (!state) return null;
      return state.queue[state.count] || null;
    }

    function recordResponse(dimId, choice) {
      const state = dimState[dimId];
      const item = state.queue[state.count];
      if (!item) return;
      state.responses.push({
        id: item.id,
        skill: item.skill,
        choice: choice,
        level: item.levelMap[choice],
        anchor: item.anchors[choice]
      });
      state.count++;
    }

    function isDimComplete(dimId) {
      const s = dimState[dimId];
      return s && s.count >= s.queue.length;
    }

    // Kept for the sheet payload. Now: how many answers landed at each level.
    function getDimAvgs(dimId) {
      const state = dimState[dimId];
      const counts = [0, 0, 0, 0];
      if (!state) return counts;
      state.responses.forEach(r => { counts[r.level]++; });
      return counts;
    }

    function getFinalLevel(dimId) {
      const state = dimState[dimId];
      if (!state || state.count === 0) return 0;
      const levels = state.responses.map(r => r.level).sort((a, b) => b - a);
      // Highest level demonstrated on at least half the questions.
      return levels[Math.floor(levels.length / 2)] || 0;
    }

    // The craft gate. Overall level is the median dimension — so no single strong
    // dimension can carry you — and a dimension still sitting at Pre-Pilot costs
    // one level. Fabia: "I shouldn't be a pilot if I'm not maintaining ethical
    // standards." A serious gap in the craft has a proportionate consequence
    // rather than a cliff.
    function getOverallLevel() {
      const per = DOMAINS.map(d => getFinalLevel(d.id)).sort((a, b) => a - b);
      const median = per[Math.floor(per.length / 2)];
      const penalty = per.some(x => x === 0) ? 1 : 0;
      return Math.max(0, median - penalty);
    }

    // Which dimension is holding the overall level down. The most actionable
    // single line in the report.
    function getLimitingDimensions() {
      return DOMAINS.filter(d => getFinalLevel(d.id) === 0).map(d => d.name);
    }

    // The deliverable: which craft skills are not yet in evidence, and where.
    // Anything answered below the person's own overall level is a live gap.
    function getSkillGaps() {
      const overall = getOverallLevel();
      const gaps = [];
      DOMAINS.forEach(d => {
        const s = dimState[d.id];
        if (!s) return;
        s.responses.forEach(r => {
          if (r.level < Math.max(overall, 1)) {
            gaps.push({
              dim: d.id, dimName: d.name, skill: r.skill,
              at: LEVELS[r.level], anchor: r.anchor,
              next: nextAnchorFor(d.id, r.id, r.level)
            });
          }
        });
      });
      // Widest gaps first.
      return gaps.sort((a, b) => LEVELS.indexOf(a.at) - LEVELS.indexOf(b.at));
    }

    // The next rung up on the same question — concrete, not advice.
    function nextAnchorFor(dimId, qId, level) {
      const q = ITEM_BANK_V2[dimId].questions.find(x => x.id === qId);
      if (!q) return '';
      for (let i = 0; i < q.anchors.length; i++) {
        if (q.levelMap[i] > level) return q.anchors[i];
      }
      return '';
    }

    function getCompletedCount() {
      return DOMAINS.filter(d => isDimComplete(d.id)).length;
    }
"""

INTRO_CARD_JS = """    function renderIntroCard(dimId) {
      const domain = DOMAINS.find(d => d.id === dimId);
      const total = ITEM_BANK_V2[dimId].questions.length;
      return `
        <div style="margin-top:16px;">
          <div style="font-size:0.88rem;line-height:1.7;color:var(--off-white);margin-bottom:14px;padding:16px 18px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:2px solid var(--rubine);">${domain.desc}</div>
          <div style="font-size:0.86rem;line-height:1.7;color:var(--text-mid);margin-bottom:16px;padding:14px 16px;background:rgba(206,0,88,0.05);border:1px solid rgba(206,0,88,0.18);border-radius:8px;">
            <span class="font-mono" style="display:block;font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--rubine-light);margin-bottom:7px;">How to answer</span>
            ${HOW_TO_ANSWER[dimId]}
          </div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:0.62rem;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:18px;">${total} questions &nbsp;·&nbsp; Pick what actually happened — no option is the wrong one</div>
          <button class="begin-rating-btn" data-action="begin-dim" data-dim="${dimId}" style="padding:10px 22px;background:transparent;border:1px solid rgba(206,0,88,0.5);color:var(--rubine-light);border-radius:6px;font-family:'IBM Plex Mono',monospace;font-size:0.65rem;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;transition:all 0.15s;">Begin →</button>
        </div>
      `;
    }
"""

WHATS_NEXT_JS = """        // ── What happens next ───────────────────────────────────────────────
        // Fabia's copy. Programs ARE ready — nothing here may suggest otherwise.
        const whatsNextHTML = `
          <div style="margin-top:28px;padding:16px 18px;background:rgba(206,0,88,0.06);border:1px solid rgba(206,0,88,0.2);border-radius:10px;">
            <div class="font-mono" style="font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--rubine-light);margin-bottom:10px;">What happens next</div>
            <p style="font-size:0.86rem;line-height:1.7;color:rgba(244,243,233,0.85);margin:0 0 12px;">Your answers go to the L&amp;D team, who use them to recommend the right program and curate your path in Coursera — so you can close these skills quickly instead of hunting for courses yourself. The programs are ready. Invitations are coming shortly.</p>
            <p style="font-size:0.86rem;line-height:1.7;color:rgba(244,243,233,0.75);margin:0;">If you'd like help sooner, or there's a skill you want to develop that didn't come through in your results, message the BU Learning team (Fabia) in Slack. She can take it into account when making recommendations for the courses and programs for you in Coursera.</p>
          </div>`;
"""

QUESTION_CARD_JS = """    function renderStatementCard(dimId) {
      const state = dimState[dimId];
      if (!state) return '';
      if (!dimIntroSeen[dimId]) return renderIntroCard(dimId);
      const item = getCurrentItem(dimId);
      if (!item) return renderCompletionState(dimId);
      const qNum = state.count + 1;
      const total = state.queue.length;
      return `
        <div style="margin-top:16px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;">Question ${qNum} of ${total} &nbsp;·&nbsp; ${item.skill}</div>
          <div style="font-size:0.97rem;line-height:1.65;color:var(--off-white);margin-bottom:8px;padding:14px 16px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:2px solid var(--rubine);">${item.stem}</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);margin:14px 0 10px;">Pick the one closest to what you actually did</div>
          <div style="display:flex;flex-direction:column;gap:7px;">
            ${item.anchors.map((a, i) => `<button class="anchor-btn" data-action="rate" data-dim="${dimId}" data-rating="${i}">${a}</button>`).join('')}
          </div>
        </div>
      `;
    }
"""

SKILL_GAP_RENDER_JS = """        // ── Skills to develop next ──────────────────────────────────────────
        // Fabia: "help me identify what skills are most prevalent for people to
        // develop where they are." No programs — she is building those from these
        // results, not routing into ones that already exist.
        const overall = getOverallLevel();
        const limiting = getLimitingDimensions();
        const gaps = getSkillGaps();

        const limitingHTML = limiting.length ? `
          <div style="background:rgba(206,0,88,0.06);border:1px solid rgba(206,0,88,0.2);border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:0.82rem;color:rgba(244,243,233,0.75);line-height:1.55;">
            <strong style="color:var(--rubine-light);">What's holding your level:</strong>
            ${limiting.join(' and ')}. You're working at ${LEVELS[overall]} overall — the craft in ${limiting.length > 1 ? 'these areas' : 'this area'} is what moves that, not doing more with AI.
          </div>` : '';

        const gapsHTML = gaps.length ? `
          <div style="margin-top:8px;">
            <div class="font-mono" style="color:var(--text-muted);margin-bottom:4px;font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;">Skills to develop next</div>
            <p style="font-size:0.875rem;color:var(--text-mid);margin-bottom:16px;line-height:1.6;">${userName.split(' ')[0]}, these are the specific skills where your answers put you below where the rest of your practice sits. Widest gaps first.</p>
            ${gaps.slice(0, 6).map(g => `
              <div style="border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:14px 16px;margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:8px;">
                  <span style="font-size:0.92rem;color:var(--off-white);font-weight:500;">${g.skill}</span>
                  <span class="font-mono" style="font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);white-space:nowrap;">${g.dimName} &nbsp;·&nbsp; ${g.at}</span>
                </div>
                <div style="font-size:0.8rem;color:var(--text-mid);line-height:1.55;margin-bottom:6px;"><span class="font-mono" style="font-size:0.6rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);">Now: </span>${g.anchor}</div>
                ${g.next ? `<div style="font-size:0.8rem;color:rgba(244,243,233,0.85);line-height:1.55;"><span class="font-mono" style="font-size:0.6rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--rubine-light);">Next: </span>${g.next}</div>` : ''}
              </div>`).join('')}
          </div>` : `
          <div style="margin-top:8px;font-size:0.875rem;color:var(--text-mid);line-height:1.6;">Your answers were consistent across all five dimensions — no single skill stands out as a gap relative to the rest of your practice.</div>`;

        courseRecsEl.innerHTML = `
          <div class="font-mono" style="color:var(--text-muted);margin-bottom:20px;font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;">Where to go next</div>
          ${limitingHTML}
          ${gapsHTML}
          ${whatsNextHTML}
        `;
      }
    }
"""

ANCHOR_CSS = """    .anchor-btn {
      text-align: left;
      padding: 12px 15px;
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 8px;
      color: var(--off-white);
      font-family: inherit;
      font-size: 0.875rem;
      line-height: 1.5;
      cursor: pointer;
      transition: all 0.14s;
    }
    .anchor-btn:hover {
      background: rgba(206,0,88,0.10);
      border-color: rgba(206,0,88,0.45);
    }
    .anchor-btn:active { transform: translateY(1px); }
"""


def replace_span(text, start_marker, end_pattern, replacement, label):
    """Replace from start_marker through the first end_pattern match after it."""
    i = text.find(start_marker)
    if i < 0:
        sys.exit(f"FAIL: could not find start of {label}")
    m = re.compile(end_pattern, re.M).search(text, i)
    if not m:
        sys.exit(f"FAIL: could not find end of {label}")
    return text[:i] + replacement + text[m.end():]


def main():
    html = SRC.read_text()
    items = json.loads(ITEMS.read_text())
    bank = {k: v for k, v in items.items() if not k.startswith("_")}

    # 1. ITEM_BANK -> ITEM_BANK_V2 (+ per-dimension answering instructions)
    how_to = {k: v["_howToAnswer"] for k, v in bank.items()}
    bank_js = ("    const ITEM_BANK_V2 = "
               + json.dumps(bank, indent=6, ensure_ascii=False)
               + ";\n\n    const HOW_TO_ANSWER = "
               + json.dumps(how_to, indent=6, ensure_ascii=False)
               + ";\n")
    html = replace_span(html, "    const ITEM_BANK = {", r"^    \};?$",
                        bank_js, "ITEM_BANK")

    # 1b. Framework copy — learning resources, not programs; drop the
    #     "demonstrate not studied" line (Fabia).
    html = html.replace(
        "connects gaps to specific programs. Your level is determined by what "
        "you can demonstrate — not what you've studied.",
        "connects gaps to specific learning resources.", 1)
    html = html.replace(
        "Your level in any RANGE dimension is what you can demonstrate — not "
        "what you've studied. Be honest with yourself. This is a development "
        "map, not a performance review.",
        "Answer for what you actually did over the last two weeks. Be honest "
        "with yourself — this is a development map, not a performance review.", 1)

    # 1c. Per-dimension "How to answer" guidance
    html = replace_span(html, "    function renderIntroCard(dimId) {",
                        r"^    \}$", INTRO_CARD_JS, "renderIntroCard")

    # 2. Engine -> gated anchor scoring
    html = replace_span(html,
                        "    // ─── Assessment Engine",
                        r"^    function getCompletedCount\(\) \{\n.*?\n    \}$",
                        SCORING_JS, "assessment engine")

    # 3. Question card -> 6 labelled anchors
    html = replace_span(html, "    function renderStatementCard(dimId) {",
                        r"^    \}$", QUESTION_CARD_JS, "renderStatementCard")

    # 3b. Course recommender out — skills, not programs.
    #     Drops the 584-course BU_CATALOG (~128KB) and the three-tier course
    #     engine, and puts the skill-gap output in its place.
    html = re.sub(r"[ ]*// ─── Full BetterUp Coursera Catalog.*?\n[ ]*const BU_CATALOG = \[.*?\];\n",
                  "", html, count=1, flags=re.S)

    #     Program card out too — no program recommendations in the output at all.
    html = replace_span(html, "        // ── AFS Next logic (3+ of 5 dims at Pilot or above) ──",
                        r"^          programHTML = '';\n        \}$",
                        WHATS_NEXT_JS, "program card")

    html = replace_span(html, "        // ── Course recommendations — 3 tiers ──",
                        r"^          \$\{collectionHTML\}\n        `;\n      \}\n    \}$",
                        SKILL_GAP_RENDER_JS, "course recommendation render")

    html = replace_span(html, "    // ─── Tier 1: RANGE gap targeting",
                        r"^    function pickManagerCourses\(levels, alreadyPicked\) \{(?:.*?\n)*?    \}$",
                        "", "course engine functions")

    # Submit payload: drop courses, add the skill gaps.
    html = re.sub(r"[ ]*const skillCourses = pickSkillCourses\(levels\);\n"
                  r"[ ]*const fnCourses = pickFunctionCourses\([^\n]*\);\n"
                  r"[ ]*const courses = \[\.\.\.skillCourses, \.\.\.fnCourses\];\n",
                  "", html, count=1)
    html = re.sub(r"[ ]*courses: courses\.map\([^\n]*\),\n",
                  "        skillGaps: getSkillGaps().map(g => "
                  "({ dim: g.dim, skill: g.skill, at: g.at, next: g.next })),\n"
                  "        limitingDimensions: getLimitingDimensions(),\n"
                  "        overallLevel: LEVELS[getOverallLevel()],\n", html, count=1)

    # 4. Anchor button styles
    html = html.replace("    .rating-btn {", ANCHOR_CSS + "    .rating-btn {", 1)

    # 5. Retake button out — retake is out of scope
    html = re.sub(r'\s*<button class="reset-btn".*?</button>', "", html, count=1)

    # 6. Honest window framing on the intake/assessment copy
    html = html.replace("Rate honestly — there are no right answers",
                        "Answer for the last two weeks")

    DEST.write_text(html)

    n_q = sum(len(v["questions"]) for v in bank.values())
    print(f"Wrote {DEST.relative_to(ROOT)}")
    print(f"  dimensions: {len(bank)}   questions: {n_q}   anchors each: 6")
    for k, v in bank.items():
        print(f"  {k:16} {v['_lens']:10} {', '.join(v['_craft'])}")


if __name__ == "__main__":
    main()
