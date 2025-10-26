from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/analyze-upgrade-impact.sh"


def run_script(req_dir: Path, args: str = "") -> subprocess.CompletedProcess[str]:
    command = [str(SCRIPT), "--req", str(req_dir)]
    if args:
        command.extend(args.split())
    return subprocess.run(
        command,
        text=True,
        capture_output=True,
        check=False,
        cwd=ROOT,
    )


def test_analyze_upgrade_creates_reports(tmp_path: Path) -> None:
    req_dir = tmp_path / "REQ-999"
    req_dir.mkdir(parents=True, exist_ok=True)
    (req_dir / "PRD.md").write_text("# PRD\n\n## User Story\n- Do something\n", encoding="utf-8")

    result = run_script(req_dir)
    assert result.returncode == 0, result.stderr

    analysis_dir = req_dir / "analysis"
    reports = list(analysis_dir.glob("*.md"))
    assert reports, "Expected analysis reports to be generated"
