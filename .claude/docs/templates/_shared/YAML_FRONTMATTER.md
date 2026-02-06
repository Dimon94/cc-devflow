# YAML Frontmatter Template Component

> **Purpose**: Shared YAML frontmatter patterns for all spec documents
> **Version**: 1.0.0
> **Usage**: Copy relevant frontmatter based on document type

---

## Usage

Select the appropriate frontmatter template based on document type.

---

## PRD Frontmatter

```yaml
---
req_id: "{{REQ_ID}}"
title: "{{TITLE}}"
type: "PRD"
status: "Draft"
created_at: "{{ISO_8601_TIMESTAMP}}"
updated_at: "{{ISO_8601_TIMESTAMP}}"
version: "1.0.0"
author: "prd-writer"
constitution_version: "v2.1.0"
---
```

---

## TECH_DESIGN Frontmatter

```yaml
---
req_id: "{{REQ_ID}}"
title: "{{TITLE}}"
type: "Technical Design"
status: "Draft"
created_at: "{{ISO_8601_TIMESTAMP}}"
updated_at: "{{ISO_8601_TIMESTAMP}}"
version: "1.0.0"
author: "tech-architect"
constitution_version: "v2.1.0"
baseline_tech_stack:
  frontend: "{{BASELINE_FRONTEND}}"
  backend: "{{BASELINE_BACKEND}}"
  database: "{{BASELINE_DATABASE}}"
---
```

---

## EPIC Frontmatter

```yaml
---
req_id: "{{REQ_ID}}"
title: "{{TITLE}}"
type: "Epic"
status: "Planned"
created_at: "{{ISO_8601_TIMESTAMP}}"
updated_at: "{{ISO_8601_TIMESTAMP}}"
version: "1.0.0"
author: "planner"
constitution_version: "v2.1.0"
phases:
  - name: "Setup"
    status: "pending"
  - name: "Tests First"
    status: "pending"
  - name: "Implementation"
    status: "pending"
  - name: "Integration"
    status: "pending"
  - name: "Polish"
    status: "pending"
---
```

---

## UI_PROTOTYPE Frontmatter (HTML Comment)

```html
<!--
Generated: {{ISO_8601_TIMESTAMP}}
REQ-ID: {{REQ_ID}}
Title: {{TITLE}}
Type: UI Prototype
Version: 1.0.0
Author: ui-designer

Design Inspirations:
  - Inspiration 1: {{ARTIST_1}} ({{CATEGORY}})
  - Inspiration 2: {{ARTIST_2}} ({{CATEGORY}})

Design System:
  Primary Color: {{PRIMARY_COLOR}}
  Font Family: {{FONT_FAMILY}}
  Base Spacing: {{BASE_SPACING}}

Responsive Breakpoints:
  Mobile: 320px - 767px
  Tablet: 768px - 1023px
  Desktop: 1024px+

Constitution Check: {{PASS/FAIL}}
-->
```

---

## TASKS Frontmatter

```yaml
---
req_id: "{{REQ_ID}}"
title: "{{TITLE}}"
type: "Tasks"
status: "In Progress"
created_at: "{{ISO_8601_TIMESTAMP}}"
updated_at: "{{ISO_8601_TIMESTAMP}}"
version: "1.0.0"
author: "planner"
total_tasks: {{TOTAL}}
completed_tasks: {{COMPLETED}}
progress: "{{PERCENTAGE}}%"
current_phase: "{{PHASE_NAME}}"
---
```

---

## Common Fields Reference

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `req_id` | string | Requirement ID (REQ-XXX) | Yes |
| `title` | string | Document title | Yes |
| `type` | string | Document type | Yes |
| `status` | string | Draft/Planned/In Progress/Complete | Yes |
| `created_at` | string | ISO 8601 timestamp | Yes |
| `updated_at` | string | ISO 8601 timestamp | Yes |
| `version` | string | Semantic version | Yes |
| `author` | string | Agent or person name | Yes |
| `constitution_version` | string | Constitution version | Recommended |

---

## Status Values

| Status | Description | Applicable To |
|--------|-------------|---------------|
| `Draft` | Initial creation, not reviewed | PRD, TECH_DESIGN |
| `Planned` | Reviewed and approved | EPIC |
| `In Progress` | Currently being worked on | TASKS |
| `Complete` | All work finished | All |
| `Archived` | No longer active | All |

---

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
