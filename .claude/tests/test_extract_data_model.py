from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/extract-data-model.sh"


def run_script(req_dir: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(SCRIPT), str(req_dir)],
        text=True,
        capture_output=True,
        check=False,
        cwd=ROOT,
    )


def test_extract_data_model(tmp_path: Path) -> None:
    req_dir = tmp_path / "devflow" / "requirements" / "REQ-321"
    req_dir.mkdir(parents=True)
    (req_dir / "TECH_DESIGN.md").write_text(
        "# Technical Design\n\n## 3. Data Model\n\n- User(id, email)\n\n## 4. API Design\n",
        encoding="utf-8",
    )

    result = run_script(req_dir)
    assert result.returncode == 0, result.stderr

    data_model = (req_dir / "data-model.md").read_text(encoding="utf-8")
    assert "User(id, email)" in data_model
