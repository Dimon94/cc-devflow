#!/usr/bin/env bash
# =============================================================================
# generate-clarification-questions.sh - 智能问题生成与优先级排序
# =============================================================================
# Purpose: 基于扫描结果生成优先级排序问题 (≤5)
# Usage: generate-clarification-questions.sh --input scan_result.json --max 5
# Output: JSON (stdout) - ClarificationQuestion[]
# Exit codes: 0=success, 1=no issues, 2=fatal
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Import functions from run-clarify-scan.sh
source "${SCRIPT_DIR}/run-clarify-scan.sh" 2>/dev/null || true

# Configuration
MAX_QUESTIONS=5
INPUT_FILE=""

# =============================================================================
# T026: 优先级计算
# =============================================================================
calculate_priority() {
    local issue_json="$1"
    local impact uncertainty
    impact=$(echo "$issue_json" | jq -r '.impact // 5')
    uncertainty=$(echo "$issue_json" | jq -r '.uncertainty // 5')
    echo $((impact * uncertainty))
}

# =============================================================================
# T027: 问题合并 (同维度多个歧义合并为 1 个问题)
# =============================================================================
merge_similar_issues() {
    local issues_json="$1"

    # 按维度分组，每个维度取最高优先级的问题
    echo "$issues_json" | jq '
        group_by(.dimensionId) |
        map(
            sort_by(-.priority) |
            .[0] + {
                relatedIssues: (. | length),
                mergedDescriptions: (map(.description) | join("; "))
            }
        )
    '
}

# =============================================================================
# T028: 问题模板生成
# =============================================================================
generate_question_template() {
    local issue_json="$1"
    local question_id="$2"

    local dim_id dim_name description
    dim_id=$(echo "$issue_json" | jq -r '.dimensionId')
    description=$(echo "$issue_json" | jq -r '.description // .mergedDescriptions // "需要澄清"')

    # 维度名称映射
    local dim_names=(
        "" "Functional Scope" "Data Model" "UX Flow" "Non-Functional Quality"
        "Integration & Dependencies" "Edge Cases" "Constraints & Tradeoffs"
        "Terminology" "Completion Signals" "Misc & Placeholders" "Security & Privacy"
    )
    dim_name="${dim_names[$dim_id]:-Unknown}"

    # 生成问题文本
    local question_text="关于 ${dim_name}: ${description}"

    # 默认选项模板
    local options='[
        {"optionId": "A", "text": "使用推荐方案", "description": "采用行业最佳实践"},
        {"optionId": "B", "text": "自定义方案", "description": "需要进一步说明"},
        {"optionId": "C", "text": "暂时跳过", "description": "稍后决定"}
    ]'

    # 如果有 CLAUDE_API_KEY，使用 AI 生成更好的问题
    if [[ -n "${CLAUDE_API_KEY:-}" ]]; then
        local ai_result
        ai_result=$(generate_ai_question "$issue_json" "$dim_name") || true
        if [[ -n "$ai_result" ]] && echo "$ai_result" | jq -e '.text' >/dev/null 2>&1; then
            question_text=$(echo "$ai_result" | jq -r '.text')
            options=$(echo "$ai_result" | jq '.options // []')
            if [[ $(echo "$options" | jq 'length') -eq 0 ]]; then
                options='[
                    {"optionId": "A", "text": "使用推荐方案", "description": "采用行业最佳实践"},
                    {"optionId": "B", "text": "自定义方案", "description": "需要进一步说明"},
                    {"optionId": "C", "text": "暂时跳过", "description": "稍后决定"}
                ]'
            fi
        fi
    fi

    # 构建问题 JSON
    jq -n \
        --arg qid "$question_id" \
        --argjson dimId "$dim_id" \
        --arg text "$question_text" \
        --argjson options "$options" \
        --arg recommended "A" \
        --arg rationale "推荐使用行业最佳实践以降低风险" \
        '{
            questionId: $qid,
            dimensionId: $dimId,
            text: $text,
            type: "multiple_choice",
            options: $options,
            recommendedOption: $recommended,
            recommendedRationale: $rationale,
            answer: null,
            answeredAt: null,
            rationale: null
        }'
}

# =============================================================================
# AI 问题生成 (使用 Claude Sonnet)
# =============================================================================
generate_ai_question() {
    local issue_json="$1"
    local dim_name="$2"

    local description
    description=$(echo "$issue_json" | jq -r '.description // .mergedDescriptions')

    local system_prompt="You are a requirements clarification specialist.
Generate a clarification question for this ambiguity:
Dimension: ${dim_name}
Issue: ${description}

Output ONLY valid JSON:
{
    \"text\": \"问题文本（中文，简洁明确）\",
    \"options\": [
        {\"optionId\": \"A\", \"text\": \"选项A\", \"description\": \"说明\"},
        {\"optionId\": \"B\", \"text\": \"选项B\", \"description\": \"说明\"},
        {\"optionId\": \"C\", \"text\": \"选项C\", \"description\": \"说明\"}
    ],
    \"recommendedOption\": \"A\",
    \"recommendedRationale\": \"推荐理由\"
}"

    call_claude_api "claude-sonnet-4-5-20241022" "$system_prompt" "$description" 1000 30 2>/dev/null || echo '{}'
}

# =============================================================================
# T029: 主入口
# =============================================================================
parse_args() {
    local input_file=""
    local max_questions="$MAX_QUESTIONS"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --input)
                input_file="$2"
                shift 2
                ;;
            --max)
                max_questions="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: generate-clarification-questions.sh --input scan_result.json [--max 5]"
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done

    echo "$input_file|$max_questions"
}

extract_all_issues() {
    local scan_result="$1"

    # 从扫描结果中提取所有 issues
    echo "$scan_result" | jq '
        .dimensions // [] |
        map(select(.status == "ambiguous")) |
        map(.issues[] + {dimensionId: .dimensionId, dimensionName: .name}) |
        sort_by(-.priority)
    '
}

main() {
    # 解析参数
    local parsed
    parsed=$(parse_args "$@")
    local input_file max_questions
    IFS='|' read -r input_file max_questions <<< "$parsed"

    # 验证输入
    if [[ -z "$input_file" ]]; then
        echo '{"error": {"code": "MISSING_INPUT", "message": "--input is required"}}' >&2
        exit 2
    fi

    local scan_result
    if [[ "$input_file" == "-" ]]; then
        scan_result=$(cat)
    elif [[ -f "$input_file" ]]; then
        scan_result=$(cat "$input_file")
    else
        echo '{"error": {"code": "FILE_NOT_FOUND", "message": "Input file not found"}}' >&2
        exit 2
    fi

    # 验证 JSON
    if ! echo "$scan_result" | jq -e '.' >/dev/null 2>&1; then
        echo '{"error": {"code": "INVALID_JSON", "message": "Input is not valid JSON"}}' >&2
        exit 2
    fi

    # 提取所有 issues
    local all_issues
    all_issues=$(extract_all_issues "$scan_result")

    local issue_count
    issue_count=$(echo "$all_issues" | jq 'length')

    # T024: 如果没有 issues，返回空
    if [[ "$issue_count" -eq 0 ]]; then
        echo '{"questions": [], "message": "No ambiguities found - research.md is clear"}'
        exit 1
    fi

    # 合并相似问题
    local merged_issues
    merged_issues=$(merge_similar_issues "$all_issues")

    # 按优先级排序并限制数量
    local top_issues
    top_issues=$(echo "$merged_issues" | jq --argjson max "$max_questions" '
        sort_by(-.priority) | .[:$max]
    ')

    # 生成问题
    local questions="[]"
    local idx=0
    while IFS= read -r issue; do
        idx=$((idx + 1))
        local question_id="Q${idx}"
        local question
        question=$(generate_question_template "$issue" "$question_id")
        questions=$(echo "$questions" | jq --argjson q "$question" '. + [$q]')
    done < <(echo "$top_issues" | jq -c '.[]')

    # 输出结果
    jq -n \
        --argjson questions "$questions" \
        --argjson totalIssues "$issue_count" \
        --argjson generatedCount "$(echo "$questions" | jq 'length')" \
        '{
            questions: $questions,
            totalIssuesFound: $totalIssues,
            questionsGenerated: $generatedCount
        }'
}

# 只在直接执行时运行 main
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
