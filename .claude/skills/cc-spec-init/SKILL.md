---
name: cc-spec-init
version: 1.2.0
description: Use when you need to initialize or evolve capability specs under `devflow/specs/`.
reads:
  - PLAYBOOK.md
  - references/spec-contract.md
  - assets/INDEX_TEMPLATE.md
  - assets/CAPABILITY_TEMPLATE.md
writes:
  - path: devflow/specs/INDEX.md
    durability: durable
    required: false
  - path: devflow/specs/capabilities/<capability>.md
    durability: durable
    required: false
effects:
  - capability truth source initialization or update
  - Git commit after spec work completes
---

# CC-Spec-Init

`cc-spec-init` maintains long-lived capability specs. It is not a process-state generator.

Allowed outputs:

- `devflow/specs/INDEX.md`
- `devflow/specs/capabilities/<capability>.md`

Do not create change-scoped JSON. Changes link to specs through `task.md`, roadmap text, PR text, and Git commits.

## Use This Skill When

- initializing `devflow/specs/`
- creating a capability spec
- splitting, merging, or deprecating a capability
- clarifying canonical project language

## Exit Criteria

- capability boundary is clear
- current truth and gaps are written
- `INDEX.md` links to existing capability files
- spec changes are committed to Git
