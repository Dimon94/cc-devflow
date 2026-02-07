#!/usr/bin/env bash
# =============================================================================
# archive-requirement.sh - 需求归档脚本 (v4.5 增强版)
# 将已完成或废弃的需求移动到归档目录
# 支持 Delta Specs 集成
# =============================================================================
# [INPUT]: 依赖 common.sh, orchestration_status.json
# [OUTPUT]: 移动需求到 devflow/archive/{YYYY-MM}/
# [POS]: scripts 的归档脚本，被 /flow:archive 调用
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# =============================================================================
# 使用说明
# =============================================================================
usage() {
    cat << 'EOF'
Usage: archive-requirement.sh <REQ_ID> [OPTIONS]

归档需求目录到 devflow/archive/{YYYY-MM}/ 下

Arguments:
  REQ_ID              需求编号 (e.g., REQ-003, BUG-001)

Options:
  --reason REASON     归档原因: completed (默认), deprecated, obsolete, superseded
  --restore           恢复归档的需求到活跃目录
  --list              列出所有归档的需求
  --json              输出 JSON 格式
  --dry-run           仅显示将执行的操作，不实际执行
  --help, -h          显示帮助信息

Examples:
  archive-requirement.sh REQ-003                    # 归档已完成需求
  archive-requirement.sh REQ-003 --reason deprecated  # 标记为废弃归档
  archive-requirement.sh --list                     # 列出所有归档
  archive-requirement.sh REQ-003 --restore          # 恢复归档需求
EOF
}

# =============================================================================
# 参数解析
# =============================================================================
REQ_ID=""
REASON="completed"
RESTORE=false
LIST_MODE=false
JSON_MODE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --reason)
            REASON="$2"
            shift 2
            ;;
        --restore)
            RESTORE=true
            shift
            ;;
        --list)
            LIST_MODE=true
            shift
            ;;
        --json)
            JSON_MODE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option: $1" >&2
            usage
            exit 1
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            fi
            shift
            ;;
    esac
done

REPO_ROOT=$(get_repo_root)

# =============================================================================
# 列出归档模式
# =============================================================================
if [[ "$LIST_MODE" == "true" ]]; then
    if [[ "$JSON_MODE" == "true" ]]; then
        # JSON 格式输出
        archive_base="$REPO_ROOT/devflow/archive"
        echo "["
        first=true
        if [[ -d "$archive_base" ]]; then
            for month_dir in "$archive_base"/*/; do
                [[ -d "$month_dir" ]] || continue
                month=$(basename "$month_dir")
                for req_dir in "$month_dir"*/; do
                    [[ -d "$req_dir" ]] || continue
                    req_id=$(basename "$req_dir")
                    status_file="$req_dir/orchestration_status.json"
                    reason="completed"
                    archived_at=""
                    title=""
                    if [[ -f "$status_file" ]]; then
                        reason=$(jq -r '.archivedReason // "completed"' "$status_file" 2>/dev/null)
                        archived_at=$(jq -r '.archivedAt // ""' "$status_file" 2>/dev/null)
                        title=$(jq -r '.title // ""' "$status_file" 2>/dev/null)
                    fi
                    if [[ "$first" == "true" ]]; then
                        first=false
                    else
                        echo ","
                    fi
                    printf '  {"reqId": "%s", "title": "%s", "month": "%s", "reason": "%s", "archivedAt": "%s"}' \
                        "$req_id" "$title" "$month" "$reason" "$archived_at"
                done
            done
        fi
        echo ""
        echo "]"
    else
        # 人类可读格式
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📦 归档需求列表"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        printf "%-10s | %-12s | %-12s | %s\n" "月份" "需求ID" "归档原因" "标题"
        echo "───────────────────────────────────────────────────────────────"
        archive_base="$REPO_ROOT/devflow/archive"
        found=false
        if [[ -d "$archive_base" ]]; then
            for month_dir in "$archive_base"/*/; do
                [[ -d "$month_dir" ]] || continue
                month=$(basename "$month_dir")
                for req_dir in "$month_dir"*/; do
                    [[ -d "$req_dir" ]] || continue
                    req_id=$(basename "$req_dir")
                    status_file="$req_dir/orchestration_status.json"
                    reason="completed"
                    title=""
                    if [[ -f "$status_file" ]]; then
                        reason=$(jq -r '.archivedReason // "completed"' "$status_file" 2>/dev/null)
                        title=$(jq -r '.title // ""' "$status_file" 2>/dev/null)
                    fi
                    printf "%-10s | %-12s | %-12s | %s\n" "$month" "$req_id" "$reason" "$title"
                    found=true
                done
            done
        fi
        if [[ "$found" == "false" ]]; then
            echo "(暂无归档需求)"
        fi
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
    exit 0
fi

# =============================================================================
# 验证 REQ_ID
# =============================================================================
if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: 必须提供需求ID" >&2
    usage
    exit 1
fi

if ! validate_req_id "$REQ_ID"; then
    exit 1
fi

# =============================================================================
# 恢复模式
# =============================================================================
if [[ "$RESTORE" == "true" ]]; then
    archived_path=$(find_archived_req "$REPO_ROOT" "$REQ_ID")

    if [[ -z "$archived_path" ]]; then
        echo "ERROR: 归档中未找到 $REQ_ID" >&2
        exit 1
    fi

    # 确定目标目录
    req_type=$(get_req_type "$REQ_ID")
    if [[ "$req_type" == "bug" ]]; then
        target_dir="$REPO_ROOT/devflow/bugs/$REQ_ID"
    else
        target_dir="$REPO_ROOT/devflow/requirements/$REQ_ID"
    fi

    # 检查目标是否已存在
    if [[ -d "$target_dir" ]]; then
        echo "ERROR: 目标目录已存在: $target_dir" >&2
        echo "请先删除或重命名现有目录" >&2
        exit 1
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] 将移动: $archived_path → $target_dir"
        exit 0
    fi

    # 执行恢复
    mkdir -p "$(dirname "$target_dir")"
    mv "$archived_path" "$target_dir"

    # 更新状态文件
    status_file="$target_dir/orchestration_status.json"
    if [[ -f "$status_file" ]]; then
        # 恢复到归档前的状态
        original_status=$(jq -r '.statusBeforeArchive // "release_complete"' "$status_file")
        jq --arg status "$original_status" \
           --arg updated "$(get_beijing_time_iso)" \
           'del(.archivedAt, .archivedReason, .archiveLocation, .statusBeforeArchive) |
            .status = $status |
            .updatedAt = $updated' \
           "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
    fi

    # 记录日志
    log_event "$REQ_ID" "需求从归档恢复: $archived_path → $target_dir"

    if [[ "$JSON_MODE" == "true" ]]; then
        cat << EOF
{
  "action": "restore",
  "reqId": "$REQ_ID",
  "from": "$archived_path",
  "to": "$target_dir",
  "status": "success"
}
EOF
    else
        echo "✅ 需求 $REQ_ID 已从归档恢复"
        echo "   位置: $target_dir"
    fi
    exit 0
fi

# =============================================================================
# 归档模式
# =============================================================================

# 验证归档原因
valid_reasons=("completed" "deprecated" "obsolete" "superseded")
if [[ ! " ${valid_reasons[*]} " =~ " ${REASON} " ]]; then
    echo "ERROR: 无效的归档原因: $REASON" >&2
    echo "有效选项: ${valid_reasons[*]}" >&2
    exit 1
fi

# 检查需求是否已归档
if is_archived "$REPO_ROOT" "$REQ_ID"; then
    archived_path=$(find_archived_req "$REPO_ROOT" "$REQ_ID")
    echo "ERROR: $REQ_ID 已经在归档中: $archived_path" >&2
    echo "如需重新归档，请先使用 --restore 恢复" >&2
    exit 1
fi

# 获取当前需求目录
source_dir=$(get_req_dir "$REPO_ROOT" "$REQ_ID")

if [[ ! -d "$source_dir" ]]; then
    echo "ERROR: 需求目录不存在: $source_dir" >&2
    exit 1
fi

# 确定归档目标
archive_month=$(TZ='Asia/Shanghai' date '+%Y-%m')
archive_dir=$(get_archive_dir "$REPO_ROOT" "$archive_month")
target_dir="$archive_dir/$REQ_ID"

# 检查 Delta Specs
delta_count=$(get_delta_count "$source_dir")
has_unapplied_deltas=false
if [[ "$delta_count" -gt 0 ]]; then
    # 检查是否有未应用的 deltas
    for delta_dir in "$source_dir/deltas"/*/; do
        [[ -d "$delta_dir" ]] || continue
        delta_file="$delta_dir/delta.md"
        if [[ -f "$delta_file" ]]; then
            status=$(grep -E '^status:' "$delta_file" | head -1 | sed 's/status:[[:space:]]*"\?\([^"]*\)"\?/\1/')
            if [[ "$status" != "applied" ]]; then
                has_unapplied_deltas=true
                break
            fi
        fi
    done
fi

if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY-RUN] 将移动: $source_dir → $target_dir"
    echo "[DRY-RUN] 归档原因: $REASON"
    if [[ "$delta_count" -gt 0 ]]; then
        echo "[DRY-RUN] Delta Specs: $delta_count 个"
        if [[ "$has_unapplied_deltas" == "true" ]]; then
            echo "[DRY-RUN] ⚠️  警告: 存在未应用的 Delta Specs"
        fi
    fi
    exit 0
fi

# 警告未应用的 deltas
if [[ "$has_unapplied_deltas" == "true" ]]; then
    echo "⚠️  警告: 存在未应用的 Delta Specs"
    echo "   建议先运行: /flow:delta apply $REQ_ID --all"
    echo ""
fi

# 创建归档目录
mkdir -p "$archive_dir"

# 读取当前状态
status_file="$source_dir/orchestration_status.json"
current_status="unknown"
if [[ -f "$status_file" ]]; then
    current_status=$(jq -r '.status // "unknown"' "$status_file")
fi

# 移动目录
mv "$source_dir" "$target_dir"

# 更新状态文件
status_file="$target_dir/orchestration_status.json"
if [[ -f "$status_file" ]]; then
    jq --arg reason "$REASON" \
       --arg archived_at "$(get_beijing_time_iso)" \
       --arg location "$target_dir" \
       --arg prev_status "$current_status" \
       --arg updated "$(get_beijing_time_iso)" \
       --argjson delta_count "$delta_count" \
       '.status = "archived" |
        .archivedReason = $reason |
        .archivedAt = $archived_at |
        .archiveLocation = $location |
        .statusBeforeArchive = $prev_status |
        .deltaCount = $delta_count |
        .updatedAt = $updated' \
       "$status_file" > "${status_file}.tmp" && mv "${status_file}.tmp" "$status_file"
fi

# 记录日志
log_file="$target_dir/EXECUTION_LOG.md"
if [[ -f "$log_file" ]]; then
    cat >> "$log_file" << EOF

### $(get_beijing_time)
**需求归档**
- 归档原因: $REASON
- 归档位置: $target_dir
- 归档前状态: $current_status
- Delta Specs: $delta_count 个
EOF
fi

# 输出结果
if [[ "$JSON_MODE" == "true" ]]; then
    cat << EOF
{
  "action": "archive",
  "reqId": "$REQ_ID",
  "from": "$source_dir",
  "to": "$target_dir",
  "reason": "$REASON",
  "previousStatus": "$current_status",
  "deltaCount": $delta_count,
  "archivedAt": "$(get_beijing_time_iso)",
  "status": "success"
}
EOF
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 需求 $REQ_ID 已归档"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   原位置: $source_dir"
    echo "   新位置: $target_dir"
    echo "   归档原因: $REASON"
    echo "   归档前状态: $current_status"
    if [[ "$delta_count" -gt 0 ]]; then
        echo "   Delta Specs: $delta_count 个"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
