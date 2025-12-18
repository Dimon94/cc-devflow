#!/usr/bin/env bash
# =============================================================================
# run-clarify-scan.sh - 11 维度并行歧义扫描
# =============================================================================
# Purpose: 执行 11 维度并行扫描，识别 research.md 中的歧义
# Usage: run-clarify-scan.sh REQ-XXX [--parallel] [--timeout 20] [--dimension all|1-11]
# Output: JSON (stdout) - DimensionScanResult[]
# Exit codes: 0=success, 1=partial (some dimensions timeout), 2=fatal
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# =============================================================================
# 跨平台时间戳 (epoch ms)
# =============================================================================
now_ms() {
    if command -v python3 >/dev/null 2>&1; then
        python3 -c 'import time; print(int(time.time() * 1000))'
        return 0
    fi
    echo $(( $(date +%s) * 1000 ))
}

# =============================================================================
# Constants (T012)
# =============================================================================
readonly DIMENSIONS=(
    "Functional Scope"
    "Data Model"
    "UX Flow"
    "Non-Functional Quality"
    "Integration & Dependencies"
    "Edge Cases"
    "Constraints & Tradeoffs"
    "Terminology"
    "Completion Signals"
    "Misc & Placeholders"
    "Security & Privacy"
)

readonly DIMENSION_FOCUS=(
    "核心目标、成功标准、排除声明"
    "实体、属性、关系、生命周期"
    "用户旅程、错误状态、空状态"
    "延迟、吞吐量、可用性、可观测性"
    "外部 API、故障模式、协议"
    "负面场景、限流、冲突解决"
    "技术约束、拒绝方案"
    "规范术语、避免同义词"
    "验收标准、完成定义"
    "TODO 标记、模糊形容词"
    "AuthN/AuthZ、数据保护、合规"
)

# Configuration
DEFAULT_TIMEOUT=20
PARALLEL_MODE=true
SELECTED_DIMENSION="all"

# =============================================================================
# T007: API Key 验证
# =============================================================================
check_api_key() {
    if [[ -z "${CLAUDE_API_KEY:-}" ]]; then
        echo '{"error": {"code": "API_KEY_MISSING", "message": "CLAUDE_API_KEY not set"}}' >&2
        echo "提示: export CLAUDE_API_KEY='sk-ant-...'" >&2
        return 1
    fi

    # 验证格式 (sk-ant-* 开头)
    if [[ ! "${CLAUDE_API_KEY}" =~ ^sk-ant- ]]; then
        echo '{"error": {"code": "API_KEY_INVALID", "message": "CLAUDE_API_KEY format invalid"}}' >&2
        return 1
    fi
    return 0
}

# =============================================================================
# API Key 快速检测 (不输出错误)
# =============================================================================
has_valid_api_key() {
    [[ -n "${CLAUDE_API_KEY:-}" ]] && [[ "${CLAUDE_API_KEY}" =~ ^sk-ant- ]]
}

# =============================================================================
# 无 API Key 降级：规则引擎歧义扫描
# =============================================================================
contains_any() {
    local haystack="$1"
    shift
    local needle
    for needle in "$@"; do
        if [[ -n "$needle" ]] && [[ "$haystack" == *"$needle"* ]]; then
            return 0
        fi
    done
    return 1
}

scan_dimension_heuristic() {
    local dim_id="$1"
    local dim_name="$2"
    local research_content="$3"

    local description impact uncertainty
    description=""
    impact=5
    uncertainty=5

    case "$dim_id" in
        1)
            if ! contains_any "$research_content" "In Scope" "Out of Scope" "in-scope" "out-of-scope" "范围" "不做" "非目标" "success" "Success" "验收" "完成定义"; then
                description="功能范围边界与成功标准不清：缺少 In Scope / Out of Scope、可度量验收信号"
                impact=9
                uncertainty=8
            fi
            ;;
        2)
            if ! contains_any "$research_content" "ExecutionResult" "Context" "context" "capabilities" "capability" "schema" "字段" "数据模型"; then
                description="接口数据模型未定义：Context / ExecutionResult / capabilities 的结构与生命周期缺失"
                impact=7
                uncertainty=7
            fi
            ;;
        3)
            if ! contains_any "$research_content" "UX" "用户" "交互" "CLI" "参数" "flag" "配置" "auto" "自动"; then
                description="调用方如何选择/覆盖 Adapter 未定义：自动探测 vs 配置文件 vs CLI 参数"
                impact=7
                uncertainty=6
            fi
            ;;
        4)
            if ! contains_any "$research_content" "性能" "latency" "timeout" "SLA" "可观测" "logging" "metrics" "稳定" "reliability"; then
                description="非功能目标缺失：性能/超时/错误恢复/可观测性要求未量化"
                impact=6
                uncertainty=7
            fi
            ;;
        5)
            if ! contains_any "$research_content" ".claude" "commands" "agents" "scripts" "集成" "integration" "entry" "registry"; then
                description="集成点不清：与现有命令/Agent/脚本的调用链、初始化时机、配置来源未明确"
                impact=8
                uncertainty=7
            fi
            ;;
        6)
            if ! contains_any "$research_content" "fallback" "优先级" "priority" "冲突" "conflict" "multiple" "edge" "降级"; then
                description="边界场景缺失：多个 Adapter 命中/无 Adapter 命中/探测冲突时的降级与报错策略"
                impact=7
                uncertainty=7
            fi
            ;;
        7)
            if ! contains_any "$research_content" "constraint" "tradeoff" "取舍" "约束" "兼容" "backward" "breaking" "向后"; then
                description="约束与取舍未声明：是否必须保持 Claude Code 行为完全兼容？允许哪些破坏性重构？"
                impact=6
                uncertainty=6
            fi
            ;;
        8)
            if [[ "$research_content" =~ RM-[0-9]+ ]]; then
                description="术语/编号不一致：文档出现 RM-* 与 REQ-* 混用，需统一命名与引用"
                impact=5
                uncertainty=6
            fi
            ;;
        9)
            if ! contains_any "$research_content" "验收" "完成" "Definition" "DoD" "Acceptance" "测试" "交付"; then
                description="完成定义不清：需要可验证交付物与验收清单（接口、注册表、默认适配器、测试）"
                impact=8
                uncertainty=8
            fi
            ;;
        10)
            if contains_any "$research_content" "TODO" "TBD" "None requested" "not clear" "不清楚"; then
                description="存在占位/来源缺失：外部参考/输入不足，决策依据可能不够可追溯"
                impact=5
                uncertainty=7
            fi
            ;;
        11)
            if ! contains_any "$research_content" "security" "Security" "privacy" "Privacy" "权限" "Auth" "鉴权" "审计"; then
                description="安全边界未定义：Adapter 能力（shell/filesystem/network）最小化、审计与隔离策略缺失"
                impact=8
                uncertainty=7
            fi
            ;;
        *)
            ;;
    esac

    if [[ -z "$description" ]]; then
        jq -n '{"issues": []}'
        return 0
    fi

    jq -n \
        --arg desc "$description" \
        --argjson impact "$impact" \
        --argjson uncertainty "$uncertainty" \
        '{
            issues: [
                {
                    description: $desc,
                    impact: $impact,
                    uncertainty: $uncertainty
                }
            ]
        }'
}

# =============================================================================
# T008: 用户答案验证
# =============================================================================
validate_answer() {
    local type="$1"      # "multiple_choice" | "short_answer"
    local answer="$2"
    local options="${3:-A,B,C,D,E}"

    case "$type" in
        "multiple_choice")
            # 必须是单字符 A-E (大小写)
            if [[ ! "$answer" =~ ^[A-Ea-e]$ ]]; then
                return 1
            fi
            # 转换为大写并检查是否在有效选项中
            local upper_answer
            upper_answer=$(echo "$answer" | tr '[:lower:]' '[:upper:]')
            if [[ ! ",$options," == *",$upper_answer,"* ]]; then
                return 1
            fi
            ;;
        "short_answer")
            # ≤5 个单词
            local word_count
            word_count=$(echo "$answer" | wc -w | tr -d ' ')
            if [[ "$word_count" -gt 5 ]]; then
                return 1
            fi
            # 仅允许字母数字 + 空格 + 基本符号
            if [[ ! "$answer" =~ ^[a-zA-Z0-9\ \<\>\.\-\_\,]+$ ]]; then
                return 1
            fi
            ;;
        *)
            return 1
            ;;
    esac
    return 0
}

# =============================================================================
# T009: 会话状态读取
# =============================================================================
load_session() {
    local session_file="$1"

    if [[ ! -f "$session_file" ]]; then
        echo '{"error": {"code": "SESSION_NOT_FOUND", "message": "Session file not found"}}' >&2
        return 1
    fi

    # 验证 JSON 格式
    if ! jq -e '.' "$session_file" >/dev/null 2>&1; then
        echo '{"error": {"code": "SESSION_CORRUPT", "message": "Invalid JSON in session file"}}' >&2
        return 1
    fi

    cat "$session_file"
}

# =============================================================================
# T010: 会话状态保存
# =============================================================================
save_session() {
    local session_file="$1"
    local session_data="$2"

    # 更新 updatedAt 时间戳
    local updated_data
    updated_data=$(echo "$session_data" | jq --arg ts "$(get_beijing_time_iso)" '.updatedAt = $ts')

    # 原子写入 (临时文件 + mv)
    local temp_file="${session_file}.tmp"
    echo "$updated_data" | jq '.' > "$temp_file"
    mv "$temp_file" "$session_file"
}

# =============================================================================
# T011: Claude API 调用封装
# =============================================================================
call_claude_api() {
    local model="$1"      # "claude-4-5-haiku" | "claude-sonnet-4-5-20241022"
    local system_prompt="$2"
    local user_content="$3"
    local max_tokens="${4:-1000}"
    local timeout="${5:-$DEFAULT_TIMEOUT}"

    local retry_count=0
    local max_retries=3
    local result=""

    while [[ $retry_count -lt $max_retries ]]; do
        result=$(timeout "${timeout}s" curl -s \
            -X POST "https://api.anthropic.com/v1/messages" \
            -H "Authorization: Bearer ${CLAUDE_API_KEY}" \
            -H "Content-Type: application/json" \
            -H "anthropic-version: 2023-06-01" \
            -d "$(jq -n \
                --arg model "$model" \
                --arg system "$system_prompt" \
                --arg content "$user_content" \
                --argjson max_tokens "$max_tokens" \
                '{
                    model: $model,
                    max_tokens: $max_tokens,
                    system: $system,
                    messages: [{role: "user", content: $content}]
                }')" 2>/dev/null) || true

        # 检查是否成功
        if [[ -n "$result" ]] && echo "$result" | jq -e '.content[0].text' >/dev/null 2>&1; then
            echo "$result" | jq -r '.content[0].text'
            return 0
        fi

        # 检查是否是 rate limit
        if echo "$result" | jq -e '.error.type == "rate_limit_error"' >/dev/null 2>&1; then
            retry_count=$((retry_count + 1))
            sleep $((2 ** retry_count))  # 指数退避
            continue
        fi

        # 其他错误，退出
        break
    done

    # 返回错误
    echo '{"error": "API call failed after retries"}'
    return 1
}

# =============================================================================
# T018: 单维度扫描
# =============================================================================
scan_dimension() {
    local dim_id="$1"
    local dim_name="$2"
    local dim_focus="$3"
    local research_content="$4"
    local timeout_sec="${5:-$DEFAULT_TIMEOUT}"

    local start_time
    start_time=$(now_ms)

    local system_prompt="You are a requirements ambiguity scanner for dimension: ${dim_name}.
Focus areas: ${dim_focus}

Analyze the research document and identify:
1. Missing information (gaps that need clarification)
2. Vague terminology (e.g., 'fast', 'robust' without metrics)
3. Implicit assumptions (things taken for granted)
4. Contradictions with other sections

Output ONLY valid JSON:
{\"issues\": [{\"description\": \"...\", \"impact\": 1-10, \"uncertainty\": 1-10}]}

If no issues found, return: {\"issues\": []}"

    local result
    if has_valid_api_key; then
        result=$(call_claude_api "claude-haiku-4-5-20241022" "$system_prompt" "$research_content" 1000 "$timeout_sec") || true

        # API 不可用/超时/输出无效时，降级到规则引擎
        if [[ -z "$result" ]] || [[ "$result" == *'"error"'* ]] || ! echo "$result" | jq -e '.issues' >/dev/null 2>&1; then
            result=$(scan_dimension_heuristic "$dim_id" "$dim_name" "$research_content")
        fi
    else
        result=$(scan_dimension_heuristic "$dim_id" "$dim_name" "$research_content")
    fi

    local end_time
    end_time=$(now_ms)
    local duration=$((end_time - start_time))

    # 解析结果
    local status="clear"
    local issues="[]"

    if [[ -z "$result" ]] || [[ "$result" == *'"error"'* ]]; then
        status="timeout"
    elif echo "$result" | jq -e '.issues' >/dev/null 2>&1; then
        issues=$(echo "$result" | jq '.issues')
        local issue_count
        issue_count=$(echo "$issues" | jq 'length')
        if [[ "$issue_count" -gt 0 ]]; then
            status="ambiguous"
            # 添加 issueId 和 priority
            issues=$(echo "$issues" | jq --argjson dim "$dim_id" '
                to_entries | map(
                    .value + {
                        issueId: ("dim-" + ($dim | tostring) + "-issue-" + ((.key + 1) | tostring)),
                        priority: ((.value.impact // 5) * (.value.uncertainty // 5))
                    }
                )
            ')
        fi
    fi

    # 输出结果 JSON
    jq -n \
        --argjson dimId "$dim_id" \
        --arg name "$dim_name" \
        --arg status "$status" \
        --argjson issues "$issues" \
        --argjson scanTimeMs "$duration" \
        '{
            dimensionId: $dimId,
            name: $name,
            status: $status,
            issues: $issues,
            scanTimeMs: $scanTimeMs
        }'
}

# =============================================================================
# T019: 并行扫描主函数
# =============================================================================
scan_all_dimensions() {
    local req_id="$1"
    local timeout_sec="$2"
    local single_dim="${3:-all}"

    local repo_root
    repo_root=$(get_repo_root)
    local req_dir
    req_dir=$(get_req_dir "$repo_root" "$req_id")
    local research_file="$req_dir/research/research.md"

    if [[ ! -f "$research_file" ]]; then
        echo '{"error": {"code": "MISSING_RESEARCH", "message": "research.md not found"}}' >&2
        return 2
    fi

    local research_content
    research_content=$(cat "$research_file")

    local session_id
    session_id="$(TZ='Asia/Shanghai' date '+%Y%m%d-%H%M%S')-${req_id}"
    local start_time
    start_time=$(now_ms)

    local results=()
    local pids=()
    local temp_dir
    temp_dir=$(mktemp -d)

    # 确定要扫描的维度
    local dims_to_scan=()
    if [[ "$single_dim" == "all" ]]; then
        for i in "${!DIMENSIONS[@]}"; do
            dims_to_scan+=("$((i + 1))")
        done
    else
        dims_to_scan=("$single_dim")
    fi

    # 启动并行扫描
    for dim_id in "${dims_to_scan[@]}"; do
        local idx=$((dim_id - 1))
        local dim_name="${DIMENSIONS[$idx]}"
        local dim_focus="${DIMENSION_FOCUS[$idx]}"

        (
            scan_dimension "$dim_id" "$dim_name" "$dim_focus" "$research_content" "$timeout_sec" \
                > "$temp_dir/dim_${dim_id}.json"
        ) &
        pids+=($!)
    done

    # 等待所有完成
    local has_timeout=false
    for pid in "${pids[@]}"; do
        wait "$pid" || has_timeout=true
    done

    # 收集结果
    local all_results="["
    local first=true
    for dim_id in "${dims_to_scan[@]}"; do
        if [[ -f "$temp_dir/dim_${dim_id}.json" ]]; then
            if [[ "$first" == "true" ]]; then
                first=false
            else
                all_results+=","
            fi
            all_results+=$(cat "$temp_dir/dim_${dim_id}.json")

            # 检查是否有 timeout
            if jq -e '.status == "timeout"' "$temp_dir/dim_${dim_id}.json" >/dev/null 2>&1; then
                has_timeout=true
            fi
        fi
    done
    all_results+="]"

    # 清理临时文件
    rm -rf "$temp_dir"

    local end_time
    end_time=$(now_ms)
    local total_duration=$((end_time - start_time))

    # T020: 格式化输出
    jq -n \
        --arg sessionId "$session_id" \
        --argjson scanDurationMs "$total_duration" \
        --argjson dimensions "$all_results" \
        '{
            sessionId: $sessionId,
            scanDurationMs: $scanDurationMs,
            dimensions: $dimensions
        }'

    if [[ "$has_timeout" == "true" ]]; then
        return 1
    fi
    return 0
}

# =============================================================================
# T021: 主入口
# =============================================================================
parse_args() {
    local req_id=""
    local timeout="$DEFAULT_TIMEOUT"
    local dimension="all"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --parallel)
                PARALLEL_MODE=true
                shift
                ;;
            --timeout)
                timeout="$2"
                shift 2
                ;;
            --dimension)
                dimension="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: run-clarify-scan.sh REQ-XXX [--parallel] [--timeout N] [--dimension all|1-11]"
                exit 0
                ;;
            *)
                if [[ -z "$req_id" ]]; then
                    req_id="$1"
                fi
                shift
                ;;
        esac
    done

    echo "$req_id|$timeout|$dimension"
}

main() {
    if ! has_valid_api_key; then
        echo "Warning: CLAUDE_API_KEY not set or invalid; using heuristic scan" >&2
    fi

    # 解析参数
    local parsed
    parsed=$(parse_args "$@")
    local req_id timeout dimension
    IFS='|' read -r req_id timeout dimension <<< "$parsed"

    # 验证 REQ_ID
    if [[ -z "$req_id" ]]; then
        req_id=$(get_current_req_id)
    fi

    if ! validate_req_id "$req_id" 2>/dev/null; then
        echo '{"error": {"code": "INVALID_REQ_ID", "message": "Invalid or missing REQ_ID"}}' >&2
        exit 2
    fi

    # 执行扫描
    scan_all_dimensions "$req_id" "$timeout" "$dimension"
    exit $?
}

# 只在直接执行时运行 main
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
