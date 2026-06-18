# Use Project-Level Runtime Hooks

cc-devflow runtime hooks will be installed as project-level host configuration instead of skill frontmatter hooks. The runtime harness must run before an agent chooses or loads a skill, because its job is to surface the active workflow contract and block illegal phase transitions when model discipline fails; skill-scoped hooks would miss the exact failure mode where the agent never loads the correct skill.
