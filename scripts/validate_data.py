#!/usr/bin/env python3
"""Validate EvoAtlas' embedded teaching dataset without third-party packages."""
from __future__ import annotations

import json
import pathlib
import re
import sys
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "data.js"
REQUIRED = {"id", "parent", "zh", "latin", "rank", "ageMa", "clade", "status", "confidence", "summary", "traits", "sources"}
VALID_STATUS = {"extant", "extinct", "ancestral"}
VALID_CONFIDENCE = {"high", "medium", "low"}


def load_nodes() -> list[dict]:
    text = DATA_FILE.read_text(encoding="utf-8")
    match = re.fullmatch(r"\s*window\.EVO_TAXA\s*=\s*(\[.*\]);\s*", text, flags=re.S)
    if not match:
        raise ValueError("data.js does not contain the expected window.EVO_TAXA assignment")
    return json.loads(match.group(1))


def main() -> int:
    nodes = load_nodes()
    by_id = {node["id"]: node for node in nodes}
    errors: list[str] = []
    warnings: list[str] = []

    if len(by_id) != len(nodes):
        duplicates = [key for key, count in Counter(node["id"] for node in nodes).items() if count > 1]
        errors.append(f"duplicate ids: {duplicates}")

    for node in nodes:
        missing = REQUIRED - node.keys()
        if missing:
            errors.append(f"{node.get('id', '<unknown>')}: missing {sorted(missing)}")
        if node.get("status") not in VALID_STATUS:
            errors.append(f"{node.get('id')}: invalid status {node.get('status')}")
        if node.get("confidence") not in VALID_CONFIDENCE:
            errors.append(f"{node.get('id')}: invalid confidence {node.get('confidence')}")
        parent = node.get("parent")
        if parent and parent not in by_id:
            errors.append(f"{node['id']}: parent {parent} does not exist")
        if node.get("status") == "extinct":
            if "firstMa" not in node or "lastMa" not in node:
                warnings.append(f"{node['id']}: extinct node has no complete temporal range")
            elif node["firstMa"] < node["lastMa"]:
                errors.append(f"{node['id']}: firstMa must be older/larger than lastMa")
        if not node.get("traits"):
            warnings.append(f"{node['id']}: no traits")
        if not node.get("sources"):
            warnings.append(f"{node['id']}: no sources")

    # Cycle and age checks.
    for node in nodes:
        visited: set[str] = set()
        current = node
        while current.get("parent"):
            if current["id"] in visited:
                errors.append(f"cycle detected from {node['id']}")
                break
            visited.add(current["id"])
            parent = by_id[current["parent"]]
            child_age = current.get("lastMa", current.get("ageMa", 0)) if current.get("status") == "extinct" else current.get("ageMa", 0)
            if parent.get("ageMa", 0) < child_age:
                warnings.append(
                    f"{current['id']}: parent {parent['id']} age {parent.get('ageMa')} Ma is younger than child display age {child_age} Ma"
                )
            current = parent

    print(f"Validated {len(nodes)} nodes")
    print(f"Species nodes: {sum(node['rank'] == '种' for node in nodes)}")
    print(f"Extinct nodes: {sum(node['status'] == 'extinct' for node in nodes)}")
    if warnings:
        print(f"Warnings ({len(warnings)}):")
        for warning in warnings:
            print(f"  - {warning}")
    if errors:
        print(f"Errors ({len(errors)}):", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    print("No blocking errors found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
