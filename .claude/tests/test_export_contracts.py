from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/export-contracts.sh"


def run_script(req_dir: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(SCRIPT), str(req_dir)],
        text=True,
        capture_output=True,
        check=False,
        cwd=ROOT,
    )


def test_export_contracts_from_code_block(tmp_path: Path) -> None:
    req_dir = tmp_path / "devflow" / "requirements" / "REQ-654"
    req_dir.mkdir(parents=True)
    (req_dir / "TECH_DESIGN.md").write_text(
        "# Technical Design\n\n## 4. API Design\n\n```yaml\nopenapi: 3.0.3\ninfo: {title: API, version: 1.0.0}\n```\n",
        encoding="utf-8",
    )

    result = run_script(req_dir)
    assert result.returncode == 0, result.stderr
    openapi = (req_dir / "contracts" / "openapi.yaml").read_text(encoding="utf-8")
    assert "openapi: 3.0.3" in openapi


def test_export_contracts_placeholder(tmp_path: Path) -> None:
    req_dir = tmp_path / "devflow" / "requirements" / "REQ-655"
    req_dir.mkdir(parents=True)
    (req_dir / "TECH_DESIGN.md").write_text("# Technical Design\n", encoding="utf-8")

    result = run_script(req_dir)
    assert result.returncode == 0, result.stderr
    openapi = (req_dir / "contracts" / "openapi.yaml").read_text(encoding="utf-8")
    assert "openapi: 3.0.3" in openapi
