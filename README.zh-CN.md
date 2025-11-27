# 🚀 cc-devflow

> Claude Code 一键需求开发流系统

基于 Claude Code 官方子代理、钩子和设置机制构建的完整开发工作流系统。通过单一命令将需求从规划转变为代码交付。

[中文文档](./README.zh-CN.md) | [English](./README.md)

---

## 🎯 一句话介绍

通过 `/flow-new "REQ-123|功能|URLs"` 一键从 PRD 生成到代码交付的完整自动化工作流。

---

## ✨ 核心特性

- 🎯 **一键启动流程** - 单命令完成 PRD → 代码 → 测试 → 发布全流程
- 🔄 **阶段化命令** - 8个独立阶段命令，精细化控制每个开发环节
- 📋 **文档驱动** - 自动化 PRD → UI原型 → EPIC → TASKS → 实现链条
- 📝 **模板驱动** - 自执行模板（PRD_TEMPLATE, EPIC_TEMPLATE, TASKS_TEMPLATE）
- 🔄 **智能恢复** - `/flow-restart` 自动检测重启点，继续中断的开发
- 🛡️ **质量闸** - 自动化 TypeScript 检查、测试、代码检查和安全扫描
- 🤖 **子代理编排** - 12 个专业研究型代理负责不同开发阶段
- 🎨 **UI原型生成** - 条件触发的HTML原型，融合艺术设计灵感
- 🔗 **GitHub 集成** - 自动化 PR 创建、分支管理和规范化提交
- 📊 **进度跟踪** - 实时状态监控和智能重启点
- 🔍 **一致性验证** - 企业级一致性检查，智能冲突检测
- 🧪 **TDD 强制执行** - 严格的测试驱动开发，TEST VERIFICATION CHECKPOINT
- 📜 **Constitution** - 10条宪法条款管控质量、安全和架构

---

## 💡 核心概念

### Hooks 系统

实时质量守护，PreToolUse 阻止不合规操作，PostToolUse 自动记录变更。

<details>
<summary>📖 Hooks 详解（点击展开）</summary>

**Hook 类型**:

| Hook | 触发时机 | 功能 |
|------|---------|------|
| **UserPromptSubmit** | 用户输入提交时 | 智能推荐相关 Skills |
| **PreToolUse** | 工具使用前 | 阻止不合规操作（TDD 违规等） |
| **PostToolUse** | 工具使用后 | 自动记录文件变更 |
| **Stop** | 会话停止时 | 提供错误处理提示 |

**Guardrail 工作流程**:
```
用户编辑文件 → PreToolUse Hook 触发
  ↓ 路径归一化
  ↓ 规则匹配
  ↓ 内容检查
  ↓ 违规？阻止操作 : 允许操作
```

**跳过 Guardrail**:
```bash
# 方式 1: 文件标记
echo "@skip-tdd-check" >> devflow/requirements/REQ-123/TASKS.md

# 方式 2: 环境变量
export SKIP_TDD_ENFORCER=1
```

📚 [完整 Hooks 文档](docs/guides/hooks-system.zh-CN.md)
</details>

### Skills 系统

智能知识库激活，自动推荐相关领域知识。

<details>
<summary>📖 Skills 详解（点击展开）</summary>

**可用 Skills**:

| Skill | 类型 | 触发场景 |
|-------|------|----------|
| `cc-devflow-orchestrator` | domain | 需求管理、流程指导 |
| `devflow-tdd-enforcer` | guardrail | 编辑 TASKS.md |
| `constitution-guardian` | guardrail | 编辑 PRD/EPIC/TASKS |
| `devflow-file-standards` | domain | 文件命名、目录结构 |
| `skill-developer` | domain | Skill 开发、Hook 系统 |

**触发机制**:
1. **关键词触发** - 输入包含特定关键词
2. **意图匹配** - 正则匹配用户意图
3. **文件触发** - 编辑特定路径文件
4. **内容匹配** - 文件内容匹配特定模式

📚 [完整 Skills 文档](docs/guides/skills-system.zh-CN.md)
</details>

### Agent Orchestration

研究型代理（11个，只读分析）+ 主代理（执行）的双层执行模型。

<details>
<summary>📖 代理编排详解（点击展开）</summary>

**执行模型**:
- **研究型代理**: 只读分析，生成 Markdown 计划和报告
- **主代理 (Claude)**: 执行所有代码操作，拥有完整上下文
- **工作流程**: 代理研究 → 输出计划 → 主代理执行 → 迭代

**工具分配**:
- 研究型代理: Read, Grep, Glob（分析）
- 主代理: Edit, Write, Bash, Git（执行）

📚 [执行模型详解](docs/architecture/execution-model.zh-CN.md)
</details>

---

## 🚀 快速开始

### 安装

```bash
npx tiged Dimon94/cc-devflow/.claude .claude
```

### 验证安装

```bash
.claude/scripts/verify-setup.sh
```

### 第一个需求

```bash
/flow-new "REQ-001|用户认证|https://docs.example.com/auth"
```

<details>
<summary>🔍 完整入门教程（点击展开）</summary>

**交互式演示**:
```bash
python3 .claude/scripts/demo.py
```

**核心脚本**:
```bash
# 环境检查
bash .claude/scripts/check-prerequisites.sh

# 查看任务状态
bash .claude/scripts/check-task-status.sh --verbose

# 标记任务完成
bash .claude/scripts/mark-task-complete.sh T001

# 生成状态报告
bash .claude/scripts/generate-status-report.sh --format markdown
```

**运行测试**:
```bash
# 运行所有测试
bash .claude/tests/run-all-tests.sh --scripts

# Constitution 测试
bash .claude/tests/constitution/run_all_constitution_tests.sh
```

📚 [完整入门指南](docs/guides/getting-started.zh-CN.md)
</details>

---

## 📋 命令速查表

### 🏢 项目级命令（Project-Level）

**用途**: 项目整体规划和架构设计，通常在项目初期执行一次

| 命令 | 用途 | 快速示例 | 详细文档 |
|------|------|----------|----------|
| `/core-roadmap` | 🗺️ 生成产品路线图 | `/core-roadmap` | [→](docs/commands/core-roadmap.zh-CN.md) |
| `/core-architecture` | 🏗️ 生成系统架构 | `/core-architecture` | [→](docs/commands/core-architecture.zh-CN.md) |
| `/core-guidelines` | 📘 生成项目规范 | `/core-guidelines` | [→](docs/commands/core-guidelines.zh-CN.md) |
| `/core-style` | 🎨 生成设计风格指南 | `/core-style` | [→](docs/commands/core-style.zh-CN.md) |

### 📦 需求级命令（Requirement-Level）

**用途**: 具体需求开发，每个需求（REQ-XXX）执行一次

| 命令 | 用途 | 快速示例 | 详细文档 |
|------|------|----------|----------|
| `/flow-new` | 🎯 启动新需求 | `/flow-new "REQ-123\|功能"` | [→](docs/commands/flow-new.zh-CN.md) |
| `/flow-init` | 📦 初始化需求 | `/flow-init "REQ-123\|功能"` | [→](docs/commands/flow-init.zh-CN.md) |
| `/flow-verify` | 🔍 验证一致性 | `/flow-verify "REQ-123"` | [→](docs/commands/flow-verify.zh-CN.md) |
| `/flow-qa` | 🧪 质量保证 | `/flow-qa "REQ-123"` | [→](docs/commands/flow-qa.zh-CN.md) |
| `/flow-release` | 🚢 创建发布 | `/flow-release "REQ-123"` | [→](docs/commands/flow-release.zh-CN.md) |

📚 [完整命令参考](docs/commands/README.zh-CN.md)

<details>
<summary>🎯 我应该用哪个命令？（点击展开）</summary>

```
你的场景：
├─ 规划产品方向？ → /core-roadmap
├─ 设计系统架构？ → /core-architecture
├─ 建立编码规范？ → /core-guidelines
├─ 建立设计风格指南？ → /core-style
├─ 启动全新功能开发？ → /flow-new "REQ-123|功能|URLs"
├─ 仅创建需求目录？ → /flow-init "REQ-123|功能"
├─ 开发中断需要继续？ → /flow-restart "REQ-123"
├─ 检查开发进度？ → /flow-status REQ-123
├─ 发现文档不一致？ → /flow-verify "REQ-123"
├─ 开发完成需要测试？ → /flow-qa "REQ-123"
├─ 修复生产 Bug？ → /flow-fix "BUG-001|描述"
└─ 准备发布？ → /flow-release "REQ-123"
```
</details>

---

## 🔄 工作流程图

以下 Mermaid 流程图展示了完整的 cc-devflow 工作流，包括项目级和需求级两个层面的流程：

```mermaid
graph TB
    Start([项目启动]) --> ProjectLevel{项目级<br/>初始化}
    
    ProjectLevel --> CoreRoadmap[/core-roadmap<br/>ROADMAP.md + BACKLOG.md]
    ProjectLevel --> CoreArch[/core-architecture<br/>ARCHITECTURE.md]
    ProjectLevel --> CoreGuidelines[/core-guidelines<br/>前端/后端规范]
    ProjectLevel --> CoreStyle[/core-style<br/>STYLE.md]
    
    CoreRoadmap --> ReqLevel
    CoreArch --> ReqLevel
    CoreGuidelines --> ReqLevel
    CoreStyle --> ReqLevel
    
    ReqLevel([需求级<br/>开发流程]) --> FlowInit[/flow-init<br/>research.md + tasks.json]
    
    FlowInit --> FlowPRD[/flow-prd<br/>PRD.md]
    FlowPRD --> FlowTech[/flow-tech<br/>TECH_DESIGN.md + 数据模型]
    FlowPRD --> FlowUI[/flow-ui<br/>UI_PROTOTYPE.html<br/>可选]
    
    FlowTech --> FlowEpic[/flow-epic<br/>EPIC.md + TASKS.md]
    FlowUI --> FlowEpic
    
    FlowEpic --> FlowDev[/flow-dev<br/>TASKS.md 执行<br/>TDD 强制]
    
    FlowDev --> FlowQA[/flow-qa<br/>QA 报告 + 安全审查]
    
    FlowQA --> FlowRelease[/flow-release<br/>PR 创建 + 部署]
    
    FlowRelease --> FlowVerify[/flow-verify<br/>一致性检查]
    
    FlowVerify --> End([发布完成])
    
    FlowVerify -.->|可在任意阶段<br/>调用| ReqLevel
    
    style ProjectLevel fill:#e1f5ff
    style ReqLevel fill:#fff4e1
    style FlowInit fill:#e8f5e9
    style FlowPRD fill:#e8f5e9
    style FlowTech fill:#e8f5e9
    style FlowUI fill:#fff9c4
    style FlowEpic fill:#e8f5e9
    style FlowDev fill:#f3e5f5
    style FlowQA fill:#fce4ec
    style FlowRelease fill:#e0f2f1
    style FlowVerify fill:#e3f2fd
```

**流程说明**:
- **项目级命令**（浅蓝色）：项目初始化时执行一次，建立全局标准（SSOT）
- **需求级命令**（浅橙色）：每个需求（REQ-XXX）执行一次
- **可选步骤**（黄色）：`/flow-ui` 为可选步骤，可与 `/flow-tech` 并行执行
- **质量闸门**：每个阶段都有入口/出口闸门，确保文档质量和 Constitution 合规性
- **TDD 强制执行**：`/flow-dev` 严格强制执行测试驱动开发顺序
- **一致性检查**：`/flow-verify` 可在任意阶段调用，确保文档一致性

---

## 🏗️ 系统架构

**执行模型**: 研究型代理（11个，只读）+ 主代理（执行）
**文档结构**: 单轨架构，一个需求目录包含所有产物
**质量保证**: Constitution v2.0.0 + TDD 强制执行 + 实时 Guardrail

<details>
<summary>📖 架构详解（点击展开）</summary>

### 子代理工作流

```text
prd-writer          → PRD 生成（必须使用 PRD_TEMPLATE）
ui-designer         → UI 原型（条件触发）
tech-architect      → 技术设计（Anti-Tech-Creep 强制执行）
planner             → EPIC & TASKS（必须使用 EPIC_TEMPLATE, TASKS_TEMPLATE）
dev-implementer     → 实现计划（仅研究）
qa-tester           → 测试计划 + 测试报告
security-reviewer   → 安全计划 + 安全报告
release-manager     → 发布计划
```

### 单轨架构

```text
devflow/
├── ROADMAP.md               # 产品路线图
├── ARCHITECTURE.md          # 系统架构设计
├── BACKLOG.md               # 需求待办列表
└── requirements/REQ-123/
    ├── PRD.md
    ├── EPIC.md
    ├── TASKS.md
    ├── EXECUTION_LOG.md
    ├── TEST_PLAN.md
    ├── TEST_REPORT.md
    ├── SECURITY_PLAN.md
    ├── SECURITY_REPORT.md
    └── RELEASE_PLAN.md
```

### 质量闸

- Pre-push Guard（TypeScript、测试、代码检查、安全、构建）
- Constitution Compliance（每个阶段强制执行）
- TDD Checkpoint（TEST VERIFICATION CHECKPOINT）
- Guardrail Hooks（PreToolUse 实时阻止不合规操作）

📚 [完整架构文档](docs/architecture/README.zh-CN.md)
</details>

---

## ⚙️ 配置

**最小配置** (`.claude/settings.json`):

```json
{
  "permissions": {
    "allowGitOperations": true,
    "allowNetworkRequests": true,
    "allowSubprocesses": true
  }
}
```

<details>
<parameter name="summary">🔧 完整配置选项（点击展开）</summary>

### Hooks 配置

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{"type": "command", "command": "..."}]
    }]
  }
}
```

### 环境变量

```bash
# 流程行为
export FLOW_AUTO_APPROVE=false
export MIN_TEST_COVERAGE=80
export STRICT_TYPE_CHECKING=true

# Guardrail 跳过
export SKIP_TDD_ENFORCER=1
export SKIP_CONSTITUTION_CHECK=1
```

📚 [完整配置指南](docs/guides/configuration.zh-CN.md)
</details>

---

## 🧪 测试覆盖

**脚本测试**: 8/8 通过 ✅ (100%)
**Constitution 测试**: 38/38 通过 ✅ (100%)

```bash
# 运行所有测试
bash .claude/tests/run-all-tests.sh --scripts
```

<details>
<summary>📊 测试框架详解（点击展开）</summary>

### 测试套件

| 测试套件 | 测试用例数 | 状态 |
|----------|-----------|------|
| `test_check_prerequisites` | 18 | ✅ 100% |
| `test_check_task_status` | 18 | ✅ 100% |
| `test_common` | 15 | ✅ 100% |
| `test_mark_task_complete` | 15 | ✅ 100% |
| `test_setup_epic` | 13 | ✅ 100% |
| `test_validate_constitution` | 4 | ✅ 100% |

📚 [测试框架详解](docs/guides/testing-guide.zh-CN.md)
</details>

---

## 📝 版本历史

### v2.1.0 (2025-11-07) - 最新版本

**🏢 核心突破：引入项目级命令（Project-Level Commands）**

v2.1.0 的核心突破是引入了**项目级命令**，与之前的**需求级命令**形成两层体系：

- **项目级命令** - 项目整体规划和架构设计（项目初期执行一次）
  - `/core-roadmap` - 交互式产品路线图生成（6阶段对话）
  - `/core-architecture` - 4种架构图生成（Mermaid格式）
  - `/core-guidelines` - 项目规范生成（前端/后端分离）
  - `/core-style` - 项目设计风格指南生成（视觉一致性SSOT）

- **需求级命令增强** - Stage 1.5 路线图与架构上下文加载（flow-init）
  - 初始化需求时自动加载项目级上下文
  - 需求与路线图自动映射（RM-ID, Milestone, Quarter）
  - 架构上下文自动关联（Feature Layer, Tech Stack, Module）

**📚 文档改进**:
- README 完全重构（完整目录 + 折叠 + 外部文档链接）
- 新增 25+ 个详细文档

📋 [完整变更日志](CHANGELOG.md)

---

## 🤝 贡献 & 支持

**贡献**: [贡献指南](CONTRIBUTING.md)
**问题**: [GitHub Issues](https://github.com/Dimon94/cc-devflow/issues)
**文档**: [完整文档](docs/)

---

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件

---

**🌟 如果 cc-devflow 帮助简化了您的开发工作流，请为此仓库点星！**
