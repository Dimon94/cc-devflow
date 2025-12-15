# Building Effective AI Agents: Key Patterns and Practices

**Source**: [Anthropic Engineering Blog](https://www.anthropic.com/engineering/building-effective-agents)
**Retrieved**: 2025-12-15
**Author**: Anthropic Engineering Team

---

## Core Architecture Distinction

Anthropic identifies two fundamental approaches to agentic systems:

**Workflows** involve orchestrating LLMs and tools through predetermined code paths, offering predictability for well-defined tasks.

**Agents** enable LLMs to dynamically direct their own processes and tool usage, providing flexibility when decision-making needs vary.

---

## Building Blocks

### The Augmented LLM Foundation
The fundamental component enhances language models with retrieval, tools, and memory capabilities. "Our current models can actively use these capabilities—generating their own search queries, selecting appropriate tools, and determining what information to retain."

Key implementation focus areas:
- Tailor augmentations to specific use cases
- Provide clear, well-documented interfaces for the LLM
- Consider adopting the Model Context Protocol for tool integration

---

## Five Essential Workflow Patterns

### 1. Prompt Chaining
Decomposes tasks into sequential steps where each LLM call processes previous outputs. Includes programmatic validation gates at intermediate stages.

**Best for:** Marketing copy generation followed by translation; document outlining with validation before full writing.

### 2. Routing
Classifies inputs and directs them to specialized downstream tasks, enabling optimized responses for distinct categories.

**Best for:** Customer service queries requiring different handling; routing questions to appropriately-sized models for cost efficiency.

### 3. Parallelization
Runs multiple LLM operations simultaneously, manifesting as either:
- **Sectioning:** Independent subtasks executed in parallel
- **Voting:** Multiple attempts generating diverse outputs

**Best for:** Guardrail implementation; code vulnerability reviews; content appropriateness evaluation.

### 4. Orchestrator-Workers
A central LLM dynamically decomposes complex tasks and delegates to worker LLMs, synthesizing results.

**Best for:** Multi-file code modifications; information gathering from distributed sources.

### 5. Evaluator-Optimizer
Implements iterative refinement where one LLM generates responses while another provides feedback loops.

**Best for:** Literary translation; complex research requiring multiple search iterations.

---

## Agent Implementation

Autonomous agents operate independently after receiving initial direction, using environmental feedback (tool results, code execution) to assess progress. They include stopping conditions and pause points for human input.

Critical success factors:
- "Agents are typically just LLMs using tools based on environmental feedback in a loop"
- Extensive sandboxed testing with appropriate guardrails
- Clear, thoughtfully-designed tool documentation

### Real-World Applications

**Customer Support:** Natural conversation flows combined with external data access, refund issuance, and ticket management. Usage-based pricing demonstrates operational confidence.

**Software Development:** Autonomous issue resolution with automated test verification. "Agents can now solve real GitHub issues in the SWE-bench Verified benchmark based on the pull request description alone."

---

## Tool Design Principles

Treat tool engineering with equal attention as prompt optimization. Key recommendations:

- Allocate sufficient tokens for model deliberation before output generation
- Use formats naturally occurring in internet text
- Eliminate formatting overhead (line counting, string escaping)
- Include example usage and edge cases in definitions
- Test extensively using the Anthropic workbench
- Apply poka-yoke principles to minimize mistake potential

---

## Three Core Implementation Principles

1. **Simplicity** in agent architecture design
2. **Transparency** through explicit planning step visibility
3. **Documentation and testing** focused on agent-computer interfaces

---

## Critical Guidance

"Success in the LLM space isn't about building the most sophisticated system. It's about building the right system for your needs." Start with optimized single LLM calls, adding complexity only when demonstrably improving outcomes.

Developers should begin with direct LLM API usage rather than frameworks, understanding underlying mechanics thoroughly before abstraction layers.

---

## Application to /flow-clarify

### Pattern Mappings

| Anthropic Pattern | /flow-clarify Application |
|-------------------|---------------------------|
| **Prompt Chaining** | Scan → Generate Questions → Present → Record → Integrate |
| **Routing** | Route to specific dimension scanner based on content type |
| **Parallelization** | Scan 11 dimensions in parallel for speed |
| **Orchestrator-Workers** | Main clarify agent + dimension-specific scanners |
| **Evaluator-Optimizer** | Question generator + quality validator |

### Architectural Decisions

**Use Workflow, Not Pure Agent**:
- Clarification has well-defined steps (scan → question → answer → integrate)
- Predictable code paths improve reliability
- Validation gates at each phase ensure quality

**Augmented LLM Components**:
- **Retrieval**: Read research.md, tasks.json, spec files
- **Tools**: Read/Grep/Glob for scanning, Write for reports
- **Memory**: Track answered questions to avoid repetition

**Tool Design Principles for Dimension Scanners**:
- Natural format: Markdown input/output
- No formatting overhead: Direct text extraction
- Edge case examples: Show missing vs partial vs clear coverage
- Poka-yoke: Validate dimension coverage before question generation

### Implementation Blueprint

```
/flow-clarify (Command) → Workflow Controller
   ↓
[Phase 1: Augmented LLM reads research materials]
   ├─ Read research.md
   ├─ Read tasks.json
   └─ Grep for TODO/PLACEHOLDER markers
   ↓
[Phase 2: Parallelization - 11 dimension scanners]
   ├─ Scanner 01: Functional Scope (haiku)
   ├─ Scanner 02: Data Model (haiku)
   ├─ ... (parallel execution)
   └─ Scanner 11: Placeholders (haiku)
   ↓
[Phase 3: Orchestrator-Workers - Question generation]
   └─ Main agent (sonnet) synthesizes results → max 5 questions
   ↓
[Phase 4: Routing - Interactive presentation]
   └─ Route to user (HITL) → one question at a time
   ↓
[Phase 5: Prompt Chaining - Integration]
   └─ Update research.md → Write clarifications/ report
   ↓
[Phase 6: Evaluator-Optimizer - Validation]
   └─ Validator checks for completeness, contradictions, placeholders
```

### Key Takeaways

1. **Start Simple**: Single LLM call for MVP, add orchestration only if needed
2. **Transparency**: Make each dimension scan result visible to user
3. **Test Tools**: Verify dimension scanner prompts in workbench first
4. **Poka-yoke**: Design scanners to prevent missing coverage
5. **Right System**: Workflow > Agent for structured clarification

---

**Relevance**: ⭐⭐⭐⭐⭐ (Critical reference for architecture decisions)
**Next**: Apply these patterns in TECH_DESIGN.md and planner agent prompts
