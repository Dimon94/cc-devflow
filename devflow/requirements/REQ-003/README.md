# REQ-003: 分支命名优化 (中文转拼音)

**Status**: Initialized
**Type**: requirement
**Created**: 2025-12-16
**Branch**: `feature/REQ-003-branch-naming-pinyin`

---

## Roadmap Context

| Field | Value |
|-------|-------|
| Roadmap Item | RM-003 |
| Milestone | M3 (v2.0 Release) |
| Quarter | Q1-2026 |
| Priority | P1 |
| Effort | 0.5 weeks |
| Dependencies | None |

---

## Description

优化 Git 分支命名逻辑，自动将中文特性名转换为拼音，避免 Git 工具兼容性问题。

**示例**:
- 输入: "用户登录功能"
- 输出: `feature/REQ-003-yong-hu-deng-lu-gong-neng`

---

## Acceptance Criteria

- [ ] 集成 pinyin 库 (pypinyin for Python)
- [ ] 支持多音字智能选择
- [ ] 保留英文和数字
- [ ] 转换规则:
  - 中文 → 拼音小写
  - 空格 → 连字符
  - 特殊字符 → 移除
- [ ] 向后兼容现有分支命名

---

## Technical Decisions (from Research)

| ID | Decision | Rationale |
|----|----------|-----------|
| R001 | Python + pypinyin | 项目已使用 Python3；成熟稳定 |
| R002 | 使用默认词典 | pypinyin 内置词组智能匹配 |
| R003 | 隐式支持繁体 | pypinyin 默认可处理 |

---

## Documents

### Planning Phase
- [ ] PRD.md - Product Requirements Document
- [ ] TECH_DESIGN.md - Technical Design
- [ ] EPIC.md - Epic Planning
- [ ] TASKS.md - Task Breakdown

### Execution Phase
- [x] EXECUTION_LOG.md - Event Log
- [ ] TEST_PLAN.md - Test Plan

### Review Phase
- [ ] TEST_REPORT.md - Test Report
- [ ] RELEASE_PLAN.md - Release Plan

---

## Research Materials

研究材料位于 `research/` 目录:

```
research/
├── internal/
│   └── codebase-overview.md     # 现有代码分析
├── mcp/
│   └── 20251216/
│       └── official/
│           ├── pypinyin-docs.md # pypinyin 官方文档
│           └── pinyin-pro-docs.md # pinyin-pro 对比文档
├── research-summary.md          # 调研摘要
├── research.md                  # 决策记录
└── tasks.json                   # 调研任务
```

---

## Workflow

```
/flow-init     ✅ Initialize structure (CURRENT)
  ↓
/flow-prd      → Generate PRD.md
  ↓
/flow-tech     → Generate TECH_DESIGN.md
  ↓
/flow-epic     → Generate EPIC.md and TASKS.md
  ↓
/flow-dev      → Implement tasks (TDD)
  ↓
/flow-qa       → Quality assurance
  ↓
/flow-release  → Create PR and merge
```

---

## Next Steps

1. Run `/flow-prd` to generate Product Requirements Document
2. Review research materials in `research/` directory
3. Provide any additional context for PRD generation
