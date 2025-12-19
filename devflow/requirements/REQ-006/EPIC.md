# Epic: REQ-006 - Adapter Compiler (RM-008)

**Status**: Planned
**Created**: 2025-12-19T16:00:00+08:00
**Owner**: CC-DevFlow Team
**Type**: Epic
**Milestone**: M4

**Input**: PRD.md from `devflow/requirements/REQ-006/PRD.md`
**Prerequisites**: PRD.md 已完成并通过 Constitution Check

---

## 概述

### Epic 描述

扩展现有 CC-DevFlow 编译管线，自动生成四个目标平台（Cursor, Codex, Qwen, Antigravity）的规则入口文件和技能注册表。本 Epic 是 RM-008 的完整实现，将 `.claude/` 目录作为单一事实源（SSOT），编译输出各平台所需的规则文件、技能元数据和命令定义。

### 业务价值

1. **跨平台支持**: 开发者可在非 Claude Code 平台（Cursor/Codex/Qwen/Antigravity）获得完整的 CC-DevFlow 工作流支持
2. **单一事实源**: `.claude/` 目录为唯一需要维护的源，消除多平台配置不一致问题
3. **增量编译**: 只编译变更文件，提高开发效率
4. **CI/CD 集成**: 漂移检测确保生成物与源文件同步

### 目标用户

- CC-DevFlow 用户（在 Cursor/Codex/Qwen/Antigravity 平台使用）
- CI/CD 管道（自动化编译和漂移检测）
- CC-DevFlow 开发者（维护编译系统）

### 成功指标

| 指标 | 基线 | 目标 | 测量方法 | 时间线 |
|------|------|------|----------|--------|
| 平台规则文件生成率 | 0/4 平台 | 4/4 平台 | 运行 `npm run adapt` 后检查文件存在 | M4 完成 |
| 技能注册表完整性 | 0% | 100% 技能覆盖 | 对比 skill-rules.json 条目数 | M4 完成 |
| 增量编译效率 | N/A | 单文件变更 <1s | 计时测试 | M4 完成 |
| 格式验证通过率 | N/A | 100% | MDC/TOML lint 测试 | M4 完成 |

---

## 范围定义

### 包含范围

- 四个目标平台的规则入口文件生成（Cursor MDC, Codex SKILL.md, Qwen TOML, Antigravity Markdown）
- 技能注册表 JSON 生成（合并 skill-rules.json 和 skill.md 元数据）
- 扩展 manifest.json 到 v2.0 支持增量编译
- 漂移检测 `--check` 功能
- Hook 降级策略文档
- Antigravity 12K 字符限制智能分块

### 不包含范围

- MCP 动态加载机制（超出 RM-008 范围）
- 新平台支持（Windsurf, Auggie 等）
- 运行时技能热加载
- GUI 界面
- 网络请求功能

### 用户故事映射

#### Story 1: 平台规则入口文件生成

- **Epic 目标**: 运行 `npm run adapt` 后自动生成四个平台的规则入口文件
- **实现阶段**: Phase 3 (Core Implementation)
- **优先级**: P1 (MVP Critical)
- **验收标准**:
  - `.cursor/rules/devflow.mdc` 包含有效 MDC 格式
  - `.codex/skills/cc-devflow/SKILL.md` 包含技能元数据
  - `.qwen/commands/devflow.toml` 为有效 TOML 格式
  - `.agent/rules/rules.md` 不超过 12,000 字符

#### Story 2: 技能注册表生成

- **Epic 目标**: 编译时自动从 `skill-rules.json` 生成技能注册表
- **实现阶段**: Phase 3 (Core Implementation)
- **优先级**: P1 (MVP Critical)
- **验收标准**:
  - 生成 `devflow/.generated/skills-registry.json`
  - 包含所有技能的 name, type, enforcement, triggers, skillPath
  - 新增/删除技能后注册表自动更新

#### Story 3: 增量编译扩展

- **Epic 目标**: 技能和规则入口文件支持增量编译
- **实现阶段**: Phase 4 (Integration)
- **优先级**: P2 (High)
- **验收标准**:
  - 无变更时输出 "No changes detected"
  - 单文件变更时只更新相关输出
  - manifest.json 记录 skills 和 rulesEntry hash

#### Story 4: 漂移检测

- **Epic 目标**: 使用 `npm run adapt -- --check` 检测生成物漂移
- **实现阶段**: Phase 4 (Integration)
- **优先级**: P2 (High)
- **验收标准**:
  - 同步时输出 "All generated files are up to date" 且 exit code 0
  - 漂移时输出 diff 信息且 exit code 2

#### Story 5: Hook 降级策略文档

- **Epic 目标**: 生成的规则入口文件包含 Hook 降级说明
- **实现阶段**: Phase 5 (Polish)
- **优先级**: P3 (Medium)
- **验收标准**:
  - `.cursor/rules/devflow.mdc` 包含 "Hook Compatibility" 章节
  - 列出每个 Hook 的降级策略

---

## Phase -1: 宪法闸门检查 (Pre-Implementation Gates)

### Simplicity Gate (简单性闸门) - Constitution Article VII

- [x] **项目数量**: 使用 ≤3 个项目/模块？
  - **实际**: 3 个主要模块（Parser/Transformer 现有、Skills Registry 扩展、Rules Emitters 新增）
  - **Status**: PASS

- [x] **NO FUTURE-PROOFING**: 没有为"未来可能需要"的功能做准备？
  - **验证**: 无插件系统、无通用框架、仅实现 PRD 明确需求
  - **Status**: PASS

- [x] **Minimal Dependencies**: 只使用必需的依赖库？
  - **验证**: 零新增依赖，完全复用 gray-matter, @iarna/toml, js-yaml, zod
  - **Status**: PASS

### Anti-Abstraction Gate (反抽象闸门) - Constitution Article VIII

- [x] **Framework Trust**: 直接使用框架功能，没有封装？
  - **验证**: 直接使用 Node.js fs/path，无自定义封装
  - **Status**: PASS

- [x] **Single Model Representation**: 实体只有一种数据表示？
  - **验证**: skill-rules.json 为唯一触发规则源，无 DTO 转换
  - **Status**: PASS

- [x] **No Unnecessary Interfaces**: 没有单一实现的接口？
  - **验证**: BaseEmitter 是必要抽象（4 个平台实现），BaseRulesEmitter 同理
  - **Status**: PASS

### Integration-First Gate (集成优先闸门) - Constitution Article IX

- [x] **Contracts Defined First**: API contracts 在实现前定义？
  - **验证**: PLATFORM_CONFIG 和 CLI 契约已在 TECH_DESIGN.md 定义
  - **Status**: PASS

- [x] **Contract Tests Planned**: Contract tests 在 Phase 2 计划？
  - **验证**: 将在 Phase 2 编写规则格式验证测试
  - **Status**: PASS

- [x] **Real Environment**: 使用真实文件系统测试？
  - **验证**: 所有测试使用真实文件系统操作，无 mock
  - **Status**: PASS

### Complexity Tracking (复杂度追踪表)

| 违规项 | 为何需要 | 更简单方案为何不够 | 缓解措施 |
|--------|---------|-------------------|----------|
| 无 | N/A | N/A | N/A |

**Phase -1 Gates Status**: ALL PASSED

---

## 技术方案

### 系统架构

#### 高层架构

```
SOURCES (SSOT: .claude/)
├── commands/*.md          → CommandIR[]
├── skills/**/skill.md     → SkillMetadata[]
└── skills/skill-rules.json → TriggerRules
              │
              ▼
┌─────────────────────────────────────┐
│      COMPILATION PIPELINE           │
│  Parser → Transformer → Registry    │
│              ↓                      │
│  Rules Emitters + Command Emitters  │
└─────────────────────────────────────┘
              │
              ▼
OUTPUTS
├── .cursor/rules/devflow.mdc
├── .codex/skills/cc-devflow/SKILL.md
├── .qwen/commands/devflow.toml
├── .agent/rules/rules.md
└── devflow/.generated/
    ├── skills-registry.json
    └── manifest.json (v2.0)
```

#### 核心组件

| 组件 | 职责 | 技术栈 | 依赖 |
|------|------|--------|------|
| Parser | 解析 Markdown + YAML frontmatter | gray-matter | 现有 |
| Transformer | 占位符展开、路径映射 | Node.js | 现有 |
| Skills Registry | 技能注册表生成（重写） | Node.js, Zod | skill-rules.json |
| Platforms | 平台配置注册表（新增） | Node.js | - |
| Rules Emitters | 规则入口文件生成（新增） | Node.js, js-yaml, @iarna/toml | Skills Registry |
| Manifest | 增量编译追踪、漂移检测（扩展） | Node.js | - |

### 数据模型

#### Entity 1: PlatformConfig

```typescript
interface PlatformConfig {
  name: string;           // 平台显示名称
  folder: string;         // 输出目录 (e.g., ".cursor/")
  rulesEntry: {
    path: string;         // 规则入口文件相对路径
    format: 'mdc' | 'markdown' | 'toml';
  };
  commandsDir: string;    // 命令输出子目录
  commandExt: string;     // 命令文件扩展名
  argumentPattern: string; // 参数占位符
  hasHooks: boolean;      // 是否支持原生 hooks
  limits: {
    maxFileChars?: number; // 文件大小限制
  };
}
```

#### Entity 2: SkillEntry

```typescript
interface SkillEntry {
  name: string;
  description: string;
  type: 'domain' | 'guardrail' | 'utility';
  enforcement: 'suggest' | 'block' | 'warn';
  priority: 'critical' | 'high' | 'medium' | 'low';
  skillPath: string;
  triggers: {
    prompt: { keywords: string[]; intentPatterns: string[]; };
    file: { pathPatterns: string[]; contentPatterns: string[]; };
  };
}
```

#### Entity 3: ManifestV2

```typescript
interface ManifestV2 {
  version: "2.0";
  generatedAt: string;
  entries: ManifestEntry[];    // 命令编译记录（现有）
  skills: {                     // 技能编译记录（新增）
    name: string;
    sourceHash: string;
    timestamp: string;
  }[];
  rulesEntry: {                 // 规则入口文件记录（新增）
    [platform: string]: {
      path: string;
      hash: string;
      timestamp: string;
    };
  };
}
```

#### 关系图

```
skill-rules.json ─────┐
                      ├──▶ SkillRegistry ──▶ skills-registry.json
skill.md files ───────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │ RulesEmitters  │
                           └────────────────┘
                                    │
              ┌─────────┬───────────┼───────────┬──────────┐
              ▼         ▼           ▼           ▼          ▼
        .cursor/   .codex/     .qwen/     .agent/    manifest.json
        rules/     skills/     commands/  rules/     (v2.0)
        *.mdc      SKILL.md    *.toml     *.md
```

### CLI 设计

#### 命令接口

```bash
npm run adapt                           # 编译所有平台
npm run adapt -- --platform cursor      # 单平台编译
npm run adapt -- --check                # 漂移检测
npm run adapt -- --verbose              # 详细输出
npm run adapt -- --rules                # 仅生成规则入口文件
npm run adapt -- --skills               # 仅生成技能注册表
```

#### Exit Codes

| Code | 含义 |
|------|------|
| 0 | 成功 |
| 1 | 编译错误 |
| 2 | 漂移检测失败 (--check) |
| 3 | 参数错误 |

### 技术栈选型

#### 必须使用（已有依赖）

- **Runtime**: Node.js >= 18.0.0 - 现有项目要求
- **gray-matter**: ^4.0.3 - YAML frontmatter 解析
- **@iarna/toml**: ^2.2.5 - TOML 序列化 (Qwen)
- **js-yaml**: ^4.1.0 - YAML 序列化
- **zod**: ^3.22.4 - Schema 验证
- **jest**: ^29.7.0 - 单元测试

#### Baseline Deviation

**Deviations from Baseline**: **无**

本需求完全复用现有技术栈，零新增依赖。

---

## 实施阶段

### Phase 1: Setup (环境准备)

**预计时间**: 0.5 天

**任务**:
- 创建 `lib/compiler/platforms.js` 定义 PLATFORM_CONFIG
- 创建 `lib/compiler/rules-emitters/` 目录结构
- 扩展 `manifest.js` schema 到 v2.0

**交付物**:
- 平台配置注册表
- 目录结构就绪
- Manifest v2.0 schema

### Phase 2: Tests First (TDD 测试优先)

**预计时间**: 1 天

**关键原则**: 所有测试必须在 Phase 3 之前完成并失败

**任务**:
- 编写 skills-registry.js 单元测试
- 编写各平台 rules emitter 格式验证测试
- 编写 manifest v2.0 schema 测试
- 编写集成测试（完整编译流程）
- **TEST VERIFICATION CHECKPOINT**: 验证所有测试失败

**交付物**:
- 完整测试套件（全部失败）
- 测试覆盖报告（0% - 预期）

### Phase 3: Core Implementation (核心实现)

**预计时间**: 2 天

**前提**: Phase 2 的所有测试已失败

**任务**:
- 重写 `skills-registry.js` 合并 skill-rules.json
- 实现 `base-rules-emitter.js` 基类
- 实现 `cursor-rules-emitter.js` (MDC 格式)
- 实现 `codex-rules-emitter.js` (SKILL.md 格式)
- 实现 `qwen-rules-emitter.js` (TOML 格式)
- 实现 `antigravity-rules-emitter.js` (12K 分块)
- **让测试通过**

**交付物**:
- 功能代码
- 测试覆盖率 >= 80%
- 四个平台规则文件生成

### Phase 4: Integration (集成)

**预计时间**: 1 天

**任务**:
- 扩展 `index.js` 集成规则生成
- 扩展 `bin/adapt.js` 添加 --rules/--skills 选项
- 实现漂移检测扩展（含规则文件）
- Manifest v2.0 迁移和兼容

**交付物**:
- 完整 CLI 功能
- 增量编译支持
- 漂移检测功能

### Phase 5: Polish (完善)

**预计时间**: 0.5 天

**任务**:
- Hook 降级文档生成
- 格式验证测试 (MDC/TOML lint)
- README 和 quickstart 更新
- 性能优化验证

**交付物**:
- 完整文档
- 格式验证通过
- 性能达标

---

## 依赖关系

### 外部依赖

| 依赖 | 类型 | 负责方 | 状态 | 预计完成 | 风险 |
|------|------|--------|------|----------|------|
| RM-006 (Skill System) | 内部 | CC-DevFlow | 已完成 | - | LOW |
| RM-007 (Command Emitter) | 内部 | CC-DevFlow | 已完成 | - | LOW |
| gray-matter | npm | 第三方 | 稳定 | - | LOW |
| @iarna/toml | npm | 第三方 | 稳定 | - | LOW |

### 内部依赖

| 依赖 | 描述 | 影响 | 缓解措施 |
|------|------|------|----------|
| skill-rules.json | 技能触发规则定义 | 注册表生成依赖此文件 | 已有完整定义 |
| 现有 emitters | 命令 emitter 接口 | 规则 emitter 复用模式 | 遵循现有模式 |
| manifest.json | 增量编译追踪 | 需要 schema 升级 | 向后兼容迁移 |

---

## 质量标准

### Definition of Done (DoD)

#### 代码质量

- [ ] 代码审查通过
- [ ] 符合 ES Modules 规范
- [ ] 无 linter 错误
- [ ] NO CODE DUPLICATION 验证
- [ ] NO DEAD CODE 验证
- [ ] 单文件 <= 800 行

#### 测试质量

- [ ] 单元测试覆盖率 >= 80%
- [ ] 所有集成测试通过
- [ ] 格式验证测试通过 (MDC/TOML)
- [ ] TDD 流程遵循（测试先行）

#### 安全质量

- [ ] NO HARDCODED SECRETS 验证
- [ ] 输入验证（YAML/TOML/Markdown 格式）
- [ ] 路径遍历防护

#### 文档质量

- [ ] quickstart.md 更新
- [ ] CLI help 更新
- [ ] CHANGELOG 更新

#### 部署就绪

- [ ] `npm run adapt` 正常运行
- [ ] `npm run adapt -- --check` 正常运行
- [ ] 四个平台输出验证

### 验收标准

- AC1: `npm run adapt` 生成四个平台规则入口文件
- AC2: `devflow/.generated/skills-registry.json` 包含所有技能
- AC3: 无变更时增量编译跳过所有文件
- AC4: `--check` 模式检测漂移并返回正确 exit code
- AC5: Antigravity 文件不超过 12,000 字符
- AC6: 所有格式验证通过（MDC/TOML）

---

## Phase -1 Constitutional Gates (宪法前置闸)

### Gate 1: Simplicity Gate (Article VII)

**检查项**:
- [x] **项目数量限制**: 3 个主要模块 <= 3
- [x] **无未来预留**: 无插件系统、无通用框架
- [x] **最小可行方案**: 直接复用现有 emitter 模式
- [x] **直接实现**: 无不必要的抽象层

### Gate 2: Anti-Abstraction Gate (Article VIII)

**检查项**:
- [x] **直接使用框架**: 直接使用 Node.js fs/path
- [x] **避免工厂模式**: 使用简单 switch-case 选择 emitter
- [x] **避免中间件层**: 无自定义中间件
- [x] **拒绝过度抽象**: BaseEmitter 仅用于共享代码

### Gate 3: Integration-First Gate (Article IX)

**检查项**:
- [x] **Contract 优先**: PLATFORM_CONFIG 和 CLI spec 已定义
- [x] **真实环境测试**: 使用真实文件系统
- [x] **端到端优先**: 集成测试覆盖完整编译流程
- [x] **避免 Mock**: 无外部服务依赖，无需 mock

### Phase -1 Gate 决策记录

| Gate | Status | 决策 | 理由（如有例外） |
|------|--------|------|------------------|
| Simplicity Gate (VII) | PASS | 3 模块，零新增依赖 | - |
| Anti-Abstraction Gate (VIII) | PASS | 直接使用框架，BaseEmitter 是必要共享代码 | - |
| Integration-First Gate (IX) | PASS | 契约优先，真实文件系统测试 | - |

---

## Constitution Check (宪法符合性检查)

**Reference**: `.claude/constitution/project-constitution.md` (v2.0.0)

### Article I: Quality First (质量至上)

- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: Epic 范围完整，无占位符
- [x] **I.2 - Testing Mandate**: TDD 流程明确，Phase 2 测试优先
- [x] **I.3 - No Simplification**: 无"暂时简化"描述
- [x] **I.4 - Quality Gates**: 验收标准可测试

### Article II: Architectural Consistency (架构一致性)

- [x] **II.1 - NO CODE DUPLICATION**: 复用现有 emitter 模式和 manifest 机制
- [x] **II.2 - Consistent Naming**: 遵循现有命名约定
- [x] **II.3 - Anti-Over-Engineering**: 架构适合 CLI 工具规模
- [x] **II.4 - Single Responsibility**: 清晰的模块职责

### Article III: Security First (安全优先)

- [x] **III.1 - NO HARDCODED SECRETS**: N/A（无敏感数据）
- [x] **III.2 - Input Validation**: YAML/TOML/Markdown 格式验证
- [x] **III.3 - Least Privilege**: N/A（本地 CLI）
- [x] **III.4 - Secure by Default**: 路径遍历防护

### Article IV: Performance Accountability (性能责任)

- [x] **IV.1 - NO RESOURCE LEAKS**: 文件句柄正确关闭
- [x] **IV.2 - Algorithm Efficiency**: 增量编译 O(变更文件数)
- [x] **IV.3 - Lazy Loading**: 按需读取 skill 文件
- [x] **IV.4 - Caching Strategy**: manifest hash 缓存

### Article V: Maintainability (可维护性)

- [x] **V.1 - NO DEAD CODE**: 仅实现需求功能
- [x] **V.2 - Separation of Concerns**: Parser/Transformer/Emitter 分离
- [x] **V.3 - Documentation**: quickstart.md 和 CLI help
- [x] **V.4 - File Size Limits**: 单文件 <= 800 行

### Article VI: Test-First Development (测试优先开发)

- [x] **VI.1 - TDD Mandate**: Phase 2 测试优先
- [x] **VI.2 - Test Independence**: 测试使用独立临时目录
- [x] **VI.3 - Meaningful Tests**: 真实文件系统测试

### Article VII-IX: Phase -1 Gates

- [x] **Article VII - Simplicity Gate**: 3 模块，零新增依赖
- [x] **Article VIII - Anti-Abstraction Gate**: 直接使用框架
- [x] **Article IX - Integration-First Gate**: 契约优先

### Article X: Requirement Boundary (需求边界)

- [x] **X.1 - Forced Clarification**: 所有歧义已通过 /flow-clarify 解决
- [x] **X.2 - No Speculative Features**: 仅实现 PRD 明确功能
- [x] **X.3 - User Story Independence**: 每个故事独立可测试，优先级明确

### Constitutional Violations (宪法违规记录)

无违规。

---

## 风险管理

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| Cursor MDC 格式变更 | M | H | 抽象 emitter 接口，监控 Cursor changelog | Tech Lead |
| Antigravity 12K 限制更严 | L | M | 已实现章节拆分，可调整分块算法 | Tech Lead |
| TOML 库解析问题 | L | L | @iarna/toml 已验证稳定 | - |

### 进度风险

| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| P1 任务延期 | L | H | 按优先级严格执行，P2/P3 可延后 | Tech Lead |
| 测试覆盖率不足 | M | M | Phase 2 严格执行 TDD | Tech Lead |

### 资源风险

| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| 单人开发瓶颈 | M | M | 任务拆分原子化，可并行独立执行 | - |

---

## 发布计划

### 发布策略

- **部署方式**: npm 脚本更新（npm run adapt）
- **环境流程**: Dev → Test → Production（本地 CLI）
- **回滚策略**: 恢复 `lib/compiler/` 到 RM-007 版本

### 里程碑

| 里程碑 | 目标 | 日期 | 状态 |
|--------|------|------|------|
| **Phase 1 Complete** | 环境就绪 | M4 Week 1 Day 1 | Planned |
| **Phase 2 Complete** | 测试完成（失败） | M4 Week 1 Day 2 | Planned |
| **TEST CHECKPOINT** | 验证测试失败 | M4 Week 1 Day 2 | Planned |
| **Phase 3 Complete** | 核心实现（测试通过） | M4 Week 1 Day 4 | Planned |
| **Phase 4 Complete** | 集成完成 | M4 Week 2 Day 1 | Planned |
| **Phase 5 Complete** | 生产就绪 | M4 Week 2 Day 2 | Planned |

### 部署检查清单

- [ ] `npm run adapt` 正常运行
- [ ] `npm run adapt -- --check` exit code 正确
- [ ] 四个平台规则文件格式验证
- [ ] skills-registry.json 完整
- [ ] manifest.json v2.0 正确
- [ ] quickstart.md 更新
- [ ] 增量编译效率达标 (<1s)

---

## Progress Tracking (进度跟踪)

### 完成状态

- [x] 概述定义清晰
- [x] 范围界定明确
- [x] 技术方案完整
- [x] 数据模型设计
- [x] CLI 契约定义
- [x] 实施阶段规划
- [x] 依赖关系识别
- [x] 质量标准定义
- [x] Constitution Check 通过
- [x] 风险评估完成
- [x] 发布计划制定

### 质量检查

- [x] 所有 PRD 用户故事已映射
- [x] 技术方案可行性验证
- [x] TDD 流程明确定义
- [x] CLI 契约完整
- [x] 依赖全部识别
- [x] 风险评估充分

### 闸门状态

- [x] Constitution Check: PASS
- [x] 技术可行性: PASS
- [x] 依赖就绪: PASS

**准备好进行任务生成**: YES

---

## 相关文档

### 输入文档

- **PRD**: [PRD.md](PRD.md)
- **TECH_DESIGN**: [TECH_DESIGN.md](TECH_DESIGN.md)
- **Data Model**: [data-model.md](data-model.md)
- **CLI Spec**: [contracts/cli-spec.yaml](contracts/cli-spec.yaml)
- **研究材料**: [research/](research/)

### 输出文档

- **Tasks**: 将由 planner agent 生成 TASKS.md（TDD 顺序）
- **测试计划**: 将由 qa-tester agent 生成
- **安全计划**: 将由 security-reviewer agent 生成

---

**Generated by**: planner agent
**Based on**: PRD.md, TECH_DESIGN.md, CC-DevFlow Constitution v2.0.0
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Generate TASKS.md with TDD order (Phase 2 Tests -> Phase 3 Implementation)

---

## Validation Checklist (验证清单)

### PRD 对齐

- [x] 所有用户故事已映射到 Epic (5/5)
- [x] 所有验收标准已包含
- [x] 成功指标与 PRD 一致
- [x] 技术约束已考虑

### 技术方案完整性

- [x] 架构设计清晰
- [x] 数据模型完整 (PlatformConfig, SkillEntry, ManifestV2)
- [x] CLI 契约定义
- [x] 技术栈选型合理（零新增依赖）

### TDD 准备

- [x] Phase 2 明确定义为"Tests First"
- [x] TEST VERIFICATION CHECKPOINT 已标记
- [x] 测试策略明确
- [x] Phase 3 依赖 Phase 2 完成

### 质量保证

- [x] DoD 明确且可验证
- [x] Constitution Check 通过
- [x] 风险已识别和评估
- [x] 回滚策略明确

### 可执行性

- [x] 实施阶段清晰 (5 phases)
- [x] 依赖已识别
- [x] 资源需求明确
- [x] 时间估算合理 (~5 天)
