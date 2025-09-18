---
name: flow-orchestrator-guide
description: Standard Operating Procedure for main agent when executing /flow:new command. Not an executable agent, but workflow guidance.
type: workflow-guide
---

# 需求开发流程标准作业程序

当用户执行 `/flow:new "REQ-ID|TITLE|PLAN_URLS"` 时，主 Agent (Claude 本身) 应按以下标准流程操作：

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

1. **Standard Patterns** (.claude/rules/standard-patterns.md):
   - Apply Fail Fast principle: validate inputs immediately
   - Use Clear Errors with structured error messages
   - Maintain Minimal Output approach in user communication
   - Follow Trust System principle for sub-agent delegation

2. **DevFlow Patterns** (.claude/rules/devflow-patterns.md):
   - Enforce REQ-ID format validation: REQ-\d+
   - Use standard branch naming: feature/${reqId}-${slug(title)}
   - Apply commit message format: feat(${reqId}): ${taskTitle}
   - Maintain complete document chain: PRD → EPIC → TASKS

3. **Agent Coordination** (.claude/rules/agent-coordination.md):
   - Use file locks for concurrent access prevention
   - Update status in LOG.md after each sub-agent call
   - Implement proper error propagation between agents
   - Follow the defined sub-agent call sequence

4. **Branch Operations** (.claude/rules/branch-operations.md):
   - Verify clean working directory before branch creation
   - Use conventional commit messages with Co-authored-by
   - Enforce quality gates before any push operations
   - Clean up branches after successful merge

5. **GitHub Operations** (.claude/rules/github-operations.md):
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
1) Context intake
   - If planSources include URLs, first use MCP server "docs-web" (or WebFetch) to fetch HTML/MD/PDF and write them under .claude/docs/requirements/${reqId}/research/${reqId}_*.md.
   - Read local .claude/docs/plan/*.md and CLAUDE.md to learn codebase constraints.

2) Git branch
   - git switch -c feature/${reqId}-${slug(title)}

## 标准作业流程

### 阶段1: 需求研究和分析
1. **外部资料研究**
   ```bash
   Task: prd-writer "Analyze ${planSources} and generate comprehensive PRD for ${reqId}: ${title}"
   ```

   - prd-writer 输出: `.claude/docs/requirements/${reqId}/PRD.md`
   - 主 Agent 读取并理解需求

2. **规划和分解**
   ```bash
   Task: planner "Based on PRD, create Epic and detailed task breakdown for ${reqId}"
   ```

   - planner 输出: `EPIC.md` 和 `tasks/TASK_*.md`
   - 主 Agent 审查规划合理性

### 阶段2: 实施计划制定
3. **技术实施计划**
   ```bash
   Task: dev-implementer "Create detailed implementation plan for ${reqId} based on all tasks"
   ```

   - dev-implementer 输出: `IMPLEMENTATION_PLAN.md`
   - 包含: 文件清单、代码结构、实施步骤、技术细节

4. **测试计划**
   ```bash
   Task: qa-tester "Create comprehensive test plan for ${reqId}"
   ```

   - qa-tester 输出: `TEST_PLAN.md`
   - 包含: 测试策略、用例设计、覆盖率要求

5. **安全评估计划**
   ```bash
   Task: security-reviewer "Create security assessment plan for ${reqId}"
   ```

   - security-reviewer 输出: `SECURITY_PLAN.md`
   - 包含: 安全检查点、风险评估、缓解措施

6. **发布计划**
   ```bash
   Task: release-manager "Create release plan for ${reqId}"
   ```

   - release-manager 输出: `RELEASE_PLAN.md`
   - 包含: 发布流程、回滚计划、部署策略

### 阶段3: 主 Agent 实施执行
7. **代码实施**
   - 主 Agent 基于 IMPLEMENTATION_PLAN.md 直接编写代码
   - 遵循现有项目模式和约定
   - 实施所有 TASK 的功能要求

8. **测试执行**
   - 主 Agent 基于 TEST_PLAN.md 编写和执行测试
   - 确保测试覆盖率达到要求
   - 验证所有功能正常工作

9. **安全检查**
   - 主 Agent 基于 SECURITY_PLAN.md 进行安全检查
   - 修复发现的安全问题
   - 确保代码安全标准

10. **发布和合并**
    - 主 Agent 基于 RELEASE_PLAN.md 创建 PR
    - 执行质量闸检查
    - 处理代码合并流程

### 阶段4: 总结和归档
11. **文档更新**
    - 更新项目文档和说明
    - 记录实施过程和决策
    - 更新 BACKLOG.md/SPRINT.md 状态

12. **执行日志**
    - 在 LOG.md 中记录完整执行过程
    - 包含时间线、决策点、问题解决

```text
.claude/docs/requirements/${reqId}/
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
// .claude/docs/requirements/${reqId}/orchestration_status.json
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
    {"agent": "dev-implementer", "taskId": "TASK_001", "status": "running", "startTime": "..."},
    {"agent": "dev-implementer", "taskId": "TASK_002", "status": "running", "startTime": "..."},
    {"agent": "dev-implementer", "taskId": "TASK_003", "status": "completed", "endTime": "..."}
  ],
  "completedTasks": ["TASK_003"],
  "failedTasks": [],
  "nextActions": ["wait_for_TASK_001", "wait_for_TASK_002"]
}
```

### Parallel Execution Pattern
When launching multiple dev-implementer agents:
1. **Pre-Launch**: Create orchestration_status.json
2. **Launch**: Start all agents with Task tool in single message
3. **Monitor**: Periodically check agent completion via file system
4. **Synchronize**: Wait for all agents before proceeding to next phase
5. **Verify**: Ensure all outputs meet quality standards

### Error Handling
- If any dev-implementer fails, pause and report
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

**REMEMBER**: You are an orchestrator, not an implementer. Every step should use Task tool to delegate to appropriate agents. Never write code, generate documents, or execute git commands yourself - always delegate to the specialist agents.
