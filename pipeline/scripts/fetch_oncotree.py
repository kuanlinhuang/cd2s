#!/usr/bin/env python3
"""Vendor the stable OncoTree release used by controlled subject assignment."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.request import urlopen

API = "https://oncotree.mskcc.org/api"
VERSION = "oncotree_latest_stable"
OUTPUT = Path(__file__).parents[1] / "src/cds/vocab/oncotree_tissues.json"


def fetch_json(url: str):
    with urlopen(url, timeout=60) as response:  # noqa: S310 - fixed HTTPS host
        return json.load(response)


def main() -> None:
    versions = fetch_json(f"{API}/versions")
    release = next(v for v in versions if v["api_identifier"] == VERSION)
    nodes = fetch_json(f"{API}/tumorTypes?version={VERSION}")
    payload = {
        "version": VERSION,
        "release_date": release["release_date"],
        "nodes": {
            node["code"].lower(): {
                "code": node["code"],
                "name": node["name"],
                "tissue": node["tissue"],
                "parent": node.get("parent"),
                "nci": (node.get("externalReferences", {}).get("NCI") or [None])[0],
            }
            for node in nodes
        },
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    print(f"Wrote {len(nodes)} nodes from {VERSION} ({release['release_date']}) to {OUTPUT}")


if __name__ == "__main__":
    main()
