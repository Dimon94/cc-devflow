#!/usr/bin/env bash
# =============================================================================
# Team Communication Protocol for flow-spec
# =============================================================================
# [INPUT]: 依赖 common.sh 的 Team 函数，team-config.json 的协商主题
# [OUTPUT]: 对外提供协商消息生成和决策记录功能
# [POS]: flow-spec/scripts/ 的 Team 通信协议，被 tech-architect 和 ui-designer 消费
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../../../scripts/common.sh"

# =============================================================================
# Negotiate Message Generation
# =============================================================================

# Generate a negotiate message from template
# Args: $1 - topic_id, $2 - sender, $3 - content (JSON)
generate_negotiate_message() {
    local topic_id="$1"
    local sender="$2"
    local content="$3"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    cat <<EOF
{
  "type": "negotiate",
  "topic_id": "$topic_id",
  "sender": "$sender",
  "timestamp": "$timestamp",
  "content": $content
}
EOF
}

# Get negotiate topic template
# Args: $1 - topic_id
get_topic_template() {
    local topic_id="$1"
    local config_file="$SCRIPT_DIR/../team-config.json"

    if [[ ! -f "$config_file" ]]; then
        echo "Error: team-config.json not found" >&2
        return 1
    fi

    # Extract template for topic
    jq -r --arg tid "$topic_id" \
        '.communication.negotiate_topics[] | select(.id == $tid) | .template // empty' \
        "$config_file"
}

# Get topic participants
# Args: $1 - topic_id
get_topic_participants() {
    local topic_id="$1"
    local config_file="$SCRIPT_DIR/../team-config.json"

    jq -r --arg tid "$topic_id" \
        '.communication.negotiate_topics[] | select(.id == $tid) | .participants | join(",")' \
        "$config_file"
}

# Get topic decision owner
# Args: $1 - topic_id
get_topic_decision_owner() {
    local topic_id="$1"
    local config_file="$SCRIPT_DIR/../team-config.json"

    jq -r --arg tid "$topic_id" \
        '.communication.negotiate_topics[] | select(.id == $tid) | .decision_owner' \
        "$config_file"
}

# =============================================================================
# Decision Recording
# =============================================================================

# Initialize design decisions file
# Args: $1 - repo_root, $2 - req_id
init_design_decisions() {
    local repo_root="$1"
    local req_id="$2"
    local decisions_dir="$repo_root/devflow/requirements/$req_id/research"
    local decisions_file="$decisions_dir/design_decisions.md"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    mkdir -p "$decisions_dir"

    if [[ ! -f "$decisions_file" ]]; then
        cat > "$decisions_file" <<EOF
# Design Decisions for $req_id

> [INPUT]: 依赖 team-config.json 的 negotiate_topics 定义
> [OUTPUT]: 对外提供设计决策记录
> [POS]: research/ 的 Team 协商决策记录，被 planner 消费
> [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

---
req_id: "$req_id"
created_at: "$timestamp"
updated_at: "$timestamp"
participants: ["tech-architect", "ui-designer", "planner"]
---

## Decision Log

<!-- Decisions will be appended below -->

## Summary

| Topic | Decision | Owner | Status |
|-------|----------|-------|--------|
| api_format | - | tech-architect | pending |
| field_naming | - | tech-architect | pending |
| auth_strategy | - | tech-architect | pending |
| state_management | - | ui-designer | pending |
| component_granularity | - | ui-designer | pending |

## Changelog

| Date | Topic | Change | By |
|------|-------|--------|-----|
| $timestamp | - | Initial creation | spec-lead |
EOF
        echo "Created design_decisions.md at $decisions_file"
    else
        echo "design_decisions.md already exists at $decisions_file"
    fi
}

# Record a design decision
# Args: $1 - repo_root, $2 - req_id, $3 - topic_id, $4 - decision_json
record_decision() {
    local repo_root="$1"
    local req_id="$2"
    local topic_id="$3"
    local decision_json="$4"
    local decisions_file="$repo_root/devflow/requirements/$req_id/research/design_decisions.md"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    if [[ ! -f "$decisions_file" ]]; then
        init_design_decisions "$repo_root" "$req_id"
    fi

    # Extract decision details from JSON
    local decision
    local rationale
    local owner
    local status
    decision=$(echo "$decision_json" | jq -r '.decision // "TBD"')
    rationale=$(echo "$decision_json" | jq -r '.rationale // "TBD"')
    owner=$(get_topic_decision_owner "$topic_id")
    status=$(echo "$decision_json" | jq -r '.status // "approved"')

    # Get next decision number
    local decision_num
    decision_num=$(grep -c "^### DD-" "$decisions_file" 2>/dev/null || echo "0")
    decision_num=$((decision_num + 1))
    local decision_id
    decision_id=$(printf "DD-%03d" "$decision_num")

    # Get topic name from config
    local topic_name
    topic_name=$(jq -r --arg tid "$topic_id" \
        '.communication.negotiate_topics[] | select(.id == $tid) | .name' \
        "$SCRIPT_DIR/../team-config.json")

    # Append decision to file
    cat >> "$decisions_file" <<EOF

### $decision_id: $topic_name

**Topic ID**: \`$topic_id\`
**Decision Owner**: $owner
**Participants**: $(get_topic_participants "$topic_id")
**Status**: $status

**Decision**:
$decision

**Rationale**:
$rationale

**Timestamp**: $timestamp

---
EOF

    # Update summary table
    sed -i '' "s/| $topic_id | .* |/| $topic_id | $decision | $owner | $status |/" "$decisions_file" 2>/dev/null || true

    # Update changelog
    local changelog_entry="| $timestamp | $topic_id | Decision recorded | $owner |"
    sed -i '' "/^## Changelog/,/^$/{ /^|.*|$/a\\
$changelog_entry
}" "$decisions_file" 2>/dev/null || true

    echo "Recorded decision $decision_id for topic $topic_id"
}

# =============================================================================
# SendMessage Integration Examples
# =============================================================================

# Example: tech-architect initiates API format negotiation
example_api_format_negotiate() {
    cat <<'EOF'
# tech-architect 发起 API 格式协商

## SendMessage 调用示例

```json
{
  "type": "message",
  "recipient": "ui-designer",
  "content": "我建议 API 响应格式采用 RESTful JSON，分页使用 cursor-based pagination。响应结构如下：\n\n```json\n{\n  \"data\": [...],\n  \"meta\": {\n    \"cursor\": \"xxx\",\n    \"hasMore\": true\n  }\n}\n```\n\n你的前端需求是否有特殊要求？",
  "summary": "API format negotiation - RESTful JSON"
}
```

## ui-designer 响应示例

```json
{
  "type": "message",
  "recipient": "tech-architect",
  "content": "同意 RESTful JSON 方案。建议 meta 中增加 total 字段用于显示总数。另外，错误响应格式建议统一为：\n\n```json\n{\n  \"error\": {\n    \"code\": \"ERR_XXX\",\n    \"message\": \"...\"\n  }\n}\n```",
  "summary": "API format agreement with suggestions"
}
```
EOF
}

# Example: ui-designer initiates state management negotiation
example_state_management_negotiate() {
    cat <<'EOF'
# ui-designer 发起状态管理协商

## SendMessage 调用示例

```json
{
  "type": "message",
  "recipient": "tech-architect",
  "content": "前端状态管理建议采用 Zustand，全局状态包括：\n\n1. user: 用户信息\n2. auth: 认证状态\n3. ui: UI 状态 (sidebar, modal)\n\n这些状态需要与后端 API 同步，请确认数据结构是否匹配。",
  "summary": "State management proposal - Zustand"
}
```
EOF
}

# =============================================================================
# Main
# =============================================================================

main() {
    local action="${1:-help}"
    local repo_root="${2:-$(get_repo_root)}"
    local req_id="${3:-$(get_current_req_id)}"

    case "$action" in
        init)
            init_design_decisions "$repo_root" "$req_id"
            ;;
        record)
            local topic_id="${4:-}"
            local decision_json="${5:-'{}'}"
            if [[ -z "$topic_id" ]]; then
                echo "Usage: $0 record <repo_root> <req_id> <topic_id> <decision_json>" >&2
                exit 1
            fi
            record_decision "$repo_root" "$req_id" "$topic_id" "$decision_json"
            ;;
        template)
            local topic_id="${4:-}"
            if [[ -z "$topic_id" ]]; then
                echo "Usage: $0 template <repo_root> <req_id> <topic_id>" >&2
                exit 1
            fi
            get_topic_template "$topic_id"
            ;;
        participants)
            local topic_id="${4:-}"
            if [[ -z "$topic_id" ]]; then
                echo "Usage: $0 participants <repo_root> <req_id> <topic_id>" >&2
                exit 1
            fi
            get_topic_participants "$topic_id"
            ;;
        owner)
            local topic_id="${4:-}"
            if [[ -z "$topic_id" ]]; then
                echo "Usage: $0 owner <repo_root> <req_id> <topic_id>" >&2
                exit 1
            fi
            get_topic_decision_owner "$topic_id"
            ;;
        example-api)
            example_api_format_negotiate
            ;;
        example-state)
            example_state_management_negotiate
            ;;
        help|*)
            cat <<EOF
Team Communication Protocol for flow-spec

Usage: $0 <action> [args...]

Actions:
  init <repo_root> <req_id>
      Initialize design_decisions.md for a requirement

  record <repo_root> <req_id> <topic_id> <decision_json>
      Record a design decision

  template <repo_root> <req_id> <topic_id>
      Get negotiate message template for a topic

  participants <repo_root> <req_id> <topic_id>
      Get participants for a topic

  owner <repo_root> <req_id> <topic_id>
      Get decision owner for a topic

  example-api
      Show API format negotiation example

  example-state
      Show state management negotiation example

Topics:
  api_format          - API 响应格式
  field_naming        - 数据字段命名
  auth_strategy       - 认证策略
  state_management    - 状态管理方案
  component_granularity - 组件粒度
EOF
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
