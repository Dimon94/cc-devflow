# Prioritize Compact And Resume Recovery

The first runtime harness implementation will prioritize recovery slices for session resume and post-compaction context restoration before broad write interception. Compaction and resume are high-value, low-frequency points where agents lose the current workflow move, while durable truth can reconstruct the active task, next action, files to read, verification command, and forbidden delivery transitions without replaying conversation memory. Compact summaries may be logged or inspected for diagnostics, but they must not be trusted as input for the recovery slice; recovery is rebuilt from `task.md`, Git, PR truth, and handoff artifacts.

Recovery slices use the same field allowlist as prompt-time selector output: `active`, `next`, `read`, `verify`, and `forbid`. If recovery can infer only `active` but no action field, the hook stays silent and may record an internal debug reason; incomplete recovery must not be injected into the agent context.
