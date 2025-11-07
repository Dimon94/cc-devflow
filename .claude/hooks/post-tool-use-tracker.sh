#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# 文件变更追踪 Hook - PostToolUse
# ═══════════════════════════════════════════════════════════════════════════════
#
# 【核心功能】
# 在 Edit/MultiEdit/Write 工具执行后追踪被修改的文件
#
# 【工作原理】
# 1. 监听工具执行完成事件
# 2. 检测文件所属的仓库/服务
# 3. 记录受影响的文件和仓库
# 4. 生成构建和类型检查命令
# 5. 缓存信息供后续使用（如 tsc-check hook）
#
# 【设计哲学】
# "理解上下文是智能的基础"
# 通过追踪文件变更，Claude 能更好地理解项目的活跃区域
#
# 【应用场景】
# - 配合 tsc-check hook 进行增量类型检查
# - 为技能激活提供上下文（哪些服务被修改了）
# - 生成项目活动报告
#
# ═══════════════════════════════════════════════════════════════════════════════

# 错误时立即退出
set -e

# ───────────────────────────────────────────────────────────────────────────────
# 步骤 1: 读取工具信息
# ───────────────────────────────────────────────────────────────────────────────
# 从 stdin 读取工具执行信息（JSON 格式）
tool_info=$(cat)

# 提取关键数据
# - tool_name: 工具名称（Edit/MultiEdit/Write）
# - file_path: 被修改的文件路径
# - session_id: 会话 ID（用于隔离不同会话的缓存）
tool_name=$(echo "$tool_info" | jq -r '.tool_name // empty')
file_path=$(echo "$tool_info" | jq -r '.tool_input.file_path // empty')
session_id=$(echo "$tool_info" | jq -r '.session_id // empty')

# ───────────────────────────────────────────────────────────────────────────────
# 步骤 2: 过滤条件检查
# ───────────────────────────────────────────────────────────────────────────────

# 检查 1: 只处理编辑工具
if [[ ! "$tool_name" =~ ^(Edit|MultiEdit|Write)$ ]] || [[ -z "$file_path" ]]; then
    exit 0  # 不是编辑工具或没有文件路径，跳过
fi

# 检查 2: 跳过 Markdown 文件（文档变更不需要类型检查）
if [[ "$file_path" =~ \.(md|markdown)$ ]]; then
    exit 0  # Markdown 文件，跳过
fi

# ───────────────────────────────────────────────────────────────────────────────
# 步骤 3: 初始化缓存目录
# ───────────────────────────────────────────────────────────────────────────────
# 在项目目录下创建会话专用的缓存
# 路径：.claude/tsc-cache/{session_id}/
cache_dir="$CLAUDE_PROJECT_DIR/.claude/tsc-cache/${session_id:-default}"
mkdir -p "$cache_dir"

# ───────────────────────────────────────────────────────────────────────────────
# 函数：检测文件所属的仓库/服务
# ───────────────────────────────────────────────────────────────────────────────
#
# 【功能】
# 从文件路径推断文件属于哪个仓库/服务
#
# 【支持的结构】
# - 单体应用：frontend/、backend/、src/
# - Monorepo：packages/xxx/、services/xxx/
# - 特殊目录：database/、prisma/、examples/
#
# 【设计原则】
# - 自适应：自动检测项目结构
# - 模式匹配：支持常见的目录命名约定
# - 可扩展：易于添加新的目录模式
#
detect_repo() {
    local file="$1"
    local project_root="$CLAUDE_PROJECT_DIR"

    # 计算相对路径（去除项目根目录前缀）
    local relative_path="${file#$project_root/}"

    # 提取第一级目录（通常是仓库/服务名）
    local repo=$(echo "$relative_path" | cut -d'/' -f1)

    # ┌───────────────────────────────────────────────────────────────┐
    # │ 模式匹配：识别常见的项目结构                                    │
    # └───────────────────────────────────────────────────────────────┘
    case "$repo" in
        # 前端变体
        frontend|client|web|app|ui)
            echo "$repo"
            ;;
        # 后端变体
        backend|server|api|src|services)
            echo "$repo"
            ;;
        # 数据库
        database|prisma|migrations)
            echo "$repo"
            ;;
        # Monorepo 结构：packages/xxx
        packages)
            # 提取包名（第二级目录）
            local package=$(echo "$relative_path" | cut -d'/' -f2)
            if [[ -n "$package" ]]; then
                echo "packages/$package"
            else
                echo "$repo"
            fi
            ;;
        # 示例目录：examples/xxx
        examples)
            local example=$(echo "$relative_path" | cut -d'/' -f2)
            if [[ -n "$example" ]]; then
                echo "examples/$example"
            else
                echo "$repo"
            fi
            ;;
        *)
            # 检查是否是根目录下的文件
            if [[ ! "$relative_path" =~ / ]]; then
                echo "root"
            else
                echo "unknown"
            fi
            ;;
    esac
}

# ───────────────────────────────────────────────────────────────────────────────
# 函数：获取构建命令
# ───────────────────────────────────────────────────────────────────────────────
#
# 【功能】
# 为仓库生成合适的构建命令
#
# 【检测逻辑】
# 1. 检查 package.json 中是否有 build 脚本
# 2. 自动识别包管理器（pnpm > npm > yarn）
# 3. 特殊处理：Prisma 数据库使用 prisma generate
#
get_build_command() {
    local repo="$1"
    local project_root="$CLAUDE_PROJECT_DIR"
    local repo_path="$project_root/$repo"

    # ┌───────────────────────────────────────────────────────────────┐
    # │ 检查 1: package.json 中的 build 脚本                           │
    # └───────────────────────────────────────────────────────────────┘
    if [[ -f "$repo_path/package.json" ]]; then
        if grep -q '"build"' "$repo_path/package.json" 2>/dev/null; then
            # 根据 lock 文件检测包管理器
            if [[ -f "$repo_path/pnpm-lock.yaml" ]]; then
                echo "cd $repo_path && pnpm build"
            elif [[ -f "$repo_path/package-lock.json" ]]; then
                echo "cd $repo_path && npm run build"
            elif [[ -f "$repo_path/yarn.lock" ]]; then
                echo "cd $repo_path && yarn build"
            else
                echo "cd $repo_path && npm run build"  # 默认使用 npm
            fi
            return
        fi
    fi

    # ┌───────────────────────────────────────────────────────────────┐
    # │ 检查 2: Prisma 数据库特殊处理                                   │
    # └───────────────────────────────────────────────────────────────┘
    if [[ "$repo" == "database" ]] || [[ "$repo" =~ prisma ]]; then
        if [[ -f "$repo_path/schema.prisma" ]] || [[ -f "$repo_path/prisma/schema.prisma" ]]; then
            echo "cd $repo_path && npx prisma generate"
            return
        fi
    fi

    # 没有找到构建命令
    echo ""
}

# ───────────────────────────────────────────────────────────────────────────────
# 函数：获取 TypeScript 检查命令
# ───────────────────────────────────────────────────────────────────────────────
#
# 【功能】
# 为仓库生成 TypeScript 类型检查命令
#
# 【检测逻辑】
# 1. 检查是否存在 tsconfig.json
# 2. Vite/React 项目特殊处理（使用 tsconfig.app.json）
# 3. 使用 --noEmit 只检查类型，不生成文件
#
get_tsc_command() {
    local repo="$1"
    local project_root="$CLAUDE_PROJECT_DIR"
    local repo_path="$project_root/$repo"

    # 检查 TypeScript 配置文件
    if [[ -f "$repo_path/tsconfig.json" ]]; then
        # Vite/React 项目通常有独立的 tsconfig.app.json
        if [[ -f "$repo_path/tsconfig.app.json" ]]; then
            echo "cd $repo_path && npx tsc --project tsconfig.app.json --noEmit"
        else
            echo "cd $repo_path && npx tsc --noEmit"
        fi
        return
    fi

    # 没有找到 TypeScript 配置
    echo ""
}

# ───────────────────────────────────────────────────────────────────────────────
# 步骤 4: 执行仓库检测
# ───────────────────────────────────────────────────────────────────────────────
repo=$(detect_repo "$file_path")

# 如果检测失败（unknown 或为空），跳过
if [[ "$repo" == "unknown" ]] || [[ -z "$repo" ]]; then
    exit 0
fi

# ───────────────────────────────────────────────────────────────────────────────
# 步骤 5: 记录信息到缓存
# ───────────────────────────────────────────────────────────────────────────────

# ┌───────────────────────────────────────────────────────────────┐
# │ 5.1 记录编辑的文件（带时间戳）                                  │
# └───────────────────────────────────────────────────────────────┘
# 格式：timestamp\ttool\tfile_path\trepo
# 使用 tab 分隔以便其他 hooks（如 error-handling-reminder）正确解析
echo -e "$(date +%s)\t$tool_name\t$file_path\t$repo" >> "$cache_dir/edited-files.log"

# ┌───────────────────────────────────────────────────────────────┐
# │ 5.2 更新受影响的仓库列表（去重）                                │
# └───────────────────────────────────────────────────────────────┘
if ! grep -q "^$repo$" "$cache_dir/affected-repos.txt" 2>/dev/null; then
    echo "$repo" >> "$cache_dir/affected-repos.txt"
fi

# ┌───────────────────────────────────────────────────────────────┐
# │ 5.3 生成并存储构建/类型检查命令                                 │
# └───────────────────────────────────────────────────────────────┘
build_cmd=$(get_build_command "$repo")
tsc_cmd=$(get_tsc_command "$repo")

# 存储构建命令
if [[ -n "$build_cmd" ]]; then
    echo "$repo:build:$build_cmd" >> "$cache_dir/commands.txt.tmp"
fi

# 存储类型检查命令
if [[ -n "$tsc_cmd" ]]; then
    echo "$repo:tsc:$tsc_cmd" >> "$cache_dir/commands.txt.tmp"
fi

# ┌───────────────────────────────────────────────────────────────┐
# │ 5.4 去重并整理命令列表                                          │
# └───────────────────────────────────────────────────────────────┘
if [[ -f "$cache_dir/commands.txt.tmp" ]]; then
    # sort -u: 排序并去重
    sort -u "$cache_dir/commands.txt.tmp" > "$cache_dir/commands.txt"
    rm -f "$cache_dir/commands.txt.tmp"
fi

# ───────────────────────────────────────────────────────────────────────────────
# 步骤 6: 正常退出
# ───────────────────────────────────────────────────────────────────────────────
# exit 0 表示 hook 成功执行
# Claude Code 会继续正常流程
exit 0
