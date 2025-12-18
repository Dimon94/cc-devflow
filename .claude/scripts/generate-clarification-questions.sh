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

# =============================================================================
# API Key 检测 (与 run-clarify-scan.sh 对齐)
# =============================================================================
if ! declare -F has_valid_api_key >/dev/null 2>&1; then
has_valid_api_key() {
    [[ -n "${CLAUDE_API_KEY:-}" ]] && [[ "${CLAUDE_API_KEY}" =~ ^sk-ant- ]]
}
fi

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
generate_heuristic_question() {
    local dim_id="$1"
    local description="$2"

    case "$dim_id" in
        1)
            jq -n \
                --arg desc "$description" \
                '{
                    text: "REQ-004 的 MVP 适配范围应如何定义？",
                    options: [
                        {optionId: "A", text: "双平台可运行", description: "交付 claude-code + codex-cli 两个可运行 adapter，其它平台先留 stub"},
                        {optionId: "B", text: "单平台先抽象", description: "只交付 claude-code adapter + 接口/注册表，其它平台后续需求再做"},
                        {optionId: "C", text: "多平台一次到位", description: "至少 3 个可运行 adapter（Claude/Codex/Cursor 等）"},
                        {optionId: "D", text: "仅出设计不落地", description: "只输出 PRD/Tech Design，本需求不交付代码"}
                    ],
                    recommendedOption: "A",
                    recommendedRationale: "至少落地 2 个可运行 adapter 才能验证架构正确性，同时把范围控制在可交付的最小集合"
                }'
            ;;
        4)
            jq -n \
                --arg desc "$description" \
                '{
                    text: "对 adapter 的探测/执行链路，有哪些硬性非功能要求需要现在锁定？",
                    options: [
                        {optionId: "A", text: "轻量指标 + 结构化日志", description: "detect 总耗时 <50ms（缓存后 <5ms），记录 adapter/timing/result 的结构化日志"},
                        {optionId: "B", text: "严格指标 + 可观测套件", description: "detect <5ms，强制 metrics/tracing，所有执行都有 traceId"},
                        {optionId: "C", text: "不设指标", description: "先按 best-effort 做通功能，后续再补性能与观测"}
                    ],
                    recommendedOption: "A",
                    recommendedRationale: "先把可观测性与基本性能边界写清，避免后续返工；同时不引入过度工程"
                }'
            ;;
        6)
            jq -n \
                --arg desc "$description" \
                '{
                    text: "当多个 adapter 同时命中或没有命中时，选择/降级策略应是什么？",
                    options: [
                        {optionId: "A", text: "可覆盖 + 确定性优先级", description: "用户显式指定(ENV/CLI) > 配置 > detect 打分最高 > fallback 默认 adapter；冲突时输出告警"},
                        {optionId: "B", text: "冲突即失败", description: "多个命中或无命中直接报错，要求用户显式指定"},
                        {optionId: "C", text: "先到先得", description: "按注册顺序 first-match，不做打分与冲突处理"}
                    ],
                    recommendedOption: "A",
                    recommendedRationale: "保证可预测性与可控性：默认自动化，但允许用户明确覆盖，并且对冲突有确定性规则"
                }'
            ;;
        9)
            jq -n \
                --arg desc "$description" \
                '{
                    text: "REQ-004 的 Definition of Done 应以哪些可验证交付物为准？",
                    options: [
                        {optionId: "A", text: "可运行 + 可验证", description: "接口规范 + registry + 默认 adapter + 配置机制 + 测试 + 文档 + 至少 1 个非默认平台 adapter"},
                        {optionId: "B", text: "先抽象后验证", description: "接口规范 + registry + 默认 adapter + 基础测试；非默认 adapter 仅 stub"},
                        {optionId: "C", text: "文档优先", description: "只产出 PRD/Tech Design/TASKS，代码实现拆到后续需求"}
                    ],
                    recommendedOption: "A",
                    recommendedRationale: "定义完成必须可验证；至少一个非默认 adapter 能证明架构不是纸上谈兵"
                }'
            ;;
        11)
            jq -n \
                --arg desc "$description" \
                '{
                    text: "Adapter 的能力边界与默认安全策略应如何设计（shell/filesystem/network）？",
                    options: [
                        {optionId: "A", text: "Capability allow-list", description: "adapter 声明 capabilities；命令声明 required capabilities；默认 deny 危险能力（shell/network），启用需显式配置并写审计日志"},
                        {optionId: "B", text: "完全信任", description: "adapter 拥有全部能力，不做额外限制"},
                        {optionId: "C", text: "全局 Safe Mode", description: "默认关闭 shell/network，提供全局开关；不做细粒度 capability 控制"}
                    ],
                    recommendedOption: "A",
                    recommendedRationale: "用能力模型把危险操作从设计上隔离出去，默认最小权限，审计可追踪"
                }'
            ;;
        *)
            jq -n \
                --arg desc "$description" \
                '{
                    text: ("需要澄清：" + $desc),
                    options: [
                        {optionId: "A", text: "采用推荐方案", description: "采用行业最佳实践"},
                        {optionId: "B", text: "自定义方案", description: "需要进一步说明"},
                        {optionId: "C", text: "暂时跳过", description: "稍后决定"}
                    ],
                    recommendedOption: "A",
                    recommendedRationale: "优先选可验证、低风险路径"
                }'
            ;;
    esac
}

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

    local template_json options recommended recommended_rationale
    template_json="{}"
    options='[]'
    recommended="A"
    recommended_rationale="推荐使用行业最佳实践以降低风险"

    if has_valid_api_key; then
        template_json=$(generate_ai_question "$issue_json" "$dim_name") || true
    else
        template_json=$(generate_heuristic_question "$dim_id" "$description") || true
    fi

    if [[ -n "$template_json" ]] && echo "$template_json" | jq -e '.text and (.options | length > 0)' >/dev/null 2>&1; then
        question_text=$(echo "$template_json" | jq -r '.text')
        options=$(echo "$template_json" | jq '.options')
        recommended=$(echo "$template_json" | jq -r '.recommendedOption // "A"')
        recommended_rationale=$(echo "$template_json" | jq -r '.recommendedRationale // "推荐使用行业最佳实践以降低风险"')
    else
        # 兜底：使用最通用模板
        options='[
            {"optionId": "A", "text": "使用推荐方案", "description": "采用行业最佳实践"},
            {"optionId": "B", "text": "自定义方案", "description": "需要进一步说明"},
            {"optionId": "C", "text": "暂时跳过", "description": "稍后决定"}
        ]'
        recommended="A"
        recommended_rationale="推荐使用行业最佳实践以降低风险"
    fi

    # 构建问题 JSON
    jq -n \
        --arg qid "$question_id" \
        --argjson dimId "$dim_id" \
        --arg text "$question_text" \
        --argjson options "$options" \
        --arg recommended "$recommended" \
        --arg rationale "$recommended_rationale" \
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
