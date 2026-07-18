#!/usr/bin/env python3
"""Validate the generated EvoAtlas teaching dataset."""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "data.js"
VALID_STATUS = {"extant", "extinct", "ancestral"}
VALID_CONFIDENCE = {"high", "medium", "low"}
REQUIRED = {"id", "parent", "zh", "latin", "rank", "ageMa", "clade", "status", "confidence", "summary", "traits", "sources"}


def load_nodes() -> list[dict]:
    script = (
        "global.window={};"
        f"require({json.dumps(str(DATA))});"
        "process.stdout.write(JSON.stringify(window.EVO_TAXA));"
    )
    result = subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


def main() -> int:
    nodes = load_nodes()
    ids = [n.get("id") for n in nodes]
    by_id = {n["id"]: n for n in nodes}
    errors: list[str] = []

    duplicates = [key for key, count in Counter(ids).items() if count > 1]
    if duplicates:
        errors.append(f"duplicate ids: {duplicates}")
    if len(nodes) != 106:
        errors.append(f"expected 106 nodes, got {len(nodes)}")

    for node in nodes:
        missing = REQUIRED - node.keys()
        if missing:
            errors.append(f"{node.get('id')}: missing {sorted(missing)}")
        if node.get("status") not in VALID_STATUS:
            errors.append(f"{node.get('id')}: invalid status")
        if node.get("confidence") not in VALID_CONFIDENCE:
            errors.append(f"{node.get('id')}: invalid confidence")
        parent = node.get("parent")
        if parent and parent not in by_id:
            errors.append(f"{node['id']}: missing parent {parent}")
        if node.get("status") == "extinct" and "firstMa" in node and "lastMa" in node:
            if node["firstMa"] < node["lastMa"]:
                errors.append(f"{node['id']}: invalid fossil range")

    for node in nodes:
        seen: set[str] = set()
        current = node
        while current.get("parent"):
            if current["id"] in seen:
                errors.append(f"cycle from {node['id']}")
                break
            seen.add(current["id"])
            current = by_id[current["parent"]]

    print(f"Validated {len(nodes)} nodes")
    print(f"Species nodes: {sum(n['rank'] == '种' for n in nodes)}")
    print(f"Extinct nodes: {sum(n['status'] == 'extinct' for n in nodes)}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("No blocking errors found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
