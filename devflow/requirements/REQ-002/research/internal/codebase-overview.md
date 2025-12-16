# Codebase Overview: REQ-002 - /flow-checklist 需求质量检查命令

**Generated**: 2025-12-15T21:52:00+08:00
**Purpose**: 内部代码调研，识别可复用模块和关键入口

---

## 1. 核心可复用模块

### 1.1 命令模式参考: flow-clarify.md

**路径**: `.claude/commands/flow-clarify.md`

**借鉴点**:
- 命令接口设计: `/flow-clarify [REQ-XXX] [--skip] [--history]`
- Entry/Exit Gate 模式
- Session 恢复机制
- Hook 集成 (PreToolUse)
- 与后续命令的数据传递

**关键代码模式**:
```markdown
## Entry Gate
1. 验证 research/research.md 存在
2. 验证 orchestration_status.json.phase0_complete == true
3. 检查 .session.json 是否有未完成会话

## Exit Gate
1. 验证报告完整性
2. 更新 orchestration_status.json
3. 删除 .session.json
```

### 1.2 Agent 模式参考: clarify-analyst.md

**路径**: `.claude/agents/clarify-analyst.md`

**借鉴点**:
- Agent 元数据结构 (Identity, Purpose, Capabilities)
- 输入/输出格式定义
- Model 选择策略 (Sonnet for quality, Haiku for cost)

### 1.3 脚本参考: run-clarify-scan.sh

**路径**: `.claude/scripts/run-clarify-scan.sh`

**可复用函数**:
- `check_api_key()` - API Key 验证
- `validate_answer()` - 用户答案验证
- `call_claude_api()` - Claude API 调用封装（含重试）
- `scan_dimension()` - 单维度扫描
- `scan_all_dimensions()` - 并行扫描主函数

**常量定义模式**:
```bash
readonly DIMENSIONS=(
    "Functional Scope"
    "Data Model"
    ...
)
readonly DIMENSION_FOCUS=(
    "核心目标、成功标准、排除声明"
    ...
)
```

### 1.4 验证脚本参考: validate-research.sh

**路径**: `.claude/scripts/validate-research.sh`

**借鉴点**:
- 多级验证结构 (LEVEL 1-4)
- 各级验证函数分离
- Constitution 合规检查
- STRICT 模式开关

---

## 2. 与本需求直接相关的入口文件

### 2.1 现有集成点

| 文件 | 集成类型 | 说明 |
|------|----------|------|
| `.claude/commands/flow-epic.md` | **入口门目标** | checklist 必须完成 ≥80% |
| `.claude/skills/cc-devflow-orchestrator/skill.md` | **工作流图** | 需更新添加 flow-checklist 节点 |
| `devflow/requirements/*/orchestration_status.json` | **状态存储** | 需新增 checklist_complete 字段 |

### 2.2 新增文件清单

| 文件路径 | 类型 | 说明 |
|---------|------|------|
| `.claude/commands/flow-checklist.md` | Command | 命令定义 |
| `.claude/agents/checklist-agent.md` | Agent | 代理指令 (~250 lines) |
| `.claude/hooks/checklist-gate.js` | Hook | Epic 入口门检查 |
| `.claude/docs/templates/CHECKLIST_TEMPLATE.md` | Template | Checklist 模板 |
| `config/quality-rules.yml` | Config | 检查规则配置 |

---

## 3. 设计规格（来自 SPEC_KIT_FINAL_SOLUTION.md）

### 3.1 核心理念: Unit Tests for English

**关键区分**:
- ❌ 测试实现 (Testing Implementation)
- ✅ 测试需求质量 (Testing Requirement Quality)

**Anti-Example 示例**:
```markdown
❌ WRONG: "Verify the login page displays a username field"
✅ RIGHT: "Is the exact layout of the login form specified? [Completeness]"
```

### 3.2 质量维度标签

| Tag | Pattern | Example |
|-----|---------|---------|
| `[Completeness]` | 是否定义了 X？ | "是否定义了所有 API 端点的请求/响应格式？" |
| `[Clarity]` | X 是否有明确/可量化的定义？ | "'快速响应' 是否有具体的时间指标？" |
| `[Consistency]` | X 和 Y 之间是否一致？ | "API 文档和 UI 原型中的字段命名是否一致？" |
| `[Measurability]` | 如何验证 X 是否满足？ | "如何验证'用户体验流畅'？" |
| `[Coverage]` | 是否覆盖了 X 场景？ | "是否覆盖了网络断开的场景？" |

### 3.3 输出规格

**文件路径**: `devflow/requirements/REQ-XXX/checklists/[type].md`

**Checklist 类型**:
- `ux` - 用户体验
- `api` - API 设计
- `security` - 安全性
- `performance` - 性能
- `data` - 数据模型
- `general` - 综合

### 3.4 Gate 阈值

- **最低通过分数**: 80%
- **Gate 位置**: `/flow-epic` 入口

---

## 4. 现有测试覆盖

### 4.1 测试脚本

| 脚本 | 用途 |
|------|------|
| `.claude/scripts/test-clarify-scan.sh` | clarify 扫描测试 |

### 4.2 扩展测试需求

需为 /flow-checklist 创建:
- `test-checklist-generation.sh` - 检查生成逻辑
- `test-checklist-gate.sh` - 入口门阻断测试

---

## 5. 依赖与技术栈

### 5.1 已有依赖
- Bash (macOS/Linux)
- jq (JSON 处理)
- Claude API

### 5.2 新增依赖
无需新增依赖，复用现有基础设施。

---

## 6. Constitution 合规要点

| Article | 要求 | 检查点 |
|---------|------|--------|
| I | 完整实现 | 5 维度全覆盖，无 TODO |
| II | 架构一致 | 遵循现有命令/代理模式 |
| V.4 | 文件大小 | agent ≤ 500 lines |
| VI | TDD | 测试任务先于实现任务 |
| X | 需求边界 | 仅实现方案定义功能 |

---

**调研完成时间**: 2025-12-15T21:52:00+08:00
**主要发现**:
1. flow-clarify 提供了完整的命令+代理+脚本+Hook 模式参考
2. SPEC_KIT_FINAL_SOLUTION.md 已有详细设计规格
3. 核心创新点是 "Unit Tests for English" 理念
4. 与 /flow-epic 的入口门集成是关键交付
