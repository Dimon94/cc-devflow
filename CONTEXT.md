# cc-devflow

cc-devflow is an agent-first workflow system for moving coding work through planning, execution, verification, and delivery with durable evidence.

## Language

**Runtime Harness**:
An outer workflow guard that supplies current workflow context and enforces phase gates while an agent works.
_Avoid_: Hook pack, workflow daemon

**Runtime Policy Core**:
The host-neutral decision layer that interprets durable workflow truth and returns context or gate decisions.
_Avoid_: Codex runtime, Claude runtime

**Host Adapter**:
A platform-specific bridge that translates a host's hook lifecycle into runtime policy decisions.
_Avoid_: Platform core, hook policy

**Durable Truth**:
Repository-owned workflow facts that outlive a chat turn and remain authoritative across agents and hosts.
_Avoid_: Runtime state store, generated mirror

**Single Source Of Truth**:
The rule that workflow authority belongs to durable truth, not to runtime caches or generated summaries.
_Avoid_: Shadow state, mirrored workflow state

**User Entry Skill**:
A skill that a person invokes to start or resume a workflow phase.
_Avoid_: Public skill, command skill

**Chain Skill**:
A skill that exists for other skills and agents to reuse inside the workflow chain, rather than as a primary human entry point.
_Avoid_: Shared reference, helper doc

**Managed Resource Copy**:
A bundled resource file copied into one or more skill-local paths from an owner
resource so host adapters, package consumers, and generated mirrors can resolve
relative paths without treating each copy as a separate source of truth.
_Avoid_: Chain Skill, shared reference, generated mirror

**Capability Skill**:
A reusable skill that can be invoked directly and consulted by workflow skills
without becoming a PDCA stage. `cc-research` is a Capability Skill and owns
`devflow/research/`.
_Avoid_: PDCA stage, process file writer

**Task Contract**:
The durable agreement that defines the shape and meaning of `task.md` for planning, execution, verification, and delivery.
_Avoid_: Task template, issue spec, task document

**Quality Gate Packet**:
A transient evidence bundle assembled by `cc-check` and passed between quality participants to classify the current gate verdict and route without becoming Durable Truth. It carries normalized summaries and evidence references, not raw command or review output. `cc-act` may check freshness and final-commit coverage, but it does not reinterpret the verdict. It does not enter the Failure Ledger; only classified review escapes or confirmed lessons become durable failure evidence.
_Avoid_: Quality state file, verification database, gate artifact

**Project Hook**:
A host hook registered for the project as a whole, outside any single skill's lifecycle.
_Avoid_: Skill-scoped hook, frontmatter hook

**Quiet-By-Default Hook**:
A hook contract where running is cheap and silent unless durable workflow evidence or the current user prompt proves that the agent needs context or must be blocked.
_Avoid_: Per-turn reminder, always-on injection

**Actionable Context Slice**:
A compact hook payload made only of the exact workflow fact, next action, evidence gap, or forbidden transition the agent needs for the current turn.
_Avoid_: Process reminder, motivational guidance, generic checklist, wrapper label

**Action Field**:
A context field that directly changes what the agent should read, run, do, avoid, or prove next.
_Avoid_: Standalone status, decorative metadata

**Recovery Slice**:
An actionable context slice emitted after compaction or session resume to restore the next workflow move from durable truth.
_Avoid_: Conversation summary, memory replay
