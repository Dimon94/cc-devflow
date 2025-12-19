# Google Antigravity IDE Rules and Workflows

**Source**: [Mete Atamel Blog](https://atamel.dev/posts/2025/11-25_customize_antigravity_rules_workflows/), [antigravity.codes](https://antigravity.codes/blog/user-rules), [Getting Started Codelab](https://codelabs.developers.google.com/getting-started-google-antigravity)
**Fetched**: 2025-12-19

---

## Overview

Antigravity comes with two customization options: **Rules** and **Workflows**.

| Type | Purpose | Activation |
|------|---------|------------|
| Rules | Guide agent behavior (system instructions) | Always on (passive) |
| Workflows | Saved prompts triggered on demand | User triggers with `/` |

---

## Rules

Rules serve as the "system instructions" or the **immutable constitution** for the agent. They are passive, persistent guidelines that the agent must consider before generating any code or plan.

### Types of Rules

#### 1. System Rules (Immutable)
- Core directives from Google DeepMind
- Define agent identity (e.g., "Always plan before coding," "Create premium designs")
- **Cannot be changed by users**

#### 2. User Rules (Customizable)
- Your custom instructions
- Sit on top of system rules
- Allow overriding defaults or adding specific constraints

### Rule Scopes

| Scope | Apply To | Storage Location |
|-------|----------|------------------|
| Global Rules | Every project | `~/.gemini/GEMINI.md` |
| Project Rules | Current project only | `.cursorrules` or similar in project root |

**Note**: Global rules define personal coding philosophy or organizational mandates. Project-level rules enforce team standards or project-specific architectural patterns.

---

## Workflows

Workflows are **saved prompts** that you can trigger on demand with `/` as you interact with the agent.

> A good analogy is that Rules are more like system instructions whereas Workflows are more like saved prompts that you can choose on demand.

---

## File Structure

```
project/
├── .antigravity/             # Official Antigravity config
│   ├── rules.md              # Agent Rules & Permissions
│   └── artifacts/            # Generated artifacts
├── .context/                 # Context files
├── .github/                  # CI/CD Workflows
└── .cursorrules              # Alternative rules location
```

---

## Token/Context Limits

| Limit | Value | Source |
|-------|-------|--------|
| **Rules/Workflows File** | **12,000 characters each** | Official docs (confirmed) |
| Token Budget | 200,000 tokens per conversation | Official docs |
| Rate Limits | "Generous" limits, refresh every 5 hours | Official docs |

### File Limit Details (Official)

> "Rules files are limited to 12,000 characters each."
> "Workflow files are limited to 12,000 characters each."

This confirms RM-008's AC requirement for 12K character limit handling.

---

## Key Insights for RM-008

### Antigravity-Specific Considerations

1. **No explicit file size limit found** - Unlike the 12K character limit mentioned in RM-008 AC, research did not reveal a hard file limit. The 12K limit may come from different source or earlier version.

2. **Rules trigger options**:
   - Manual
   - Always On
   - Model Decision
   - Glob patterns

3. **`@filename` references** - Rules support `@filename` references (relative paths resolved from rules file location)

4. **Dual location support** - Can use either `.antigravity/rules.md` or `.cursorrules`

---

## Output Directory for CC-DevFlow

For RM-008 Adapter Compiler, target Antigravity output structure:

```
.agent/
├── rules/
│   └── rules.md              # Main rules file
├── workflows/
│   ├── flow-init.md          # Compiled workflows
│   ├── flow-prd.md
│   └── ...
├── scripts/                   # Copied utility scripts
└── docs/                      # Copied documentation
```

---

## Differences from Claude Code

| Feature | Claude Code | Antigravity |
|---------|-------------|-------------|
| Rules Format | `CLAUDE.md` + hooks | `rules.md` or `.cursorrules` |
| Workflows | Slash commands (`/flow-*`) | `/`-triggered workflows |
| Skills | `skill-rules.json` registry | Not explicitly documented |
| Global Config | `~/.claude/` | `~/.gemini/GEMINI.md` |
| Token Limit | Unlimited (summarization) | 200K per conversation |

---

## References

- [Workspace Template](https://github.com/study8677/antigravity-workspace-template)
- [Full Guide](https://aimeetcode.substack.com/p/antigravity-full-guide-from-install)
- [Troubleshooting](https://antigravity.codes/troubleshooting)
