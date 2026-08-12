#!/usr/bin/env python3
"""Derive the two-level team dropdown from a Workday worker report.

Learners were complaining their team wasn't in the dropdown, because the list was
hardcoded from a stale guess. This builds it from the actual roster instead.

Function comes from the cost-centre prefix (10xxx, 20xxx …), sub-function from the
cost-centre name with the numeric code stripped. Coverage is asserted at 100% --
if any active worker lacks a cost centre the build fails rather than silently
producing a list someone is missing from.

PRIVACY: the input contains names, work emails, managers and employment status.
Nothing per-person is read into the output -- only cost-centre labels and counts.
Do not commit the source report.

Usage:
    python3 analysis/build_team_taxonomy.py <worker_report.xlsx> content/teams.json
"""

import collections
import json
import sys
import zipfile
from xml.etree import ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

COL_ACTIVE = 4       # "Active Status" — 'Yes' for current workers
COL_WORKER_TYPE = 3  # Employee | Contingent Worker (both included, per Fabia)
COL_COST_CENTER = 12

# Cost-centre prefix -> learner-facing function name.
FUNCTIONS = {
    "10": "Corporate & Operations",
    "20": "Customer Support & Care",
    "30": "Coaching Operations",
    "40": "Revenue & Client Services",
    "50": "Marketing",
    "60": "Product, Engineering & Labs",
}

# Cost-centre names carry internal shorthand. Rewrite the ones a learner would
# not recognise as their own team.
RELABEL = {
    "Office of CEO": "Office of the CEO",
    "People Admin": "People & Community",
    "Human Resources": "People & Community — HR",
    "Recruiting": "Talent Acquisition",
    "Data and Insights": "Data & Insights",
    "IT": "IT & Internal Systems",
    "FP&A": "Financial Planning & Analysis",
    "Corp Development": "Corporate Development",
    "Gen AI": "Generative AI",
    "Operations Strategy Executive": "Operations Strategy",
    "Cost of Sales - Operations": "Cost of Sales Operations",
    "CE&S Admin": "CE&S",
    "Sales AM Management": "Account Management Leadership",
    "Sales AE Management": "Sales Leadership",
    "Product Managers - Platform": "Product Management — Platform",
    "Product Managers - Apps": "Product Management — Apps",
}

# Cost-centre prefixes are a good default but not authoritative — Workday's
# finance coding does not always match how the org actually describes itself.
# These overrides win, keyed by cost-centre code, and are the place to record
# corrections from the people who own each org.
#
#   code: (function, sub-function)
#
# Several codes can share a sub-function name to merge them into one option.
OVERRIDES = {
    # Fabia: "Behavioral Science sits under Client Partnership & Behavioral
    # Science, under CE&S." Merges 40180 and 40195 into one sub-team.
    "40180": ("CE&S", "Client Partnership & Behavioral Science"),
    "40195": ("CE&S", "Client Partnership & Behavioral Science"),
    "40165": ("CE&S", "CE&S"),

    # Fabia: "Customer Success is enough" — 40140 and 40145 were showing as two
    # near-identical options.
    "40140": ("Revenue & Client Services", "Customer Success"),
    "40145": ("Revenue & Client Services", "Customer Success"),

    # Same defect: an "X Admin" cost centre alongside the team's own, which read
    # as two teams. Collapsed into one option each.
    "60100": ("Product, Engineering & Labs", "Engineering"),
    "60110": ("Product, Engineering & Labs", "Engineering"),
    "60600": ("Product, Engineering & Labs", "Experience Architecture"),
    "60610": ("Product, Engineering & Labs", "Experience Architecture"),
}

# Every function gets this, so nobody is ever stuck.
CATCH_ALL = "Other / Not listed"


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

    rows = []
    for r in ET.fromstring(z.read("xl/worksheets/sheet1.xml")).iter(NS + "row"):
        row = {}
        for c in r.iter(NS + "c"):
            val = value(c).strip()
            if val:
                row[col_index(c.get("r"))] = val
        rows.append(row)
    return rows


def clean(cost_center):
    """'40145 Customer Success Managers' -> 'Customer Success Managers'."""
    parts = cost_center.split(None, 1)
    name = parts[1] if len(parts) > 1 and parts[0].isdigit() else cost_center
    name = name.replace(" Admin", "").strip() or name.strip()
    return RELABEL.get(name, name)


def main(src, dest):
    rows = read_rows(src)
    header_at = next(i for i, r in enumerate(rows) if r.get(0) == "Preferred Name")
    data = [r for r in rows[header_at + 1:] if r.get(0)]

    active = [r for r in data if r.get(COL_ACTIVE) == "Yes"]
    if not active:
        sys.exit("FAIL: no rows with Active Status = 'Yes'")

    missing = [r for r in active if not r.get(COL_COST_CENTER)]
    if missing:
        sys.exit(f"FAIL: {len(missing)} active workers have no cost centre — "
                 "the dropdown would be missing them. Fix the report first.")

    tree = collections.defaultdict(collections.Counter)
    unmapped = collections.Counter()
    overridden = 0
    for r in active:
        cc = r[COL_COST_CENTER]
        code = cc.split()[0]
        if code in OVERRIDES:
            fn, sub = OVERRIDES[code]
            overridden += 1
        else:
            fn = FUNCTIONS.get(code[:2])
            sub = clean(cc)
        if not fn:
            unmapped[cc] += 1
            continue
        tree[fn][sub] += 1

    if unmapped:
        sys.exit("FAIL: cost centres with unrecognised prefix and no override:\n  " +
                 "\n  ".join(f"{v}x {k}" for k, v in unmapped.items()))

    # Override targets must be real, or a correction silently does nothing.
    declared = {f for f, _ in OVERRIDES.values()}
    for fn in declared:
        if fn not in tree:
            sys.exit(f"FAIL: override targets function '{fn}' but no active worker "
                     "landed there — check the cost-centre codes.")

    order = list(FUNCTIONS.values()) + sorted(declared - set(FUNCTIONS.values()))
    functions = []
    for fn in order:
        subs = sorted(tree[fn])
        if not subs:
            continue
        functions.append({
            "function": fn,
            "headcount": sum(tree[fn].values()),
            "subFunctions": subs + [CATCH_ALL],
        })

    out = {
        "_doc": ("Two-level team dropdown, derived from the Workday worker report by "
                 "analysis/build_team_taxonomy.py. Function = cost-centre prefix, "
                 "sub-function = cost-centre name. Active workers only; employees and "
                 "contingent workers both included. Regenerate when the roster changes."),
        "_source": src.split("/")[-1],
        "_activeWorkers": len(active),
        "_byWorkerType": dict(collections.Counter(r.get(COL_WORKER_TYPE, "?") for r in active)),
        "catchAll": CATCH_ALL,
        "functions": functions,
    }
    with open(dest, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Overrides applied to {overridden} workers")
    print(f"Active workers: {len(active)}  "
          f"({', '.join(f'{v} {k.lower()}' for k, v in out['_byWorkerType'].items())})")
    print(f"Coverage: 100% — every active worker maps to a function\n")
    for fn in functions:
        print(f"{fn['function']}  ({fn['headcount']})")
        for s in fn["subFunctions"]:
            n = tree[fn["function"]][s]
            print(f"    {s}" + (f"  [{n}]" if n else "  [catch-all]"))
        print()
    print(f"Wrote {dest}")
    print(f"{len(functions)} functions, "
          f"{sum(len(f['subFunctions']) for f in functions)} sub-function options")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
