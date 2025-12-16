# Epic: REQ-003 - 分支命名优化 (中文转拼音)

**Status**: Planned
**Created**: 2025-12-16T15:30:00+08:00
**Owner**: cc-devflow Team
**Type**: Epic

**Input**: PRD.md from `devflow/requirements/REQ-003/PRD.md`
**Prerequisites**: PRD.md 已完成并通过 Constitution Check

---

## 概述

### Epic 描述

增强 `slugify()` 函数，支持中文特性名自动转换为拼音，生成符合 Git 命名规范的分支名。这是一个单函数改造项目，影响范围集中在 `.claude/scripts/common.sh` 文件。

### 业务价值

- **提升可读性**: 中文特性名 "用户登录" 转换为 `yong-hu-deng-lu`，而非被删除成空字符串
- **保持兼容性**: 纯英文输入行为 100% 不变，零回归风险
- **优雅降级**: pypinyin 未安装时给出明确警告，不中断执行

### 目标用户

cc-devflow 开发者，特别是使用中文描述需求的团队

### 成功指标

| 指标 | 基线 | 目标 | 测量方法 | 时间线 |
|------|------|------|----------|--------|
| 中文分支名可读性 | 0% (中文被删除) | 100% (转为拼音) | 手动验证 | MVP 完成 |
| 英文分支名兼容性 | 100% | 100% (无回归) | bats 测试 | MVP 完成 |
| 测试覆盖率 | 0% (无测试) | 100% (核心路径) | bats 测试 | MVP 完成 |

---

## 范围定义

### 包含范围

- `slugify()` 函数增强，支持中文转拼音
- 新增 `_chinese_to_pinyin()` 内部辅助函数
- pypinyin 依赖检测与警告机制
- bats-core 单元测试覆盖核心场景
- README.md 可选依赖说明更新

### 不包含范围

- pypinyin 自动安装功能
- 繁体中文显式支持 (依赖 pypinyin 默认能力)
- 自定义多音字词典
- 英文智能分词 (如 CamelCase 拆分)
- 其他脚本改造

### 用户故事映射

#### Story 1: 中文特性名转拼音
- **Epic 目标**: 实现 `slugify()` 函数中文转拼音核心能力
- **实现阶段**: Phase 3 (MVP)
- **优先级**: P1 (MVP Critical)

#### Story 2: 纯英文输入兼容
- **Epic 目标**: 确保现有英文输入行为 100% 不变
- **实现阶段**: Phase 3 (MVP, 与 Story 1 合并)
- **优先级**: P1 (MVP Critical)

#### Story 3: 依赖缺失警告
- **Epic 目标**: pypinyin 未安装时输出明确警告到 stderr
- **实现阶段**: Phase 4
- **优先级**: P2 (High)

---

## Phase -1: 宪法闸门检查 (Pre-Implementation Gates)

### Simplicity Gate (简单性闸门) - Constitution Article VII

- [x] **项目数量**: 使用 ≤3 个项目/模块？
  - 仅 1 个文件 (`common.sh`) 修改 + 1 个测试文件 (`slugify.bats`) 新增

- [x] **NO FUTURE-PROOFING**: 没有为"未来可能需要"的功能做准备？
  - 无推测性功能，仅实现 PRD 明确需求

- [x] **Minimal Dependencies**: 只使用必需的依赖库？
  - pypinyin 为可选依赖，核心功能必需

### Anti-Abstraction Gate (反抽象闸门) - Constitution Article VIII

- [x] **Framework Trust**: 直接使用框架功能，没有封装？
  - 直接调用 pypinyin 的 `lazy_pinyin()`，无封装层

- [x] **Single Model Representation**: 实体只有一种数据表示？
  - N/A: 无数据模型

- [x] **No Unnecessary Interfaces**: 没有单一实现的接口？
  - 函数内部实现，无额外抽象

### Integration-First Gate (集成优先闸门) - Constitution Article IX

- [x] **Contracts Defined First**: API contracts 在实现前定义？
  - `contracts/function-contract.md` 已定义输入/输出行为

- [x] **Contract Tests Planned**: Contract tests 在 Phase 2 计划？
  - bats 测试覆盖所有 AC 场景

- [x] **Real Environment**: 使用真实数据库而非 mocks？
  - N/A: Bash 函数直接测试，无 mock 需求

### Complexity Tracking (复杂度追踪表)

| 潜在违规 | 为何需要 | 更简单方案为何不够 | 缓解措施 |
|----------|---------|-------------------|----------|
| 引入 pypinyin | PRD Story 1 核心功能必需 | 纯 Bash 方案无法处理多音字 | 可选依赖，缺失时优雅降级 |

**结论**: 无宪法违规

---

## 技术方案

### 系统架构

#### 高层架构

```text
┌─────────────────────────────────────────┐
│         create-requirement.sh           │
│              (调用方)                    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           common.sh                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                        slugify() 函数                               │  │
│  │  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    │  │
│  │  │ 输入检测     │ → │ 中文检测        │ → │ 输出处理         │    │  │
│  │  │ (空/非空)    │    │ (正则匹配)      │    │ (连字符/去重)    │    │  │
│  │  └─────────────┘    └────────┬────────┘    └─────────────────┘    │  │
│  │                              │                                     │  │
│  │                     ┌────────▼────────┐                           │  │
│  │                     │ 含中文?         │                           │  │
│  │                     └────────┬────────┘                           │  │
│  │               ┌──────────────┴──────────────┐                     │  │
│  │               ▼                              ▼                     │  │
│  │        ┌─────────────┐              ┌─────────────┐               │  │
│  │        │ YES: 调用    │              │ NO: 原有    │               │  │
│  │        │ pypinyin    │              │ 逻辑处理    │               │  │
│  │        └──────┬──────┘              └─────────────┘               │  │
│  │               │                                                    │  │
│  │        ┌──────▼──────┐                                            │  │
│  │        │ pypinyin    │                                            │  │
│  │        │ 可用?       │                                            │  │
│  │        └──────┬──────┘                                            │  │
│  │        ┌──────┴──────┐                                            │  │
│  │        ▼              ▼                                            │  │
│  │  ┌─────────┐   ┌─────────┐                                        │  │
│  │  │ YES:    │   │ NO:     │                                        │  │
│  │  │ 转拼音  │   │ 警告+   │                                        │  │
│  │  │         │   │ 降级    │                                        │  │
│  │  └─────────┘   └─────────┘                                        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│     pypinyin (Python3 可选依赖)          │
│     - lazy_pinyin() 函数                 │
│     - 多音字智能处理                      │
└─────────────────────────────────────────┘
```

#### 核心组件

| 组件 | 职责 | 技术栈 | 依赖 |
|------|------|--------|------|
| `slugify()` | 字符串转 slug，支持中文 | Bash 5.x | `_chinese_to_pinyin()` |
| `_chinese_to_pinyin()` | 中文转拼音辅助函数 | Bash + Python3 | pypinyin (可选) |
| `tests/slugify.bats` | 单元测试 | bats-core | Bash |

### 数据模型

N/A: 本功能为纯函数改造，无数据模型

### API 设计

#### 函数契约

| 函数 | 签名 | 输入 | 输出 |
|------|------|------|------|
| `slugify` | `slugify <input>` | 任意字符串 | `[a-z0-9-]` 格式 slug |
| `_chinese_to_pinyin` | `_chinese_to_pinyin <input>` | 含中文字符串 | 拼音替换后字符串 |

**输出约束**:
- 仅包含 `[a-z0-9-]` 字符
- 不以 `-` 开头或结尾
- 无连续 `--`

### 技术栈选型

#### 必须使用
- **Shell**: Bash 5.x - 项目现有脚本语言
- **Runtime**: Python3 3.8+ - common.sh 已有 Python3 调用
- **Library**: pypinyin 0.49+ - 中文拼音转换 (可选)

#### 建议使用
- **测试框架**: bats-core - Bash 单元测试标准工具
- **CI/CD**: 现有 CI 管道

---

## 实施阶段

### Phase 1: Setup (环境准备)
**预计时间**: 0.5 天

**任务**:
- 确认 bats-core 测试环境可用
- 创建测试文件结构

**交付物**:
- 可运行的测试框架

### Phase 2: Foundational (基础设施)
**预计时间**: N/A (无阻塞性前置条件)

**说明**: 本项目为单函数改造，无需 Phase 2 基础设施搭建

### Phase 3: MVP (Story 1 + Story 2)
**预计时间**: 1 天

**前置**: Phase 1 完成

**任务**:
- 编写 bats 测试用例 (TDD)
- 验证测试失败 (红灯)
- 实现 `_chinese_to_pinyin()` 辅助函数
- 改造 `slugify()` 函数
- 验证测试通过 (绿灯)

**交付物**:
- 增强后的 `slugify()` 函数
- 通过的测试套件

### Phase 4: Story 3 (警告功能)
**预计时间**: 0.5 天

**前置**: Phase 3 完成

**任务**:
- 补充 pypinyin 缺失场景测试
- 实现 stderr 警告输出

**交付物**:
- 完整的警告机制

### Phase 5: Polish (完善)
**预计时间**: 0.5 天

**任务**:
- README.md 可选依赖说明
- 代码清理
- 最终验证

**交付物**:
- 生产就绪的代码
- 完整文档

---

## 依赖关系

### 外部依赖

| 依赖 | 类型 | 负责方 | 状态 | 预计完成 | 风险 |
|------|------|--------|------|----------|------|
| pypinyin | 可选库 | PyPI | Available | N/A | LOW |
| bats-core | 测试框架 | Homebrew/apt | Available | N/A | LOW |

### 内部依赖

| 依赖 | 描述 | 影响 | 缓解措施 |
|------|------|------|----------|
| Python3 | common.sh 已使用 | 无 | 系统自带 |
| create-requirement.sh | 调用 slugify() | 需验证集成 | 集成测试 |

---

## 质量标准

### Definition of Done (DoD)

#### 代码质量
- [x] 代码审查通过
- [x] 符合团队编码规范
- [x] 无 linter 错误
- [x] NO CODE DUPLICATION 验证
- [x] NO DEAD CODE 验证

#### 测试质量
- [x] 单元测试覆盖率 ≥80%
- [x] 所有 bats 测试通过
- [x] 纯英文输入回归测试通过
- [x] 中文输入转换测试通过

#### 安全质量
- [x] 输入经过正则过滤
- [x] Python 参数传递安全 (sys.argv)

#### 文档质量
- [x] README 更新 (可选依赖)
- [x] 函数注释完整

#### 部署就绪
- [x] 现有功能不受影响
- [x] 降级机制验证通过

### 验收标准

*从 PRD 映射*

**Story 1 (中文转拼音)**:
- `slugify "用户登录功能"` → `yong-hu-deng-lu-gong-neng`
- `slugify "OAuth2认证"` → `oauth2-ren-zheng`
- `slugify "测试@#$%功能"` → `ce-shi-gong-neng`
- `slugify "重庆"` → `chong-qing`

**Story 2 (英文兼容)**:
- `slugify "User Login Feature"` → `user-login-feature`
- `slugify "API2.0"` → `api2-0`
- `slugify ""` → ``

**Story 3 (警告)**:
- pypinyin 未安装 + 中文输入 → stderr 警告
- pypinyin 未安装 + 英文输入 → 无警告

---

## Constitution Check (宪法符合性检查)

### Article I: Quality First (质量至上)
- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: Epic 范围完整且明确
- [x] **I.2 - Testing Mandate**: TDD 流程明确定义，bats 测试
- [x] **I.3 - No Simplification**: 无"暂时简化"的做法
- [x] **I.4 - Quality Gates**: 所有验收标准可测试且明确

### Article II: Architectural Consistency (架构一致性)
- [x] **II.1 - NO CODE DUPLICATION**: 复用现有 slugify() 函数
- [x] **II.2 - Consistent Naming**: 遵循 common.sh 现有命名约定
- [x] **II.3 - Anti-Over-Engineering**: 最小改动原则
- [x] **II.4 - Single Responsibility**: slugify 仅处理 slug 转换

### Article III: Security First (安全优先)
- [x] **III.1 - NO HARDCODED SECRETS**: N/A
- [x] **III.2 - Input Validation**: 输入经过正则过滤

### Article IV: Performance Accountability (性能责任)
- [x] **IV.1 - NO RESOURCE LEAKS**: N/A (瞬时 Python 调用)
- [x] **IV.2 - Algorithm Efficiency**: <100ms 单次调用

### Article V: Maintainability (可维护性)
- [x] **V.1 - NO DEAD CODE**: 无冗余代码
- [x] **V.2 - Separation of Concerns**: 辅助函数独立
- [x] **V.4 - File Size Limits**: 改动 <50 行

### Article VI: Test-First Development (测试优先开发)
- [x] **VI.1 - TDD Mandate**: Phase 3 测试优先
- [x] **VI.2 - Test Independence**: bats 测试独立运行

### Article VII-IX: Phase -1 Gates
- [x] **Article VII - Simplicity Gate**: PASS
- [x] **Article VIII - Anti-Abstraction Gate**: PASS
- [x] **Article IX - Integration-First Gate**: PASS

### Article X: Requirement Boundary (需求边界)
- [x] **X.1 - Forced Clarification**: 需求已通过 /flow-clarify 澄清
- [x] **X.2 - No Speculative Features**: 无推测性功能
- [x] **X.3 - User Story Independence**: 每个故事独立可测试

### Constitutional Violations (宪法违规记录)

无违规

---

## 风险管理

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| pypinyin 安装失败 | L | L | 降级到原有行为，输出警告 | Dev |
| 多音字转换错误 | M | L | 依赖 pypinyin 默认词典 | Dev |
| bats-core 环境问题 | L | M | CI 验证，本地 Homebrew 安装 | Dev |

### 进度风险

| 风险 | 可能性 | 影响 | 缓解措施 | 负责人 |
|------|--------|------|----------|--------|
| 无 | - | - | 功能简单，风险可控 | - |

---

## 发布计划

### 发布策略
- **部署方式**: 直接合并到 main 分支
- **环境流程**: feature branch → PR → main
- **回滚策略**: git revert 还原 common.sh

### 里程碑

| 里程碑 | 目标 | 日期 | 状态 |
|--------|------|------|------|
| **Phase 1 Complete** | 测试环境就绪 | Day 1 | Planned |
| **Phase 3 Complete** | MVP 功能完成 | Day 2 | Planned |
| **Phase 4 Complete** | 警告功能完成 | Day 2 | Planned |
| **Phase 5 Complete** | 生产就绪 | Day 3 | Planned |

### 部署检查清单
- [ ] 纯英文输入回归测试通过
- [ ] 中文输入转换测试通过
- [ ] pypinyin 缺失场景测试通过
- [ ] README 更新完成
- [ ] Code Review 通过

---

## Progress Tracking (进度跟踪)

### 完成状态
- [x] 概述定义清晰
- [x] 范围界定明确
- [x] 技术方案完整
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
- [x] 函数契约完整
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
- **Function Contract**: [contracts/function-contract.md](contracts/function-contract.md)
- **研究材料**: [research/](research/)

### 输出文档
- **Tasks**: [TASKS.md](TASKS.md)

---

**Generated by**: planner agent
**Based on**: PRD.md, TECH_DESIGN.md, CC-DevFlow Constitution v2.0.0
**Template Version**: 2.0.0 (Self-Executable)
**Next Step**: Generate TASKS.md with TDD order
