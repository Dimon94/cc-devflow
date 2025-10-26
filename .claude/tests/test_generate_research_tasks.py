from __future__ import annotations

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/generate-research-tasks.sh"


def run_script(req_dir: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(SCRIPT), str(req_dir)],
        text=True,
        capture_output=True,
        check=False,
        cwd=ROOT,
    )


def test_generate_research_tasks(tmp_path: Path) -> None:
    req_dir = tmp_path / "REQ-123"
    req_dir.mkdir()
    (req_dir / "README.md").write_text("# REQ-123 Sample Feature\n", encoding="utf-8")
    (req_dir / "plan.md").write_text(
        "- **Backend**: FastAPI 0.110\n- **Database**: PostgreSQL 15.4\n",
        encoding="utf-8",
    )
    (req_dir / "notes.md").write_text(
        "Authentication flow NEEDS CLARIFICATION about refresh tokens.\n", encoding="utf-8"
    )

    result = run_script(req_dir)
    assert result.returncode == 0, result.stderr

    tasks_file = req_dir / "research" / "tasks.json"
    assert tasks_file.exists()
    data = json.loads(tasks_file.read_text(encoding="utf-8"))
    prompts = [task["prompt"] for task in data["tasks"]]
    assert any("Authentication flow" in prompt for prompt in prompts)
    assert any("FastAPI" in prompt for prompt in prompts)


def test_generate_research_tasks_handles_no_matches(tmp_path: Path) -> None:
    req_dir = tmp_path / "REQ-456"
    req_dir.mkdir()

    result = run_script(req_dir)
    assert result.returncode == 0, result.stderr
    data = json.loads((req_dir / "research" / "tasks.json").read_text(encoding="utf-8"))
    assert data["tasks"] == []
