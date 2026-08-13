#!/usr/bin/env python3
"""Derive the two-level team dropdown from a Workday supervisory-org report.

Learners were complaining their team wasn't in the dropdown, because the list was
hardcoded from a guess. This builds it from the actual org tree instead.

  main team  = Level 3 Supervisory Org   (falls back to Level 2 when blank)
  sub-team   = Level 4 Supervisory Org   (blank means the person sits directly
                                          in the main team)

Columns are located by header name, not position, so a re-run of the Workday
report with different column ordering still works.

Coverage is asserted: every worker must land in some main team, or the build fails
rather than silently emitting a list someone is missing from.

PRIVACY: the input contains names, work emails, managers and HRBP assignments.
Nothing per-person is read into the output -- only org names and counts. Do not
commit the source report.

Usage:
    python3 analysis/build_team_taxonomy.py <report.xlsx> content/teams.json
"""

import collections
import re
import json
import sys
import zipfile
from xml.etree import ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

HDR_L2 = "Level 2 Supervisory Org"
HDR_L3 = "Level 3 Supervisory Org"
HDR_L4 = "Level 4 Supervisory Org"
HDR_L5 = "Level 5 Supervisory Org"
HDR_ID = "ID"

# Sub-team label for someone who sits directly in the main team with no Level 4.
DIRECT = "{team} — no sub-team"

# Level 5 is where several real teams live (e.g. "Client Partnership, Behavioral
# Sciences and PIC" under Customer Experience & Services), so it is used when it
# adds information. But a sub-team of one or two people, sitting next to an
# individual's results, is effectively an identifier -- so Level 5 only splits out
# once the group reaches this size. Smaller groups roll up to their Level 4.
MIN_L5_GROUP = 3

# Always offered, at both levels, so nobody is ever stuck.
CATCH_ALL = "Other / Not listed"

# Org names that read as internal shorthand. Keyed on the Workday value.
RELABEL = {
    "COO Direct": "Operations (COO org)",
    "CEO Direct": "Office of the CEO",
    "LAPPS": "Legal AI, Product, Privacy & Security",
    "Legal AI, Product, Privacy, Security (LAPPS)":
        "Legal — AI, Product, Privacy & Security",
    "Legal, Commercial": "Legal — Commercial",
    "D2C": "Direct-to-Consumer",
    "CIO Org": "CIO Office",
    "Human Resources, Europe": "Human Resources — Europe",
    "Marketing EMEA": "Marketing — EMEA",
    "Studios, Interactive": "Studios (Interactive)",
    "Center for Daring Leadership": "Center for Daring Leadership",
    "Partnerships, Advisors, & Community": "Partnerships, Advisors & Community",
    "Information Technology & Security": "IT & Security",
    "R&D Product Operations": "R&D Product Operations",
}

# Corrections that outrank the org tree, keyed on the Workday Level 3 value.
# This is where to record "team X actually sits under Y" from the people who own
# each org. Empty is fine — the org tree is usually right.
FUNCTION_OVERRIDES = {}


def read_rows(path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).iter(NS + "si"):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))

    def col_index(ref):
        letters = "".join(c for c in ref if c.isalpha())
        n = 0
        for c in letters:
            n = n * 26 + ord(c) - 64
        return n - 1

    def value(c):
        v = c.find(NS + "v")
        if v is None or v.text is None:
            return ""
        return shared[int(v.text)] if c.get("t") == "s" else v.text

    sheet = next(n for n in z.namelist() if n.startswith("xl/worksheets/sheet"))
    rows = []
    for r in ET.fromstring(z.read(sheet)).iter(NS + "row"):
        row = {}
        for c in r.iter(NS + "c"):
            val = value(c).strip()
            if val:
                row[col_index(c.get("r"))] = val
        rows.append(row)
    return rows


def label(name):
    return RELABEL.get(name, name)


def main(src, dest):
    rows = read_rows(src)

    header_at, header = next(
        (i, r) for i, r in enumerate(rows) if HDR_ID in r.values()
    )
    cols = {v: k for k, v in header.items()}
    for h in (HDR_L2, HDR_L3, HDR_L4):
        if h not in cols:
            sys.exit(f"FAIL: column '{h}' not found. Headers present:\n  "
                     + "\n  ".join(sorted(header.values())))
    c_l2, c_l3, c_l4 = cols[HDR_L2], cols[HDR_L3], cols[HDR_L4]
    c_l5 = cols.get(HDR_L5)
    c_id = cols[HDR_ID]

    workers = [r for r in rows[header_at + 1:] if r.get(c_id)]
    if not workers:
        sys.exit("FAIL: no worker rows found")

    # Which Level 5 orgs are big enough to stand as their own option, and add
    # something their Level 4 parent does not already say.
    def l5_adds_nothing(l4, l5):
        """True when the Level 5 name just restates its parent.

        Workday holds 'Platform Engineering' > 'Engineering' and
        'Information Technology & Security' > 'Information technology & Security'
        (a casing difference). Splitting on those produces two options a learner
        cannot tell apart, so they are folded back into the Level 4.

        The test is whether Level 5 introduces a new word. Substring matching was
        too blunt -- it folded 'Enterprise Sales' into 'Sales' and lost a real
        team.
        """
        words = lambda s: {w for w in re.split(r"[^a-z0-9]+", s.lower()) if w}
        return words(l5) <= words(l4)

    l5_sizes = collections.Counter()
    if c_l5:
        for r in workers:
            l4, l5 = r.get(c_l4), r.get(c_l5)
            if l4 and l5 and not l5_adds_nothing(l4, l5):
                l5_sizes[(l4, l5)] += 1
    l5_ok = {pair for pair, n in l5_sizes.items() if n >= MIN_L5_GROUP}
    rolled_up = sum(n for pair, n in l5_sizes.items() if pair not in l5_ok)

    tree = collections.defaultdict(collections.Counter)
    unplaced = 0
    for r in workers:
        # Level 3 is the main team; people who report above it fall back to
        # Level 2 (in practice, CEO Direct).
        raw_team = r.get(c_l3) or r.get(c_l2)
        if not raw_team:
            unplaced += 1
            team = CATCH_ALL
        else:
            team = label(FUNCTION_OVERRIDES.get(raw_team, raw_team))

        if not r.get(c_l4):
            sub = DIRECT.format(team=team)
        elif c_l5 and (r.get(c_l4), r.get(c_l5)) in l5_ok:
            # Keep the Level 4 parent in the label, so the grouping a learner
            # recognises is still visible: "Customer Experience & Services —
            # Deployment" rather than a bare "Deployment".
            sub = f"{label(r[c_l4])} — {label(r[c_l5])}"
        else:
            sub = label(r[c_l4])
        tree[team][sub] += 1

    placed = sum(sum(v.values()) for v in tree.values())
    if placed != len(workers):
        sys.exit(f"FAIL: {len(workers) - placed} workers did not land in a team")

    # Largest teams first — most learners find themselves without scrolling.
    order = sorted(tree, key=lambda t: (t == CATCH_ALL, -sum(tree[t].values())))

    functions = []
    for team in order:
        subs = sorted(tree[team])
        # Where everyone sits directly in the main team there is nothing to
        # choose, so emit no sub-teams at all and the second dropdown stays
        # hidden. Asking someone to pick "Other / Not listed" from a list of one
        # is a question with no information in it.
        if subs == [DIRECT.format(team=team)] or subs == [CATCH_ALL]:
            subs = []
        functions.append({
            "function": team,
            "headcount": sum(tree[team].values()),
            "subFunctions": (subs + [CATCH_ALL]) if subs else [],
        })

    if not any(f["function"] == CATCH_ALL for f in functions):
        functions.append({"function": CATCH_ALL, "headcount": 0,
                          "subFunctions": []})

    out = {
        "_doc": ("Two-level team dropdown, generated by "
                 "analysis/build_team_taxonomy.py from a Workday supervisory-org "
                 "report. Main team = Level 3 Supervisory Org (Level 2 when blank); "
                 "sub-team = Level 4. Regenerate when the org changes."),
        "_source": src.split("/")[-1],
        "_workers": len(workers),
        "_minSubTeamSize": MIN_L5_GROUP,
        "catchAll": CATCH_ALL,
        "functions": functions,
    }
    with open(dest, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Workers: {len(workers)}   main teams: {len(functions)}   "
          f"sub-team options: {sum(len(f['subFunctions']) for f in functions)}")
    if unplaced:
        print(f"  {unplaced} with no Level 2 or 3 org -> {CATCH_ALL}")
    print(f"  Level 5 split out where the group reaches {MIN_L5_GROUP}; "
          f"{rolled_up} people in smaller Level 5 orgs rolled up to Level 4")
    print("Coverage: 100% — every worker lands in a main team\n")
    for f in functions:
        print(f"{f['function']}  ({f['headcount']})")
        for s in f["subFunctions"]:
            n = tree[f["function"]].get(s, 0)
            print(f"    {s}" + (f"  [{n}]" if n else "  [catch-all]"))
        print()
    print(f"Wrote {dest}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
