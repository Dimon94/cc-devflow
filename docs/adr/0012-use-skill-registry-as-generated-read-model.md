# Use Skill Registry As Generated Read Model, Not Runtime Authority

The Skill Registry will be a generated read model for skill-suite indexing,
validation, documentation, and publish gates, not a runtime router or workflow
state store. Workflow authority stays with Durable Truth: `task.md`, Git, and
PR or handoff reality. This preserves the Single Source Of Truth rule while
still allowing the registry to expose the Skill Suite Graph for tooling.
