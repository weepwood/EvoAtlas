#!/usr/bin/env python3
"""Static HTML/JS integration checks without third-party dependencies."""
from __future__ import annotations

import pathlib
import re
import sys
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text(encoding="utf-8")
js = (ROOT / "app.js").read_text(encoding="utf-8")
ids = re.findall(r'\bid="([^"]+)"', html)
unique = set(ids)
errors = []

for identifier, count in Counter(ids).items():
    if count > 1:
        errors.append(f"duplicate HTML ID: {identifier} ({count})")

referenced = set(re.findall(r"""\$\(['"]([\w-]+)['"]\)""", js))
for identifier in sorted(referenced - unique):
    errors.append(f"app.js references missing HTML ID: {identifier}")

for src in re.findall(r'<script\s+src="([^"]+)"', html):
    file = ROOT / src
    if not file.is_file():
        errors.append(f"missing script: {src}")
for src in re.findall(r'<link\s+rel="stylesheet"\s+href="([^"]+)"', html):
    file = ROOT / src
    if not file.is_file():
        errors.append(f"missing stylesheet: {src}")

for selector in ['treeView', 'compareView', 'sources', 'graphStage', 'detailPanel']:
    if selector not in unique:
        errors.append(f"missing essential UI target: {selector}")

print(f"HTML IDs: {len(unique)}")
print(f"JS referenced IDs: {len(referenced)}")
if errors:
    for item in errors:
        print(f"ERROR: {item}", file=sys.stderr)
    sys.exit(1)
print("Static interface contracts validated.")
