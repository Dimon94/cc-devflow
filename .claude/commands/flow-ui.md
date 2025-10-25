---
name: flow-ui
description: Generate interactive HTML prototype from PRD. Usage: /flow-ui "REQ-123" or /flow-ui
---

# Flow-UI - UI原型生成命令

## 命令格式
```text
/flow-ui "REQ_ID"
/flow-ui             # Auto-detect from current branch
```

### 参数说明
- **REQ_ID**: 需求编号 (可选,默认从当前Git分支或环境变量获取)

### 示例
```text
/flow-ui "REQ-123"
/flow-ui              # On feature/REQ-123-* branch
```

## 触发条件

### 自动触发逻辑
`/flow-ui` 在以下情况自动触发:

1. **PRD包含UI关键词**:
   - "用户界面", "前端", "Web页面", "UI", "界面设计", "交互"
   - "页面", "表单", "按钮", "导航", "布局"

2. **项目技术栈检测**:
   - 存在 `package.json` (前端项目)
   - 存在 `src/components/` 目录 (组件化架构)
   - 存在 `public/` 或 `static/` 目录 (静态资源)
   - PRD中明确提到技术栈: React/Vue/Angular/Next.js等

3. **用户明确请求**:
   - PRD中有"UI原型"/"设计稿"/"原型图"等关键词
   - 用户在执行流程时手动调用 `/flow-ui`

### 跳过逻辑
在以下情况自动跳过UI原型生成:

- 纯后端项目(API/数据库/CLI工具)
- PRD中明确标注"无UI需求"
- 项目结构中无前端技术栈标志

## 执行流程

### 阶段 1: 前置条件检查 (Entry Gate)

**Execution Flow**:
```text
1. Determine requirement ID
   → If REQ_ID provided: Use provided ID
   → Else: Run check-prerequisites.sh --json --paths-only
   → Parse REQ_ID from JSON output
   → If not found: ERROR "No requirement ID found"

2. Validate PRD exists
   → Run: check-prerequisites.sh --json
   → Verify: PRD_FILE exists
   → If missing: ERROR "PRD.md not found. Run /flow-prd first."

3. Check if UI prototype already exists
   → Check: UI_PROTOTYPE_FILE exists
   → If exists: WARN "UI_PROTOTYPE.html already exists. Overwrite? (y/n)"
   → User must confirm to proceed

4. Detect UI requirements
   → Read PRD.md
   → Search for UI keywords: grep -iE "用户界面|前端|Web页面|UI|界面设计|交互|页面|表单|按钮|导航"
   → Check project structure: ls -d src/components package.json public/
   → If no UI requirements:
      WARN "No UI requirements detected. This appears to be a backend-only project."
      PROMPT "Generate UI prototype anyway? (y/n)"
      → If NO: EXIT with status "ui_skipped"

5. Check orchestration status
   → Read: orchestration_status.json
   → Verify: status is "prd_complete"
   → If wrong phase: ERROR "PRD not complete. Run /flow-prd first."

*GATE CHECK: All prerequisite validations passed*
```

### 阶段 2: 设计风格分析与灵感采样 (Design Style Analysis)

**Execution Flow**:
```text
1. Extract design style hints from PRD
   → Read PRD.md sections:
     - "背景与目标" - 业务领域和品牌调性
     - "用户故事" - 目标用户画像和使用场景
     - "非功能性要求" - 明确的设计风格要求

   → Search for explicit style keywords:
     - "现代", "简约", "科技感", "专业", "活泼", "典雅"
     - "企业级", "面向青年", "面向儿童", "B2B", "B2C"
     - 明确的颜色偏好: "蓝色主题", "绿色环保风"
     - 明确的参考: "类似Apple官网", "参考Notion设计"

2. Intelligent designer sampling strategy
   根据PRD风格提示,智能选择采样类别:

   If PRD mentions "现代/简约/专业":
     → Sample from: 现代主义信息设计(Vignelli, Müller-Brockmann)
     → + 工业设计(Dieter Rams, Jony Ive)

   If PRD mentions "科技感/创新/动态":
     → Sample from: 生成艺术(John Maeda, Refik Anadol)
     → + 建筑(Zaha Hadid, BIG)

   If PRD mentions "典雅/艺术/文化":
     → Sample from: 亚洲与当代艺术(Kusama, 葛饰北斋)
     → + 平面设计(Paula Scher, Neville Brody)

   If PRD mentions "活泼/年轻/时尚":
     → Sample from: 后现代图形(David Carson, April Greiman)
     → + 抽象艺术(Miró, Matisse)

   If PRD mentions "企业级/金融/严肃":
     → Sample from: 现代主义(Le Corbusier, Alvar Aalto)
     → + 工业设计(Braun, ThinkPad)

   If NO style hints:
     → Random sample from different categories (default behavior)

3. Web search for design inspiration (OPTIONAL)
   If PRD mentions specific reference:
     → Use WebSearch to find:
       "设计案例 {参考网站} UI设计分析"
       "网页设计风格 {关键词}"
     → Save results to: REQ_DIR/research/design_inspiration_{timestamp}.md
     → Extract: 色彩方案, 版式风格, 交互特点

4. Save design strategy
   → Create: REQ_DIR/research/ui_design_strategy.md
   → Content:
     ```markdown
     # UI设计策略 - {REQ_ID}

     ## PRD风格提示
     - 业务领域: {提取的业务特征}
     - 目标用户: {提取的用户画像}
     - 风格关键词: {提取的风格关键词}
     - 明确要求: {PRD中明确的设计要求}

     ## 采样策略
     - 采样类别1: {类别名称}
     - 采样类别2: {类别名称}
     - 采样理由: {为什么选择这些类别}

     ## 外部灵感 (如有)
     - 参考网站: {如有明确参考}
     - 设计分析: {WebSearch结果摘要}
     ```
   → Log: "Design strategy saved"

*OUTPUT: Design strategy document ready for ui-designer agent*
```

### 阶段 3: 调用 ui-designer Agent

**Agent Invocation**:
```text
Task: ui-designer agent
Prompt:
  You are generating a UI prototype for {REQ_ID}: {TITLE}.

  Context:
  - Requirement ID: {REQ_ID}
  - Requirement Title: {TITLE}
  - PRD Document: {PRD_FILE_PATH}
  - Design Strategy: {UI_DESIGN_STRATEGY_FILE_PATH}
  - Research materials: {研究材料数量} files

  Research Materials:
  {读取 research/ 目录下的所有 .md 文件内容}

  Your task:
  1. Run .claude/scripts/check-prerequisites.sh --json --paths-only
     to get requirement paths

  2. Read PRD.md from {PRD_FILE}
     - Extract user stories (用户故事)
     - Extract non-functional requirements (非功能性要求)
     - Extract UI-related acceptance criteria (验收标准)

  3. Read ui_design_strategy.md (if exists)
     - Use PRD style hints to guide designer sampling
     - If explicit designer preferences exist, prioritize them
     - If external inspiration exists, incorporate insights

  4. Read UI_PROTOTYPE_TEMPLATE.md from .claude/docs/templates/

  5. Follow the Execution Flow in template (10 phases):
     Phase 1: Product Analysis
       → Extract core features, user flows, page types from PRD

     Phase 2: Design Inspiration Sampling
       → If ui_design_strategy.md exists:
         • Follow recommended sampling categories
         • Use style keywords to guide translation
       → Else:
         • Random sample from different categories
       → For each sampled master:
         • Generate translation guide (色彩/版式/形态/动效)
         • Specify prohibited imitations

     Phase 3: Design System Definition
       → Define colors (avoid AI purple/blue)
       → Define typography (中英文混排)
       → Define spacing (8px grid)
       → Define grid (12 columns)
       → Define animations (200-300ms)

     Phase 4: Information Architecture
       → Map PRD user stories to pages
       → Design navigation structure
       → Define user flows

     Phase 5: Component Inventory
       → List all needed components
       → Define component states (default/hover/active/disabled/error)
       → Select icon library (Lucide/Heroicons)

     Phase 6: HTML Structure
       → Write semantic HTML5
       → Add ARIA labels
       → Use real content from PRD (no Lorem Ipsum)
       → Use Picsum for images (no placeholders)

     Phase 7: CSS Styling
       → Implement Design System as CSS variables
       → Style all components with states
       → Responsive design (320px/768px/1024px)
       → Animations with prefers-reduced-motion

     Phase 8: JavaScript Interactions
       → SPA router (hash-based)
       → Form validation
       → Modal/Toast/Dropdown
       → Event handling

     Phase 9: Responsive Adaptation
       → Test at 3 breakpoints
       → Ensure 44x44px touch targets
       → No horizontal scrollbars

     Phase 10: Constitution Check
       → Validate against project-constitution.md v2.0.0
       → Ensure NO PARTIAL IMPLEMENTATION
       → Ensure NO HARDCODED SECRETS
       → Ensure all PRD user stories implemented

  6. Write complete UI_PROTOTYPE.html to {UI_PROTOTYPE_FILE}
     - Single HTML file with inline CSS/JS
     - Include design metadata in HTML comments
     - Include Constitution Check report in comments

  7. Log events:
     log_event "{REQ_ID}" "UI prototype generation started"
     log_event "{REQ_ID}" "UI prototype generation completed"

  8. Update orchestration_status.json:
     - Set phase = "ui_complete"
     - Set uiPrototypeGenerated = true
     - Set uiPrototypeFile = "UI_PROTOTYPE.html"

  Output: Complete UI_PROTOTYPE.html file at {UI_PROTOTYPE_FILE}

Subagent: ui-designer
```

**Key Agent Instructions**:
- **MUST READ PRD.md**: Agent不共享主代理上下文,必须显式读取PRD
- **MUST FOLLOW ui_design_strategy.md**: 如果存在设计策略文档,优先遵循其建议
- **MUST USE WebSearch results**: 如果research/中有外部灵感,必须融入设计
- **MUST OUTPUT single HTML file**: 所有HTML/CSS/JS在一个文件中

### 阶段 4: UI原型验证 (Exit Gate)

**Exit Gate Validation**:
```text
1. Verify UI_PROTOTYPE.html was created
   → Check: UI_PROTOTYPE_FILE exists
   → If missing: ERROR "UI prototype generation failed - file not created"

2. Validate HTML completeness
   → Read: UI_PROTOTYPE_FILE
   → Check: File size > 1000 lines (sanity check)
   → Check: Contains "<!DOCTYPE html>"
   → Check: Contains design metadata in comments
   → Check: Contains Constitution Check report
   → If incomplete: ERROR "UI prototype appears incomplete or corrupted"

3. Validate design inspiration
   → Parse HTML comments for "Design Inspirations" section
   → Verify: 2 masters sampled
   → Verify: Translation guide for each master
   → If missing: WARN "Design inspiration section incomplete"

4. Validate PRD alignment
   → Parse HTML comments for "PRD Alignment" section
   → Extract user story count from PRD
   → Verify: All user stories have corresponding UI implementation
   → If misaligned: WARN "Some PRD user stories may not be implemented"

5. Run Constitution validation
   → Execute: validate-constitution.sh --type ui --severity warning
   → Parse output for violations
   → If errors:
      ERROR "Constitution violations found. Review and fix."
      Display violations to user
   → If warnings only:
      WARN "Constitution warnings found. Review recommended."
      Display warnings to user

6. Browser compatibility check (optional)
   → Check: HTML uses standard tags (no deprecated)
   → Check: CSS uses supported properties
   → Check: JavaScript uses ES6+ (no IE-specific code)
   → Log: "Browser compatibility: Modern browsers (Chrome/Firefox/Safari/Edge)"

7. File size check
   → Get: wc -l UI_PROTOTYPE_FILE
   → Check: File size < 3000 lines (recommended)
   → If > 3000 lines:
      WARN "Large prototype file ({line_count} lines). Consider optimization."
      Acceptable for complex prototypes.

8. Update orchestration status
   → Set: status = "ui_complete"
   → Set: phase = "epic_planning"
   → Set: completedSteps = ["init", "prd", "ui"]
   → Set: uiPrototypeGenerated = true
   → Set: uiPrototypeFile = "UI_PROTOTYPE.html"
   → Set: updatedAt = current timestamp
   → Write: orchestration_status.json

9. Generate preview instructions
   → Output to user:
     """
     ✅ UI prototype generated successfully!

     Preview:
       1. Open in browser: open {UI_PROTOTYPE_FILE}
       2. Or use Live Server: npx live-server {REQ_DIR}

     What's inside:
       - {page_count} pages
       - {component_count} components
       - {design_master_1} + {design_master_2} design inspirations

     Review checklist:
       □ Visual design aligns with PRD requirements
       □ All user stories have corresponding UI
       □ Interactions work as expected
       □ Responsive layout works at all breakpoints

     Next steps:
       ▶ If satisfied: Run /flow-epic to generate implementation plan
       ▶ If needs changes: Edit UI_PROTOTYPE.html manually or regenerate
     """

*GATE CHECK: UI prototype meets all quality criteria*
```

**Success Output**:
```text
✅ UI prototype generated successfully!

Requirement ID:    {REQ_ID}
Prototype File:    {UI_PROTOTYPE_FILE}
Lines:             {line_count}
Pages:             {page_count}
Components:        {component_count}
Design Masters:    {master_1}, {master_2}
Constitution:      ✅ Passed / ⚠️  Warnings

Design System:
  ✅ Color Palette (8 colors, no AI purple/blue)
  ✅ Typography (Inter + 思源黑体)
  ✅ Spacing (8px grid)
  ✅ Responsive (320px/768px/1024px)
  ✅ Interactions (SPA router, forms, modals)

PRD Alignment:
  ✅ User Story 1: Login → page-auth-login
  ✅ User Story 2: Dashboard → page-dashboard
  ✅ User Story 3: Orders → page-orders + table component
  ...

Preview Instructions:
  Browser: open {UI_PROTOTYPE_FILE}
  Live Server: npx live-server {REQ_DIR}

Next Steps:
  1. Open prototype in browser to review
  2. Check all interactions work as expected
  3. Verify responsive layout at different screen sizes
  4. If satisfied: Run /flow-epic "{REQ_ID}"
  5. If needs changes: Edit manually or regenerate

Files created/updated:
  - {UI_PROTOTYPE_FILE} (new, {line_count} lines)
  - research/ui_design_strategy.md (new)
  - research/design_inspiration_{timestamp}.md (if web search used)
  - orchestration_status.json (updated: phase=ui_complete)
  - EXECUTION_LOG.md (updated: logged UI generation)
```

## 输出产物

### UI_PROTOTYPE.html 结构
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <!-- Metadata -->
    <title>{REQ_ID} - {TITLE} - UI原型</title>

    <!-- Design Metadata (in comments) -->
    <!--
    Generated: 2025-01-10T12:34:56Z
    REQ-ID: {REQ_ID}

    === Product Analysis ===
    Target Users: {用户画像}
    Core Features: {功能列表}
    ...

    === Design Inspirations ===
    Master 1: Josef Müller-Brockmann (现代主义网格系统)
      → 严格的12列栅格布局
      → 高度结构化的信息层级
    Master 2: Yayoi Kusama (波点艺术)
      → 圆形背景纹理
      → 重复的几何元素

    === Constitution Check Report ===
    Status: PASS
    Article I - Quality First: ✅ PASS
    Article III - Security First: ✅ PASS
    ...
    -->

    <!-- CDN Resources -->
    <link href="https://fonts.googleapis.com/..." rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        /* Design System (CSS Variables) */
        :root { ... }

        /* Components */
        .btn { ... }
        .card { ... }

        /* Responsive */
        @media (min-width: 768px) { ... }
    </style>
</head>
<body>
    <header class="header">
        <!-- Navigation -->
    </header>

    <main class="main">
        <!-- Pages (SPA style) -->
        <section id="page-dashboard" class="page page-active">
            <!-- Dashboard content -->
        </section>
        <section id="page-orders" class="page">
            <!-- Orders content -->
        </section>
    </main>

    <footer class="footer">
        <!-- Footer -->
    </footer>

    <script>
        /* SPA Router */
        /* Interactions */
    </script>
</body>
</html>
```

### research/ui_design_strategy.md
```markdown
# UI设计策略 - REQ-123

## PRD风格提示
- 业务领域: 电商订单管理系统
- 目标用户: 企业客户,专业用户
- 风格关键词: 专业, 高效, 数据密集
- 明确要求: 需要支持复杂表格和数据可视化

## 采样策略
- 采样类别1: 现代主义信息设计 (Josef Müller-Brockmann)
  理由: 适合数据密集型界面,提供清晰的信息层级
- 采样类别2: 工业设计 (Dieter Rams)
  理由: 体现专业和高效,符合企业客户审美

## 设计关键词
- 网格秩序, 高对比度, 功能优先, 极简主义

## 外部灵感 (如有)
无明确参考网站
```

### 状态更新
**orchestration_status.json**:
```json
{
  "reqId": "REQ-123",
  "title": "用户订单管理系统",
  "status": "ui_complete",
  "phase": "epic_planning",
  "completedSteps": ["init", "prd", "ui"],
  "uiPrototypeGenerated": true,
  "uiPrototypeFile": "UI_PROTOTYPE.html",
  "designMasters": ["Josef Müller-Brockmann", "Dieter Rams"],
  "createdAt": "2025-09-30T12:00:00Z",
  "updatedAt": "2025-09-30T13:15:00Z"
}
```

## Constitution Check

This command enforces Constitution principles during UI prototype generation:

### Quality First
- [ ] Prototype is complete, no placeholders (NO PARTIAL IMPLEMENTATION)
- [ ] All images use real resources (Picsum)
- [ ] All content is real (no Lorem Ipsum)
- [ ] All interactions are functional

### Security First
- [ ] No hardcoded API keys or secrets
- [ ] Form inputs have validation
- [ ] External resources use HTTPS CDN

### Architectural Consistency
- [ ] Follows existing design system (if project has one)
- [ ] Components are reusable and consistent
- [ ] Naming conventions are clear (BEM or consistent)

### Requirement Boundary
- [ ] Only implements features from PRD
- [ ] No speculative "future features"
- [ ] All implemented features trace to user stories

## Error Handling

### Common Errors

**1. PRD not found**
```
ERROR: PRD.md not found for requirement REQ-123
Path checked: devflow/requirements/REQ-123/PRD.md
Run /flow-prd "REQ-123" first to generate PRD.
```

**2. No UI requirements detected**
```
WARNING: No UI requirements detected in PRD.md
Searched for keywords: "用户界面", "前端", "Web页面", "UI"
Project structure: No package.json or src/components/ found

This appears to be a backend-only requirement.

Options:
  1. Skip UI prototype generation (recommended for backend projects)
  2. Generate UI prototype anyway (e.g., for admin panel)

Your choice: [1/2]
```

**3. Design inspiration web search failed**
```
WARNING: Failed to fetch design inspiration from web
URL: {search_query}
Reason: Network timeout / Rate limit

Fallback:
  Using random sampling from designer pool (default behavior)
```

**4. Constitution violations**
```
⚠️  Constitution violations found in UI prototype:

[error] NO_PARTIAL_IMPLEMENTATION: Placeholder images detected
  Location: UI_PROTOTYPE.html:245
  Issue: <img src="placeholder.jpg">
  Fix: Replace with Picsum URL: https://picsum.photos/id/157/800/600

[warning] Article V.4 - File Size
  Location: UI_PROTOTYPE.html
  Issue: File size 2500 lines (recommended: <2000 lines)
  Fix: Acceptable for complex prototypes, or consider splitting

Review and fix these issues before proceeding to /flow-epic.
```

**5. HTML validation failed**
```
ERROR: HTML validation failed

Issues:
  - Unclosed <div> tag at line 145
  - Duplicate ID "btn-submit" at lines 89, 203
  - Missing alt attribute on <img> at line 67

ui-designer agent output may be corrupted. Check EXECUTION_LOG.md.

Recovery:
  1. Review ui-designer agent logs in EXECUTION_LOG.md
  2. Fix HTML errors manually in UI_PROTOTYPE.html
  3. Re-run: /flow-ui "REQ-123" --regenerate
```

### Recovery

If UI prototype generation fails:
1. Check EXECUTION_LOG.md for detailed error logs
2. Review ui-designer agent output
3. Check if PRD.md exists and is complete
4. Verify research/ directory has necessary materials
5. Re-run `/flow-ui "REQ-123"` to regenerate

If Constitution check fails:
1. Review violations in console output
2. Fix errors manually in UI_PROTOTYPE.html
3. Re-run Constitution validation: `bash .claude/scripts/validate-constitution.sh --type ui`
4. Or regenerate: `/flow-ui "REQ-123" --force`

## Integration with Other Commands

### Workflow Integration
```text
/flow-init     → Initialize structure ✅
  ↓
/flow-prd      → Generate PRD.md ✅
  ↓
/flow-ui       → Generate UI_PROTOTYPE.html ← YOU ARE HERE ⚡️ (conditional)
  ↓
/flow-tech     → Generate TECH_DESIGN.md (technical solution + anti-tech-creep)
  ↓
/flow-epic     → Generate EPIC.md and TASKS.md (uses TECH_DESIGN.md + UI prototype)
  ↓
/flow-dev      → Implement tasks (TDD: Tests → Implementation, reference UI prototype)
  ↓
/flow-qa       → Quality assurance (tests + security)
  ↓
/flow-release  → Create PR and merge (update CLAUDE.md if needed)
```

### Dependency on /flow-prd
This command requires /flow-prd to have been run first:
- PRD.md must exist and be complete
- orchestration_status.json must have status="prd_complete"

### Enables /flow-epic
After successful UI prototype generation:
- UI_PROTOTYPE.html becomes reference for Epic planning
- planner agent can use component inventory for task breakdown
- dev-implementer can use design system for implementation planning

### Data Flow to Downstream Commands
```text
UI_PROTOTYPE.html
  ├─ HTML Comments → EPIC.md (设计元数据参考)
  ├─ Component Inventory → TASKS.md (组件实现任务)
  ├─ Design System → Implementation (CSS变量直接复用)
  └─ Page Structure → Dev Planning (页面实现顺序)
```

## Script Integration

This command uses the unified script infrastructure:

### Scripts Called
```bash
# 1. Get requirement paths
.claude/scripts/check-prerequisites.sh --json --paths-only

# 2. Validate Constitution
.claude/scripts/validate-constitution.sh --type ui --severity warning

# 3. Log events (via common.sh)
source .claude/scripts/common.sh
log_event "$REQ_ID" "UI prototype generation started"
log_event "$REQ_ID" "UI prototype generation completed"
```

### Agent Called
```text
ui-designer agent (research-type)
- Tools: Read, Write, WebFetch, WebSearch, Grep, Glob
- Reads PRD.md and research materials
- Follows UI_PROTOTYPE_TEMPLATE.md Execution Flow
- Writes UI_PROTOTYPE.html
- Logs events
```

## Best Practices

### Before Running
1. Ensure /flow-prd completed successfully
2. Check if project has existing design system to reference
3. Add any design reference URLs to PRD if available
4. Confirm project type (frontend/fullstack/backend)

### During Execution
1. Review design strategy generated in阶段2
2. If design inspirations don't match PRD tone, regenerate
3. Monitor ui-designer agent output for errors
4. Check EXECUTION_LOG.md for detailed progress

### After Running
1. **Open UI_PROTOTYPE.html in browser immediately**
2. Test all interactions (navigation, forms, modals)
3. Check responsive layout at 3 breakpoints (320px/768px/1280px)
4. Verify all PRD user stories have corresponding UI
5. Review design inspirations - do they match PRD tone?
6. Check color palette - avoid AI purple/blue?
7. Confirm no Lorem Ipsum or placeholder images
8. If satisfied, proceed to `/flow-epic`
9. If needs changes, edit manually or regenerate with updated PRD

### Troubleshooting
1. If prototype looks generic: Check design inspiration sampling logic
2. If missing pages: Review PRD user stories completeness
3. If interactions broken: Check JavaScript console for errors
4. If layout broken: Test at different breakpoints
5. Use `/flow-ui "REQ-123" --debug` for verbose output

### Optimization Tips
1. **For large PRD (>10 user stories)**:
   - Consider generating 1-2 core pages deeply
   - Other pages can be simplified

2. **For specific design style**:
   - Add explicit style keywords to PRD "非功能性要求" section
   - Example: "UI风格要求: 现代简约, 参考Apple官网设计"

3. **For custom color palette**:
   - Add color requirements to PRD
   - Example: "主色调: 深蓝#003D82, 辅助色: 橙色#FF6B35"

4. **For external inspiration**:
   - Add reference URLs to PRD
   - System will WebSearch and save to research/

---

**Note**: This command invokes the ui-designer research agent which analyzes PRD and generates HTML prototype. The agent does not execute code directly; the main agent (Claude) is responsible for file operations and status updates. The ui-designer agent outputs a complete UI_PROTOTYPE.html file based on the self-executable template pattern.
