# Research Report - REQ-005: Command Template Engine

## Research Summary
Investigated template engine choices and integration strategies for multi-platform AI agents.

## Decisions

### R001 — Template Engine Selection
- **Decision**: Use Handlebars.js as the primary template engine.
- **Rationale**: Handlebars provides a powerful yet readable syntax for variable replacement, conditional rendering, and loops, which are essential for customizing code generation prompts for different AI agents.
- **Alternatives Considered**: Mustache, EJS.

### R002 — Template Storage & Fallback
- **Decision**: Adopt a platform-specific directory structure: `templates/adapters/[platform]/[command].hbs` with a `generic` fallback.
- **Rationale**: This structure allows each adapter to have its own specialized prompts while providing a safe default for unsupported or new platforms.
- **Alternatives Considered**: Putting all platform logic inside a single template file.

### R003 — Spec-Kit Architecture Adoption
- **Decision**: Adopt `spec-kit`'s logical structure (Variable Substitution, Agent Registry) but implement via Runtime Helpers.
- **Rationale**: `spec-kit` relies on build-time static generation which creates maintenance overhead (dozens of zip files). Using Handlebars helpers like `agent_script` achieves the same agent-specific customization dynamically at runtime.
- **Alternatives Considered**: Copying `spec-kit`'s shell-based build system.

## Source Library
- [Handlebars.js Official Docs](https://handlebarsjs.com/)
- spec-kit project references
