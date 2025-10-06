---
name: flow-init
description: Initialize requirement structure. Usage: /flow-init "REQ-123|User Authentication" or /flow-init --interactive
---

# Flow-Init - 需求初始化命令

## 命令格式
```text
/flow-init "REQ_ID|TITLE"
/flow-init --interactive
```

### 参数说明
- **REQ_ID**: 需求编号，格式 REQ-XXX 或 BUG-XXX (例如: REQ-123, BUG-456)
- **TITLE**: 需求标题 (例如: User Authentication)
- **--interactive, -i**: 交互模式，逐步提示输入信息

### 示例
```text
/flow-init "REQ-123|User Authentication"
/flow-init "BUG-456|Fix login timeout issue"
/flow-init --interactive
```

## 执行流程

### 阶段 1: 参数解析和验证 (Entry Gate)

**Execution Flow**:
```
1. Parse command arguments
   → If --interactive: Enter interactive mode
   → If argument provided: Parse "REQ_ID|TITLE"
   → If missing: ERROR "Usage: /flow-init \"REQ-ID|Title\" or --interactive"

2. Validate REQ_ID format
   → Must match: ^(REQ|BUG)-[0-9]+$
   → If invalid: ERROR "Invalid format. Expected: REQ-123 or BUG-456"

3. Check if REQ_ID already exists
   → Run: ls devflow/requirements/${REQ_ID} 2>/dev/null
   → Run: ls devflow/bugs/${REQ_ID} 2>/dev/null
   → If exists: ERROR "Requirement ${REQ_ID} already exists. Use /flow-restart to continue."

4. Verify git status (if git repo)
   → Run: git status --porcelain
   → If not clean: WARN "Working directory not clean. Continue? (y/n)"
   → User must confirm to proceed

*GATE CHECK: All validations passed*
```

### 阶段 2: 目录结构初始化

**Execution Flow**:
```
1. Run script to create directory structure
   → Execute: .claude/scripts/create-requirement.sh "${REQ_ID}" --title "${TITLE}" --json
   → Capture JSON output for paths

2. Verify directory creation
   → Check: REQ_DIR exists
   → Check: research/ directory exists
   → Check: EXECUTION_LOG.md created
   → Check: orchestration_status.json created
   → If any missing: ERROR "Directory creation failed"

3. Log initialization event
   → Append to EXECUTION_LOG.md:
     "### $(date -Iseconds)
      Requirement initialized via /flow-init
      Title: ${TITLE}
      Status: Ready for PRD generation"
```

### 阶段 3: Git 分支创建 (if git repo)

**Execution Flow**:
```
1. Generate branch name
   → For REQ-XXX: feature/${REQ_ID}-${slug(TITLE)}
   → For BUG-XXX: bugfix/${REQ_ID}-${slug(TITLE)}
   → slug(): lowercase, replace spaces/special chars with hyphens

2. Check if branch already exists
   → Run: git rev-parse --verify ${BRANCH_NAME}
   → If exists: ERROR "Branch ${BRANCH_NAME} already exists"

3. Create and checkout new branch
   → Run: git checkout -b "${BRANCH_NAME}"
   → If failed: ERROR "Failed to create branch. Check git permissions."

4. Set environment variable
   → Export: DEVFLOW_REQ_ID="${REQ_ID}"
   → This allows scripts to find requirement without branch parsing

5. Log branch creation
   → Append to EXECUTION_LOG.md:
     "Git branch created: ${BRANCH_NAME}
      Environment variable set: DEVFLOW_REQ_ID=${REQ_ID}"
```

### 阶段 4: README 生成

**Execution Flow**:
```
1. Generate README.md with workflow checklist
   → Content includes:
     - Requirement ID and Title
     - Document checklist (PRD, EPIC, TASKS, etc.)
     - Workflow phases
     - Research materials location
     - Next steps guidance

2. Save to REQ_DIR/README.md

3. Log README creation
```

### 阶段 5: 完成确认 (Exit Gate)

**Exit Gate Validation**:
```
1. Verify all required files created:
   - [ ] REQ_DIR/ directory exists
   - [ ] REQ_DIR/research/ directory exists
   - [ ] REQ_DIR/EXECUTION_LOG.md exists
   - [ ] REQ_DIR/orchestration_status.json exists
   - [ ] REQ_DIR/README.md exists

2. Verify git branch (if applicable):
   - [ ] Branch created successfully
   - [ ] Currently on feature/bugfix branch
   - [ ] DEVFLOW_REQ_ID environment variable set

3. Verify status tracking:
   - [ ] orchestration_status.json has "status": "initialized"
   - [ ] EXECUTION_LOG.md has initialization entry

*GATE CHECK: All verifications passed*
```

**Success Output**:
```
✅ Requirement structure initialized successfully!

Requirement ID:    ${REQ_ID}
Type:              ${REQ_TYPE} (requirement/bug)
Directory:         ${REQ_DIR}
Title:             ${TITLE}
Git Branch:        ${BRANCH_NAME}

Next Steps:
  1. Add research materials to research/ directory (optional)
  2. Run /flow-prd to generate Product Requirements Document
  3. Or provide requirement details directly to prd-writer agent

Files created:
  - ${REQ_DIR}/README.md
  - ${REQ_DIR}/EXECUTION_LOG.md
  - ${REQ_DIR}/orchestration_status.json
  - ${REQ_DIR}/research/ (empty, ready for materials)
```

## 输出产物

### 文档结构
```text
devflow/requirements/${REQ_ID}/     # For requirements
├── README.md                            # Workflow guide and checklist
├── research/                            # Empty, ready for research materials
├── EXECUTION_LOG.md                     # Event log with initialization entry
└── orchestration_status.json            # Status: "initialized", phase: "planning"

devflow/bugs/${BUG_ID}/             # For bug fixes
├── README.md
├── EXECUTION_LOG.md
└── status.json                          # BUG-specific status tracking
```

### Git 分支
- **Requirements**: `feature/${REQ_ID}-${slug(title)}`
- **BUG Fixes**: `bugfix/${BUG_ID}-${slug(title)}`

### 状态追踪
**orchestration_status.json** (for requirements):
```json
{
  "reqId": "REQ-123",
  "title": "User Authentication",
  "status": "initialized",
  "phase": "planning",
  "createdAt": "2025-09-30T12:34:56Z",
  "updatedAt": "2025-09-30T12:34:56Z"
}
```

**status.json** (for bugs):
```json
{
  "bugId": "BUG-456",
  "title": "Fix login timeout",
  "status": "initialized",
  "phase": "analysis",
  "severity": "unknown",
  "createdAt": "2025-09-30T12:34:56Z",
  "updatedAt": "2025-09-30T12:34:56Z"
}
```

## 交互模式

### Interactive Mode Flow
```text
=== Initialize New Requirement ===

Requirement ID (REQ-XXX or BUG-XXX): REQ-123
Requirement Title: User Authentication
Brief Description (optional): Implement OAuth2 authentication flow
Create git branch? (y/n): y

✅ Validating requirement ID... OK
✅ Creating directory structure... OK
✅ Generating README.md... OK
✅ Creating git branch: feature/REQ-123-user-authentication... OK
✅ Logging initialization... OK

Requirement initialized successfully!
Run /flow-prd to continue.
```

## Constitution Check

This command enforces Constitution principles:

### Quality First
- [ ] Complete directory structure created (NO PARTIAL IMPLEMENTATION)
- [ ] All required files initialized with proper content
- [ ] README.md provides clear next steps

### Security First
- [ ] No secrets in any generated files
- [ ] Status files use secure defaults
- [ ] File permissions correctly set

### Architectural Consistency
- [ ] Follows standard directory structure
- [ ] Uses unified script infrastructure (create-requirement.sh)
- [ ] Consistent naming conventions

## Error Handling

### Common Errors

**1. Invalid REQ_ID format**
```
ERROR: Invalid requirement ID format: REQ123
Expected format: REQ-XXX or BUG-XXX (e.g., REQ-123 or BUG-456)
```

**2. REQ_ID already exists**
```
ERROR: Requirement directory already exists: devflow/requirements/REQ-123
Use /flow-restart "REQ-123" to continue an existing requirement.
Or choose a different requirement ID.
```

**3. Git branch conflict**
```
ERROR: Git branch already exists: feature/REQ-123-user-auth
Options:
  1. Use a different requirement ID
  2. Delete the existing branch: git branch -D feature/REQ-123-user-auth
  3. Use --skip-git flag: /flow-init "REQ-123|Title" --skip-git
```

**4. Permission denied**
```
ERROR: Failed to create directory: devflow/requirements/REQ-123
Reason: Permission denied
Solution: Check file system permissions for .claude/docs/ directory
```

### Recovery

If initialization fails partway:
1. Check EXECUTION_LOG.md for last successful step
2. Manually clean up partial structure:
   ```bash
   rm -rf devflow/requirements/REQ-123  # If needed
   git branch -D feature/REQ-123-title       # If branch created
   ```
3. Re-run /flow-init

## Configuration Options

### Command-line Flags
```text
/flow-init "REQ-123|Title" [OPTIONS]

OPTIONS:
  --skip-git          Skip git branch creation
  --interactive, -i   Interactive mode
  --description DESC  Add description to README
```

### Environment Variables
- `DEVFLOW_REQ_ID`: Set by this command for subsequent script calls
- `DEVFLOW_SKIP_GIT`: Set to "true" to skip git operations

## Integration with Other Commands

### Workflow Integration
```text
/flow-init     → Initialize structure
  ↓
/flow-prd      → Generate PRD.md
  ↓
/flow-epic     → Generate EPIC.md and TASKS.md
  ↓
/flow-dev      → Implement tasks
  ↓
/flow-qa       → Quality assurance
  ↓
/flow-release  → Create PR and merge
```

### Backward Compatibility
`/flow-new` still works as a one-shot command, but internally it:
1. Calls `/flow-init` for initialization
2. Calls `/flow-prd` for PRD generation
3. Calls `/flow-epic` for planning
4. Continues with development flow

## Script Integration

This command uses the unified script infrastructure:

### Primary Script
```bash
.claude/scripts/create-requirement.sh "${REQ_ID}" --title "${TITLE}" --json
```

### Script Capabilities
- Creates complete directory structure
- Initializes all required files
- Supports both REQ and BUG types
- Handles git branch creation
- Supports interactive mode
- Outputs JSON for automation

### Example Script Call
```bash
# From command execution
RESULT=$(.claude/scripts/create-requirement.sh "REQ-123" \
  --title "User Authentication" \
  --description "OAuth2 flow" \
  --json)

# Parse JSON output
REQ_DIR=$(echo "$RESULT" | jq -r '.req_dir')
GIT_BRANCH=$(echo "$RESULT" | jq -r '.git_branch')
```

## Best Practices

### Before Running
1. Ensure you're on the main/develop branch
2. Check git status is clean
3. Verify requirement ID is unique
4. Have requirement details ready

### After Running
1. Verify all files created successfully
2. Check git branch is active
3. Add research materials if available
4. Proceed to /flow-prd for next step

### Troubleshooting
1. Use `--interactive` mode if unsure about parameters
2. Check EXECUTION_LOG.md for detailed steps
3. Verify script permissions: `ls -la .claude/scripts/create-requirement.sh`
4. Test script directly: `.claude/scripts/create-requirement.sh --help`

---

**Note**: This command is the first phase of the development workflow. It only creates the structure and prepares for requirement analysis. No actual requirement content is generated at this stage.