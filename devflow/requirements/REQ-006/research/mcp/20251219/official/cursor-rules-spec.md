# Cursor IDE Rules Specification

**Source**: [Cursor Official Docs](https://docs.cursor.com/context/rules), [Cursor Forum](https://forum.cursor.com/t/good-examples-of-cursorrules-file/4346)
**Fetched**: 2025-12-19

---

## Current Status (2025)

The `.cursorrules` file in your project root is **still supported but will be deprecated**. Cursor recommends migrating to **Project Rules** for more control, flexibility, and visibility.

> In Cursor 0.47, the `.cursorrule` file is deprecated from 0.45 and usable for now, but the team recommends switching to `.mdc` files in the `.cursor/rules` directory before it's gone for good.

---

## Legacy .cursorrules Format

`.cursorrules` files define custom rules for Cursor AI to follow when generating code, allowing you to tailor its behavior to your specific needs and preferences.

**Location**: Project root directory
**Naming**: `.cursorrules` (not `cursorrules.txt`)

---

## New Recommended Format: MDC Files

Each rule file is written in **MDC (.mdc)**, a format supporting metadata and content.

### MDC File Structure

```markdown
---
description: "Brief description of the rule"
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
---

# Rule Content

Your rule instructions here...

Referenced files like @service-template.ts are included as additional context when the rule triggers.
```

### Control Properties

| Property | Type | Description |
|----------|------|-------------|
| description | string | Brief description of the rule |
| globs | string[] | File patterns that trigger this rule |
| alwaysApply | boolean | If true, rule applies to all contexts |

---

## Types of Rules

### Project Rules
- **Location**: `.cursor/rules` directory within your project
- **Scope**: Version-controlled, scoped to the codebase
- **Use Case**: Encoding domain-specific knowledge, standardizing patterns, automating project workflows

### User Rules
- **Location**: Defined globally in Cursor settings
- **Scope**: Apply across all your projects
- **Use Case**: Personal preferences like response style or commonly used libraries

---

## Best Practices

1. **Keep rules concise** - Aim for clarity and brevity. Under 500 lines is a good guideline.

2. **Split bloated files** - If your `.cursorrules` file gets bloated, split it into `.cursor/*.mdc` files. This reduces token usage by only activating relevant cursor project rules when needed.

3. **Use nested rules** - Place rules in `.cursor/rules` directories throughout your project. Nested rules automatically attach when files in their directory are referenced.

---

## Directory Structure

```
project/
├── .cursorrules              # Legacy format (deprecated)
└── .cursor/
    └── rules/
        ├── general.mdc       # General coding rules
        ├── typescript.mdc    # TypeScript-specific rules
        └── components/
            └── react.mdc     # React component rules
```

---

## Migration Path

1. Create `.cursor/rules/` directory
2. Convert `.cursorrules` content to `.mdc` format
3. Add appropriate frontmatter (description, globs, alwaysApply)
4. Test rule activation
5. Remove legacy `.cursorrules` file

---

## Resources

- [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) - Configuration files that enhance Cursor AI editor experience
- [dotcursorrules.com](https://dotcursorrules.com) - Mastering AI-Assisted Coding guide
- [cursorrules.org](https://cursorrules.org/) - Free AI .cursorrules & .mdc Config Generator
