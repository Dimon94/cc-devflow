---
name: flow-prd
description: Generate Product Requirements Document. Usage: /flow-prd "REQ-123" or /flow-prd
---

# Flow-PRD - PRD 生成命令

## 命令格式
```text
/flow-prd "REQ_ID"
/flow-prd             # Auto-detect from current branch
```

### 参数说明
- **REQ_ID**: 需求编号 (可选，默认从当前 Git 分支或环境变量获取)

### 示例
```text
/flow-prd "REQ-123"
/flow-prd              # On feature/REQ-123-* branch
```

## 执行流程

### 阶段 1: 前置条件检查 (Entry Gate)

**Execution Flow**:
```
1. Determine requirement ID
   → If REQ_ID provided: Use provided ID
   → Else: Run check-prerequisites.sh --json --paths-only
   → Parse REQ_ID from JSON output
   → If not found: ERROR "No requirement ID found. Provide REQ_ID or run on feature branch."

2. Validate requirement structure exists
   → Run: check-prerequisites.sh --json
   → Verify: REQ_DIR exists
   → Verify: EXECUTION_LOG.md exists
   → Verify: orchestration_status.json exists
   → If missing: ERROR "Requirement not initialized. Run /flow-init first."

3. Check if PRD already exists
   → Check: PRD_FILE exists
   → If exists: WARN "PRD.md already exists. Overwrite? (y/n)"
   → User must confirm to proceed

4. Check orchestration status
   → Read: orchestration_status.json
   → Verify: status is "initialized" or "prd_generation_failed"
   → If wrong phase: ERROR "Requirement not in correct phase for PRD generation"

*GATE CHECK: All prerequisite validations passed*
```

### 阶段 2: 研究材料收集 (Optional)

**Execution Flow**:
```
1. Check for research materials
   → List: REQ_DIR/research/*.md
   → Count available research files

2. If no research materials:
   → PROMPT: "No research materials found. Options:
     1. Continue without research (use requirements from user)
     2. Add research materials first (abort)
     3. Provide URLs to fetch (continue)"
   → If option 3: Collect URLs and fetch using WebFetch

3. If URLs provided:
   → For each URL:
     - Run: WebFetch with prompt "Extract requirement details"
     - Save to: REQ_DIR/research/${REQ_ID}_${index}.md
     - Log: "Research material ${index} fetched from ${URL}"

4. Load all research materials
   → Read all files in research/ directory
   → Combine into research context
   → Log: "Loaded ${count} research materials"
```

### 阶段 3: PRD 生成准备

**Execution Flow**:
```
1. Load PRD template
   → Read: .claude/docs/templates/PRD_TEMPLATE.md
   → Verify template has Execution Flow section
   → If missing: ERROR "PRD template is not self-executable"

2. Prepare agent prompt
   → Include: REQ_ID, Title (from status.json)
   → Include: Research materials context
   → Include: PRD template structure
   → Include: Instruction to follow Execution Flow

3. Update orchestration status
   → Set: status = "prd_generation_in_progress"
   → Set: phase = "planning"
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

4. Log PRD generation start
   → Append to EXECUTION_LOG.md:
     "### $(date -Iseconds)
      PRD generation started
      Research materials: ${count} files
      Agent: prd-writer"
```

### 阶段 4: 调用 prd-writer Agent

**Agent Invocation**:
```
Task: prd-writer agent
Prompt:
  You are generating a Product Requirements Document for ${REQ_ID}: ${TITLE}.

  Context:
  - Requirement ID: ${REQ_ID}
  - Requirement Title: ${TITLE}
  - Research materials available: ${research_count} files

  Research Materials:
  ${research_content}

  Your task:
  1. Run .claude/scripts/check-prerequisites.sh --json --paths-only
     to get requirement paths
  2. Read PRD_TEMPLATE.md from .claude/docs/templates/
  3. Follow the Execution Flow in the template step-by-step:
       - Load context and research materials
       - Analyze requirements using INVEST criteria
       - Generate user stories with Given-When-Then criteria
       - Define non-functional requirements
       - Identify technical constraints
       - Define success metrics
       - Constitution Check (NO PARTIAL IMPLEMENTATION, NO HARDCODED SECRETS)
       - Validate completeness
  4. Write complete PRD.md to ${PRD_FILE}
       - Fill all sections, no {{PLACEHOLDER}} left
       - Include Constitution Check section
       - Include Validation Checklist
  5. Log event: log_event "${REQ_ID}" "PRD generation completed"

  Output: Complete PRD.md file at ${PRD_FILE}

Subagent: prd-writer
```

### 阶段 5: PRD 验证 (Exit Gate)

**Exit Gate Validation**:
```
1. Verify PRD.md was created
   → Check: PRD_FILE exists
   → If missing: ERROR "PRD generation failed - file not created"

2. Validate PRD completeness
   → Read: PRD_FILE
   → Check: No {{PLACEHOLDER}} patterns remain
   → Check: Constitution Check section exists and filled
   → Check: User stories section exists with acceptance criteria
   → Check: Non-functional requirements section exists
   → If incomplete: ERROR "PRD incomplete - missing required sections"

3. Run Constitution validation
   → Execute: validate-constitution.sh --type prd --severity warning
   → Parse output for violations
   → If errors: WARN "Constitution violations found. Review and fix."
   → Display violations to user

4. Verify file size and content
   → Get: wc -l PRD_FILE
   → Check: At least 100 lines (sanity check)
   → Check: Contains "## 用户故事与验收标准" section
   → If too small: ERROR "PRD appears incomplete or corrupted"

5. Update orchestration status
   → Set: status = "prd_complete"
   → Set: phase = "epic_planning"
   → Set: completedSteps = ["init", "prd"]
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

*GATE CHECK: PRD meets all quality criteria*
```

**Success Output**:
```
✅ PRD generated successfully!

Requirement ID:    ${REQ_ID}
PRD File:          ${PRD_FILE}
Lines:             ${line_count}
User Stories:      ${story_count}
Constitution:      ✅ Passed / ⚠️ Warnings

Key Sections:
  ✅ Background & Goals
  ✅ User Stories with Acceptance Criteria (${story_count} stories)
  ✅ Non-Functional Requirements
  ✅ Technical Constraints
  ✅ Success Metrics
  ✅ Constitution Check
  ✅ Dependencies & Risks

Next Steps:
  1. Review PRD.md to ensure it matches your requirements
  2. Run /flow-epic to generate Epic and task breakdown
  3. Or edit PRD.md manually if adjustments needed

Files created/updated:
  - ${PRD_FILE} (new)
  - orchestration_status.json (updated: status=prd_complete)
  - EXECUTION_LOG.md (updated: logged PRD generation)
```

## 输出产物

### PRD 文档结构
```markdown
# PRD: REQ-123 - User Authentication

**Status**: Draft
**Created**: 2025-09-30T12:34:56Z
**Owner**: Development Team
**Type**: Requirement

## 背景与目标

### 业务背景
[Business context from research materials]

### 问题陈述
[Problem statement]

### 目标
- **主要目标**: [Primary goal]
- **成功指标**: [High-level metrics]
- **影响范围**: [Scope]

## 用户故事与验收标准

### Story 1: User Registration
**As a** new user
**I want** to register with email and password
**So that** I can access the application

**Acceptance Criteria**:
```gherkin
AC1: Given a valid email and password
     When I submit the registration form
     Then my account is created
     And I receive a confirmation email

AC2: Given an invalid email format
     When I submit the registration form
     Then I see an error message "Invalid email format"
     And my account is not created
```

**Priority**: HIGH
**Complexity**: MEDIUM

[Additional stories...]

## 非功能性要求

### 性能要求
| 指标 | 目标值 | 关键性 |
|------|--------|--------|
| 响应时间 (p95) | < 200ms | HIGH |
| 并发用户数 | 1000+ | MEDIUM |

### 安全要求
- [ ] **身份验证**: OAuth2 with JWT
- [ ] **授权机制**: RBAC
- [ ] **数据加密**: TLS 1.3, AES-256
- [ ] **密钥管理**: NO HARDCODED SECRETS - use environment variables

[Additional NFRs...]

## Constitution Check (宪法符合性检查)

*GATE: 必须在 Epic 规划前通过*

### 质量原则
- [x] **NO PARTIAL IMPLEMENTATION**: 需求定义完整且明确
- [x] 用户故事遵循 INVEST 准则
- [x] 验收标准具体且可测试

### 安全原则
- [x] **NO HARDCODED SECRETS**: 定义了环境变量和密钥管理策略
- [x] 身份验证/授权机制清晰
- [x] 输入验证需求明确

[Additional checks...]

## Validation Checklist (验证清单)

- [x] 所有必需章节已填写
- [x] 没有 {{PLACEHOLDER}} 未替换
- [x] 所有依赖已识别
- [x] 所有风险已评估
- [x] Constitution 检查通过

**准备好进行 Epic 规划**: YES
```

### 状态更新
**orchestration_status.json**:
```json
{
  "reqId": "REQ-123",
  "title": "User Authentication",
  "status": "prd_complete",
  "phase": "epic_planning",
  "completedSteps": ["init", "prd"],
  "createdAt": "2025-09-30T12:00:00Z",
  "updatedAt": "2025-09-30T12:45:00Z"
}
```

## Constitution Check

This command enforces Constitution principles during PRD generation:

### Quality First
- [ ] PRD is complete, no partial requirements (NO PARTIAL IMPLEMENTATION)
- [ ] All user stories have concrete acceptance criteria
- [ ] No ambiguous or vague requirements

### Security First
- [ ] Security requirements explicitly defined
- [ ] Secret management strategy documented (NO HARDCODED SECRETS)
- [ ] Input validation requirements specified

### Architectural Consistency
- [ ] Requirements align with existing system architecture
- [ ] No contradictions with existing features
- [ ] Integration points clearly defined

## Error Handling

### Common Errors

**1. Requirement not initialized**
```
ERROR: Requirement not initialized: REQ-123
Run /flow-init "REQ-123|Title" first to create the requirement structure.
```

**2. Wrong workflow phase**
```
ERROR: Requirement REQ-123 not in correct phase for PRD generation
Current phase: epic_planning (expected: planning)
PRD already exists: devflow/requirements/REQ-123/PRD.md
```

**3. Research materials fetch failed**
```
WARNING: Failed to fetch research material from ${URL}
Reason: Network timeout / Invalid URL / Permission denied
Options:
  1. Skip this material and continue
  2. Retry fetch
  3. Add material manually to research/ directory
```

**4. Constitution violations**
```
⚠️  Constitution violations found in generated PRD:

[error] NO_PARTIAL_IMPLEMENTATION: Unfilled placeholders detected
  Location: PRD.md:145
  Issue: {{TECHNICAL_STACK}} not replaced

[warning] Missing security requirements
  Location: PRD.md:Security section
  Issue: No secret management strategy defined

Review and fix these issues before proceeding to /flow-epic.
```

### Recovery

If PRD generation fails:
1. Check EXECUTION_LOG.md for error details
2. Review prd-writer agent output
3. Fix any validation errors
4. Re-run /flow-prd to regenerate

## Integration with Other Commands

### Workflow Integration
```text
/flow-init     → Initialize structure ✅
  ↓
/flow-prd      → Generate PRD.md ← YOU ARE HERE
  ↓
/flow-ui       → Generate UI_PROTOTYPE.html ⚡️ (conditional: if UI requirements detected)
  ↓
/flow-tech     → Generate TECH_DESIGN.md (technical solution + anti-tech-creep)
  ↓
/flow-epic     → Generate EPIC.md and TASKS.md (uses TECH_DESIGN.md)
  ↓
/flow-dev      → Implement tasks (TDD: Tests → Implementation)
  ↓
/flow-qa       → Quality assurance (tests + security)
  ↓
/flow-release  → Create PR and merge (update CLAUDE.md if needed)
```

### Dependency on /flow-init
This command requires /flow-init to have been run first:
- Requirement directory must exist
- orchestration_status.json must exist with status="initialized"
- EXECUTION_LOG.md must exist

### Enables /flow-epic
After successful PRD generation:
- PRD.md becomes input for Epic planning
- orchestration_status.json updated to allow /flow-epic
- Constitution Check ensures quality for next phase

## Script Integration

This command uses the unified script infrastructure:

### Scripts Called
```bash
# 1. Get requirement paths
.claude/scripts/check-prerequisites.sh --json --paths-only

# 2. Validate Constitution
.claude/scripts/validate-constitution.sh --type prd --severity warning

# 3. Log events (via common.sh)
source .claude/scripts/common.sh
log_event "$REQ_ID" "PRD generation completed"
```

### Agent Called
```text
prd-writer agent (research-type)
- Reads PRD_TEMPLATE.md
- Follows Execution Flow
- Writes complete PRD.md
- Logs events
```

## Best Practices

### Before Running
1. Ensure /flow-init completed successfully
2. Add research materials to research/ if available
3. Have requirement details ready
4. Review PRD_TEMPLATE.md to understand output format

### During Execution
1. Provide detailed research materials for better PRD quality
2. Review any Constitution warnings carefully
3. Confirm overwrites if PRD exists

### After Running
1. **Review PRD.md thoroughly**
2. Verify all user stories match expectations
3. Check Constitution Check section for violations
4. Validate acceptance criteria are testable
5. Edit PRD.md manually if needed before proceeding

### Troubleshooting
1. Check prd-writer agent output for errors
2. Review EXECUTION_LOG.md for detailed steps
3. Use validate-constitution.sh to check specific issues
4. Re-run /flow-prd after fixing template or research materials

---

**Note**: This command invokes the prd-writer research agent which analyzes requirements and generates structured documentation. The agent does not execute code, only creates the PRD.md file following the self-executable template pattern.
