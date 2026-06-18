# Inject Only Actionable Context Slices

Runtime hook output must be an actionable context slice, not generic workflow prose, wrapper labels, or standalone status. A hook may speak only when it can name a concrete durable artifact, active task, next required skill, verification command, evidence gap, or forbidden transition; otherwise it exits silently. Status fields such as phase are allowed only when paired with an action field that changes what the agent should read, run, do, avoid, or prove next. This keeps the runtime harness useful under always-firing prompt and stop hooks, and prevents workflow state injection from becoming low-signal reminders that compete with the user's prompt.

The prompt-time field allowlist is `active`, `next`, `read`, `verify`, and `forbid`. Runtime hooks should not emit `phase`; the phase must be implied by the next action, such as `next: cc-do T002`, `next: cc-check fresh verification`, or `next: cc-act choose delivery mode`. `active` is contextual metadata, not an action field, so it must never be emitted by itself.

Explicit skill names in a user prompt are selector evidence only when they change the route of the current turn. Questions that ask what a skill means, compare skills, quote skill content, or request documentation review remain silent unless durable workflow truth also creates an action field.

Stop-time output uses a separate field set: `block` and `need`. A Stop hook should speak only when the agent is making a terminal claim that lacks durable proof or violates the current workflow gate; `block` names the missing evidence or illegal terminal claim, and `need` names the single concrete action required to unblock closeout.

Pre-tool output uses `deny` and `need`. A PreToolUse hook should speak only when the proposed tool action is definitely illegal for the current workflow state; `deny` names the blocked action and `need` names the single concrete action required before the tool can proceed.
