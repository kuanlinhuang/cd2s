"""Filesystem layout, resolved once so every module agrees."""

from __future__ import annotations

import os
from pathlib import Path

PKG_DIR = Path(__file__).resolve().parent  # pipeline/src/cds
PIPELINE_DIR = PKG_DIR.parents[1]  # pipeline
REPO_DIR = PIPELINE_DIR.parent  # repo root

DATA_DIR = Path(os.environ.get("CDS_DATA_DIR", PIPELINE_DIR / "data"))
CACHE_DIR = Path(os.environ.get("CDS_CACHE_DIR", DATA_DIR / "cache"))
RAW_DIR = DATA_DIR / "raw"
CURATED_DIR = DATA_DIR / "curated"
DIST_DIR = DATA_DIR / "dist"
SCHEMA_DIR = PIPELINE_DIR / "schemas"

WEB_DIR = REPO_DIR / "web"
WEB_DATA_DIR = WEB_DIR / "public" / "data"
WORKBOOK_DIR = REPO_DIR / "workbooks"
AGENT_DIR = REPO_DIR / "agent"
DOCS_DIR = REPO_DIR / "docs"


def ensure_dirs() -> None:
    for p in (CACHE_DIR, RAW_DIR, CURATED_DIR, DIST_DIR, SCHEMA_DIR):
        p.mkdir(parents=True, exist_ok=True)
