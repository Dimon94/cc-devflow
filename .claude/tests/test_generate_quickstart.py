from __future__ import annotations

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/generate-quickstart.sh"


def run_script(req_dir: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["bash", "-lc", f"{SCRIPT} '{req_dir}'"],
        text=True,
        capture_output=True,
        check=False,
        cwd=Path.cwd(),
    )


def test_generate_quickstart(tmp_path: Path) -> None:
    req_dir = tmp_path / "devflow" / "requirements" / "REQ-777"
    req_dir.mkdir(parents=True)

    (req_dir / "TECH_DESIGN.md").write_text(
        "# Technical Design\n\n## 2. Technology Stack\n- Backend: FastAPI\n\n## 5. Security Design\n- JWT tokens\n\n## 6. Performance Design\n- Cache miss < 100ms\n",
        encoding="utf-8",
    )

    package_json = {
        "scripts": {
            "dev": "pytest --maxfail=1",
            "test": "pytest",
        }
    }
    (req_dir / "package.json").write_text(json.dumps(package_json), encoding="utf-8")

    result = subprocess.run(
        [str(SCRIPT), str(req_dir)],
        cwd=tmp_path,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr

    quickstart = (req_dir / "quickstart.md").read_text(encoding="utf-8")
    assert "npm run test" in quickstart
    assert "JWT tokens" in quickstart
