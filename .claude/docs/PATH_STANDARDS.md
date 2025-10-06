# CC-DevFlow 文档路径标准化指南

## 概述

本文档定义了 cc-devflow 项目的文档路径管理标准，借鉴 spec-kit 的设计理念，同时适配 cc-devflow 的复杂需求场景。

## 核心原则

1. **路径可预测性** - 所有文档路径都应该可以通过脚本自动计算
2. **Git 分支关联** - 文档路径应该与 Git 分支名称关联（当使用 Git 时）
3. **非 Git 友好** - 支持没有 Git 的场景，通过环境变量回退
4. **类型分离** - 需求 (REQ-) 和缺陷 (BUG-) 文档分开存储

## 路径结构

### 基础结构
```text
.claude/
├── scripts/                    # 脚本工具库
│   ├── common.sh              # 统一脚本基础函数
│   └── check-prerequisites.sh # 前置条件检查
├── docs/
│   ├── requirements/          # 需求文档 (REQ-XXX)
│   │   └── REQ-{ID}/
│   │       ├── research/      # 外部研究材料
│   │       ├── PRD.md        # 产品需求文档
│   │       ├── EPIC.md       # Epic 规划
│   │       ├── tasks/        # 任务分解
│   │       │   ├── TASK_001.md
│   │       │   └── TASK_002.md
│   │       ├── TEST_PLAN.md
│   │       ├── SECURITY_PLAN.md
│   │       ├── TEST_REPORT.md
│   │       ├── SECURITY_REPORT.md
│   │       ├── RELEASE_PLAN.md
│   │       ├── EXECUTION_LOG.md
│   │       └── orchestration_status.json
│   └── bugs/                  # 缺陷文档 (BUG-XXX)
│       └── BUG-{ID}/
│           ├── ANALYSIS.md    # 缺陷分析
│           ├── PLAN.md        # 修复计划
│           ├── tasks/         # 修复任务
│           ├── TEST_PLAN.md
│           ├── SECURITY_PLAN.md
│           └── status.json
└── constitution/              # 宪法体系
    ├── project-constitution.md
    ├── quality-gates.md
    └── ...
```

## 路径获取机制

### 1. 使用统一脚本

所有路径获取都应该通过 `.claude/scripts/check-prerequisites.sh` 脚本完成：

```bash
# 获取路径（JSON 格式）
.claude/scripts/check-prerequisites.sh --json --paths-only

# 输出示例
{
  "REPO_ROOT": "/path/to/project",
  "REQ_ID": "REQ-123",
  "REQ_TYPE": "requirement",
  "REQ_DIR": "/path/to/project/.claude/docs/requirements/REQ-123",
  "PRD_FILE": "/path/to/project/.claude/docs/requirements/REQ-123/PRD.md",
  "EPIC_FILE": "/path/to/project/.claude/docs/requirements/REQ-123/EPIC.md"
}
```

### 2. Agent 中使用路径

在 Agent 定义中，按以下方式使用：

```markdown
Process:
1. Run `.claude/scripts/check-prerequisites.sh --json` to get paths
2. Parse JSON output to extract REQ_DIR, PRD_FILE, etc.
3. Use absolute paths for all file operations
```

### 3. 在 Shell 脚本中使用

```bash
#!/usr/bin/env bash

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Get all paths
eval $(get_requirement_paths)

# Now you can use:
# $REPO_ROOT, $REQ_ID, $REQ_DIR, $PRD_FILE, etc.
```

## 需求 ID 识别机制

### 优先级顺序

1. **环境变量** `DEVFLOW_REQ_ID`
   ```bash
   export DEVFLOW_REQ_ID="REQ-123"
   ```

2. **Git 分支名称**（如果使用 Git）
   ```bash
   # 分支名称: feature/REQ-123-user-management
   # 提取: REQ-123
   ```

3. **最新需求目录**（非 Git 场景）
   ```bash
   # 扫描 .claude/docs/requirements/ 找到最大编号
   # REQ-123 > REQ-122 > REQ-121
   ```

### ID 格式验证

- 需求 ID 格式: `REQ-{数字}`，例如 `REQ-123`
- 缺陷 ID 格式: `BUG-{数字}`，例如 `BUG-456`
- 正则表达式: `^(REQ|BUG)-[0-9]+$`

## Git 分支命名规范

### 需求分支
```text
feature/REQ-{ID}-{slug}
例如: feature/REQ-123-user-management
```

### 缺陷修复分支
```text
bugfix/BUG-{ID}-{slug}
例如: bugfix/BUG-456-login-error
```

### 从分支名提取 ID

脚本会自动从分支名中提取 `REQ-XXX` 或 `BUG-XXX`：

```bash
# feature/REQ-123-user-management → REQ-123
# bugfix/BUG-456-login-error → BUG-456
```

## 非 Git 场景支持

### 使用环境变量

在没有 Git 的环境中，设置环境变量：

```bash
export DEVFLOW_REQ_ID="REQ-123"
.claude/scripts/check-prerequisites.sh --json
```

### 自动选择最新需求

如果既没有 Git 也没有设置环境变量，脚本会自动选择最新的需求目录：

```bash
# 扫描 .claude/docs/requirements/
# 找到 REQ-123, REQ-122, REQ-121
# 自动选择 REQ-123 (最大编号)
```

## 文档类型特定路径

### 需求文档 (REQ-XXX)

```text
.claude/docs/requirements/REQ-{ID}/
├── research/              # 外部研究材料
├── PRD.md                # 产品需求文档
├── EPIC.md               # Epic 规划
├── tasks/                # 任务分解
├── TEST_PLAN.md          # 测试计划
├── SECURITY_PLAN.md      # 安全计划
├── TEST_REPORT.md        # 测试报告
├── SECURITY_REPORT.md    # 安全报告
├── RELEASE_PLAN.md       # 发布计划
├── EXECUTION_LOG.md      # 执行日志
└── orchestration_status.json  # 状态跟踪
```

### 缺陷文档 (BUG-XXX)

```text
.claude/docs/bugs/BUG-{ID}/
├── ANALYSIS.md           # 缺陷分析
├── PLAN.md               # 修复计划
├── tasks/                # 修复任务
├── TEST_PLAN.md          # 测试计划
├── SECURITY_PLAN.md      # 安全计划
└── status.json           # 状态跟踪
```

## 路径脚本函数参考

### common.sh 函数

```bash
# 获取仓库根目录
get_repo_root()

# 获取当前需求 ID (REQ-XXX 或 BUG-XXX)
get_current_req_id()

# 检查是否有 Git
has_git()

# 验证需求 ID 格式
validate_req_id "$req_id"

# 获取需求类型 (requirement 或 bug)
get_req_type "$req_id"

# 获取需求目录路径
get_req_dir "$repo_root" "$req_id"

# 获取所有需求路径（输出变量供 eval 使用）
get_requirement_paths()

# 创建需求目录结构
create_req_structure "$req_id"

# 记录事件到日志
log_event "$req_id" "$message"
```

### check-prerequisites.sh 选项

```bash
# 获取路径（JSON 格式，不验证）
--paths-only --json

# 验证 PRD 存在（规划阶段）
--json

# 验证 PRD + EPIC 存在（任务生成阶段）
--json --require-epic

# 验证 PRD + EPIC + tasks/ 存在（实施阶段）
--json --require-epic --require-tasks --include-tasks
```

## 最佳实践

### 1. Agent 定义中始终使用脚本

❌ **不推荐**:
```markdown
1. Read `.claude/docs/requirements/${reqId}/PRD.md`
```

✅ **推荐**:
```markdown
1. Run `.claude/scripts/check-prerequisites.sh --json` to get paths
2. Parse JSON to extract PRD_FILE path
3. Read PRD_FILE
```

### 2. 使用绝对路径

❌ **不推荐**:
```bash
cat ../docs/requirements/REQ-123/PRD.md
```

✅ **推荐**:
```bash
eval $(get_requirement_paths)
cat "$PRD_FILE"
```

### 3. 错误处理

```bash
# 验证需求 ID
if ! validate_req_id "$REQ_ID"; then
    exit 1
fi

# 检查文件存在
if [[ ! -f "$PRD_FILE" ]]; then
    echo "ERROR: PRD not found at $PRD_FILE" >&2
    exit 1
fi
```

### 4. 支持多种场景

```bash
# Git 场景
git checkout -b "feature/REQ-123-title"
# REQ_ID 自动从分支名提取

# 非 Git 场景
export DEVFLOW_REQ_ID="REQ-123"
# 通过环境变量指定

# 自动回退场景
# 脚本自动选择最新需求目录
```

## 迁移指南

### 从旧路径结构迁移

如果你有旧的路径结构，可以使用以下步骤迁移：

```bash
# 1. 创建新的目录结构
mkdir -p .claude/docs/requirements
mkdir -p .claude/docs/bugs
mkdir -p .claude/scripts

# 2. 移动现有文档
# (根据实际情况调整)

# 3. 复制脚本文件
cp spec-kit/.specify/scripts/bash/common.sh .claude/scripts/
cp spec-kit/.specify/scripts/bash/check-prerequisites.sh .claude/scripts/
chmod +x .claude/scripts/*.sh

# 4. 测试新脚本
.claude/scripts/check-prerequisites.sh --json --paths-only
```

## 常见问题

### Q1: 如何在命令行中快速获取当前需求 ID？

```bash
source .claude/scripts/common.sh
echo $(get_current_req_id)
```

### Q2: 如何手动指定需求 ID？

```bash
export DEVFLOW_REQ_ID="REQ-123"
```

### Q3: 如何检查某个需求的所有文档？

```bash
.claude/scripts/check-prerequisites.sh --include-tasks
```

### Q4: 脚本找不到需求 ID 怎么办？

确保：
1. 在正确的 Git 分支上 (feature/REQ-XXX-xxx)
2. 或者设置了 DEVFLOW_REQ_ID 环境变量
3. 或者 .claude/docs/requirements/ 目录中有需求目录

### Q5: 如何创建新需求的目录结构？

```bash
source .claude/scripts/common.sh
create_req_structure "REQ-123"
```

## 相关文档

- `.claude/scripts/common.sh` - 脚本基础库实现
- `.claude/scripts/check-prerequisites.sh` - 前置条件检查实现
- `.claude/agents/planner.md` - 使用路径脚本的示例
- `spec-kit/.specify/` - 参考实现来源

---

*版本: 1.0.0*
*最后更新: 2025-01-09*