#!/usr/bin/env python3
"""Validate the EvoAtlas curated pedagogical dataset (base + editorial overlay)."""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = [ROOT / "data" / "data.js", ROOT / "data" / "curation.js"]
VALID_STATUS = {"extant", "extinct", "ancestral"}
VALID_CONFIDENCE = {"high", "medium", "low"}
REQUIRED = {
    "id", "parent", "zh", "latin", "rank", "ageMa", "clade",
    "status", "confidence", "summary", "traits", "sources",
}


def load_nodes() -> list[dict]:
    scripts = "\n".join(
        f"require({json.dumps(str(path))});" for path in DATA
    )
    command = "global.window={};\n" + scripts + "\nprocess.stdout.write(JSON.stringify(window.EVO_TAXA));"
    result = subprocess.run(
        ["node", "-e", command], check=True, capture_output=True, text=True
    )
    return json.loads(result.stdout)


def validate(nodes: list[dict]) -> list[str]:
    errors: list[str] = []
    ids = [n.get("id") for n in nodes]
    by_id = {n["id"]: n for n in nodes}
    duplicates = [key for key, count in Counter(ids).items() if count > 1]
    if duplicates:
        errors.append(f"duplicate ids: {duplicates}")

    if len(nodes) < 80:
        errors.append(f"expected at least 80 curated nodes, got {len(nodes)}")
    if not any(n["id"] == "luca" and n.get("parent") is None for n in nodes):
        errors.append("missing LUCA root")
    if any(str(n["id"]).startswith("survey-") for n in nodes):
        errors.append("generated Survey-clade placeholder is still present")

    for n in nodes:
        node_id = n.get("id")
        missing = REQUIRED - n.keys()
        if missing:
            errors.append(f"{node_id}: missing {sorted(missing)}")
            continue
        if n["status"] not in VALID_STATUS:
            errors.append(f"{node_id}: invalid status")
        if n["confidence"] not in VALID_CONFIDENCE:
            errors.append(f"{node_id}: invalid confidence")
        if not isinstance(n["ageMa"], (int, float)) or not (0 <= n["ageMa"] <= 4600):
            errors.append(f"{node_id}: invalid ageMa")
        if n["parent"] and n["parent"] not in by_id:
            errors.append(f"{node_id}: missing parent {n['parent']}")
        if not n["zh"].strip() or not n["latin"].strip():
            errors.append(f"{node_id}: missing display name")
        if n["status"] == "extinct" and "firstMa" in n and "lastMa" in n:
            if not (0 <= n["lastMa"] <= n["firstMa"] <= 4600):
                errors.append(f"{node_id}: invalid fossil range")

    for n in nodes:
        seen: set[str] = set()
        current = n
        while current.get("parent"):
            if current["id"] in seen:
                errors.append(f"cycle from {n['id']}")
                break
            seen.add(current["id"])
            parent = by_id.get(current["parent"])
            if not parent:
                break
            if parent["ageMa"] < current["ageMa"]:
                errors.append(
                    f"{n['id']}: child {current['id']} appears older "
                    f"than parent {parent['id']}"
                )
            current = parent
        if current.get("id") != "luca" and current.get("parent") is None:
            errors.append(f"{n['id']}: disconnected root {current['id']}")
    return sorted(set(errors))


def main() -> int:
    nodes = load_nodes()
    errors = validate(nodes)
    print(f"Curated nodes: {len(nodes)}")
    print(f"Species: {sum(n['rank'] == '种' for n in nodes)}")
    print(f"Extinct representative taxa: {sum(n['status'] == 'extinct' for n in nodes)}")
    print(f"Placeholder nodes: {sum(n['id'].startswith('survey-') for n in nodes)}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("Structure validated. NOTE: this does not establish scientific accuracy.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
