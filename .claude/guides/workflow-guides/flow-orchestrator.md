---
name: flow-orchestrator-guide
description: Standard Operating Procedure for main agent when executing /flow-new command. Not an executable agent, but workflow guidance.
type: workflow-guide
---

# 需求开发流程标准作业程序

当用户执行 `/flow-new "REQ-ID|TITLE|PLAN_URLS"` 时，主 Agent (Claude 本身) 应按以下标准流程操作：

## 核心原则 (遵循 Claude Code 最佳实践)

### 主 Agent 职责
- **完整上下文管理**: 主 Agent 拥有项目全貌，负责所有代码实施
- **Sub-agent 协调**: 调用研究型 sub-agents 收集专业信息和制定计划
- **最终实施**: 基于所有研究报告和计划，主 Agent 直接执行代码修改

### Sub-agent 定位
- **研究员角色**: 仅提供研究报告、分析文档、实施计划
- **无代码执行**: 不直接修改项目文件，只输出 Markdown 文档
- **专业分工**: 各自在专业领域提供深度分析和建议

### 工作流原则
1. **顺序执行**: 避免并行代码修改，确保一致性
2. **上下文保持**: 主 Agent 保持完整项目上下文
3. **计划先行**: 充分规划后再执行实施
4. **质量保证**: 每个阶段都有相应的质量检查

## Rules Integration
You MUST follow these rules during orchestration:

0. **Constitution** (.claude/constitution/):
   - **Project Constitution**: Follow all constitutional principles without exception
   - **Quality Gates**: Enforce all quality gate requirements
   - **Architecture Constraints**: Adhere to architectural consistency rules
   - **Security Principles**: Apply security-first approach to all operations

1. **Standard Patterns** (.claude/rules/core-patterns.md):
   - Apply Fail Fast principle: validate inputs immediately
   - Use Clear Errors with structured error messages
   - Maintain Minimal Output approach in user communication
   - Follow Trust System principle for sub-agent delegation

2. **DevFlow Patterns** (.claude/rules/devflow-conventions.md):
   - Enforce REQ-ID format validation: REQ-\d+
   - Use standard branch naming: feature/${reqId}-${slug(title)}
   - Apply commit message format: feat(${reqId}): ${taskTitle}
   - Maintain complete document chain: PRD → EPIC → TASKS

3. **Agent Coordination** (.claude/rules/agent-coordination.md):
   - Use file locks for concurrent access prevention
   - Update status in LOG.md after each sub-agent call
   - Implement proper error propagation between agents
   - Follow the defined sub-agent call sequence

4. **Branch Operations** (.claude/guides/technical-guides/git-github-guide.md):
   - Verify clean working directory before branch creation
   - Use conventional commit messages with Co-authored-by
   - Enforce quality gates before any push operations
   - Clean up branches after successful merge

5. **GitHub Operations** (.claude/guides/technical-guides/git-github-guide.md):
   - Check authentication status before PR operations
   - Verify repository is not a template before modifications
   - Use structured PR descriptions with links to documentation
   - Handle permission errors gracefully

6. **Test Execution** (.claude/rules/test-execution.md):
   - Delegate all testing to qa-tester sub-agent
   - Capture verbose test output for audit trail
   - Enforce minimum coverage thresholds
   - Never mock external services in tests

7. **DateTime Handling** (.claude/rules/datetime.md):
   - Use real system time in ISO 8601 UTC format
   - Include timestamps in all YAML frontmatter
   - Handle timezone-aware operations correctly
   - Support cross-platform datetime operations

8. **MCP Integration** (.claude/rules/mcp-integration.md):
   - Use WebFetch tool for all external content retrieval
   - Apply URL validation rules for security
   - Implement retry logic with exponential backoff
   - Cache content appropriately to reduce API calls

Steps:
0) Constitutional Validation
   - Read and internalize .claude/constitution/ requirements
   - Validate all inputs against constitutional principles
   - Ensure current environment meets constitutional standards
   - Apply constitutional constraints to the entire workflow

1) Context intake
   - If planSources include URLs, first use MCP server "docs-web" (or WebFetch) to fetch HTML/MD/PDF and write them under devflow/requirements/${reqId}/research/${reqId}_*.md.
   - Read local .claude/docs/plan/*.md and CLAUDE.md to learn codebase constraints.

2) Git branch
   - git switch -c feature/${reqId}-${slug(title)}

## 标准作业流程

### 阶段1: 需求研究和分析
1. **外部资料研究**
   ```bash
   Task: prd-writer "Analyze ${planSources} and generate comprehensive PRD for ${reqId}: ${title}"
   ```

   - prd-writer 输出: `devflow/requirements/${reqId}/PRD.md`
   - 主 Agent 读取并理解需求

2. **规划和分解**
   ```bash
   Task: planner "Based on PRD, create Epic and detailed task breakdown for ${reqId}"
   ```

   - planner 输出: `EPIC.md` 和 `tasks/TASK_*.md`
   - 主 Agent 审查规划合理性

### 阶段2: 实施准备
3. **一致性初步验证**（计划阶段）
   ```bash
   Task: consistency-checker "Verify document consistency and requirement traceability for ${reqId}"
   ```

   - consistency-checker 输出: `CONSISTENCY_ANALYSIS.md`
   - 包含: 文档一致性检查、需求可追溯性验证、潜在冲突识别
   - **触发条件**: PRD 和 EPIC 生成完成后自动执行

4. **测试计划**（代码实现前）
   ```bash
   Task: qa-tester "Create comprehensive test plan for ${reqId} based on EPIC and tasks"
   ```

   - qa-tester 输出: `TEST_PLAN.md`
   - 包含: 测试策略、用例设计、覆盖率要求
   - **触发词**: 包含 "test plan" 的提示词

5. **安全评估计划**（代码实现前）
   ```bash
   Task: security-reviewer "Create comprehensive security plan for ${reqId} based on requirements"
   ```

   - security-reviewer 输出: `SECURITY_PLAN.md`
   - 包含: 安全检查点、风险评估、缓解措施
   - **触发词**: 包含 "security plan" 的提示词

### 阶段3: 主 Agent 代码实施
5. **代码实施**
   - 主 Agent 基于详细的 TASK 文档直接编写代码
   - 遵循现有项目模式和约定
   - 实施所有 TASK 的功能要求

### 阶段4: 质量验证（代码实现后）
6. **测试执行和报告**
   ```bash
   Task: qa-tester "Analyze implemented code and generate comprehensive test report for ${reqId}"
   ```

   - 主 Agent 基于 TEST_PLAN.md 编写和执行测试
   - qa-tester 分析测试结果，输出: `TEST_REPORT.md`
   - 包含: 覆盖率分析、测试结果、质量评估
   - **触发词**: 包含 "test report" 的提示词

7. **安全检查和报告**
   ```bash
   Task: security-reviewer "Analyze implemented code and generate comprehensive security report for ${reqId}"
   ```

   - security-reviewer 分析实际代码，输出: `SECURITY_REPORT.md`
   - 包含: 漏洞扫描、安全风险、修复建议
   - **触发词**: 包含 "security report" 的提示词

8. **最终一致性验证**（实施完成后）
   ```bash
   Task: consistency-checker "Perform comprehensive consistency verification for completed ${reqId}"
   ```

   - consistency-checker 输出: `FINAL_CONSISTENCY_REPORT.md`
   - 包含: 实现与规格一致性、测试覆盖完整性、文档同步状态
   - **触发条件**: 代码实现和质量报告完成后执行

9. **发布准备**
   ```bash
   Task: release-manager "Create release plan for ${reqId} based on quality reports"
   ```

   - release-manager 输出: `RELEASE_PLAN.md`
   - 包含: 发布流程、回滚计划、部署策略

### 阶段5: 发布执行
10. **质量闸检查**
   - **宪法合规检查**: 验证所有代码和流程符合项目宪法
   - **质量闸验证**: 确保通过所有质量闸要求
   - **架构一致性**: 验证架构约束得到遵循
   - **安全原则**: 确保安全原则得到执行
   - 修复 TEST_REPORT.md 和 SECURITY_REPORT.md 中发现的问题

10. **发布和合并**
    - 主 Agent 基于 RELEASE_PLAN.md 创建 PR
    - 执行最终质量闸检查
    - 处理代码合并流程

### 阶段6: 总结和归档
11. **文档更新**
    - 更新项目文档和说明
    - 记录实施过程和决策
    - 记录需求完成状态

12. **执行日志**
    - 在 LOG.md 中记录完整执行过程
    - 包含时间线、决策点、问题解决

```text
devflow/requirements/${reqId}/
├── PRD.md                 # 产品需求文档
├── EPIC.md               # Epic 规划
├── tasks/                # 任务分解
│   ├── TASK_001.md
│   ├── TASK_002.md
│   └── ...
├── research/             # 外部研究材料
│   ├── ${reqId}_plan_1.md
│   └── ${reqId}_plan_2.md
├── TEST_REPORT.md        # 测试报告
└── LOG.md               # 执行日志
```

## Agent Coordination Protocol

### Status Management
Create and maintain status files for coordination:
```json
// devflow/requirements/${reqId}/orchestration_status.json
{
  "reqId": "${reqId}",
  "currentPhase": "development",
  "startTime": "2024-01-15T10:30:00Z",
  "phaseStatus": {
    "research": "completed",
    "prd": "completed",
    "planning": "completed",
    "development": "in_progress",
    "testing": "pending",
    "security": "pending",
    "release": "pending"
  },
  "activeAgents": [
    {"agent": "qa-tester", "phase": "test_analysis", "status": "running", "startTime": "..."},
    {"agent": "security-reviewer", "phase": "security_analysis", "status": "running", "startTime": "..."}
  ],
  "completedTasks": ["TASK_003"],
  "failedTasks": [],
  "nextActions": ["wait_for_TASK_001", "wait_for_TASK_002"]
}
```

### Sequential Execution Pattern
When coordinating research agents:
1. **Pre-Launch**: Create orchestration_status.json
2. **Sequential Launch**: Start agents one by one based on dependencies
3. **Monitor**: Check agent completion via file system
4. **Quality Check**: Validate each agent's output before proceeding
5. **Main Agent Execution**: Execute code implementation based on all plans

### Error Handling
- If any research agent fails, pause and report
- Allow manual intervention or retry
- Update status file with failure details
- Provide recovery options

### Communication Files
- `orchestration_status.json` - Current execution state
- `LOG.md` - Detailed audit trail
- `dev_status.json` - Development phase specifics
- Individual task completion markers in tasks/ directory

Be conservative with privileges. Ask when performing push/merge. Persist everything in Markdown.

## Key Implementation Notes

**REMEMBER**: This is a workflow guide for the main agent. The main agent should call research-type sub-agents using Task tool for analysis and planning, then execute all actual code implementation, testing, and git operations directly based on the plans received from sub-agents.
