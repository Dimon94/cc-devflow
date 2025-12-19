# CC-DevFlow v2.x Roadmap

**Version:** 2.0
**Status:** Planning
**Last Updated:** 2025-12-18

## Vision Statement

CC-DevFlow v2.x 升级目标：借鉴 spec-kit 的"质量左移"理念，通过新增 `/flow-clarify`（11 维度歧义扫描）和 `/flow-checklist`（需求单元测试）两个核心命令，在 PRD 生成和任务分解阶段消除需求歧义。同时构建 **编译式多平台适配层**：以 `.claude/` 为单一事实源（SSOT），将 commands/scripts/skills/hooks 等资产编译为各平台可消费的规则与工作流（Codex/Cursor/Qwen/Antigravity）。

## Timeline Overview

```
2025 Q4              2026 Q1                    2026 Q2
  |                     |                          |
  |--- M1: MVP          |--- M2: Quality Gates    |--- M4: Multi-Platform
  |                     |--- M3: v2.0 Release      |
  |                     |                          |
  v                     v                          v
/flow-clarify      /flow-checklist          Agent Adapters
                   + P1 Features            (4 platforms)
```

### Quarter Distribution

| Quarter   | Focus Area              | Deliverables                          | Effort (weeks) |
|-----------|-------------------------|---------------------------------------|----------------|
| Q4-2025   | MVP Foundation          | /flow-clarify                         | 2.0            |
| Q1-2026   | Quality & Enhancement   | /flow-checklist + P1 features + arch  | 6.0            |
| Q2-2026   | Multi-Platform Support  | Adapter compiler + 4 platform outputs | 4.0            |

## Milestones

### M1: MVP (Q4-2025 End) ✅

**Status:** 🟢 Completed (2025-12-15)
**Goal:** Enable requirement clarification workflow

**Deliverables:**
- RM-001: `/flow-clarify` 需求澄清命令 ✅
  - 11 维度歧义扫描引擎 ✅
  - 交互式澄清对话流程 ✅
  - 澄清结果文档生成 ✅

**Success Criteria:**
- ✅ 能够识别至少 8/11 维度的常见歧义 (11/11 achieved)
- ✅ 生成结构化澄清报告
- ✅ 与现有 `/flow-prd` 命令集成

**Timeline:** 2 weeks (Q4-2025) - Completed on schedule
**Test Results:** 24/24 tests PASS (Foundation: 3/3, Unit: 10/10, Integration: 5/5, Contract: 6/6)

---

### M2: Quality Gates (Q1-2026 Mid) ✅

**Status:** 🟢 Completed (2025-12-16)
**Goal:** Complete shift-left quality process

**Deliverables:**
- RM-002: `/flow-checklist` 需求质量检查命令 ✅
  - 6 种 Checklist 类型 (ux, api, security, performance, data, general) ✅
  - 5 质量维度 (Completeness, Clarity, Consistency, Measurability, Coverage) ✅
  - 80% 门禁阈值与 `/flow-epic` Entry Gate 集成 ✅
  - Anti-Example 规则防止生成实现测试 ✅

**Success Criteria:**
- ✅ 支持自定义检查规则 (`.claude/config/quality-rules.yml`)
- ✅ 生成可量化的质量指标 (`--status` 完成度表格)
- ✅ 阻断质量不达标的需求流转 (`checklist-gate.js` Hook)

**Dependencies:**
- ✅ Requires RM-001 (/flow-clarify) completion - **Completed**

**Timeline:** 2 weeks (Q1-2026) - Completed on 2025-12-16
**Test Results:** 6/6 User Stories, 26/29 AC (90%), Security Score 96.75/100

---

### M3: v2.0 Release (Q1-2026 End) 🟡

**Status:** 🟡 In Progress (2/4 completed)
**Goal:** Production-ready release with P0+P1 features and multi-platform foundation

**Deliverables:**
- RM-003: 分支命名优化 (中文转拼音) ✅
  - 使用 pypinyin 实现中文转拼音 ✅
  - 支持多音字智能选择（lazy_pinyin 词组识别）✅
  - 向后兼容现有分支命名 ✅
  - 完整单元测试套件 (10 测试用例) ✅
- RM-006: Agent 适配层架构 ✅
  - 定义 Adapter 接口规范 ✅
  - 实现插件系统与 Registry ✅
  - 默认支持 Claude Code CLI ✅
  - 适配 Codex CLI (MVP) ✅
- RM-004: GitHub API 限流处理
- RM-005: Coverage Summary Table 增强

**Success Criteria:**
- All P0 and P1 features tested and documented (进行中)
- Multi-platform adapter architecture defined
- Zero critical bugs
- Migration guide available

**Timeline:** Q1-2026 (weeks 5-6 + architecture design)
**Completed:** RM-003 merged on 2025-12-16 (PR #6)

---

### M4: Multi-Platform (Q2-2026 End)

**Goal:** Support 4 major AI agent platforms

**Deliverables:**
- RM-007: 命令转译器（Command Emitter）
- RM-008: Adapter Compiler（Dynamic Context Compiler）
- RM-009: Codex CLI 适配 (Priority 1)
- RM-010: Antigravity IDE 适配 (Priority 2)
- RM-011: Cursor 适配 (Priority 3)
- RM-012: Qwen Code 适配 (Priority 4)
- RM-013: Skills Bridge（Registry + Loader + MCP 可选）

**Success Criteria:**
- All 4 platforms can execute core workflows
- Adapter template documented for future platforms
- Platform-specific features gracefully degraded
- Integration tests pass on all platforms

**Dependencies:**
- Requires RM-006 (Adapter architecture)
- Requires RM-007 (Command emitter)
- Requires RM-008 (Adapter compiler)

**Timeline:** Q2-2026 (4.0 weeks)

## Quarterly Planning Details

### Q4-2025: MVP Foundation

**Theme:** Quality Left-Shift - Phase 1

**Projects:**
1. **RM-001: /flow-clarify 需求澄清命令** (P0, 2 weeks)
   - Implement 11-dimension ambiguity scanner
   - Build interactive clarification dialogue
   - Generate structured clarification reports
   - Integrate with `/flow-prd` workflow

**Resource Allocation:**
- Development: 80%
- Testing: 15%
- Documentation: 5%

**Key Risks:**
- Ambiguity detection accuracy may vary across domains
- User adoption of additional workflow step

---

### Q1-2026: Quality & Enhancement

**Theme:** Quality Left-Shift - Phase 2 + Core Enhancements

**Projects:**
1. **RM-002: /flow-checklist 需求质量检查命令** (P0, 2 weeks)
   - Build requirement unit testing framework
   - Create quality checklist engine
   - Implement coverage analysis

2. **RM-003: 分支命名优化** (P1, 0.5 weeks) ✅
   - Chinese to Pinyin conversion ✅
   - Branch naming validation ✅
   - Completed: 2025-12-16 (PR #6)

3. **RM-004: GitHub API 限流处理** (P1, 0.5 weeks)
   - Rate limit detection
   - Retry with exponential backoff
   - User notification

4. **RM-005: Coverage Summary Table 增强** (P1, 1 week)
   - Enhanced visualization
   - Trend analysis
   - Export capabilities

5. **RM-006: Agent 适配层架构** (P2, 2 weeks) ✅
   - Define adapter interface ✅
   - Design plugin system ✅
   - Create adapter registry ✅
   - Completed: 2025-12-17 (PR #7)

**Resource Allocation:**
- P0 Features: 35%
- P1 Features: 35%
- P2 Architecture: 30% ✅ (Completed)

**Key Risks:**
- Scope creep from P1 features
- Architecture decisions impacting backward compatibility

---

### Q2-2026: Multi-Platform Support

**Theme:** Platform Expansion

**Projects:**
1. **RM-007: 命令转译器（Command Emitter）** (P2, 1 week)
   - 从 `.claude/commands/*.md` 生成平台命令/工作流
     - Codex: `.codex/prompts/*.md`
     - Cursor: `.cursor/commands/*.md`
     - Qwen: `.qwen/commands/*.toml`
     - Antigravity: `.agent/workflows/*.md`
   - 展开占位符（确定性编译）
     - `{SCRIPT:<alias>}` → frontmatter `scripts` 实际命令
     - `{AGENT_SCRIPT}` → frontmatter `agent_scripts`（并替换 `__AGENT__`）
     - `$ARGUMENTS`/`{{args}}` 平台化
   - 生成 manifest（source/target/hash）

2. **RM-008: Adapter Compiler（Dynamic Context Compiler）** (P2, 1 week)
   - 扫描 `.claude/` 构建 Source IR
   - 生成平台规则入口文件（Cursor/Codex/Qwen/Antigravity）
   - Skills Registry + Loader（渐进披露）
   - Runtime entry: `.claude/scripts/update-agent-context.sh`, which now compiles contexts without `.specify`, honors `DEVFLOW_CONTEXT_SOURCE`/`DEVFLOW_PLAN_PATH`, falls back to `devflow/ROADMAP.md` when metadata is missing, and supports `DEVFLOW_AGENT_CONTEXT_TEMPLATE` overrides.

3. **RM-009: Codex CLI 适配** (P2, 0.5 weeks)
   - Priority 1 platform
   - Core workflow validation

4. **RM-010: Antigravity IDE 适配** (P2, 1 week)
   - Priority 2 platform
   - `.agent/rules/` + `.agent/workflows/` 产物生成

5. **RM-011: Cursor 适配** (P2, 0.5 weeks)
   - Priority 3 platform
   - IDE integration considerations

6. **RM-012: Qwen Code 适配** (P2, 0.5 weeks)
   - Priority 4 platform
   - Chinese language optimizations

**Resource Allocation:**
- Compiler/Emitter: 30%
- Adapter Development: 60%
- Integration Testing: 10%

**Key Risks:**
- Platform API changes breaking adapters
- Inconsistent feature support across platforms

## Dependency Graph

```
Phase 1: Foundation (Q4-2025)
  RM-001 (/flow-clarify)
    |
    v
Phase 2: Quality Gates (Q1-2026)
  RM-002 (/flow-checklist)
  RM-003 (Branch naming)
  RM-004 (Rate limiting)
  RM-005 (Coverage)
  RM-006 (Adapter architecture)
    |
    v
Phase 3: Platform Support (Q2-2026)
  RM-006 (Adapter architecture)
    |
    +---> RM-007 (Command emitter)
            |
            +---> RM-008 (Adapter compiler)
            |       |
            |       +---> RM-009 (Codex CLI)
            |       |
            |       +---> RM-010 (Antigravity IDE)
            |       |
            |       +---> RM-011 (Cursor)
            |       |
            |       +---> RM-012 (Qwen Code)
            |       |
            |       +---> RM-013 (Skills Bridge)
            |
            v
```

**Critical Path:**
RM-001 → RM-002 → RM-006 → RM-007 → RM-008 → RM-009/010/011/012

**Parallel Tracks:**
- Track 1 (Quality): RM-001 → RM-002
- Track 2 (Enhancements): RM-003, RM-004, RM-005 (can run in parallel)
- Track 3 (Platform): RM-006 → RM-007 → RM-008 → (RM-009 + RM-010 + RM-011 + RM-012) + RM-013

## Risks & Mitigation Strategies

### High Priority Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Ambiguity detection accuracy below expectations | High | Medium | - Iterative training with real PRD samples<br>- Fallback to manual review<br>- Community feedback loop |
| Platform API breaking changes | High | Medium | - Version pinning<br>- Adapter abstraction layer<br>- Graceful degradation |
| Resource constraints for Q2 adapters | Medium | High | - Prioritize Codex CLI and Antigravity<br>- Community contributions for Cursor/Qwen<br>- Phased rollout |

### Medium Priority Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User adoption resistance to new steps | Medium | Medium | - Clear value demonstration<br>- Optional vs. mandatory flags<br>- Progressive disclosure |
| Backward compatibility issues | Medium | Low | - Semantic versioning<br>- Deprecation warnings<br>- Migration tooling |
| GitHub API rate limits | Low | High | - Token rotation<br>- Caching layer<br>- Batch operations |

### Contingency Plans

**If M1 slips:**
- Reduce initial ambiguity dimensions from 11 to 6 core dimensions
- Defer interactive dialogue to M2

**If M3 slips:**
- Move RM-005 (Coverage enhancement) to M4
- Ship v2.0 with P0 + critical P1 only

**If M4 capacity insufficient:**
- Ship RM-009 (Codex) + RM-010 (Antigravity) only
- Defer RM-011 (Cursor) + RM-012 (Qwen) to Q3-2026

## Success Metrics

### M1 (MVP) ✅
- [x] /flow-clarify command functional
- [ ] >80% user satisfaction in pilot group (待用户反馈)
- [ ] <5 min average clarification time (待性能测试)

### M2 (Quality Gates) ✅
- [x] /flow-checklist integrated (PR #5 merged 2025-12-16)
- [x] >90% quality check coverage (90% AC coverage achieved)
- [ ] 50% reduction in downstream rework (待后续统计)

### M3 (v2.0 Release) 🟡
- [ ] All P0+P1 features shipped (1/4 P1 features completed)
- [x] RM-006 Architecture delivered (2025-12-17)
- [x] Zero critical bugs (RM-003, RM-006 passed)
- [x] Documentation complete (RM-003, RM-006 documented)
- [ ] 100 beta users onboarded

### M4 (Multi-Platform)
- [ ] 4 platform adapters functional
- [ ] >70% feature parity across platforms
- [ ] Integration tests passing
- [ ] Adapter developer guide published

## References & Inspiration

### Borrowed Concepts from spec-kit

1. **Quality Left-Shift Philosophy**
   - Source: spec-kit's emphasis on early requirement validation
   - Applied: /flow-clarify and /flow-checklist commands

2. **11-Dimension Ambiguity Framework**
   - Source: spec-kit's requirement analysis methodology
   - Applied: Core logic of /flow-clarify scanner

3. **Requirement Unit Testing**
   - Source: spec-kit's validation approach
   - Applied: /flow-checklist implementation

### Key Documents
- `docs/SPEC_KIT_REFERENCE_ANALYSIS_CLAUDE.md` - Original analysis
- `docs/SPEC_KIT_FINAL_SOLUTION.md` - Integration design
- `docs/SPEC_KIT_UPGRADE_TASKS.md` - Implementation tasks

---

**Document Status:** Living Document
**Owner:** CC-DevFlow Team
**Last Updated:** 2025-12-18 (RM-006 completed)
**Next Review:** End of M3 (Q1-2026 End)
