# Keep Runtime Harness Read-Only Over Workflow Truth

The runtime policy core will not create or update its own durable workflow state. It may read `task.md`, Git, PR truth, and handoff artifacts, while host adapters may keep only disposable ignored runtime cache for host mechanics such as repeated Stop handling; that cache must never become authoritative for phase, task, verification, or delivery decisions. This preserves a single source of truth and avoids the drift that would come from a competing runtime state store.
