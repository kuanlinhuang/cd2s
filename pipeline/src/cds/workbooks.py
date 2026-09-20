"""Build and execute analysis workbooks, and record proof that they ran.

Workbooks are written as plain Python in the `# %%` cell format rather than as .ipynb
files. Notebooks are terrible source: the JSON is unreadable in review, diffs are noise,
and outputs get committed by accident. Keeping the source as a script means the workbook
can be read, reviewed and diffed like any other code, and the notebook is a build
artifact.

Execution produces a receipt - when it ran, against which package versions, how long it
took, how many cells executed, and a hash of the outputs. That is what makes
"independently executed" a checkable claim rather than an assertion.
"""

from __future__ import annotations

import hashlib
import json
import platform
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING, Any

from cds.paths import REPO_DIR

if TYPE_CHECKING:
    import nbformat

WORKBOOK_SRC = REPO_DIR / "workbooks" / "python"
WORKBOOK_R = REPO_DIR / "workbooks" / "r"
WORKBOOK_OUT = REPO_DIR / "workbooks" / "executed"

CELL_MARKER = "# %%"
MD_MARKER = "# %% [markdown]"


@dataclass
class Receipt:
    workbook: str
    executed: bool = False
    executed_at: str | None = None
    runtime_seconds: float | None = None
    executor: str | None = None
    package_versions: dict[str, str] = field(default_factory=dict)
    n_cells: int | None = None
    n_cells_executed: int | None = None
    output_hash: str | None = None
    error: str | None = None
    notebook_path: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {k: v for k, v in self.__dict__.items()}


def parse_percent_script(text: str) -> list[tuple[str, str]]:
    """Split a `# %%` script into (kind, source) cells."""
    lines = text.splitlines()
    cells: list[tuple[str, list[str]]] = []
    kind = "code"
    buf: list[str] = []
    for line in lines:
        stripped = line.rstrip()
        if stripped.startswith(CELL_MARKER):
            if buf:
                cells.append((kind, buf))
            buf = []
            kind = "markdown" if stripped.startswith(MD_MARKER) else "code"
            continue
        buf.append(line)
    if buf:
        cells.append((kind, buf))

    out: list[tuple[str, str]] = []
    for k, body in cells:
        if k == "markdown":
            # Markdown cells are written as comments; strip the leading "# ".
            text_lines = [
                ln[2:] if ln.startswith("# ") else (ln[1:] if ln.startswith("#") else ln)
                for ln in body
            ]
            src = "\n".join(text_lines).strip()
        else:
            src = "\n".join(body).strip()
        if src:
            out.append((k, src))
    return out


def build_notebook(script_path: Path) -> nbformat.NotebookNode:
    from nbformat.v4 import new_code_cell, new_markdown_cell, new_notebook

    cells = parse_percent_script(script_path.read_text())
    nb = new_notebook()
    for kind, src in cells:
        nb.cells.append(new_markdown_cell(src) if kind == "markdown" else new_code_cell(src))
    nb.metadata["kernelspec"] = {
        "display_name": "Python 3",
        "language": "python",
        "name": "python3",
    }
    nb.metadata["language_info"] = {"name": "python", "version": platform.python_version()}
    nb.metadata["cds"] = {
        "source": str(script_path.relative_to(REPO_DIR)),
        "built_at": datetime.now(UTC).isoformat(),
    }
    return nb


def _package_versions(names: list[str]) -> dict[str, str]:
    out: dict[str, str] = {"python": platform.python_version()}
    for n in names:
        try:
            mod = __import__(n)
            out[n] = getattr(mod, "__version__", "unknown")
        except Exception:  # noqa: BLE001 - a missing package is information, not an error
            out[n] = "not installed"
    return out


TRACKED_PACKAGES = [
    "pandas",
    "numpy",
    "matplotlib",
    "lifelines",
    "scipy",
    "requests",
    "httpx",
]


def execute(script_path: Path, *, timeout: int = 1200, out_dir: Path | None = None) -> Receipt:
    import nbformat
    from nbclient import NotebookClient

    out_dir = out_dir or WORKBOOK_OUT
    out_dir.mkdir(parents=True, exist_ok=True)
    name = script_path.stem
    receipt = Receipt(workbook=name)

    nb = build_notebook(script_path)
    # Count code cells only: comparing executed code cells against a total that includes
    # markdown made every receipt look like a partial run.
    receipt.n_cells = sum(1 for c in nb.cells if c.get("cell_type") == "code")
    started = time.monotonic()
    client = NotebookClient(
        nb,
        timeout=timeout,
        kernel_name="python3",
        resources={"metadata": {"path": str(script_path.parent)}},
        allow_errors=False,
    )
    try:
        client.execute()
        receipt.executed = True
    except Exception as exc:  # noqa: BLE001 - failures must be recorded, not raised
        receipt.error = f"{type(exc).__name__}: {exc}"[:2000]
        receipt.executed = False

    receipt.runtime_seconds = round(time.monotonic() - started, 2)
    receipt.executed_at = datetime.now(UTC).isoformat()
    receipt.executor = (
        f"nbclient / python {platform.python_version()} / "
        f"{platform.system()} {platform.release()} {platform.machine()}"
    )
    receipt.package_versions = _package_versions(TRACKED_PACKAGES)
    receipt.n_cells_executed = sum(
        1 for c in nb.cells if c.get("cell_type") == "code" and c.get("execution_count") is not None
    )

    nb_path = out_dir / f"{name}.ipynb"
    nbformat.write(nb, nb_path)
    receipt.notebook_path = str(nb_path.relative_to(REPO_DIR))

    digest = hashlib.sha256()
    for c in nb.cells:
        for o in c.get("outputs", []) or []:
            digest.update(json.dumps(o.get("data", {}), sort_keys=True, default=str).encode())
            digest.update((o.get("text") or "").encode())
    receipt.output_hash = digest.hexdigest()[:32]

    (out_dir / f"{name}.receipt.json").write_text(json.dumps(receipt.to_dict(), indent=2))
    return receipt


def first_figure(notebook_path: Path) -> bytes | None:
    """The first rendered image in an executed notebook, as PNG bytes.

    Returned rather than written so the caller decides where it belongs. `None` when the
    notebook produced no figure, which is not an error: a workbook is allowed to be all
    text, and the site simply shows no preview for it.
    """
    import base64

    nb = json.loads(notebook_path.read_text())
    for cell in nb.get("cells", []):
        for output in cell.get("outputs", []) or []:
            png = (output.get("data") or {}).get("image/png")
            if png:
                return base64.b64decode(png)
    return None


def png_size(data: bytes) -> tuple[int, int]:
    """Pixel width and height from a PNG's IHDR chunk, which is always the first one."""
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise ValueError("not a PNG")
    return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")


def r_workbooks() -> list[Path]:
    """R workbooks present in the tree.

    They are not executed here: `execute` drives a Python kernel, and no R kernel is
    installed on the build machine. Listing them keeps `cds workbooks` from reporting
    "6/6 executed" while two workbooks sit unmentioned on disk - see workbooks/r/README.md
    for why they are shipped unexecuted rather than dropped.
    """
    if not WORKBOOK_R.exists():
        return []
    return sorted(WORKBOOK_R.glob("*.R"))


def execute_all(*, only: str | None = None, timeout: int = 1200) -> list[Receipt]:
    scripts = sorted(WORKBOOK_SRC.glob("*.py"))
    if only:
        scripts = [s for s in scripts if only in s.stem]
    return [execute(s, timeout=timeout) for s in scripts]


def load_receipts(out_dir: Path | None = None) -> dict[str, dict[str, Any]]:
    out_dir = out_dir or WORKBOOK_OUT
    out: dict[str, dict[str, Any]] = {}
    for p in sorted(out_dir.glob("*.receipt.json")):
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            continue
        out[data.get("workbook", p.stem)] = data
    return out
