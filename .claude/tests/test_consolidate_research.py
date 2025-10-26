from __future__ import annotations

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/consolidate-research.sh"


def run_script(req_dir: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(SCRIPT), str(req_dir)],
        text=True,
        capture_output=True,
        check=False,
        cwd=ROOT,
    )


def test_consolidate_research(tmp_path: Path) -> None:
    req_dir = tmp_path / "devflow" / "requirements" / "REQ-789"
    req_dir.mkdir(parents=True)
    research_dir = req_dir / "research"
    research_dir.mkdir()

    tasks = {
        "tasks": [
            {
                "id": "R001",
                "prompt": "Research caching options for service X",
                "decision": "Use Redis",
                "rationale": "Low latency, fits workload",
                "alternatives": "Memcached, In-memory",
            }
        ]
    }
    (research_dir / "tasks.json").write_text(json.dumps(tasks), encoding="utf-8")
    (research_dir / "sample.md").write_text("External findings", encoding="utf-8")

    result = run_script(req_dir)
    assert result.returncode == 0, result.stderr

    summary = (research_dir / "research.md").read_text(encoding="utf-8")
    assert "Research Summary" in summary
    assert "Use Redis" in summary
    assert "sample.md" in summary
