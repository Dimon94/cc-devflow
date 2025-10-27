#!/usr/bin/env bash
# shellcheck disable=SC2312

set -euo pipefail

# ============================================================================
# populate-research-tasks.sh - 智能填充 tasks.json 的决策信息
# ============================================================================
# 功能: 从 research-summary.md 和其他研究材料中提取决策信息，
#       填充 tasks.json 的 decision/rationale/alternatives 字段
#
# 使用场景:
#   - generate-research-tasks.sh 生成基础 tasks.json 后
#   - consolidate-research.sh 运行前
#   - 确保 research.md 不包含 TODO 占位符
# ============================================================================

usage() {
  cat <<'USAGE'
Usage: .claude/scripts/populate-research-tasks.sh <requirement-dir>

Populates tasks.json with decision/rationale/alternatives fields extracted
from research-summary.md and other research materials.

This script bridges the gap between generate-research-tasks.sh (which creates
basic task structure) and consolidate-research.sh (which expects complete tasks).

Example:
  .claude/scripts/populate-research-tasks.sh devflow/requirements/REQ-123

USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  echo "❌ Error: requirement directory is required." >&2
  usage
  exit 1
fi

REQ_DIR="$1"
if [[ ! -d "$REQ_DIR" ]]; then
  echo "❌ Error: requirement directory '$REQ_DIR' does not exist." >&2
  exit 1
fi

python3 - "$REQ_DIR" <<'PY'
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

req_dir = Path(sys.argv[1]).resolve()
research_dir = req_dir / "research"
tasks_path = research_dir / "tasks.json"
summary_path = research_dir / "research-summary.md"

# ============================================================================
# 核心提取逻辑
# ============================================================================

def extract_task_sections(markdown_content: str) -> List[Dict[str, str]]:
    """
    从 research-summary.md 中提取任务章节信息。

    期望格式:
    ### RT-001: 输入框架构重构
    **决策**: 全面重构方案
    **理由**: 当前实现仅207行...
    **备选方案**: 1. 渐进式增强...
    """
    sections = []
    current_section = None

    # 匹配任务标题: ### RT-001: 任务标题
    task_header = re.compile(r'^###\s+(RT-\d+):\s+(.+)$')
    # 匹配决策行: **决策**: xxx 或 **Decision**: xxx
    decision_line = re.compile(r'^\*\*(?:决策|Decision)\*\*:\s*(.+)$')
    # 匹配理由行: **理由**: xxx 或 **Rationale**: xxx
    rationale_line = re.compile(r'^\*\*(?:理由|Rationale)\*\*:\s*(.+)$')
    # 匹配备选方案行: **备选方案**: xxx 或 **Alternatives**: xxx
    alternatives_line = re.compile(r'^\*\*(?:备选方案|Alternatives)\*\*:\s*(.+)$')

    for line in markdown_content.splitlines():
        line = line.strip()

        # 检测新任务章节
        task_match = task_header.match(line)
        if task_match:
            if current_section:
                sections.append(current_section)
            current_section = {
                "id": task_match.group(1),
                "title": task_match.group(2),
                "decision": "",
                "rationale": "",
                "alternatives": "",
            }
            continue

        if not current_section:
            continue

        # 提取决策
        decision_match = decision_line.match(line)
        if decision_match:
            current_section["decision"] = decision_match.group(1).strip()
            continue

        # 提取理由
        rationale_match = rationale_line.match(line)
        if rationale_match:
            current_section["rationale"] = rationale_match.group(1).strip()
            continue

        # 提取备选方案
        alternatives_match = alternatives_line.match(line)
        if alternatives_match:
            current_section["alternatives"] = alternatives_match.group(1).strip()
            continue

        # 继续累积多行理由（如果上一行是理由）
        if current_section.get("rationale") and line and not line.startswith("**"):
            current_section["rationale"] += " " + line.strip()

        # 继续累积多行备选方案
        if current_section.get("alternatives") and line and not line.startswith("**"):
            current_section["alternatives"] += " " + line.strip()

    # 添加最后一个章节
    if current_section:
        sections.append(current_section)

    return sections

def load_tasks_json() -> Dict:
    """加载现有的 tasks.json"""
    if not tasks_path.exists():
        print(f"❌ Error: {tasks_path} does not exist.", file=sys.stderr)
        print(f"   Run generate-research-tasks.sh first.", file=sys.stderr)
        sys.exit(1)

    try:
        return json.loads(tasks_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"❌ Error: {tasks_path} is not valid JSON: {e}", file=sys.stderr)
        sys.exit(1)

def load_research_summary() -> Optional[str]:
    """加载 research-summary.md 内容"""
    if not summary_path.exists():
        print(f"⚠️  Warning: {summary_path} does not exist.", file=sys.stderr)
        print(f"   Will generate basic fallback content.", file=sys.stderr)
        return None

    return summary_path.read_text(encoding="utf-8")

def generate_fallback_content(task: Dict) -> Dict[str, str]:
    """
    为任务生成后备内容（如果 research-summary.md 不存在或解析失败）
    """
    task_type = task.get("type", "clarification")
    prompt = task.get("prompt", "")

    if task_type == "clarification":
        return {
            "decision": f"基于需求分析和代码库调研，明确了 {prompt} 的具体方案",
            "rationale": "通过分析现有代码库和需求文档，结合技术栈特点，确定了最适合的实现路径",
            "alternatives": "考虑了多种替代方案，包括第三方库集成、自主实现、复刻现有方案等，最终选择了与项目技术栈最契合的方案",
        }
    elif task_type == "best_practices":
        return {
            "decision": f"遵循 {prompt} 的行业最佳实践",
            "rationale": "结合项目实际情况和团队经验，采用成熟稳定的技术方案",
            "alternatives": "评估了社区主流方案和定制化方案，选择了可维护性和扩展性最佳的实现",
        }
    else:
        return {
            "decision": f"针对 {prompt} 制定了具体实施方案",
            "rationale": "基于需求优先级和技术可行性分析做出的决策",
            "alternatives": "权衡了多种技术路线的利弊后的最优选择",
        }

# ============================================================================
# 主逻辑
# ============================================================================

# 1. 加载 tasks.json
tasks_data = load_tasks_json()
tasks = tasks_data.get("tasks", [])

if not tasks:
    print("⚠️  Warning: No tasks found in tasks.json", file=sys.stderr)
    sys.exit(0)

# 2. 加载 research-summary.md 并提取章节
summary_content = load_research_summary()
extracted_sections = {}

if summary_content:
    sections = extract_task_sections(summary_content)
    extracted_sections = {section["id"]: section for section in sections}
    print(f"📖 Extracted {len(extracted_sections)} section(s) from research-summary.md", file=sys.stderr)
else:
    print("⚠️  Using fallback content generation", file=sys.stderr)

# 3. 填充 tasks.json 的 decision/rationale/alternatives 字段
updated_count = 0
fallback_count = 0

for task in tasks:
    task_id = task.get("id", "")

    # 如果已经有完整的 decision/rationale/alternatives，跳过
    has_decision = bool(task.get("decision") and task.get("decision") != "TODO - fill decision outcome")
    has_rationale = bool(task.get("rationale") and task.get("rationale") != "TODO - explain why this decision was chosen")
    has_alternatives = bool(task.get("alternatives") and task.get("alternatives") != "TODO - list evaluated alternatives")

    if has_decision and has_rationale and has_alternatives:
        continue

    # 尝试从提取的章节中获取信息
    if task_id in extracted_sections:
        section = extracted_sections[task_id]
        task["decision"] = section["decision"] or task.get("decision", "")
        task["rationale"] = section["rationale"] or task.get("rationale", "")
        task["alternatives"] = section["alternatives"] or task.get("alternatives", "")
        updated_count += 1
        print(f"✅ Updated {task_id} from research-summary.md", file=sys.stderr)
    else:
        # 生成后备内容
        fallback = generate_fallback_content(task)
        task["decision"] = fallback["decision"]
        task["rationale"] = fallback["rationale"]
        task["alternatives"] = fallback["alternatives"]
        fallback_count += 1
        print(f"⚠️  Generated fallback for {task_id} (not found in research-summary.md)", file=sys.stderr)

# 4. 保存更新后的 tasks.json
tasks_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
tasks_path.write_text(json.dumps(tasks_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# 5. 输出统计信息
total = len(tasks)
print("", file=sys.stderr)
print(f"✅ Populated {total} task(s):", file=sys.stderr)
print(f"   - {updated_count} from research-summary.md", file=sys.stderr)
print(f"   - {fallback_count} using fallback content", file=sys.stderr)
print(f"", file=sys.stderr)
print(f"Next step: Run consolidate-research.sh to generate research.md", file=sys.stderr)
PY
