# Research Guides and Resources

**Topic**: Requirement Ambiguity Detection + Interactive Clarification Workflows
**Retrieved**: 2025-12-15

---

## 1. Requirement Ambiguity Detection with LLMs (2025)

### Research Papers

1. **[Requirements Ambiguity Detection and Explanation with LLMs: An Industrial Study](https://www.ipr.mdu.se/pdf_publications/7221.pdf)**
   - IEEE Conference Publication
   - Industrial application of LLM for ambiguity detection
   - In-context learning approaches

2. **[A Test-Driven Approach for Refining Use Case Specifications](https://link.springer.com/chapter/10.1007/978-981-95-4213-0_11)**
   - Test-driven requirements refinement using LLMs
   - Iterative correction cycles

3. **[LLMs in Requirements Engineering](https://www.emergentmind.com/topics/large-language-models-llms-in-requirements-engineering)**
   - Comprehensive overview of LLM applications in RE
   - Best practices and guidelines

4. **[Clarify When Necessary: Resolving Ambiguity with Language Models](https://openreview.net/forum?id=XgdNdoZ1Hc)**
   - OpenReview discussion on clarification strategies
   - Language model ambiguity resolution techniques

5. **[Balancing Performance and Ambiguity Through Coreference Resolution](https://aclanthology.org/2025.emnlp-main.1527.pdf)**
   - EMNLP 2025 paper on ambiguity handling
   - Performance optimization strategies

### Key Findings

#### Model Performance
- **No single model dominates**: Different models excel at different ambiguity types
- **Size matters**: Larger models (Phi3-mini 3.8B, Llama-3 8B) > smaller (Qwen-2.5 1.5B)
- **Detection accuracy**: GPT-3.5 and Llama detect ambiguity slightly above chance
- **Improvement**: Chain-of-thought prompting provides marginal gains
- **Layer analysis**: Intermediate layers detect ambiguous input better than final layer

#### Best Practices (9 Themes)
1. **Context**: Provide domain-specific background
2. **Persona**: Role-based prompting
3. **Templates**: Structured output formats
4. **Disambiguation**: Explicit ambiguity resolution
5. **Reasoning**: Chain-of-thought approaches
6. **Analysis**: Multi-step evaluation
7. **Keywords**: Domain terminology emphasis
8. **Wording**: Precise language use
9. **Few-shot prompting**: Examples-based learning

#### Performance Metrics
- **SRS drafting time**: 60-70% reduction vs entry-level engineers
- **Error detection**: Significantly accelerated with LLMs
- **GPT-4 superiority**: Outperforms CodeLlama for requirement rectification

#### Recommended Techniques
- **In-context learning**: Adapt to specific domain
- **Chain-of-thought templates**: Structured reasoning
- **Contextual anchoring**: Ground in project context
- **Persona conditioning**: Role-specific prompts
- **Iterative feedback cycles**: Detect → Correct → Validate

---

## 2. Interactive Clarification & AI Agent Workflows

### Resources

1. **[Agents: Workflow Patterns](https://ai-sdk.dev/docs/agents/workflows)**
   - Comprehensive agent workflow patterns
   - Design best practices

2. **[AI Agentic Workflows: Tutorial & Best Practices](https://fme.safe.com/guides/ai-agent-architecture/ai-agentic-workflows/)**
   - FME by Safe Software guide
   - Practical tutorial and implementation tips

3. **[What Are Agentic Workflows? (Weaviate)](https://weaviate.io/blog/what-are-agentic-workflows)**
   - Patterns, use cases, examples
   - Industry applications

4. **[Building Effective AI Agents (Anthropic)](https://www.anthropic.com/engineering/building-effective-agents)**
   - Official Anthropic engineering guide
   - Claude-specific best practices

5. **[AI Agent Workflow Design Patterns (Medium/Binome)](https://medium.com/binome/ai-agent-workflow-design-patterns-an-overview-cf9e1f609696)**
   - Comprehensive overview of patterns
   - Implementation strategies

6. **[Understanding AI Agents & Agentic Workflows (Dataiku)](https://www.dataiku.com/stories/detail/ai-agents/)**
   - Enterprise perspective
   - Data-centric workflows

### Core Workflow Patterns

#### 1. Sequential/Linear Workflows
- **Description**: Steps execute in predefined order
- **Data flow**: Each step's output → next step's input
- **Use case**: Clarification → Question Generation → Answer Recording → Report

#### 2. Routing Pattern
- **Description**: Model decides which path to take based on context
- **Intelligence**: Acts as smart router
- **Use case**: Route to specific dimension scanner based on requirement type

#### 3. Parallelization
- **Description**: Independent subtasks execute simultaneously
- **Performance**: Reduced overall execution time
- **Use case**: Scan all 11 dimensions in parallel

#### 4. Orchestrator-Worker
- **Description**: Primary model coordinates specialized workers
- **Specialization**: Each worker optimized for specific subtask
- **Use case**: Main agent delegates to dimension-specific scanners

#### 5. Reflection/Evaluation
- **Description**: Quality control steps assess results
- **Retry logic**: Adjusted parameters or corrective action
- **Use case**: Validate questions meet quality criteria, retry if needed

#### 6. Human-in-the-Loop (HITL)
- **Description**: AI routes to humans when needed
- **Guidance**: Humans provide feedback or clarification
- **Use case**: Interactive questioning with user confirmation

### Interactive Clarification Pattern (Synthesis)

**Definition**: Combination of Routing + HITL + Iterative Refinement

**Workflow**:
1. **Context Gathering**: Collect requirement materials
2. **Ambiguity Detection**: Scan for missing/unclear elements
3. **Question Generation**: Create high-impact questions
4. **User Interaction**: Present questions one-by-one
5. **Answer Recording**: Capture and validate responses
6. **Integration**: Update requirement documents
7. **Validation**: Verify completeness and consistency

**Key Characteristics**:
- **Sequential questioning**: One question at a time (avoid overwhelm)
- **Adaptive routing**: Follow-up questions based on previous answers
- **Quality gates**: Confidence scoring and threshold filtering
- **Feedback loops**: User can request clarification on questions

---

## 3. Applicability to /flow-clarify

### Direct Mappings

| Research Finding | Application to /flow-clarify |
|------------------|------------------------------|
| In-context learning | Provide spec-kit examples + CC-DevFlow conventions |
| Chain-of-thought prompting | Use structured reasoning for dimension analysis |
| Intermediate layer detection | Consider using Claude's thinking process |
| Orchestrator-Worker pattern | Main agent + 11 dimension-specific scanners |
| Human-in-the-Loop | Interactive questioning workflow |
| Reflection/Evaluation | Quality gates for question generation |
| Sequential workflow | One-question-at-a-time UX |
| Few-shot prompting | Show examples of good/bad clarifications |

### Recommended Architecture

```
/flow-clarify (Command)
   ↓
clarify-analyst (Main Agent)
   ↓
   ├─ Orchestrator Mode (Routing)
   │   ├─ dimension-scanner-01 (Functional Scope)
   │   ├─ dimension-scanner-02 (Data Model)
   │   ├─ ... (11 dimensions total)
   │   └─ dimension-scanner-11 (Placeholders)
   ↓
   ├─ Question Generator (Prioritization + Chain-of-thought)
   ↓
   ├─ Interactive Presenter (Sequential HITL)
   ↓
   └─ Report Writer (Integration + Validation)
```

### Configuration Recommendations

- **Model selection**:
  - Main orchestrator: `claude-sonnet-4-5`
  - Dimension scanners: `claude-haiku` (cost-effective)
  - Question generator: `claude-sonnet-4-5` (quality critical)

- **Tool access**:
  - Scanners: `["Read", "Grep", "Glob"]` (read-only)
  - Report writer: `["Write"]` (output only)

- **Permission mode**: `default` with `canUseTool` callback

- **Quality gates**:
  - Max 5 questions (quota limit)
  - Confidence threshold: 80% (filter low-impact)
  - Coverage requirement: 11 dimensions scanned

---

## 4. Next Steps for Research

### High-Priority WebFetch Targets
1. [Requirements Ambiguity Detection PDF](https://www.ipr.mdu.se/pdf_publications/7221.pdf)
2. [Building Effective AI Agents (Anthropic)](https://www.anthropic.com/engineering/building-effective-agents)
3. [Clarify When Necessary (OpenReview)](https://openreview.net/forum?id=XgdNdoZ1Hc)

### Low-Priority (Optional)
- Weaviate agentic workflows blog
- Medium design patterns article
- Dataiku enterprise workflows

---

**Status**: Guides indexed and analyzed
**Next**: WebFetch top 3 resources for detailed analysis
