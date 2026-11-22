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

for selector in ['treeView', 'compareView', 'sources', 'graphStage', 'detailPanel', 'headerBreadcrumb']:
    if selector not in unique:
        errors.append(f"missing essential UI target: {selector}")

# The canvas must be immediately inside the active tree view, not below a hero.
if 'class="workspace-heading"' in html or 'id="graphTitle"' in html:
    errors.append("legacy title/hero still occupies tree viewport")
if 'id="exploreHuman"' in html:
    errors.append("legacy human promotion control still present")
if 'ui/custom-select.js' not in html:
    errors.append("custom-select script missing from HTML")
if 'EvoSelect?.enhanceAll()' not in js:
    errors.append("custom selects are not initialized")
if 'function chooseLabels()' not in js or 'function axisTicks()' not in js:
    errors.append("tree labels or linear time-axis layout is not implemented")
if '.graph-stage' not in (ROOT / 'styles.css').read_text(encoding='utf-8'):
    errors.append("tree canvas styles are missing")

print(f"HTML IDs: {len(unique)}")
print(f"JS referenced IDs: {len(referenced)}")
if errors:
    for item in errors:
        print(f"ERROR: {item}", file=sys.stderr)
    sys.exit(1)
print("Static interface contracts validated.")
