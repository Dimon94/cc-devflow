# Constitution Check Template Component

> **Purpose**: Shared Constitution compliance check section for PRD/EPIC/TECH_DESIGN templates
> **Version**: 1.0.0
> **Reference**: `.claude/rules/project-constitution.md` (v2.1.0)

---

## Usage

Include this component in templates via reference:
```markdown
{{INCLUDE: _shared/CONSTITUTION_CHECK.md}}
```

Or copy relevant sections based on document type.

---

## Constitution Check (宪法符合性检查)

*GATE: 必须在下一阶段前通过*

### Article I: Quality First (质量至上)

- [ ] **I.1 - NO PARTIAL IMPLEMENTATION**: 内容完整且明确？无占位符和模糊表述？
- [ ] **I.2 - Testing Mandate**: 测试策略明确？覆盖率目标 ≥80%？
- [ ] **I.3 - No Simplification**: 避免"暂时简化，后续完善"的描述？
- [ ] **I.4 - Quality Gates**: 验收标准具体、可测试、可衡量？

### Article II: Architectural Consistency (架构一致性)

- [ ] **II.1 - NO CODE DUPLICATION**: 识别可复用的现有系统和组件？
- [ ] **II.2 - Consistent Naming**: 命名约定遵循现有代码库模式？
- [ ] **II.3 - Anti-Over-Engineering**: 解决方案适合问题规模？无过度设计？
- [ ] **II.4 - Single Responsibility**: 清晰的边界和职责划分？

### Article III: Security First (安全优先)

- [ ] **III.1 - NO HARDCODED SECRETS**: 定义了密钥管理策略（环境变量/密钥服务）？
- [ ] **III.2 - Input Validation**: 输入验证需求明确？
- [ ] **III.3 - Least Privilege**: 身份验证/授权机制清晰？
- [ ] **III.4 - Secure by Default**: 数据加密策略定义？

### Article IV: Performance Accountability (性能责任)

- [ ] **IV.1 - NO RESOURCE LEAKS**: 考虑了资源管理（连接、文件句柄等）？
- [ ] **IV.2 - Algorithm Efficiency**: 性能目标现实且可测量？
- [ ] **IV.3 - Lazy Loading**: 按需加载策略规划？
- [ ] **IV.4 - Caching Strategy**: 规划了监控和缓存策略？

### Article V: Maintainability (可维护性)

- [ ] **V.1 - NO DEAD CODE**: 避免不必要的功能？仅实现明确需求？
- [ ] **V.2 - Separation of Concerns**: 代码易于理解和修改？
- [ ] **V.3 - Documentation**: 文档完整（架构、API、配置）？
- [ ] **V.4 - File Size Limits**: 遵循单一职责原则？单文件 ≤500行？

### Article VI: Test-First Development (测试优先开发)

- [ ] **VI.1 - TDD Mandate**: TDD 流程明确定义？
- [ ] **VI.2 - Test Independence**: 测试隔离策略定义？
- [ ] **VI.3 - Meaningful Tests**: 测试质量标准明确？

### Article X: Requirement Boundary (需求边界)

- [ ] **X.1 - Forced Clarification**: 所有不明确之处标记 `[NEEDS CLARIFICATION]`？
- [ ] **X.2 - No Speculative Features**: 无"可能需要"、"未来会"、"建议添加"的功能？
- [ ] **X.3 - User Story Independence**: 每个故事有明确优先级和独立测试标准？

---

## Phase -1 Gates (前置闸门)

*仅适用于 EPIC/TECH_DESIGN*

### Simplicity Gate (Article VII)

- [ ] **项目数量**: 使用 ≤3 个项目/模块？
- [ ] **NO FUTURE-PROOFING**: 没有为"未来可能需要"的功能做准备？
- [ ] **Minimal Dependencies**: 只使用必需的依赖库？

### Anti-Abstraction Gate (Article VIII)

- [ ] **Framework Trust**: 直接使用框架功能，没有封装？
- [ ] **Single Model Representation**: 实体只有一种数据表示？
- [ ] **No Unnecessary Interfaces**: 没有单一实现的接口？

### Integration-First Gate (Article IX)

- [ ] **Contracts Defined First**: API contracts 在实现前定义？
- [ ] **Contract Tests Planned**: Contract tests 在 Phase 2 计划？
- [ ] **Real Environment**: 使用真实数据库而非 mocks？

---

## Constitutional Violations (宪法违规记录)

*仅在有需要说明的宪法违规时填写*

**重要**: 任何违规都必须有充分理由，否则文档不通过

| 违规的 Article | 具体违规内容 | 为何需要 | 缓解措施 |
|----------------|-------------|----------|----------|
| {{ARTICLE_NUM}} | {{VIOLATION_DETAIL}} | {{JUSTIFICATION}} | {{MITIGATION}} |

---

## Gate Status Summary

| Gate | Status | Notes |
|------|--------|-------|
| Article I-V Core | {{PASS/FAIL}} | {{NOTES}} |
| Article VI TDD | {{PASS/FAIL}} | {{NOTES}} |
| Article VII Simplicity | {{PASS/FAIL}} | {{NOTES}} |
| Article VIII Anti-Abstraction | {{PASS/FAIL}} | {{NOTES}} |
| Article IX Integration-First | {{PASS/FAIL}} | {{NOTES}} |
| Article X Boundary | {{PASS/FAIL}} | {{NOTES}} |

**Overall Status**: {{PASS/FAIL}}
**Ready for Next Phase**: {{YES/NO}}

---

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
