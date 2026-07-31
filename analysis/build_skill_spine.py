#!/usr/bin/env python3
"""Extract the AI Capability Map into a clean assessment content spine.

Applies Fabia's directed removals, flags data defects, and tags every skill
against the BetterUp Labs adaptive-capacity readiness factors and the
non-AI skill layer.

Usage:
    python3 analysis/build_skill_spine.py baseline/BU_AI_Capability_Map_FY27.xlsx \
        content/skill-spine.json

Output is the single source of truth for ITEM_BANK and SKILL_FOCUS content.
No dependencies.
"""

import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from xml.etree import ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# Column layout of the "Capability Map" sheet
COL = {
    "dim": 0,
    "dimension": 1,
    "sub_competency": 2,
    "transition": 3,
    "skill": 4,
    "in_practice": 5,
    "cert_pathway": 6,
    "functions": 7,
}
# Columns 8 (Lee), 9 (Gail) and 10 (Notes) are reviewer scratch space.
# Fabia: "anything that has Lee and Gail as reviewers removed." Dropped below.

DIMS = ["R", "A", "N", "G", "E"]
TRANSITIONS = ["Pre-Pilot → Pilot", "Pilot → Builder", "Builder → Multiplier"]

# Fabia: "anything ChatGPT needs to be removed."
# BU policy already excludes ChatGPT/OpenAI-branded Coursera courses, so naming
# ChatGPT as a skill in a Claude-based org is a contradiction.
BANNED_SKILL_PATTERN = re.compile(r"chatgpt|openai", re.I)
RENAMES = {"ChatGPT": "Applied AI delivery"}

# BetterUp Labs individual AI-readiness factors (Khoa Le Nguyen, prelim).
# Keyword tags let us audit coverage rather than assert it.
READINESS_FACTORS = {
    "engagement": ["experiment", "curiosity", "emerging technolog", "adaptab", "innovation"],
    "job_crafting": ["business process improvement", "digital transformation", "automation",
                     "business process automation"],
    "calibration_verify": ["critical thinking", "verification", "risk assess", "model evaluation",
                           "trustworth", "accountab", "responsible ai", "data validation",
                           "quality management", "benchmarking"],
    "calibration_route": ["goal setting", "needs assessment", "resource management"],
    "championing": ["coaching", "teaching", "training", "change management", "collaboration",
                    "stakeholder", "leadership", "facilitation", "culture", "communication"],
    "optimism": [],   # expected empty — audited gap
    "identity": [],   # expected empty — audited gap
}

# Non-AI skills that yield better AI builds (Fabia's list).
NON_AI_SKILL_LAYER = {
    "systems thinking": ["systems thinking"],
    "process mapping": ["process mapping"],
    "process design": ["process design"],
    "workflow design": ["workflow", "ai workflows"],
    "quality assurance": ["quality management", "quality", "usability testing", "data validation"],
    "user accessibility": ["accessib", "usability"],
    "systemic adoption": ["adoption", "scalability", "systemic"],
    "change management": ["change management", "organizational change"],
}


def col_index(ref):
    letters = "".join(c for c in ref if c.isalpha())
    n = 0
    for c in letters:
        n = n * 26 + ord(c) - 64
    return n - 1


def read_sheet(path, sheet="xl/worksheets/sheet2.xml"):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in tree.iter(NS + "si"):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))

    def value(c):
        inline = c.find(NS + "is")
        if inline is not None:
            return "".join(t.text or "" for t in inline.iter(NS + "t"))
        v = c.find(NS + "v")
        if v is None or v.text is None:
            return ""
        return shared[int(v.text)] if c.get("t") == "s" else v.text

    rows = []
    for r in ET.fromstring(z.read(sheet)).iter(NS + "row"):
        row = {}
        for c in r.iter(NS + "c"):
            val = value(c).strip()
            if val:
                row[col_index(c.get("r"))] = val
        rows.append(row)
    return rows


def tag(text, taxonomy):
    """Return every taxonomy key whose keywords appear in text."""
    low = text.lower()
    return sorted(k for k, words in taxonomy.items() if any(w in low for w in words))


def main(src, dest):
    rows = read_sheet(src)
    raw = [r for r in rows if r.get(COL["dim"]) in DIMS and r.get(COL["skill"])]

    skills, removed = [], []
    for r in raw:
        name = r[COL["skill"]]
        practice = r.get(COL["in_practice"], "")

        if BANNED_SKILL_PATTERN.search(name) or BANNED_SKILL_PATTERN.search(practice):
            if name in RENAMES:
                # Keep the capability, drop the vendor. Rewrite the behaviour.
                practice = BANNED_SKILL_PATTERN.sub("Claude", practice)
                practice = practice.replace("(or equivalent) ", "")
                name = RENAMES[name]
            else:
                removed.append({"skill": name, "reason": "ChatGPT/OpenAI reference — BU policy"})
                continue

        searchable = f"{name} {practice}"
        skills.append({
            "dim": r[COL["dim"]],
            "dimension": r.get(COL["dimension"], ""),
            "sub_competency": r.get(COL["sub_competency"], ""),
            "transition": r.get(COL["transition"], ""),
            "skill": name,
            "in_practice": practice,
            "cert_pathway": r.get(COL["cert_pathway"], ""),
            "functions": r.get(COL["functions"], ""),
            "readiness_factors": tag(searchable, READINESS_FACTORS),
            "non_ai_layer": tag(searchable, NON_AI_SKILL_LAYER),
        })
        # Reviewer columns (8 Lee, 9 Gail, 10 Notes) intentionally not carried.

    # ---- Defect detection -------------------------------------------------
    seen, duplicates = {}, []
    for s in skills:
        key = (s["dim"], s["transition"], s["skill"], s["in_practice"])
        if key in seen:
            duplicates.append({"dim": s["dim"], "transition": s["transition"],
                               "skill": s["skill"]})
        seen[key] = True

    afs_refs = [s["skill"] for s in skills if "AFS" in s.get("cert_pathway", "")]

    # ---- Coverage audit ---------------------------------------------------
    factor_counts = Counter()
    for s in skills:
        for f in s["readiness_factors"]:
            factor_counts[f] += 1
    layer_counts = Counter()
    for s in skills:
        for l in s["non_ai_layer"]:
            layer_counts[l] += 1

    grid = defaultdict(int)
    for s in skills:
        grid[(s["dim"], s["transition"])] += 1

    spine = {
        "source": src.split("/")[-1],
        "generated_by": "analysis/build_skill_spine.py",
        "skill_count": len(skills),
        "transitions": TRANSITIONS,
        "removals_applied": {
            "chatgpt_openai_skills": removed,
            "renamed": RENAMES,
            "reviewer_columns_dropped": ["Lee (RANGE)", "Gail (TPS Priority)", "Notes"],
        },
        "defects": {
            "duplicate_rows": duplicates,
            "cert_pathway_still_references_afs": afs_refs,
        },
        "coverage": {
            "by_dim_transition": {f"{d} | {t}": grid[(d, t)] for d in DIMS for t in TRANSITIONS},
            "readiness_factors": dict(factor_counts),
            "non_ai_layer": dict(layer_counts),
            "gaps": {
                "readiness_factors": [k for k in READINESS_FACTORS if not factor_counts[k]],
                "non_ai_layer": [k for k in NON_AI_SKILL_LAYER if not layer_counts[k]],
            },
        },
        "skills": skills,
    }

    with open(dest, "w") as f:
        json.dump(spine, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # ---- Report -----------------------------------------------------------
    print(f"Skills retained: {len(skills)}  (from {len(raw)} rows)")
    print(f"Removed for ChatGPT/OpenAI policy: {len(removed)}")
    for r in removed:
        print(f"   - {r['skill']}")
    print(f"Renamed: {RENAMES}")
    print()
    print("Coverage by dimension x transition:")
    header = "".join(f"{t:>24}" for t in TRANSITIONS)
    print(f"{'':4}{header}   TOTAL")
    for d in DIMS:
        counts = [grid[(d, t)] for t in TRANSITIONS]
        print(f"{d:4}" + "".join(f"{c:>24}" for c in counts) + f"{sum(counts):>8}")
    print()
    print("Labs readiness factor coverage (skills tagged):")
    for k in READINESS_FACTORS:
        n = factor_counts[k]
        flag = "  <-- GAP" if n == 0 else ""
        print(f"   {k:22} {n:4}{flag}")
    print()
    print("Non-AI skill layer coverage (Fabia's list):")
    for k in NON_AI_SKILL_LAYER:
        n = layer_counts[k]
        flag = "  <-- GAP" if n == 0 else ""
        print(f"   {k:22} {n:4}{flag}")
    print()
    if duplicates:
        print(f"Duplicate rows found: {len(duplicates)}")
        for d in duplicates:
            print(f"   - {d['dim']} | {d['transition']} | {d['skill']}")
    if afs_refs:
        print(f"\nCert Pathway still references AFS on {len(afs_refs)} skills "
              f"(programs are coming out of learner-facing output)")
    print(f"\nWrote {dest}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
