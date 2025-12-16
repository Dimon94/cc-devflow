# Tasks: REQ-003 - 分支命名优化 (中文转拼音)

**Status**: Development Complete
**Created**: 2025-12-16T15:30:00+08:00
**Type**: Enhancement (Bash Script)

**Input**: PRD.md, EPIC.md, TECH_DESIGN.md from `devflow/requirements/REQ-003/`

---

## Format Legend

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US#]**: User Story label (US1, US2, US3)
- **T###**: Task ID (sequential)

---

## Phase 1: Setup (测试环境准备)

**Purpose**: 确保 bats-core 测试框架可用，创建测试文件结构

### 任务清单

- [x] **T001** [US1] 验证 bats-core 测试环境可用 (运行 `bats --version`)
- [x] **T002** [US1] 创建测试目录结构 `tests/` (如不存在)
- [x] **T003** [US1] 创建空测试文件 `tests/slugify.bats` 带基础结构

### Constitution Check (Phase 1)
- [x] **Article VII - Simplicity Gate**: 仅创建必要的测试文件
- [x] **Article VIII - Anti-Abstraction**: 直接使用 bats-core，无封装
- [x] **Article II - Architectural Consistency**: 遵循 Bash 项目测试约定

### Code Review Checkpoint (Phase 1)
- [x] **T004** 触发 `/code-reviewer` 子代理生成 `reviews/phase-1-setup_code_review.md`

---

## Phase 2: Foundational (阻塞性前置条件)

**Purpose**: N/A - 本项目为单函数改造，无阻塞性前置条件

**说明**: Story 1 和 Story 2 高度耦合（都修改 `slugify()` 函数），直接进入 Phase 3 MVP

**Checkpoint**: 跳过，直接进入 Phase 3

---

## Phase 3: User Story 1+2 - MVP 核心功能 (Priority: P1)

**Goal**: 实现 `slugify()` 中文转拼音能力，同时保证纯英文输入 100% 兼容

**Independent Test**:
- US1: `slugify "用户登录"` 返回 `yong-hu-deng-lu`
- US2: `slugify "User Login"` 返回 `user-login` (与改动前一致)

### Tests for MVP (TDD: Write tests FIRST)

- [x] **T005** [P] [US2] 编写英文输入回归测试用例 in `tests/slugify.bats`
  - 测试场景: "User Login Feature" → "user-login-feature"
  - 测试场景: "API2.0" → "api2-0"
  - 测试场景: "" → ""
  - 测试场景: "123" → "123"

- [x] **T006** [P] [US1] 编写中文输入转换测试用例 in `tests/slugify.bats`
  - 测试场景: "用户登录功能" → "yong-hu-deng-lu-gong-neng"
  - 测试场景: "OAuth2认证" → "oauth2-ren-zheng"
  - 测试场景: "测试@#$%功能" → "ce-shi-gong-neng"
  - 测试场景: "重庆" → "chong-qing"

### TEST VERIFICATION CHECKPOINT

- [x] **T007** [US1] [US2] 运行 `bats tests/slugify.bats` 验证所有测试 **失败** (红灯)
  - 预期: 英文测试通过，中文测试失败
  - 如果中文测试意外通过: 检查测试逻辑

### Implementation for MVP

- [x] **T008** [US1] 实现 `_chinese_to_pinyin()` 辅助函数 in `.claude/scripts/common.sh`
  - 位置: 在 `slugify()` 函数前 (约 L176)
  - 功能: 检测 pypinyin 可用性，调用 Python3 转换
  - 参考: TECH_DESIGN.md Section 3.2

- [x] **T009** [US1] [US2] 改造 `slugify()` 函数 in `.claude/scripts/common.sh:180-195`
  - 功能: 中文检测，条件调用 `_chinese_to_pinyin()`
  - 保持: 原有英文处理逻辑不变
  - 参考: TECH_DESIGN.md Section 3.1

- [x] **T010** [US1] [US2] 运行 `bats tests/slugify.bats` 验证所有测试 **通过** (绿灯)

**Checkpoint**: MVP 功能完成，US1 和 US2 可独立验证

### Code Review Checkpoint (Phase 3)
- [x] **T011** 触发 `/code-reviewer` 子代理生成 `reviews/phase-3-mvp_code_review.md`
  - 审查聚焦: 对照 PRD AC 验证功能完整性
  - 审查聚焦: 确认英文输入无回归

---

## Phase 4: User Story 3 - 依赖缺失警告 (Priority: P2)

**Goal**: pypinyin 未安装时输出明确警告到 stderr

**Independent Test**: 在无 pypinyin 环境调用 `slugify "中文"` 输出警告信息

### Tests for User Story 3 (TDD: Write tests FIRST)

- [x] **T012** [US3] 编写 pypinyin 缺失场景测试用例 in `tests/slugify.bats`
  - 测试场景: pypinyin 缺失 + 中文输入 → stderr 包含 "Warning: pypinyin not installed"
  - 测试场景: pypinyin 缺失 + 英文输入 → 无警告输出
  - 注意: 需要 mock pypinyin 不可用状态

### TEST VERIFICATION CHECKPOINT

- [x] **T013** [US3] 运行新增测试用例验证 **失败** (红灯)

### Implementation for User Story 3

- [x] **T014** [US3] 完善 `_chinese_to_pinyin()` 警告逻辑 in `.claude/scripts/common.sh`
  - 功能: pypinyin 缺失时输出警告到 stderr
  - 警告文案: "Warning: pypinyin not installed. Chinese characters cannot be converted."
  - 附加提示: "Install: pip install pypinyin"

- [x] **T015** [US3] 运行 `bats tests/slugify.bats` 验证 US3 测试 **通过** (绿灯)

**Checkpoint**: US3 功能完成，警告机制可独立验证

### Code Review Checkpoint (Phase 4)
- [x] **T016** 触发 `/code-reviewer` 子代理生成 `reviews/phase-4-user-story-3_code_review.md`

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 文档更新、代码清理、最终验证

### 任务清单

- [x] **T017** [P] [US1] 更新 `README.md` 可选依赖说明 (约 +5 行)
  - 内容: pypinyin 安装命令 `pip install pypinyin`
  - 位置: Dependencies 或 Optional Dependencies 章节

- [x] **T018** [US1] [US2] [US3] 运行完整测试套件 `bats tests/slugify.bats` 最终验证

- [x] **T019** [US1] 手动验证 quickstart 命令
  - 命令: `source .claude/scripts/common.sh && slugify "用户登录"`
  - 预期: `yong-hu-deng-lu`

- [x] **T020** 代码清理: 确认无调试代码残留、注释完整

### Code Review Checkpoint (Phase 5)
- [x] **T021** 触发 `/code-reviewer` 子代理生成 `reviews/phase-5-polish_code_review.md`
  - 审查聚焦: 最终代码质量
  - 审查聚焦: 文档完整性

---

## Dependencies & Execution Order (依赖关系与执行顺序)

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 3 (MVP: US1 + US2)  ← 核心阶段，TDD 流程
    │
    ▼
Phase 4 (US3: 警告)
    │
    ▼
Phase 5 (Polish)
```

### Task Dependencies Graph

```
T001 → T002 → T003 → T004 (Phase 1: Setup)
                       │
                       ▼
              ┌────────┴────────┐
              ▼                 ▼
           T005 [P]          T006 [P]  (Tests First)
              │                 │
              └────────┬────────┘
                       ▼
                     T007 (Verify Tests FAIL)
                       │
                       ▼
                     T008 (_chinese_to_pinyin)
                       │
                       ▼
                     T009 (slugify enhancement)
                       │
                       ▼
                     T010 (Verify Tests PASS)
                       │
                       ▼
                     T011 (Code Review)
                       │
                       ▼
                     T012 (US3 Tests)
                       │
                       ▼
                     T013 (Verify Tests FAIL)
                       │
                       ▼
                     T014 (Warning implementation)
                       │
                       ▼
                     T015 (Verify Tests PASS)
                       │
                       ▼
                     T016 (Code Review)
                       │
                       ▼
              ┌────────┴────────┐
              ▼                 ▼
           T017 [P]          T018
              │                 │
              └────────┬────────┘
                       ▼
                     T019 → T020 → T021
```

### User Story Dependencies

- **US1 (中文转拼音)**: 核心功能，无其他 US 依赖
- **US2 (英文兼容)**: 与 US1 合并实现，共享测试/实现任务
- **US3 (警告功能)**: 依赖 US1 完成 (需要 `_chinese_to_pinyin()` 函数存在)

### Within Each Phase

- Tests MUST be written and FAIL before implementation
- 同一文件 (`common.sh`) 修改任务需串行执行
- 不同文件 (`slugify.bats`, `README.md`) 可并行

---

## Parallel Execution Examples

### Phase 3 Tests (可并行)

```bash
# 并行编写测试用例 (不同测试块)
# T005: 英文回归测试
# T006: 中文转换测试

# 因为是同一文件的不同测试块，实际执行时建议串行
# 但如果多人协作，可以分别编写后合并
```

### Phase 5 (可并行)

```bash
# T017: 更新 README.md
# T018: 运行测试套件

# 这两个任务操作不同文件，可以并行执行
```

---

## Implementation Strategy (实施策略)

### MVP First (推荐)

1. **Day 1 上午**: Phase 1 Setup (T001-T004)
2. **Day 1 下午**: Phase 3 Tests (T005-T007)
3. **Day 1 傍晚**: Phase 3 Implementation (T008-T011)
4. **Day 2 上午**: Phase 4 (T012-T016)
5. **Day 2 下午**: Phase 5 Polish (T017-T021)

### Incremental Delivery

1. Complete Phase 1 → 测试环境就绪
2. Complete Phase 3 → **MVP 可交付** (US1 + US2)
3. Complete Phase 4 → 用户体验优化 (US3)
4. Complete Phase 5 → 生产就绪

---

## Notes (注意事项)

### Critical Rules

- **TDD 强制**: 先写测试，验证失败，再写实现，验证通过
- **文件路径明确**: 所有任务指定具体文件路径
- **US1+US2 合并**: 两个 Story 修改同一函数，合并为单一 MVP Phase

### File Paths Summary

| 文件 | 操作 | 涉及任务 |
|------|------|----------|
| `.claude/scripts/common.sh` | MODIFY | T008, T009, T014 |
| `tests/slugify.bats` | CREATE | T003, T005, T006, T012 |
| `README.md` | MODIFY | T017 |
| `reviews/*.md` | CREATE | T004, T011, T016, T021 |

### Common Pitfalls

- 测试用例编写时，确保 bats 语法正确
- pypinyin 缺失测试需要在隔离环境运行
- 中文正则检测使用 `grep -P` 或 Python

---

## Validation Checklist (验证清单)

### User Story Organization
- [x] US1 和 US2 合并为 MVP Phase (高度耦合)
- [x] US3 有独立 Phase
- [x] 所有任务都有 [US#] 标签

### Completeness
- [x] 所有 PRD AC 覆盖测试
- [x] 所有 TECH_DESIGN 函数有对应实现任务
- [x] README 更新任务包含

### Story Independence
- [x] US1+US2 可独立测试
- [x] US3 可独立测试

### Parallel Safety
- [x] [P] 标记仅用于不同文件任务
- [x] 同一文件 (`common.sh`) 任务无 [P] 标记

### Path Specificity
- [x] 每个任务指定具体文件路径
- [x] 行号参考已标注 (`common.sh:180-195`)

### Constitution Alignment
- [x] **Article I - Quality First**: TDD 流程完整
- [x] **Article II - Architectural Consistency**: 复用现有函数
- [x] **Article VI - Test-First Development**: 测试优先于实现
- [x] **Article X - Requirement Boundary**: 无推测性功能

---

## Progress Tracking (进度跟踪)

### Overall Progress
- [x] Phase 1: Setup (4 tasks)
- [x] Phase 3: MVP US1+US2 (7 tasks)
- [x] Phase 4: US3 (5 tasks)
- [x] Phase 5: Polish (5 tasks)

**Total Tasks**: 21/21 Complete ✅

### Test Coverage Status
- Contract Tests: 10 / 10 PASS
- Coverage: 100%

### User Story Completion
- [x] US1 (P1): 9 / 9 tasks - Independent Test: PASS ✅
- [x] US2 (P1): 6 / 6 tasks - Independent Test: PASS ✅
- [x] US3 (P2): 5 / 5 tasks - Independent Test: PASS ✅

### Constitution Compliance
- [x] **Initial Check**: All 10 Articles validated at planning stage
- [x] **Post-Implementation**: Constitution Check re-run after all tasks complete

---

## 相关文档

- **PRD**: `devflow/requirements/REQ-003/PRD.md`
- **EPIC**: `devflow/requirements/REQ-003/EPIC.md`
- **TECH_DESIGN**: `devflow/requirements/REQ-003/TECH_DESIGN.md`
- **Function Contract**: `devflow/requirements/REQ-003/contracts/function-contract.md`
- **Constitution**: `.claude/constitution/project-constitution.md`

---

**Generated by**: planner agent
**Based on**: PRD.md, EPIC.md, TECH_DESIGN.md
**Constitution**: CC-DevFlow Constitution v2.0.0
**Template Version**: 3.0.0 (User Story Centric)
