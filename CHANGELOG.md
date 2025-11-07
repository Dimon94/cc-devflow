# Changelog

All notable changes to cc-devflow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2025-11-07

### 🏢 核心突破：引入项目级命令（Project-Level Commands）

v2.1.0 的核心突破是引入了**项目级命令**，与之前的**需求级命令**形成两层体系：

#### Added - 项目级命令

**项目级命令** - 项目整体规划和架构设计（项目初期执行一次）

- **`/flow-roadmap`** - 交互式产品路线图生成
  - 6阶段交互式对话（愿景、用户、功能、技术、里程碑、指标）
  - 生成 `devflow/ROADMAP.md` 和 `devflow/BACKLOG.md`
  - 季度规划（Q1-Q4）和里程碑定义（M1-M8）
  - Feature Roadmap 表格和 Implementation Tracking 表格

- **`/flow-architecture`** - 系统架构设计与图生成
  - 生成 4 种架构图（Mermaid 格式）
    1. Feature Architecture（功能分层架构）
    2. Technical Architecture（技术架构）
    3. Module Structure（模块结构图）
    4. Requirement Dependency（需求依赖关系）
  - 生成 `devflow/ARCHITECTURE.md`

- **`/flow-guidelines`** - 项目规范生成
  - 基于 package.json 自动识别技术栈
  - 生成 frontend-guidelines Skill（React/Vue/Angular等）
  - 生成 backend-guidelines Skill（Node/Go/Python等）
  - 包含编码规范、最佳实践、测试要求

#### Added - 需求级命令增强

**Stage 1.5: 路线图与架构上下文加载** (`/flow-init` 增强)

- 初始化需求时自动检查 `ROADMAP.md` 存在性
- 自动定位需求在路线图中的位置
  - RM-ID (Roadmap Item ID)
  - Milestone (M{n}-Q{q}-{yyyy})
  - Quarter & Cluster
- 自动加载 `ARCHITECTURE.md` 并显示架构上下文
  - Feature Architecture Layer
  - Technical Architecture (Tech Stack)
  - Module Structure (Target Modules)

#### Added - 新增代理

- **`architecture-designer`** - 架构设计专家（4种架构图生成）
- **`project-guidelines-generator`** - 项目规范生成器
- **`roadmap-planner`** - 产品路线图规划师（已规划，待实现）

#### Added - 新增脚本

- `locate-requirement-in-roadmap.sh` - 从 ROADMAP.md 定位需求位置
- `sync-roadmap-progress.sh` - 同步实际开发进度到路线图
- `calculate-quarter.sh` - 计算日期对应的季度
- `validate-hooks.sh` - 验证 Hooks 配置和执行权限
- `check-dependencies.sh` - 检查项目依赖完整性

#### Added - 新增模板

- `ROADMAP_TEMPLATE.md` - 产品路线图模板
- `ARCHITECTURE_TEMPLATE.md` - 架构设计模板
- `BACKLOG_TEMPLATE.md` - 需求待办列表模板

#### Changed - 文档改进

- **README 完全重构**
  - 从 2,101 行精简到 377 行（减少 82%）
  - 使用 `<details>` 折叠非核心内容
  - 添加完整目录（可点击锚点导航）
  - 新增"核心概念"章节（Hooks 系统、Skills 系统）
  - 大幅扩展"命令参考"章节
    - 明确区分**项目级命令**和**需求级命令**
    - 每个命令都有详细的使用说明
    - 包含使用场景表（✅ 推荐 / ❌ 不推荐）
    - 提供多个实际示例
    - 说明预期输出
    - 列出相关命令
  - 新增"版本历史"章节
  - 双语同步（中文/英文）

- **新增 25+ 个详细文档**
  - `docs/commands/*.md` - 13 个命令详细文档
  - `docs/guides/*.md` - 5 个使用指南
  - `docs/architecture/*.md` - 4 个架构文档
  - `docs/examples/*.md` - 3 个示例文档

#### Changed - 配置变更

- `.claude/settings.json` 更新所有 hook 路径为 `.sh`
- 新增 Skills 配置（roadmap-planner, architecture-designer）

#### Fixed - Bug 修复

- 修复 flow-init Stage 2.6 的 `populate-research-tasks.sh` 调用缺失问题
- 修复 research.md TODO 占位符问题
- 实施数据契约一致性

---

## [1.0.0] - 2025-09-25

### 🎉 Major Updates

#### Added - Constitution System v2.0.0

- **10 Articles** governing quality, security, and architecture
  1. Article I: Quality First
  2. Article II: Security First
  3. Article III: No Hardcoded Secrets
  4. Article IV: Test-First Development
  5. Article V: Deployment-First Integration
  6. Article VI: Test Coverage Mandate
  7. Article VII: No Code Duplication
  8. Article VIII: Fail Fast
  9. Article IX: Clear Error Messages
  10. Article X: Requirement Boundary

- **Phase -1 Constitutional Gates**
  - Simplicity Gate（简洁性闸门）
  - Anti-Abstraction Gate（反抽象闸门）
  - Integration-First Gate（集成优先闸门）

- **100% test coverage** (38/38 tests passed)
- Automated compliance checking at every workflow stage
- Amendment process with formal versioning and auto-propagation

#### Added - Research Agent Model

**Execution Model**: Research Agents + Main Agent

- **11 Read-only Analysis Agents**
  - prd-writer
  - ui-designer (conditional)
  - tech-architect
  - planner
  - dev-implementer
  - qa-tester (called twice)
  - security-reviewer (called twice)
  - release-manager
  - impact-analyzer
  - compatibility-checker
  - consistency-checker
  - bug-analyzer

- **Main Agent (Claude)** handles all code operations

- **Clear Tool Distribution**
  - Research Agents: Read, Grep, Glob (analysis only)
  - Main Agent: Edit, Write, Bash, Git (execution)

#### Added - Template-Driven Development

**Self-Executable Templates**:

- `PRD_TEMPLATE.md` - Product Requirements (10-step execution flow)
- `UI_PROTOTYPE_TEMPLATE.md` - UI Prototype (Artistic design guidance)
- `EPIC_TEMPLATE.md` - Epic Planning (10-step execution flow)
- `TASKS_TEMPLATE.md` - Task Breakdown (TDD-ordered phases)
- `INTENT_CLARIFICATION_TEMPLATE.md` - Intent-driven clarification flow

**Template Usage**:
1. Agent reads template
2. Follows Execution Flow steps
3. Generates complete document
4. No placeholders left unfilled
5. Passes Validation Checklist

#### Added - Unified Script Infrastructure

**Standardized Scripts** (`.claude/scripts/`):

- `common.sh` - Core functions (log_event, get_repo_root)
- `check-prerequisites.sh` - Prerequisites validation
- `setup-epic.sh` - Epic/Tasks structure initialization
- `check-task-status.sh` - Task status and progress tracking
- `mark-task-complete.sh` - Task completion marking
- `generate-status-report.sh` - Status report generation
- `validate-constitution.sh` - Constitution compliance checking
- `recover-workflow.sh` - Workflow recovery logic

**Benefits**:
- 100% test coverage
- JSON output support (`--json` flag)
- Consistent code paths across all agents
- Easier maintenance and updates

#### Added - Quality Gates & Hooks

**Quality Gates**:
- Pre-push Guard (TypeScript, tests, linting, security, build)
- Constitution Compliance (enforced at every stage)
- TDD Checkpoint (TEST VERIFICATION CHECKPOINT)
- Markdown Formatter (automatic documentation formatting)
- Conventional Commits (standardized commit message format)

**Hooks System**:
- PreToolUse Hook - Block non-compliant operations (real-time)
- PostToolUse Hook - Auto-record file changes
- UserPromptSubmit Hook - Intelligent skill recommendations
- Stop Hook - Error handling hints

#### Added - Core Commands

**Requirement Management**:
- `/flow-new` - Start new requirement development (full flow)
- `/flow-init` - Initialize requirement structure
- `/flow-status` - Query development progress
- `/flow-restart` - Resume interrupted development
- `/flow-update` - Update task progress

**Quality Assurance**:
- `/flow-verify` - Verify document consistency
- `/flow-qa` - Execute quality assurance
- `/flow-constitution` - Manage Constitution compliance

**Tools**:
- `/flow-fix` - One-command bug fix flow
- `/flow-ideate` - Intent-driven requirement development
- `/flow-upgrade` - PRD version management
- `/flow-release` - Create release

#### Added - Single-Track Architecture

**Philosophy**: Keep one canonical workspace per requirement

```
devflow/requirements/REQ-123/
├── orchestration_status.json  # Single source of truth
├── EXECUTION_LOG.md           # Audit trail
├── PRD.md
├── EPIC.md
├── TASKS.md                   # Single unified task list
├── tasks/                     # Task artifacts
├── research/                  # External references
├── TEST_PLAN.md
├── TEST_REPORT.md
├── SECURITY_PLAN.md
└── SECURITY_REPORT.md
```

#### Added - Testing Framework

**100% Test Coverage**:

**Script Test Suites** (8/8 Passed):
- test_check_prerequisites (18 tests)
- test_check_task_status (18 tests)
- test_common (15 tests)
- test_mark_task_complete (15 tests)
- test_setup_epic (13 tests)
- test_validate_constitution (4 tests)

**Constitution Test Suites** (4/4 Passed):
- test_version_consistency (5 tests)
- test_article_coverage (10 tests)
- test_template_completeness (10 tests)
- test_agent_assignment (13 tests)

**Total**: 38/38 tests passed ✅

#### Added - Three-Layer Information Architecture

**Constitution Layer** (Immutable Principles):
- 10 Articles + Phase -1 Gates
- Quality gates and compliance standards
- Highest authority

**Guides Layer** (Operational How-To):
- Workflow SOPs
- Technical operation guides
- Agent coordination protocols

**Rules Layer** (Project Conventions):
- Core Patterns (4 fundamental principles)
- DevFlow Conventions (CC-DevFlow specific)

**Benefits**:
- 55% reduction in rules context (~100KB tokens saved)
- Clear separation of concerns
- Easy maintenance
- Scalable for 10+ years

---

## [0.9.0] - 2025-09-10 (Beta)

### Added

- Initial beta release
- Basic workflow commands (`/flow-new`, `/flow-init`)
- PRD and EPIC generation
- Basic quality gates
- Git integration

### Known Issues

- No Constitution system
- Manual task tracking
- Limited test coverage
- No consistency verification

---

## Future Releases

See [ROADMAP.md](devflow/ROADMAP.md) for planned features and improvements.

---

## Links

- [GitHub Repository](https://github.com/Dimon94/cc-devflow)
- [Documentation](docs/)
- [Contributing](CONTRIBUTING.md)
- [License](LICENSE)
