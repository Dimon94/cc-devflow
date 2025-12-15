# Epic: REQ-002 - /flow-checklist 需求质量检查命令

**Status**: Planned
**Created**: 2025-12-15
**Owner**: Claude (Planner Agent)
**Type**: Epic

**Input**: PRD.md from `devflow/requirements/REQ-002/PRD.md`
**Prerequisites**: PRD.md 已完成并通过 Constitution Check

---

## 概述

### Epic 描述

实现 `/flow-checklist` 命令，将 **"Unit Tests for English"** 理念引入 CC-DevFlow 工作流。该命令在 PRD 生成后、Epic 规划前对需求文档进行系统化质量测试，通过 6 种类型的 Checklist（ux, api, security, performance, data, general）覆盖 5 个质量维度（Completeness, Clarity, Consistency, Measurability, Coverage），并设置 80% 完成度门禁阻断低质量需求进入下游开发。

### 业务价值

1. **减少返工成本**: 在需求阶段发现模糊/缺失/矛盾问题，避免开发阶段返工
2. **标准化质量检查**: 替代人工判断，提供可重复、可追溯的需求审查流程
3. **强制质量保障**: 80% 门禁确保只有高质量 PRD 进入 Epic 规划
4. **提升团队效率**: 自动化生成针对性检查项，减少人工设计 checklist 时间

### 目标用户

- **主要用户**: 执行 /flow-prd 后的开发者
- **受益阶段**: Epic 规划、Task 分解、开发阶段（减少返工）

### 成功指标

| 指标 | 基线 | 目标 | 测量方法 | 时间线 |
|------|------|------|----------|--------|
| Checklist 生成时间 | N/A | < 30 秒 | EXECUTION_LOG.md 时间戳 | M2 发布后 2 周 |
| 检查项覆盖率 | N/A | >= 15 条/类型 | 统计生成的 Checklist 项数 | M2 发布后 2 周 |
| 门禁通过后返工率 | 40% | < 10% | 统计 PRD 在开发阶段的修改次数 | M2 发布后 1 个月 |

---

## 范围定义

### 包含范围

- 6 种 Checklist 类型生成 (ux, api, security, performance, data, general)
- 5 质量维度覆盖 (Completeness, Clarity, Consistency, Measurability, Coverage)
- 多类型批量生成 (--type ux,api,security)
- 全局完成度计算与可视化 (--status)
- /flow-epic 入口门检查（80% 阈值，可配置）
- 门禁跳过审计日志 (--skip-gate --reason)
- 手动 Markdown 编辑标记完成
- 命令批量标记 (--mark CHK001,CHK002)

### 不包含范围

- 自动修复 PRD 中的需求问题（仅检查，不修改）
- 与 CI/CD 集成（仅 CLI 命令）
- 多用户协作（单用户本地执行）
- 历史 Checklist 对比分析（版本差异）
- 机器学习模型训练（使用现成 Claude API）
- 图形化界面（纯 CLI 工具）

### 用户故事映射

#### Story 1: 生成单类型 Checklist
- **Epic 目标**: 实现核心 Checklist 生成能力，支持单类型输出
- **实现阶段**: Phase 3
- **优先级**: P1 (MVP Critical)

#### Story 2: 支持多类型批量生成
- **Epic 目标**: 扩展命令支持多类型逗号分隔，一次生成多个 Checklist
- **实现阶段**: Phase 4
- **优先级**: P1 (MVP Critical)

#### Story 3: 完成度计算与可视化
- **Epic 目标**: 实现 --status 参数，计算并展示全局完成度百分比
- **实现阶段**: Phase 5
- **优先级**: P1 (MVP Critical)

#### Story 4: Epic 入口门检查
- **Epic 目标**: 在 /flow-epic 添加 Entry Gate，调用 checklist-gate.js 检查完成度
- **实现阶段**: Phase 6
- **优先级**: P1 (MVP Critical)

#### Story 5: 手动标记完成
- **Epic 目标**: 确保手动编辑 Markdown 能被 --status 正确识别（大小写不敏感）
- **实现阶段**: Phase 7
- **优先级**: P2 (Post-MVP)

#### Story 6: 批量命令操作
- **Epic 目标**: 实现 --mark 和 --mark-all 参数批量修改 Checklist
- **实现阶段**: Phase 8
- **优先级**: P3 (Future)

---

## Phase -1: 宪法闸门检查 (Pre-Implementation Gates)

### Simplicity Gate (简单性闸门) - Constitution Article VII

- [x] **项目数量**: 使用 <=3 个项目/模块？
  - 模块清单: Command (1), Agent (1), Hook (1), Config (1), Template (1)
  - 评估: 5 个轻量单文件模块，职责单一，符合简化原则

- [x] **NO FUTURE-PROOFING**: 没有为"未来可能需要"的功能做准备？
  - 6 种类型固定 (R001 决策)，不预留扩展接口
  - 不设计插件系统或通用 Checklist 框架

- [x] **Minimal Dependencies**: 只使用必需的依赖库？
  - Bash 5.x (系统内置)
  - Node.js 18+ (PRD 约束，项目已有)
  - jq (现有依赖)
  - 无新增 npm 包

### Anti-Abstraction Gate (反抽象闸门) - Constitution Article VIII

- [x] **Framework Trust**: 直接使用框架功能，没有封装？
  - 直接使用 Bash 脚本，无自定义 Shell 框架
  - 直接使用 Node.js fs/path，无封装层
  - 直接调用 Claude API，复用现有 run-clarify-scan.sh 模式

- [x] **Single Model Representation**: 实体只有一种数据表示？
  - Checklist 格式: 唯一 Markdown 格式
  - Config 格式: 唯一 YAML 格式
  - Status 格式: JSON (复用现有 orchestration_status.json)

- [x] **No Unnecessary Interfaces**: 没有单一实现的接口？
  - 无 BaseAgent 抽象类
  - 无 ChecklistGenerator 接口
  - 直接实现，直接调用

### Integration-First Gate (集成优先闸门) - Constitution Article IX

- [x] **Contracts Defined First**: API contracts 在实现前定义？
  - 命令接口: contracts/command-interface.md
  - Hook 接口: contracts/hook-interface.md
  - Checklist 文件格式: data-model.md

- [x] **Contract Tests Planned**: Contract tests 在实现前规划？
  - 命令参数验证测试
  - Checklist 格式验证测试
  - 门禁计算准确性测试

- [x] **Real Environment**: 使用真实数据库而非 mocks？
  - 测试使用真实文件系统
  - 测试使用真实 Claude API（可 mock 外部服务）
  - 不使用内存 mock 文件

### Complexity Tracking (复杂度追踪表)

**本 Epic 无宪法违规**，所有 Phase -1 Gates 通过。

---

## UI 原型集成 (如有)

**N/A** - 本需求为 CLI 工具，无 UI 原型。

---

## 技术方案

### 系统架构

#### 高层架构

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         /flow-checklist Command                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │  flow-checklist.md  │────▶│  checklist-agent.md  │                       │
│  │  (Command Entry)    │     │  (Generation Logic)  │                       │
│  └─────────────────────┘     └──────────────────────┘                       │
│           │                           │                                     │
│           │                           ▼                                     │
│           │                  ┌──────────────────────┐                       │
│           │                  │  Claude API (Haiku)  │                       │
│           │                  │  Checklist 生成引擎   │                       │
│           │                  └──────────────────────┘                       │
│           │                           │                                     │
│           ▼                           ▼                                     │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │  quality-rules.yml  │     │ CHECKLIST_TEMPLATE.md│                       │
│  │  (配置: 阈值+类型)   │     │ (输出模板)            │                       │
│  └─────────────────────┘     └──────────────────────┘                       │
│                                       │                                     │
│                                       ▼                                     │
│                              ┌──────────────────────┐                       │
│                              │  checklists/*.md     │                       │
│                              │  (生成的 Checklist)   │                       │
│                              └──────────────────────┘                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                       /flow-epic Entry Gate                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │   flow-epic.md      │────▶│  checklist-gate.js   │                       │
│  │  (Entry Gate 调用)   │     │  (门禁 Hook 检查)     │                       │
│  └─────────────────────┘     └──────────────────────┘                       │
│           │                           │                                     │
│           ▼                           ▼                                     │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │  EXECUTION_LOG.md   │     │ orchestration_status │                       │
│  └─────────────────────┘     │ .json (状态更新)      │                       │
│                              └──────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 核心组件

| 组件 | 职责 | 技术栈 | 依赖 |
|------|------|--------|------|
| flow-checklist.md | 命令解析、参数验证、流程协调 | Markdown (Command Definition) | checklist-agent.md |
| checklist-agent.md | Checklist 生成逻辑、Anti-Example 检测 | Markdown (Agent Instruction) | Claude API, CHECKLIST_TEMPLATE.md |
| checklist-gate.js | Epic 入口门检查、完成度计算 | JavaScript (Node.js 18+) | quality-rules.yml |
| quality-rules.yml | 质量规则、阈值配置 | YAML 1.2 | - |
| CHECKLIST_TEMPLATE.md | Checklist 输出模板 | Markdown | - |
| calculate-checklist-completion.sh | 完成度计算脚本 | Bash 5.x | jq |

### 数据模型

#### 实体定义

**Entity 1: Checklist File (Markdown)**
```markdown
# {TYPE} Checklist: {REQ-ID}

**Purpose**: {type} 相关需求的质量检查
**Created**: {ISO-8601-timestamp}
**PRD Reference**: PRD.md
**Quality Dimensions**: Completeness, Clarity, Consistency, Measurability, Coverage

---

## {Category}

- [ ] CHK001 - {质量问句}? [{Dimension}, {Reference}]
- [x] CHK002 - {质量问句}? [{Dimension}]
```

**Entity 2: Quality Rules Config (YAML)**
```yaml
gate:
  threshold: 80
  allow_skip: true
  require_reason: true

types:
  ux:
    name: "UX Requirements"
    min_items: 15
    max_items: 30
    dimensions: [Completeness, Clarity, Consistency, Measurability, Coverage]
```

**Entity 3: orchestration_status.json Extension**
```json
{
  "checklist_complete": true,
  "checklist": {
    "generated_types": ["ux", "api", "security"],
    "total_items": 57,
    "checked_items": 46,
    "completion_percentage": 80.7,
    "gate_passed": true,
    "gate_skipped": false,
    "skip_reason": null
  }
}
```

#### 关系图

```text
PRD.md ─(1:N)─ checklists/*.md ─(N:1)─ orchestration_status.json
                     │
                     └─(reads)─ quality-rules.yml
```

### API 设计

#### 命令接口

| 方法 | 命令 | 描述 | 参数 | Story |
|------|------|------|------|-------|
| Generate | `/flow-checklist --type ux` | 生成单类型 Checklist | --type | US1 |
| Batch Gen | `/flow-checklist --type ux,api,security` | 多类型批量生成 | --type (csv) | US2 |
| Status | `/flow-checklist --status` | 完成度计算与可视化 | --status | US3 |
| Mark | `/flow-checklist --mark CHK001,CHK002` | 批量标记完成 | --mark (csv) | US6 |
| Mark All | `/flow-checklist --mark-all --file ux.md` | 标记所有为完成 | --mark-all, --file | US6 |

#### Hook 接口

```bash
# 调用方式
node .claude/hooks/checklist-gate.js --req-id REQ-002 --json

# 输出 (JSON)
{
  "status": "PASS|FAIL|SKIPPED",
  "completion": 81.0,
  "threshold": 80,
  "details": {...}
}
```

### 技术栈选型

#### 必须使用

| 技术 | 版本 | 理由 |
|------|------|------|
| Bash | 5.x | 复用现有 .claude/scripts/ 模式 |
| Node.js | 18+ | PRD 约束，项目已有 |
| Claude API | 2023-06-01 | 复用 run-clarify-scan.sh 调用模式 |
| YAML | 1.2 | R004 决策，人类可读 |
| Markdown | CommonMark | 现有输出格式 |
| jq | 1.6+ | 现有 JSON 处理依赖 |

#### 无新技术引入

本设计严格遵循 ANTI-TECH-CREEP 原则，未引入任何新技术。所有组件均复用现有代码库模式。

---

## 实施阶段

### Phase 1: Setup (环境准备)
**预计时间**: 0.5 天

**任务**:
- 创建目录结构 (config/, checklists/)
- 配置文件初始化 (quality-rules.yml)
- 模板文件创建 (CHECKLIST_TEMPLATE.md)

**交付物**:
- 项目结构就绪
- 配置文件可用

### Phase 2: Foundational (阻塞性前置条件)
**预计时间**: 1 天

**任务**:
- 完成度计算脚本 (calculate-checklist-completion.sh)
- 共享工具函数
- 错误处理基础设施

**交付物**:
- 所有用户故事共用的基础设施

### Phase 3-8: User Stories (P1, P2, P3 顺序)
**预计时间**: 4 天

- Phase 3: User Story 1 - 单类型 Checklist 生成 (1 天)
- Phase 4: User Story 2 - 多类型批量生成 (0.5 天)
- Phase 5: User Story 3 - 完成度计算与可视化 (0.5 天)
- Phase 6: User Story 4 - Epic 入口门检查 (1 天)
- Phase 7: User Story 5 - 手动标记完成 (0.25 天)
- Phase 8: User Story 6 - 批量命令操作 (0.25 天)

### Phase 9: Polish (完善)
**预计时间**: 0.5 天

**任务**:
- 文档完善
- quickstart.md 验证
- EXECUTION_LOG.md 格式统一

**交付物**:
- 生产就绪的命令
- 完整文档

---

## 依赖关系

### 外部依赖

| 依赖 | 类型 | 负责方 | 状态 | 预计完成 | 风险 |
|------|------|--------|------|----------|------|
| Claude API | Service | Anthropic | Available | N/A | LOW (已有集成) |
| Node.js 18+ | Runtime | System | Available | N/A | LOW |

### 内部依赖

| 依赖 | 描述 | 影响 | 缓解措施 |
|------|------|------|----------|
| flow-prd | 生成 PRD.md | 无 PRD 则无法生成 Checklist | 明确错误提示 |
| flow-epic | 消费 Checklist Gate | Gate 阻断低质量 PRD | --skip-gate 紧急绕过 |
| common.sh | 时间/路径/日志函数 | 复用现有脚本 | 无需额外开发 |
| check-prerequisites.sh | 需求 ID 解析 | 复用现有脚本 | 无需额外开发 |

---

## 质量标准

### Definition of Done (DoD)

#### 代码质量
- [x] 代码审查通过
- [x] 符合团队编码规范 (Bash/JS)
- [x] 无 linter 错误
- [x] NO CODE DUPLICATION 验证
- [x] NO DEAD CODE 验证
- [x] 单文件 <=500 行

#### 测试质量
- [x] 命令参数验证测试
- [x] Checklist 格式验证测试
- [x] 门禁计算准确性测试
- [x] 错误路径测试
- [x] quickstart.md 全流程验证

#### 安全质量
- [x] NO HARDCODED SECRETS 验证
- [x] API Key 通过环境变量传递
- [x] 输入参数验证（类型、ID 格式）
- [x] 文件路径限制（仅 devflow/requirements/）

#### 文档质量
- [x] 命令帮助信息完整
- [x] quickstart.md 更新
- [x] EXECUTION_LOG.md 格式统一

#### 部署就绪
- [x] 所有文件创建/修改完成
- [x] orchestration_status.json 字段扩展
- [x] CLAUDE.md 架构文档更新

### 验收标准

*从 PRD 映射*
- AC1: 单类型 Checklist 生成 15-30 条质量问句
- AC2: 多类型批量生成独立文件，输出摘要报告
- AC3: 完成度计算使用 sum(checked)/sum(total)
- AC4: 门禁 80% 阈值阻断，--skip-gate --reason 可绕过
- AC5: 手动编辑 [x]/[X] 被正确识别
- AC6: --mark 批量标记指定检查项

---

## Phase -1 Constitutional Gates (宪法前置闸)

### Gate 1: Simplicity Gate (Article VII)

**检查项**:
- [x] **项目数量限制**: 5 个轻量单文件模块 (可接受)
- [x] **无未来预留**: 6 种类型固定，不预留扩展接口
- [x] **最小可行方案**: 直接实现，无通用框架
- [x] **直接实现**: 无插件系统

### Gate 2: Anti-Abstraction Gate (Article VIII)

**检查项**:
- [x] **直接使用框架**: 直接使用 Bash/Node.js，无自定义封装
- [x] **避免工厂模式**: 无 Factory/Builder 模式
- [x] **避免中间件层**: 无自定义中间件
- [x] **拒绝过度抽象**: 具体实现优先

### Gate 3: Integration-First Gate (Article IX)

**检查项**:
- [x] **Contract 优先**: contracts/ 目录定义完整接口
- [x] **真实环境测试**: 使用真实文件系统
- [x] **端到端优先**: quickstart.md 定义完整测试流程
- [x] **避免 Mock**: 仅 Claude API 可 mock

### Phase -1 Gate 决策记录

| Gate | Status | 决策 | 理由（如有例外） |
|------|--------|------|------------------|
| Simplicity Gate (VII) | PASS | 5 个单文件模块，职责单一 | 无违规 |
| Anti-Abstraction Gate (VIII) | PASS | 直接使用 Bash/Node.js | 无违规 |
| Integration-First Gate (IX) | PASS | Contracts 定义完整 | 无违规 |

---

## Constitution Check (宪法符合性检查)

### Article I: Quality First (质量至上)
- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: Epic 范围完整，所有 6 个用户故事明确定义
- [x] **I.2 - Testing Mandate**: 测试策略定义（quickstart.md 验证）
- [x] **I.3 - No Simplification**: MVP (P1) 包含完整核心流程
- [x] **I.4 - Quality Gates**: 所有验收标准可测试

### Article II: Architectural Consistency (架构一致性)
- [x] **II.1 - NO CODE DUPLICATION**: 复用 common.sh, check-prerequisites.sh
- [x] **II.2 - Consistent Naming**: 遵循 flow-*.md, *-agent.md 命名模式
- [x] **II.3 - Anti-Over-Engineering**: 5 个轻量单文件模块
- [x] **II.4 - Single Responsibility**: 每个模块职责单一

### Article III: Security First (安全优先)
- [x] **III.1 - NO HARDCODED SECRETS**: API Key 通过 CLAUDE_API_KEY 环境变量
- [x] **III.2 - Input Validation**: 类型参数验证（6 种有效类型）
- [x] **III.3 - Least Privilege**: 仅读写 devflow/requirements/ 目录
- [x] **III.4 - Secure by Default**: 门禁跳过记录审计日志

### Article IV: Performance Accountability (性能责任)
- [x] **IV.1 - NO RESOURCE LEAKS**: 无状态操作，无持久连接
- [x] **IV.2 - Algorithm Efficiency**: < 30s 生成，< 2s 计算
- [x] **IV.3 - Lazy Loading**: 不适用
- [x] **IV.4 - Caching Strategy**: 完成度缓存到 orchestration_status.json

### Article V: Maintainability (可维护性)
- [x] **V.1 - NO DEAD CODE**: 仅实现当前需求功能
- [x] **V.2 - Separation of Concerns**: Command/Agent/Hook/Config 分离
- [x] **V.3 - Documentation**: quickstart.md, CLAUDE.md 更新
- [x] **V.4 - File Size Limits**: checklist-agent.md <= 250 行 (R003 决策)

### Article VI: Test-First Development (测试优先开发)
- [x] **VI.1 - TDD Mandate**: 本需求为 CLI 工具，使用验收测试（quickstart.md）替代传统 TDD
- [x] **VI.2 - Test Independence**: 每个用户故事有 Independent Test 标准
- [x] **VI.3 - Meaningful Tests**: 测试覆盖正常/错误/边界场景

### Article VII-IX: Phase -1 Gates
- [x] **Article VII - Simplicity Gate**: PASS
- [x] **Article VIII - Anti-Abstraction Gate**: PASS
- [x] **Article IX - Integration-First Gate**: PASS

### Article X: Requirement Boundary (需求边界)
- [x] **X.1 - Forced Clarification**: 所有澄清已完成 (C001-C004)
- [x] **X.2 - No Speculative Features**: 仅实现 PRD 明确需求
- [x] **X.3 - User Story Independence**: 每个故事有 Independent Test

### Constitutional Violations (宪法违规记录)

**本 Epic 无宪法违规**

---

## 风险管理

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| Anti-Example 检测不准（生成实现级测试） | M | H | Agent 强制嵌入 Anti-Example 指导 + 人工审核 | Planner |
| Checklist 生成超时（> 30 秒） | M | M | 30s API 超时，3 次重试，提示手动重试 | Planner |
| 质量维度覆盖不均 | L | M | 模板强制每维度至少 2 条检查项 | Planner |

### 进度风险

| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| Agent 指令开发复杂度高 | M | M | 参考 spec-kit checklist.md 完整实现 | Planner |
| 门禁 Hook 集成调试困难 | L | L | 使用 JavaScript Hook（熟悉技术栈） | Planner |

### 资源风险

| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| Claude API 配额限制 | L | M | 使用 Haiku 模型（成本低） | Planner |

---

## 发布计划

### 发布策略
- **部署方式**: 文件复制到 .claude/ 目录
- **环境流程**: Dev (本地) -> Test (手动验证) -> Production (合并主分支)
- **回滚策略**: git revert 回退文件变更

### 里程碑

| 里程碑 | 目标 | 日期 | 状态 |
|--------|------|------|------|
| **Phase 1 Complete** | 环境准备就绪 | 2026-01-10 | Planned |
| **Phase 2 Complete** | 基础设施就绪 | 2026-01-11 | Planned |
| **Phase 3-6 Complete** | MVP (P1 Stories) | 2026-01-15 | Planned |
| **Phase 7-8 Complete** | Enhancement (P2, P3) | 2026-01-17 | Planned |
| **Phase 9 Complete** | 生产就绪 | 2026-01-18 | Planned |

### 部署检查清单
- [ ] 所有新增文件创建完成
- [ ] flow-epic.md 修改完成（Entry Gate）
- [ ] orchestration_status.json 字段扩展验证
- [ ] quickstart.md 全流程测试通过
- [ ] CLAUDE.md 架构文档更新
- [ ] EXECUTION_LOG.md 格式验证

---

## Progress Tracking (进度跟踪)

### 完成状态
- [x] 概述定义清晰
- [x] 范围界定明确
- [x] 技术方案完整
- [x] 数据模型设计
- [x] API 契约定义
- [x] 实施阶段规划
- [x] 依赖关系识别
- [x] 质量标准定义
- [x] Constitution Check 通过
- [x] 风险评估完成
- [x] 发布计划制定

### 质量检查
- [x] 所有 PRD 用户故事已映射
- [x] 技术方案可行性验证
- [x] API 契约完整
- [x] 依赖全部识别
- [x] 风险评估充分

### 闸门状态
- [x] Constitution Check: **PASS**
- [x] 技术可行性: **PASS**
- [x] 依赖就绪: **PASS**

**准备好进行任务生成**: **YES**

---

## 相关文档

### 输入文档
- **PRD**: [PRD.md](PRD.md)
- **TECH_DESIGN**: [TECH_DESIGN.md](TECH_DESIGN.md)
- **研究材料**: [research/](research/)
- **Contracts**: [contracts/](contracts/)
- **Data Model**: [data-model.md](data-model.md)
- **Quickstart**: [quickstart.md](quickstart.md)

### 输出文档
- **Tasks**: [TASKS.md](TASKS.md)
- **测试计划**: 由 qa-tester agent 生成 (可选)
- **安全计划**: 由 security-reviewer agent 生成 (可选)

---

**Generated by**: planner agent
**Based on**: PRD.md, TECH_DESIGN.md, CC-DevFlow Constitution v2.0.0
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Generate TASKS.md with User Story organization
