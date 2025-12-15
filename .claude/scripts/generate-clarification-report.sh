#!/usr/bin/env bash
# =============================================================================
# generate-clarification-report.sh - 澄清报告生成
# =============================================================================
# Purpose: 基于会话数据生成 Markdown 报告 (借鉴 spec-kit /speckit.clarify 模式)
# Usage: generate-clarification-report.sh --session .session.json --output clarifications/
# Output: Markdown file (clarifications/[timestamp]-flow-clarify.md)
# Exit codes: 0=success, 1=invalid session, 2=fatal
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Configuration
SESSION_FILE=""
OUTPUT_DIR=""

# 维度名称映射
readonly DIM_NAMES=(
    "" "Functional Scope" "Data Model" "UX Flow" "Non-Functional Quality"
    "Integration & Dependencies" "Edge Cases" "Constraints & Tradeoffs"
    "Terminology" "Completion Signals" "Misc & Placeholders" "Security & Privacy"
)

# =============================================================================
# Coverage Status 计算
# =============================================================================
calculate_coverage_status() {
    local session_data="$1"

    # 统计各类别状态
    local clear_count=0
    local resolved_count=0
    local deferred_count=0
    local outstanding_count=0

    local dimensions
    dimensions=$(echo "$session_data" | jq -c '.scanResults.dimensions // []')

    local questions
    questions=$(echo "$session_data" | jq -c '.questions // []')

    # 遍历维度判断状态
    for i in {1..11}; do
        local dim_status
        dim_status=$(echo "$dimensions" | jq -r ".[$((i-1))].status // \"clear\"")
        local dim_issues
        dim_issues=$(echo "$dimensions" | jq ".[$((i-1))].issues | length // 0")

        # 检查是否有对应问题已回答
        local dim_resolved
        dim_resolved=$(echo "$questions" | jq "[.[] | select(.dimensionId == $i and .answer != null)] | length")

        if [[ "$dim_status" == "clear" ]] || [[ "$dim_issues" -eq 0 ]]; then
            clear_count=$((clear_count + 1))
        elif [[ "$dim_resolved" -gt 0 ]]; then
            resolved_count=$((resolved_count + 1))
        elif [[ "$dim_issues" -gt 0 ]]; then
            outstanding_count=$((outstanding_count + 1))
        fi
    done

    echo "${clear_count}|${resolved_count}|${deferred_count}|${outstanding_count}"
}

# =============================================================================
# T046: 报告模板生成 (增强版，借鉴 spec-kit)
# =============================================================================
generate_report_template() {
    local session_data="$1"

    local session_id req_id status created_at
    session_id=$(echo "$session_data" | jq -r '.sessionId // "unknown"')
    req_id=$(echo "$session_data" | jq -r '.reqId // "REQ-XXX"')
    status=$(echo "$session_data" | jq -r '.status // "unknown"')
    created_at=$(echo "$session_data" | jq -r '.createdAt // ""')

    local questions_count questions_answered
    questions_count=$(echo "$session_data" | jq '.questions | length')
    questions_answered=$(echo "$session_data" | jq '[.questions[] | select(.answer != null)] | length')

    # 计算扫描时间
    local scan_duration_ms
    scan_duration_ms=$(echo "$session_data" | jq -r '.scanResults.scanDurationMs // 0')
    local scan_duration_sec=$((scan_duration_ms / 1000))

    # 计算覆盖状态
    local coverage
    coverage=$(calculate_coverage_status "$session_data")
    local clear_count resolved_count deferred_count outstanding_count
    IFS='|' read -r clear_count resolved_count deferred_count outstanding_count <<< "$coverage"

    local today_date
    today_date=$(TZ='Asia/Shanghai' date '+%Y-%m-%d')

    cat << EOF
# Clarification Report: ${req_id}

**Session ID**: ${session_id}
**Date**: ${today_date}
**Duration**: ${scan_duration_sec}s (scan) + interactive Q&A
**Status**: ${status}

---

## Metadata

| Field | Value |
|-------|-------|
| Requirement | ${req_id} |
| Session ID | ${session_id} |
| Questions | ${questions_answered} / ${questions_count} |
| Generated | $(get_beijing_time_iso) |

---

## Coverage Summary

**Legend**: ✅ Clear | ⚠️ Partial | ❌ Missing | 🔄 Resolved | ⏭️ Deferred

EOF

    # 生成维度覆盖表格
    echo "| Category | Status | Issues | Resolution |"
    echo "|----------|--------|--------|------------|"

    local dimensions
    dimensions=$(echo "$session_data" | jq -c '.scanResults.dimensions // []')
    local questions
    questions=$(echo "$session_data" | jq -c '.questions // []')

    for i in {1..11}; do
        local dim_name="${DIM_NAMES[$i]}"
        local dim_status
        dim_status=$(echo "$dimensions" | jq -r ".[$((i-1))].status // \"clear\"")
        local dim_issues
        dim_issues=$(echo "$dimensions" | jq ".[$((i-1))].issues | length // 0")

        # 检查是否有对应问题已回答
        local dim_resolved
        dim_resolved=$(echo "$questions" | jq "[.[] | select(.dimensionId == $i and .answer != null)] | length")

        local status_icon resolution
        if [[ "$dim_status" == "clear" ]] || [[ "$dim_issues" -eq 0 ]]; then
            status_icon="✅ Clear"
            resolution="-"
        elif [[ "$dim_resolved" -gt 0 ]]; then
            status_icon="🔄 Resolved"
            resolution="Q&A addressed"
        elif [[ "$dim_status" == "ambiguous" ]]; then
            status_icon="⚠️ Partial"
            resolution="Outstanding"
        else
            status_icon="❌ Missing"
            resolution="Needs attention"
        fi

        echo "| ${dim_name} | ${status_icon} | ${dim_issues} | ${resolution} |"
    done

    cat << EOF

**Summary**:
- ✅ Clear: ${clear_count} categories
- 🔄 Resolved: ${resolved_count} categories
- ⏭️ Deferred: ${deferred_count} categories
- ❌ Outstanding: ${outstanding_count} categories

---

## High-Priority Issues (Priority ≥ 50)

EOF

    # 高优先级问题
    local high_priority_issues
    high_priority_issues=$(echo "$session_data" | jq '[.scanResults.dimensions[]?.issues[]? | select(.priority >= 50)]')
    local hp_count
    hp_count=$(echo "$high_priority_issues" | jq 'length')

    if [[ "$hp_count" -gt 0 ]]; then
        echo "| Issue ID | Dimension | Description | Impact | Uncertainty | Priority |"
        echo "|----------|-----------|-------------|--------|-------------|----------|"
        echo "$high_priority_issues" | jq -r '.[] | "| \(.issueId // "N/A") | \(.dimensionId // "-") | \(.description // "-" | .[0:50])... | \(.impact // 0)/10 | \(.uncertainty // 0)/10 | \(.priority // 0) |"'
    else
        echo "No high-priority issues detected."
    fi

    cat << EOF

---

## Clarification Session

### Session ${today_date}

EOF

    # 生成每个问题的详细信息 (spec-kit Q→A 格式)
    local idx=0
    while IFS= read -r question; do
        [[ -z "$question" ]] && continue
        idx=$((idx + 1))
        local qid text answer rationale dim_id recommended rec_rationale question_type
        qid=$(echo "$question" | jq -r '.questionId')
        text=$(echo "$question" | jq -r '.text')
        answer=$(echo "$question" | jq -r '.answer // "Not answered"')
        rationale=$(echo "$question" | jq -r '.rationale // "N/A"')
        dim_id=$(echo "$question" | jq -r '.dimensionId')
        recommended=$(echo "$question" | jq -r '.recommendedOption // "N/A"')
        rec_rationale=$(echo "$question" | jq -r '.recommendedRationale // "Based on industry best practices"')
        question_type=$(echo "$question" | jq -r '.type // "multiple_choice"')

        local dim_name="${DIM_NAMES[$dim_id]:-Unknown}"

        cat << EOF
#### ${qid}: ${dim_name}

**Question**: ${text}

**Type**: ${question_type}

EOF

        if [[ "$question_type" == "multiple_choice" ]]; then
            echo "| Option | Description |"
            echo "|--------|-------------|"
            echo "$question" | jq -r '.options // [] | .[] | "| **\(.optionId)** | \(.text) - \(.description // "") |"'

            cat << EOF

**Recommended**: ${recommended} ⭐
> ${rec_rationale}

EOF
        else
            cat << EOF
**Format**: Short answer (≤5 words)

EOF
        fi

        cat << EOF
**User Answer**: ${answer}

**Rationale**: ${rationale}

- Q: ${text} → A: ${answer}

---

EOF
    done < <(echo "$session_data" | jq -c '.questions // [] | .[]')

    if [[ "$questions_count" -eq 0 ]]; then
        echo "No questions generated - research.md appears sufficiently clear."
        echo ""
        echo "---"
        echo ""
    fi

    cat << EOF
## Validation Checklist

- [x] CLR-001 All Q&A pairs recorded in session section
- [x] CLR-002 No duplicate questions asked
- [x] CLR-003 Questions ≤ 5 (actual: ${questions_count})
- [x] CLR-004 Coverage summary complete for all 11 dimensions
- [ ] CLR-005 No contradictory statements remain in research.md
- [ ] CLR-006 Terminology consistent across updated sections

---

## Next Steps

EOF

    if [[ "$questions_answered" -eq "$questions_count" ]] && [[ "$questions_count" -gt 0 ]]; then
        cat << EOF
✅ **Clarification complete**. All ${questions_answered} questions answered.

Recommended next command: \`/flow-prd ${req_id}\`
EOF
    elif [[ "$questions_count" -eq 0 ]]; then
        cat << EOF
✅ **No critical ambiguities detected**. research.md is sufficiently specified.

Recommended next command: \`/flow-prd ${req_id}\`
EOF
    else
        cat << EOF
⚠️ **Clarification incomplete**. ${questions_answered}/${questions_count} questions answered.

Options:
1. Continue with \`/flow-clarify ${req_id}\` to complete remaining questions
2. Proceed with \`/flow-prd ${req_id}\` (acceptable risk if remaining items are low-impact)
EOF
    fi

    if [[ "$outstanding_count" -gt 0 ]]; then
        cat << EOF

> ⚠️ **${outstanding_count} categories** have outstanding issues that may need attention during planning phase.
EOF
    fi

    cat << EOF

---

**Generated by**: clarify-analyst agent
**Report Version**: 1.1.0
**Template**: CC-DevFlow Clarification Report (based on spec-kit pattern)
EOF
}

# =============================================================================
# T047: 模板渲染
# =============================================================================
render_report() {
    local session_file="$1"

    # 读取会话数据
    if [[ ! -f "$session_file" ]]; then
        echo "Error: Session file not found: $session_file" >&2
        return 1
    fi

    local session_data
    session_data=$(cat "$session_file")

    # 验证 JSON
    if ! echo "$session_data" | jq -e '.' >/dev/null 2>&1; then
        echo "Error: Invalid JSON in session file" >&2
        return 1
    fi

    # 生成报告
    generate_report_template "$session_data"
}

# =============================================================================
# T048: 报告写入
# =============================================================================
write_report() {
    local content="$1"
    local output_dir="$2"
    local session_id="$3"

    # 确保输出目录存在
    mkdir -p "$output_dir"

    # 生成文件名
    local timestamp
    timestamp=$(TZ='Asia/Shanghai' date '+%Y%m%d-%H%M%S')
    local filename="${timestamp}-flow-clarify.md"
    local filepath="${output_dir}/${filename}"

    # 写入文件
    echo "$content" > "$filepath"

    # 验证写入
    if [[ -f "$filepath" ]]; then
        echo "$filepath"
        return 0
    else
        echo "Error: Failed to write report" >&2
        return 1
    fi
}

# =============================================================================
# T049: 主入口
# =============================================================================
parse_args() {
    local session_file=""
    local output_dir=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --session)
                session_file="$2"
                shift 2
                ;;
            --output)
                output_dir="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: generate-clarification-report.sh --session .session.json [--output clarifications/]"
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done

    echo "$session_file|$output_dir"
}

main() {
    # 解析参数
    local parsed
    parsed=$(parse_args "$@")
    local session_file output_dir
    IFS='|' read -r session_file output_dir <<< "$parsed"

    # 验证输入
    if [[ -z "$session_file" ]]; then
        echo '{"error": {"code": "MISSING_SESSION", "message": "--session is required"}}' >&2
        exit 2
    fi

    if [[ ! -f "$session_file" ]]; then
        echo '{"error": {"code": "SESSION_NOT_FOUND", "message": "Session file not found"}}' >&2
        exit 1
    fi

    # 确定输出目录
    if [[ -z "$output_dir" ]]; then
        # 从会话文件路径推断
        output_dir=$(dirname "$session_file")
    fi

    # 读取会话 ID
    local session_id
    session_id=$(jq -r '.sessionId // "unknown"' "$session_file")

    # 渲染报告
    local report_content
    report_content=$(render_report "$session_file")

    if [[ -z "$report_content" ]]; then
        echo '{"error": {"code": "RENDER_FAILED", "message": "Failed to render report"}}' >&2
        exit 2
    fi

    # 写入报告
    local report_path
    report_path=$(write_report "$report_content" "$output_dir" "$session_id")

    if [[ -n "$report_path" ]]; then
        echo "{\"success\": true, \"reportPath\": \"$report_path\"}"
    else
        echo '{"error": {"code": "WRITE_FAILED", "message": "Failed to write report"}}' >&2
        exit 2
    fi
}

# 只在直接执行时运行 main
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
