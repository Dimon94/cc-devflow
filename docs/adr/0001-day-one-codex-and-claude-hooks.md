# Ship Codex And Claude Code Runtime Hooks Together

cc-devflow will introduce the runtime harness with both Codex and Claude Code hook adapters in the first implementation, instead of proving the mechanism on Codex alone first. This is a deliberate scope choice: both hosts have real hook lifecycles for prompt-time context, pre-tool gates, and stop-time continuation, and shipping both from day one prevents the runtime policy core from accidentally inheriting Codex-specific assumptions while still keeping `task.md`, Git, PR truth, and handoff artifacts as the durable sources of truth.
