#!/usr/bin/env bash

# =============================================================================
# [INPUT]: 依赖 stdin 的 JSON 任务列表 (来自 parse-task-dependencies.ts)
# [OUTPUT]: 对外提供文件冲突检测结果 JSON
# [POS]: scripts/ 的并行任务冲突检测器，被 Team 调度系统消费
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================
#
# Detect file conflicts in parallel task execution
#
# This script analyzes task file paths to detect potential conflicts
# when multiple tasks modify the same file in parallel.
#
# Usage:
#   echo '{"tasks": [...]}' | ./detect-file-conflicts.sh
#   ./detect-file-conflicts.sh < tasks.json
#
# INPUT FORMAT:
#   {
#     "tasks": [
#       {"id": "T001", "filePath": "src/user.ts", "parallel": true},
#       {"id": "T002", "filePath": "src/user.ts", "parallel": true}
#     ]
#   }
#
# OUTPUT FORMAT:
#   {
#     "hasConflicts": true,
#     "conflicts": [
#       {
#         "file": "src/user.ts",
#         "tasks": ["T001", "T002"],
#         "recommendation": "Run sequentially or assign to same agent"
#       }
#     ],
#     "safeGroups": [
#       {"tasks": ["T003", "T004"], "reason": "Different files"}
#     ]
#   }
#
# EXIT CODES:
#   0 - Success (no conflicts or conflicts detected and reported)
#   1 - Invalid input or processing error

set -e

# =============================================================================
# Main Logic
# =============================================================================

main() {
    local input
    input=$(cat)

    # Validate input is valid JSON
    if ! echo "$input" | jq empty 2>/dev/null; then
        echo '{"error": "Invalid JSON input", "hasConflicts": false, "conflicts": [], "safeGroups": []}' >&2
        exit 1
    fi

    # Check if tasks array exists
    local tasks_count
    tasks_count=$(echo "$input" | jq '.tasks | length // 0')

    if [[ "$tasks_count" -eq 0 ]]; then
        echo '{"hasConflicts": false, "conflicts": [], "safeGroups": [], "message": "No tasks provided"}'
        exit 0
    fi

    # Extract parallel tasks with file paths
    # Build a map of file -> [task IDs]
    local result
    result=$(echo "$input" | jq '
        # Filter to parallel tasks with file paths
        .tasks
        | map(select(.parallel == true and .filePath != null and .filePath != ""))

        # Group by file path
        | group_by(.filePath)

        # Analyze each group
        | map({
            file: .[0].filePath,
            tasks: [.[].id],
            count: length
        })

        # Separate conflicts (count > 1) from safe groups
        | {
            conflicts: map(select(.count > 1) | {
                file: .file,
                tasks: .tasks,
                recommendation: "Run sequentially or assign to same agent"
            }),
            safeFiles: map(select(.count == 1) | .tasks[0])
        }

        # Build final output
        | {
            hasConflicts: (.conflicts | length > 0),
            conflicts: .conflicts,
            safeGroups: (
                if (.safeFiles | length > 0) then
                    [{tasks: .safeFiles, reason: "Different files"}]
                else
                    []
                end
            )
        }
    ')

    # Add additional analysis for directory-level conflicts
    local dir_conflicts
    dir_conflicts=$(echo "$input" | jq '
        # Extract parallel tasks
        .tasks
        | map(select(.parallel == true and .filePath != null and .filePath != ""))

        # Extract directory from file path
        | map(. + {dir: (.filePath | split("/") | .[:-1] | join("/"))})

        # Group by directory
        | group_by(.dir)

        # Find directories with multiple tasks
        | map(select(length > 1))

        # Format as warnings
        | map({
            directory: .[0].dir,
            tasks: [.[].id],
            files: [.[].filePath],
            warning: "Multiple tasks in same directory - review for potential conflicts"
        })
    ')

    # Merge directory warnings into result
    local final_result
    final_result=$(echo "$result" | jq --argjson dirWarnings "$dir_conflicts" '
        . + {directoryWarnings: $dirWarnings}
    ')

    echo "$final_result"
}

# =============================================================================
# Entry Point
# =============================================================================

main "$@"
