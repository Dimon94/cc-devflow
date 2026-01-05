# CC-DevFlow 工作流约定

> **类型**: 工作流约定 (Workflow Conventions)
> **适用**: CC-DevFlow 需求开发流程
> **层级**: Rules Layer (具体约定和格式)
> **前置**: 遵循 Constitution 和 Core Patterns

---

## 🎯 核心约定

### REQ-ID 格式规范
- **格式**: `REQ-\d+` (例如: REQ-123, REQ-001)
- **唯一性**: 在当前仓库范围内必须唯一
- **禁止**: 重复使用已存在的 REQ-ID

### 命令参数格式
```bash
# 标准格式
/flow-new "REQ-123|支持用户下单|https://plan.example.com/Q1"

# 多文档格式
/flow-new "REQ-124|权限管理|https://spec.doc,https://api.doc"

# 无外部文档
/flow-new "REQ-125|数据导出"
```

---

## 📁 文件组织约定

### 目录结构
```text
devflow/requirements/${reqId}/
├── PRD.md                      # 产品需求文档
├── UI_PROTOTYPE.html           # UI原型 ⚡️ 条件生成 (仅UI需求)
├── EPIC.md                     # Epic 规划
├── TASKS.md                    # 任务分解 (单文件管理所有任务)
├── tasks/                      # 任务执行标记
│   ├── TASK_001.completed      # 任务完成标记
│   ├── TASK_002.completed
│   └── IMPLEMENTATION_PLAN.md  # dev-implementer 输出
├── research/                   # 研究资料
│   ├── ${reqId}_plan_1.md
│   ├── ${reqId}_plan_2.md
│   └── ui_design_strategy.md   # UI设计策略 (可选)
├── TEST_PLAN.md                # 测试计划
├── TEST_REPORT.md              # 测试报告
├── SECURITY_PLAN.md            # 安全计划
├── SECURITY_REPORT.md          # 安全报告
├── RELEASE_PLAN.md             # 发布计划
└── EXECUTION_LOG.md            # 执行日志
```

### 文档命名约定
- **PRD 文件**: `PRD.md`
- **Epic 文件**: `EPIC.md`
- **Tasks 文件**: `TASKS.md` (所有任务集中在一个文件)
- **任务完成标记**: `tasks/TASK_{ID}.completed` (空文件)
- **研究文件**: `${reqId}_plan_{序号}.md`
- **测试报告**: `TEST_REPORT.md`
- **执行日志**: `EXECUTION_LOG.md`

---

## 🌿 Git 分支约定

### 分支命名
```bash
# 标准格式
feature/${reqId}-${slug(BRANCH_TITLE_EN)}

# 示例
feature/REQ-123-user-order-support
feature/REQ-124-permission-management
```

> BRANCH_TITLE_EN 为 TITLE 的英文意译 (语义为准，非拼音，使用模型意译)

### 分支操作流程
1. 检查当前在 main 分支且状态干净
2. 创建特性分支
3. 实施开发 (TDD方式)
4. 质量闸检查
5. 创建 PR
6. 合并后清理分支

---

## 💬 提交信息约定

### 提交格式
```text
{type}({reqId}): {taskTitle}

{详细描述}

- 实现功能点1
- 实现功能点2

Co-authored-by: Claude <claude@anthropic.com>
```

### 提交类型
- `feat(REQ-xxx)`: 新功能
- `fix(REQ-xxx)`: 错误修复
- `docs(REQ-xxx)`: 文档更新
- `test(REQ-xxx)`: 测试添加/修改
- `refactor(REQ-xxx)`: 重构
- `chore(REQ-xxx)`: 构建、配置等杂务

---

## 🤖 子代理调用约定

### 调用顺序 (7个阶段)
```text
1. flow-init      → 初始化需求结构
   ↓
2. flow-prd       → prd-writer (研究型) → PRD.md
   ↓
2.5 flow-ui       → ui-designer (研究型) → UI_PROTOTYPE.html ⚡️ 条件触发
   ↓              仅在检测到UI需求时自动执行
3. flow-epic      → planner (研究型) → EPIC.md + TASKS.md
   ↓              如存在UI_PROTOTYPE.html, 自动集成UI上下文
4. flow-dev       → dev-implementer (研究型, 每个任务) → IMPLEMENTATION_PLAN.md
                  → main-agent (执行型) → 代码实现
   ↓              前端任务会引用UI_PROTOTYPE.html
5. flow-qa        → qa-tester (研究型) → TEST_PLAN.md
                  → security-reviewer (研究型) → SECURITY_PLAN.md
                  → main-agent (执行型) → 运行测试、安全扫描
   ↓
6. flow-release   → release-manager (研究型) → RELEASE_PLAN.md
                  → main-agent (执行型) → 创建PR、合并
```

### 状态同步约定
- 每个阶段完成后更新 `orchestration_status.json`
- 每个任务完成后创建 `tasks/TASK_{ID}.completed`
- 所有重要操作记录到 `EXECUTION_LOG.md`

---

## ⚠️ 错误处理约定

### 错误分类
1. **参数错误**: 命令格式、REQ-ID 格式等
2. **环境错误**: Git状态、权限、依赖等
3. **网络错误**: URL访问失败
4. **质量闸错误**: 代码质量不达标
5. **系统错误**: 子代理异常、文件操作失败

### 错误恢复命令
```bash
# 从特定阶段继续
/flow-restart "REQ-123" --from=prd
/flow-restart "REQ-123" --from=dev
/flow-restart "REQ-123" --from=qa
```

### 错误日志格式
```yaml
---
error_type: parameter_error
timestamp: 2024-01-15T10:30:00Z
req_id: REQ-123
step: parameter_parsing
---

# 错误详情
参数格式不正确：缺少标题部分

## 解决方案
请使用正确格式：/flow-new "REQ-123|需求标题|计划URL"
```

---

## 📊 文档元数据约定

### YAML Frontmatter 格式
```yaml
---
req_id: "REQ-123"
title: "支持用户下单"
created_at: "2024-01-15T10:00:00Z"
updated_at: "2024-01-15T15:30:00Z"
version: "1.0.0"
status: "completed"
author: "prd-writer"
---
```

---

## 🎯 性能指标约定

### 时间要求
- **整个流程**: 90% 情况下在 15 分钟内完成
- **单个任务**: 实施时间不超过 5 分钟
- **质量闸检查**: 不超过 2 分钟

### 资源约束
- **内存占用**: < 500MB (峰值)
- **并发需求**: 支持 3 个并发需求
- **文档数量**: 支持 1000 个需求文档

---

## ⚙️ 配置约定

### .claude/settings.json 配置项
```json
{
  "devflow": {
    "baseBranch": "main",
    "autoApprove": false,
    "qualityGate": {
      "minCoverage": 80,
      "strictMode": true
    },
    "templates": {
      "customPrdTemplate": ".claude/templates/custom-prd.md"
    }
  }
}
```

### 环境变量
```bash
# 调试模式
export FLOW_DEBUG=1

# 超时设置 (秒)
export FLOW_TIMEOUT=300

# 最小测试覆盖率
export MIN_COVERAGE=80
```

---

## 🔧 工具集成约定

### 钩子脚本
- `pre-push-guard.sh`: 推送前质量检查
- `markdown_formatter.py`: 文档格式化
- `auto-progress-update.py`: 进度自动更新

### 测试脚本
- `.claude/tests/run-all-tests.sh`: 运行所有测试
- `.claude/tests/scripts/test_*.sh`: 单个测试套件

---

## 🛠️ 故障排除约定

### 环境检查
```bash
# 检查 Git 状态
git status

# 检查 GitHub CLI
gh auth status

# 检查 npm 脚本
npm run --silent

# 检查权限
ls -la .claude/
```

### 日志查看
```bash
# 查看执行日志
tail -f devflow/requirements/REQ-123/EXECUTION_LOG.md

# 查看错误日志
tail -f .claude/logs/flow-*.log
```

---

## 📋 最佳实践清单

### 开始新需求前
- [ ] 确认 REQ-ID 唯一性
- [ ] 准备完整的需求输入 (标题 + 可选URL)
- [ ] 确保 Git 工作目录干净
- [ ] 在 main 分支上启动

### 开发过程中
- [ ] 遵循 TDD 顺序 (Tests First → Implementation)
- [ ] 每个任务完成后立即提交
- [ ] 定期同步主分支
- [ ] 及时更新文档

### 发布前检查
- [ ] 所有测试通过
- [ ] 测试覆盖率 ≥ 80%
- [ ] 安全扫描无高危问题
- [ ] 文档完整且格式正确

---

**重要提示**: 所有约定都是强制性的。这些约定确保 CC-DevFlow 工作流的一致性和可预测性。
