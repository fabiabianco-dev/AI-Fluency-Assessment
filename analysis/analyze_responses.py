#!/usr/bin/env python3
"""Analyze the AI Fluency Assessment response export.

Reproduces every statistic quoted in docs/01-diagnosis.md.

Usage:
    python3 analysis/analyze_responses.py path/to/AI_Fluency_Assessment_Responses.xlsx

Reads .xlsx directly via zipfile + ElementTree so it runs with no dependencies.
"""

import sys
import zipfile
import statistics as st
from collections import Counter
from xml.etree import ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

DIMS = {
    "R — Reach": 7,
    "A — Autonomy": 8,
    "N — Navigation": 9,
    "G — Generalization": 10,
    "E — Execution Fidelity": 11,
}
LEVELS = ["Pre-Pilot", "Pilot", "Builder", "Multiplier"]
COL_AVG, COL_OVERALL, COL_GAP, COL_AFS = 12, 13, 14, 22
COL_TEAM, COL_EMAIL = 3, 2
PRIORITY_COLS = [(15, "Priority 1"), (16, "Priority 2"), (17, "Priority 3")]
COURSE_COLS = [
    (18, "Skills Course 1"),
    (19, "Skills Course 2"),
    (20, "Function Course 1"),
    (21, "Function Course 2"),
]


def col_index(ref):
    """'AB12' -> zero-based column index."""
    letters = "".join(c for c in ref if c.isalpha())
    n = 0
    for c in letters:
        n = n * 26 + ord(c) - 64
    return n - 1


def load_rows(path):
    z = zipfile.ZipFile(path)

    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in tree.iter(NS + "si"):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))

    def cell_value(c):
        inline = c.find(NS + "is")
        if inline is not None:
            return "".join(t.text or "" for t in inline.iter(NS + "t"))
        v = c.find(NS + "v")
        if v is None or v.text is None:
            return ""
        return shared[int(v.text)] if c.get("t") == "s" else v.text

    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = []
    for r in sheet.iter(NS + "row"):
        row = {}
        for c in r.iter(NS + "c"):
            val = cell_value(c)
            if val != "":
                row[col_index(c.get("r"))] = val
        rows.append(row)
    return rows


def pct(n, total):
    return f"{100 * n / total:.1f}%" if total else "n/a"


def main(path):
    rows = load_rows(path)
    total_exported = len(rows) - 1
    data = [r for r in rows[1:] if r]
    completed = [r for r in data if r.get(DIMS["R — Reach"])]
    n = len(completed)

    print(f"Rows exported (excl. header): {total_exported}")
    print(f"Non-empty rows:               {len(data)}")
    print(f"Completed submissions:        {n}\n")
    if not n:
        return

    print("=" * 72)
    print(f"PER-DIMENSION LEVEL DISTRIBUTION (n={n})")
    print("=" * 72)
    print(f"{'Dimension':24}" + "".join(f"{lv:>13}" for lv in LEVELS))
    for name, col in DIMS.items():
        counts = Counter(r.get(col, "") for r in completed)
        print(f"{name:24}" + "".join(f"{pct(counts[lv], n):>13}" for lv in LEVELS))

    scores = [float(r[COL_AVG]) for r in completed if r.get(COL_AVG)]
    if scores:
        band = [s for s in scores if 0.8 <= s <= 1.6]
        print(f"\nComposite score: mean {st.mean(scores):.2f}  median {st.median(scores):.2f}"
              f"  SD {st.pstdev(scores):.2f}  range {min(scores):.1f}-{max(scores):.1f}")
        print(f"Within the 0.8-1.6 band: {pct(len(band), len(scores))} of learners")

    identical = [r for r in completed
                 if all(r.get(c) == "Pilot" for c in DIMS.values())]
    print(f"Pilot on ALL five dimensions (identical output): "
          f"{len(identical)} ({pct(len(identical), n)})")

    print("\n" + "=" * 72)
    print("SKILL PRIORITY CONCENTRATION")
    print("=" * 72)
    for col, label in PRIORITY_COLS:
        counts = Counter(r.get(col, "") for r in completed)
        print(f"\n{label} — {len(counts)} distinct values across {n} learners")
        for value, count in counts.most_common(4):
            print(f"   {pct(count, n):>7}  {value or '(blank)'}")

    print("\n" + "=" * 72)
    print("COURSE RECOMMENDATION CONCENTRATION")
    print("=" * 72)
    for col, label in COURSE_COLS:
        counts = Counter(r.get(col, "") for r in completed)
        print(f"\n{label} — {len(counts)} distinct courses across {n} learners")
        for value, count in counts.most_common(4):
            print(f"   {pct(count, n):>7}  {(value or '(blank)')[:64]}")

    print("\n" + "=" * 72)
    print("INERT FIELDS")
    print("=" * 72)
    gap_counts = Counter(
        len([x for x in r.get(COL_GAP, "").split(",") if x.strip()]) for r in completed
    )
    print("Dimensions flagged as a gap per learner:")
    for k in sorted(gap_counts):
        print(f"   {k} flagged: {gap_counts[k]:4}  ({pct(gap_counts[k], n)})")
    print("\nAFS Next eligibility:")
    for value, count in Counter(r.get(COL_AFS, "") for r in completed).most_common():
        print(f"   {pct(count, n):>7}  {value or '(blank)'}")
    print("\nOverall Level label (composite is rounded, which inflates):")
    for value, count in Counter(r.get(COL_OVERALL, "") for r in completed).most_common():
        print(f"   {pct(count, n):>7}  {value or '(blank)'}")

    print("\n" + "=" * 72)
    print("DATA HYGIENE")
    print("=" * 72)
    emails = Counter(r.get(COL_EMAIL, "").strip().lower() for r in completed)
    dupes = {e: c for e, c in emails.items() if c > 1 and e}
    print(f"Emails with multiple submissions: {len(dupes)}")
    for email, count in sorted(dupes.items(), key=lambda kv: -kv[1]):
        print(f"   {count}x  {email}")
    odd = [e for e in emails if e and not e.endswith("@betterup.co")]
    if odd:
        print(f"Non-standard domains: {', '.join(sorted(odd))}")

    print("\nSubmissions by team:")
    for team, count in Counter(r.get(COL_TEAM, "") for r in completed).most_common():
        print(f"   {team or '(blank)':14}{count:4}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
