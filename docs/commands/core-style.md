# `/core-style` - Generate Project Design Style Guide

[中文文档](./core-style.zh-CN.md) | [English](./core-style.md)

---

## 📋 Overview

Generate project-level design style guide (STYLE.md) from reference designs or existing code analysis, ensuring visual consistency across the entire project.

## 🎯 Syntax

```bash
/core-style            # Generate new design style guide
/core-style --update   # Update existing design style guide
```

## 🎬 Use Cases

### ✅ Recommended Scenarios
- Establish design standards during project initialization
- Unify project visual style
- Extract design system from reference designs
- Organize design specifications from existing code
- Update guide when design style changes

### ❌ Not Recommended Scenarios
- UI design for a single requirement → Use `/flow-ui`
- Temporary style adjustments → Directly modify component code

## 🧭 Positioning

**Project-level command** (similar to `/core-roadmap`)

- `/core-roadmap` defines product roadmap (feature planning)
- `/core-style` defines design style guide (visual specification)
- Both are **SSOT (Single Source of Truth)** for the project

## 💡 Core Philosophy

> "Design systems are the grammar of visual language, code is the implementation of grammar. Without grammar, there is no consistency."

**Role of STYLE.md**:
- ✅ Single Source of Truth (SSOT) for project design
- ✅ Primary reference for `/flow-ui` when generating UI prototypes
- ✅ Mandatory specification for `/flow-dev` during frontend development
- ✅ Ensures visual consistency across all requirement UIs

## 🔄 Execution Flow (3 Phases)

```text
Phase 1: Entry Gate & Project Type Detection
  ├─ Detect existing style guide (does STYLE.md exist?)
  ├─ Detect project type (new project vs existing project)
  └─ Route selection (new → reference design collection / existing → code analysis)

Phase 2: Reference Design Collection & Replication (New Projects Only)
  ├─ Guide user to provide reference design (URL / screenshot / HTML+CSS)
  ├─ Generate single HTML file replica (reference-001.html)
  ├─ User refinement loop (reference-002.html, reference-003.html...)
  └─ Confirm final version (reference-final.html)

Phase 3: Style Analysis & STYLE.md Generation
  ├─ Analyze input source (reference-final.html or project code)
  ├─ Generate style analysis document (research/style_analysis.md)
  ├─ Invoke style-guide-generator Agent
  └─ Output STYLE.md

Exit Gate: File check + Constitution validation + Status update
```

## 📂 Output Files

```
devflow/
├── STYLE.md                                  # Project design style guide (SSOT)
├── research/
│   ├── style_analysis.md                    # Style analysis document
│   └── style_reference_designs/             # Reference designs (new projects)
│       ├── reference-001.html               # Version 1 replica
│       ├── reference-002.html               # Version 2 (refined)
│       └── reference-final.html             # Final confirmed version
├── project_status.json                      # Project status (updated)
└── EXECUTION_LOG.md                         # Execution log (updated)
```

## 📋 STYLE.md Contents

STYLE.md is a comprehensive design style guide containing these 15 core sections:

1. **Overview** - Design system overview (name, version, philosophy, update history)
2. **Color Palette** - Color system (primary, secondary, semantic, neutrals with Hex/RGB/HSL)
3. **Typography** - Font system (font families, type scale, responsive fonts, combination rules)
4. **Spacing System** - Spacing system (base unit, spacing scale, use cases)
5. **Component Styles** - Component library (Button, Input, Card, Modal, etc. with variants, sizes, states)
6. **Shadows & Elevation** - Shadow and elevation system (shadow levels, use cases)
7. **Animations & Transitions** - Animations and transitions (duration, easing, common animations)
8. **Border Radius** - Border radius system (radius levels, use cases)
9. **Opacity & Transparency** - Opacity system (opacity levels, use cases)
10. **Common Tailwind CSS Usage** - Tailwind usage specifications (if applicable)
11. **Example Component Reference Design Code** - Example component code (at least 3 complete implementations)
12. **Design Principles** - Design principles (simplicity, consistency, accessibility, etc.)
13. **Responsive Design** - Responsive design (breakpoints, strategy, examples)
14. **Accessibility** - Accessibility (color contrast, keyboard navigation, ARIA attributes)
15. **Assets** - Asset specifications (Icon, Image, Logo, etc., if applicable)

**All definitions include**:
- Concrete values (not "TBD" or placeholders)
- Semantic naming (e.g., `--color-primary`, `--spacing-md`)
- Use case descriptions
- Example code (CSS Variables / Tailwind Config)

**Example code characteristics**:
- ✅ Copy-paste ready
- ✅ Complete HTML structure and CSS/Tailwind classes
- ✅ Clear comments explaining design decisions
- ❌ Not pseudocode or placeholders

## 🆕 New Project Workflow Example

### Scenario: You have a favorite design you want to use as the project's design foundation

```bash
# Step 1: Run command
/core-style

# Step 2: Agent guidance
Agent: Detected a new project (no frontend code).

Please provide the design you want to reference:
- Website URL (I'll fetch and analyze it)
- Design screenshot (PNG/JPG)
- Extracted HTML + CSS code

I'll help you replicate this design into a single HTML file.

# Step 3: User provides reference
User: I want to reference https://example.com/design, here's the screenshot and extracted CSS...

# Step 4: Agent generates replica
Agent: Generated devflow/research/style_reference_designs/reference-001.html

Please open the file to review. Are you satisfied? If not, tell me what needs adjustment:
- Colors (e.g., primary color too bright, change to softer blue)
- Fonts (e.g., heading font too bold, change to medium weight)
- Spacing (e.g., card spacing too small, increase to 24px)
- Component styles (e.g., button radius too large, change to 4px)

# Step 5: User refinement
User: Change primary color to #3B82F6, button radius to 6px.

# Step 6: Agent adjusts and confirms again
Agent: Adjusted, generated reference-002.html. Please review. Satisfied?

User: Yes!

# Step 7: Agent generates STYLE.md
Agent: Analyzing reference-final.html, generating STYLE.md...

✅ STYLE.md generated!

Content statistics:
- Color definitions: 15
- Font definitions: 8
- Spacing levels: 10
- Component styles: 12
- Example code: 3

Next steps:
1. Review devflow/STYLE.md for completeness
2. Run /flow-prd to start requirement development
```

## 🏢 Existing Project Workflow Example

### Scenario: You have a project with existing frontend code and want to organize design specifications

```bash
# Step 1: Run command
/core-style

# Step 2: Agent auto-analyzes
Agent: Detected an existing project (found src/components/, styles/, etc.).

Analyzing project code, extracting design styles...
- Analyzing files: src/components/**/*.tsx, styles/**/*.css
- Extracting colors: Primary #3B82F6, Secondary #8B5CF6, ...
- Extracting fonts: Inter, Roboto Mono
- Extracting spacing: 4px, 8px, 16px, 24px, 32px...

Generated devflow/research/style_analysis.md, generating STYLE.md...

✅ STYLE.md generated!

Content statistics:
- Color definitions: 18
- Font definitions: 6
- Spacing levels: 8
- Component styles: 15
- Example code: 3

Tech stack:
- Framework: React
- CSS: Tailwind CSS

Next steps:
1. Review devflow/STYLE.md for completeness
2. Adjust inconsistent components based on STYLE.md (if any)
```

## 🔄 Update Mode Example

### Scenario: Design style changes, need to update STYLE.md

```bash
# Step 1: Run command
/core-style --update

# Step 2: Agent analyzes and updates
Agent: Detected existing STYLE.md (v1.0.0), entering update mode.

Analyzing latest code, detecting new design patterns...
- Found new color: Warning #F59E0B
- Found new components: Tooltip, Pagination
- Found new spacing: 96px

Merged into STYLE.md (v1.1.0).

Update content:
- New colors: 1
- New components: 2
- New spacing: 1

✅ STYLE.md update complete!

Next steps:
1. Review changes
2. Update existing UI prototypes (if any)
```

## 🔗 Integration with Other Workflows

### `/flow-ui` Integration

**Before** (no STYLE.md):
- `/flow-ui` uses default sampling strategy (80+ design masters)
- Each requirement's UI may have inconsistent styles

**After** (with STYLE.md):
- `/flow-ui` prioritizes loading `devflow/STYLE.md`
- All colors, fonts, spacing, components strictly follow STYLE.md
- Default sampling strategy only used for parts not covered by STYLE.md

**Example**:
```bash
# Run /flow-ui
/flow-ui "REQ-001"

# Agent auto-references STYLE.md
Agent: Detected devflow/STYLE.md (v1.0.0), will strictly follow design style guide.

Generating UI prototype...
- Primary color: #3B82F6 (from STYLE.md)
- Font: Inter (from STYLE.md)
- Button radius: 6px (from STYLE.md)

✅ UI_PROTOTYPE.html generated, all styles comply with STYLE.md.
```

### `/flow-dev` Integration

**After** (with STYLE.md):
- `/flow-dev` auto-loads `devflow/STYLE.md` when generating frontend code
- All component implementations must follow STYLE.md style definitions
- Pay special attention to: color usage, font usage, spacing usage, component structure

**Example**:
```bash
# Run /flow-dev
/flow-dev "REQ-001"

# Agent auto-references STYLE.md
Agent: Detected devflow/STYLE.md (v1.0.0), all frontend code will follow design style guide.

Implementing Task T003: Implement login button...
- Using STYLE.md Button Primary style
- Color: var(--color-primary)
- Radius: var(--radius-md)
- Spacing: var(--spacing-2) var(--spacing-4)

✅ Login button implementation complete, style complies with STYLE.md.
```

## 💡 Design Philosophy

### 1. SSOT Principle (Single Source of Truth)
- STYLE.md is the sole source of truth for project design
- All UI-related work must reference STYLE.md
- Avoid design style fragmentation and inconsistency

### 2. Consistency First
- Unified visual language enhances product professionalism
- Consistent component styles reduce development and maintenance costs
- Smoother, more predictable user experience

### 3. Reusability
- All definitions are concrete and executable
- Example code is copy-paste ready, not pseudocode
- Reduce repetitive work, improve development efficiency

### 4. Evolvability
- Support iteration through `--update` parameter
- Version control (v1.0.0, v1.1.0...)
- Record reasons and changes for each update

### 5. User-Centered
- New projects through reference design collection + refinement loop
- Ensure user satisfaction
- Avoid large-scale refactoring later

## 📊 Workflow Position

```
/flow-init → research.md + tasks.json
     ↓
/core-roadmap → ROADMAP.md + BACKLOG.md (optional, project-level)
     ↓
/core-style → STYLE.md (optional, project-level design style guide) ⭐ NEW
     ↓
/flow-prd → PRD.md
     ↓
/flow-tech → TECH_DESIGN.md + data-model + contracts
     ↓
/flow-ui → UI_PROTOTYPE.html (must reference STYLE.md) ⭐ CHANGED
     ↓
/flow-epic → EPIC.md + TASKS.md
     ↓
/flow-dev → TASKS.md execution (frontend code must reference STYLE.md) ⭐ CHANGED
     ↓
/flow-qa → QA reports
     ↓
/flow-release → PR creation
```

## ⚠️ Error Handling

| Error Scenario | Handling |
|----------------|----------|
| **STYLE.md exists without --update** | Ask for confirmation to overwrite, exit if user declines |
| **No frontend features and no reference design** | Prompt user to provide reference design or confirm pure backend project |
| **Reference design replication fails** | Request more detailed design info (HTML/CSS/screenshot) |
| **Agent generation fails** | Keep style_analysis.md, prompt user to check and retry |
| **Constitution validation fails** | Block based on severity (warning level only prompts) |

## 🎯 Next Steps

1. **Review STYLE.md** - Ensure design style guide is complete and meets project needs
2. **Update existing components** (existing projects) - Adjust inconsistent components based on STYLE.md
3. **Run /flow-prd** - Start requirement development (if applicable)
4. **Run /core-roadmap** - Generate product roadmap (if applicable)

## 🔗 Related Commands

- [`/core-roadmap`](./core-roadmap.md) - Generate product roadmap
- [`/flow-ui`](./flow-ui.md) - Generate UI prototype (will reference STYLE.md)
- [`/flow-dev`](./flow-dev.md) - Execute development tasks (will reference STYLE.md)
- [`/flow-verify`](./flow-verify.md) - Consistency check (can check if code complies with STYLE.md)

## 📚 Deep Reading

- [Design System Guide](../guides/design-system-guide.md) (TBD)
- [Visual Consistency Management](../guides/visual-consistency.md) (TBD)
- [STYLE_TEMPLATE](../../.claude/docs/templates/STYLE_TEMPLATE.md)

## ❓ FAQ

### Q: When should I run `/core-style`?
A:
- ✅ During project initialization (establish design standards)
- ✅ When you have a reference design to replicate
- ✅ When existing project needs design specification organization
- ✅ When design style changes (use `--update`)

### Q: What's the difference between `/core-style` and `/flow-ui`?
A:
- **core-style**: Generates **project-level** design style guide (STYLE.md), one-time or as-needed updates
- **flow-ui**: Generates UI prototype (UI_PROTOTYPE.html) for **specific requirements**, runs per requirement

### Q: Do I need to run `/core-style` for a pure backend project?
A: No. `/core-style` is designed for frontend or full-stack projects. Pure backend projects don't need a design style guide.

### Q: Can I manually edit STYLE.md after it's generated?
A: Yes. STYLE.md is a Markdown file, you can edit it manually. However, it's recommended to use `/core-style --update` for consistency and version control.

### Q: What if I'm not satisfied with the reference design replica?
A: The agent provides a refinement loop where you can adjust multiple times until satisfied. Each adjustment generates a new version (reference-002.html, reference-003.html...), and you can revert anytime.

### Q: Will STYLE.md automatically apply to code?
A: No automatic code modification. However, `/flow-ui` and `/flow-dev` will auto-reference STYLE.md to ensure newly generated code complies with the style guide. Existing code needs manual adjustment (or use `/flow-verify` to check inconsistencies).

### Q: If my project uses Tailwind CSS, will STYLE.md include Tailwind configuration?
A: Yes. The agent auto-detects the tech stack. If using Tailwind CSS, STYLE.md will include Tailwind Config example code.

### Q: What does STYLE.md contain?
A: Contains 15 core sections: Overview, Color Palette, Typography, Spacing System, Component Styles, Shadows, Animations, Border Radius, Opacity, Tailwind Usage, Example Code, Design Principles, Responsive Design, Accessibility, Assets. See [STYLE_TEMPLATE](../../.claude/docs/templates/STYLE_TEMPLATE.md) for details.
