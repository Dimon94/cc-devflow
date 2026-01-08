# CC-DevFlow Rationalization Library

> **Version**: 1.0.0
> **Purpose**: Centralized defense against AI Agent rationalization attempts
> **Source**: Extracted from superpowers TDD skill + CC-DevFlow operational experience

---

## How to Use This Library

When an agent is about to violate a Constitutional Article, they will often produce
rationalizations. This library provides pre-crafted responses.

**Pattern**:
1. Agent produces excuse
2. Lookup excuse in relevant Article section
3. Respond with "Reality" column
4. If not found, add new rationalization to library

---

## Article I: Quality First - Rationalization Table

### Iron Law
```
NO PARTIAL IMPLEMENTATION - COMPLETE OR NOTHING
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "This is simplified for now" | CONSTITUTIONAL VIOLATION. Complete it or don't ship it. |
| "Will complete in v2" | Future versions don't exist. Implement fully now. |
| "Core logic works, edge cases later" | Edge cases ARE the implementation. No later. |
| "Time constraint" | Ship later, ship complete. Never ship incomplete. |
| "MVP approach" | MVP = Minimum VIABLE. Viable means works completely. |
| "Placeholder for now" | Placeholders = technical debt = future bugs. |
| "I'll fix it before PR" | Fix it NOW. Not later. Now. |
| "80% is good enough" | 80% = broken for 20% of users. Not good enough. |
| "Works on my machine" | Production is not your machine. Test properly. |

---

## Article II: Architectural Consistency - Rationalization Table

### Iron Law
```
REUSE EXISTING CODE - NO DUPLICATION
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Faster to rewrite" | Faster now = slower forever. Find and reuse. |
| "That code is messy" | Refactor it. Don't duplicate it. |
| "Slightly different use case" | Extract common, parameterize difference. |
| "I don't have time to search" | Searching takes 5 min. Maintaining duplicates takes forever. |
| "The other code might change" | Good. Your copy will be outdated. Use shared version. |
| "It's just a small function" | Small duplications compound. No exceptions. |
| "I understand my version better" | Understand the shared version. That's your job. |

---

## Article III: Security First - Rationalization Table

### Iron Law
```
NO HARDCODED SECRETS - ENVIRONMENT VARIABLES ONLY
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "It's just for testing" | Commits are forever. Use env vars even for tests. |
| "I'll remove it before commit" | You won't. You'll forget. Use env vars. |
| "It's not a real secret" | Any credential is a real secret. Treat it as such. |
| "Local development only" | Local becomes production. Start secure. |
| "Nobody will see the repo" | Repos get shared. Git history is permanent. |
| "I'll rotate it later" | Rotation doesn't erase history. Never commit secrets. |
| "It's encrypted" | Encrypted secrets in code are still secrets in code. |

---

## Article IV: Performance Accountability - Rationalization Table

### Iron Law
```
NO RESOURCE LEAKS - ALWAYS CLEANUP
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Garbage collector will handle it" | GC doesn't close files/connections. Explicit cleanup. |
| "Small leak, won't matter" | Small leaks become big crashes. Fix now. |
| "It's a short-lived process" | Process lifetime is not your decision. Always cleanup. |
| "I'll add cleanup later" | Later = never. Add cleanup with creation. |
| "Framework handles it" | Verify that. Don't assume. |
| "Only happens in edge case" | Edge cases run in production. Handle them. |

---

## Article V: Maintainability - Rationalization Table

### Iron Law
```
NO DEAD CODE - USE IT OR DELETE IT
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Might need it later" | Git history exists. Delete now, retrieve if needed. |
| "It's just commented out" | Commented code = noise. Delete it. |
| "Reference for future work" | Write docs. Don't keep dead code. |
| "Someone else might need it" | They'll write their own. Delete yours. |
| "Too risky to delete" | Tests exist. If tests pass after delete, it's safe. |
| "I worked hard on this" | Sunk cost fallacy. Delete it. |

---

## Article VI: Test-First Development - Rationalization Table

### Iron Law
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Tests-first = "what should this do?" |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |
| "Deleting X hours is wasteful" | Sunk cost fallacy. Keeping unverified code is technical debt. |
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "Test hard = design unclear" | Listen to test. Hard to test = hard to use. |
| "TDD slows me down" | TDD faster than debugging. Pragmatic = test-first. |
| "This is different because..." | No. This is rationalization. Follow the law. |
| "Spirit not letter" | Violating letter IS violating spirit. No loopholes. |
| "I'm being pragmatic, not dogmatic" | TDD IS pragmatic. Shortcuts = debugging in production = slower. |
| "Just this once" | No exceptions. Rules exist for this exact moment. |
| "Existing code has no tests" | You're improving it. Add tests for existing code. |
| "Manual test faster" | Manual doesn't prove edge cases. You'll re-test every change. |

---

## Article VII: Simplicity Gate - Rationalization Table

### Iron Law
```
MAXIMUM 3 PROJECTS - JUSTIFY ANY ADDITIONAL COMPLEXITY
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Microservices are better" | For your scale? Monolith is simpler. Start there. |
| "Future scalability" | YAGNI. Scale when you need to. |
| "Separation of concerns" | Modules separate concerns. Projects add overhead. |
| "Team autonomy" | Autonomy ≠ architectural chaos. Coordinate. |
| "Best practices say..." | Best practices assume scale you don't have. |
| "We might need it" | Might ≠ do. Build for now, refactor when needed. |

---

## Article VIII: Anti-Abstraction - Rationalization Table

### Iron Law
```
USE FRAMEWORKS DIRECTLY - NO UNNECESSARY WRAPPERS
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Abstraction for future flexibility" | YAGNI. You won't switch frameworks. |
| "Cleaner interface" | Framework interface IS clean. Learn it. |
| "Hide implementation details" | Framework IS implementation. Don't hide it. |
| "Consistent with other projects" | Consistency ≠ unnecessary abstraction. |
| "Easier testing" | Mock the framework. Don't wrap it. |
| "Best practice pattern" | Pattern ≠ always apply. Use judgment. |

---

## Article IX: Integration-First Testing - Rationalization Table

### Iron Law
```
CONTRACTS FIRST - REAL ENVIRONMENTS
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "Unit tests are faster" | Fast wrong tests waste time. Integration tests catch real bugs. |
| "Mocks are simpler" | Mocks hide integration issues. Real databases find them. |
| "CI is slow" | CI is cheap. Production bugs are expensive. |
| "Docker is complex" | Docker is simpler than debugging integration issues. |
| "In-memory database works" | In-memory differs from production. Test with real DB. |

---

## Article X: Requirement Boundary - Rationalization Table

### Iron Law
```
IMPLEMENT WHAT'S REQUESTED, NOTHING MORE
```

### Rationalizations

| Excuse | Reality |
|--------|---------|
| "User might need this later" | User didn't ask. Don't add. YAGNI. |
| "It's just a small addition" | Small additions compound. Scope creep. |
| "This is a natural extension" | Extensions require explicit request. |
| "Would be nice to have" | Nice ≠ required. Focus on requirements. |
| "While I'm here anyway" | Stay on task. Create separate requirement. |
| "It's only 5 more lines" | 5 lines = testing + docs + maintenance. Not 5 lines. |
| "User will thank me" | User will thank you for ON-TIME, IN-SCOPE delivery. |
| "I'm being helpful" | Helpful = following spec. Unhelpful = scope creep. |
| "It's best practice" | Best practice: implement what's requested. |
| "Future-proofing" | Future-proofing = over-engineering = waste. |
| "Obvious feature" | If obvious, it should be in spec. Not in spec = don't do. |

---

## Cross-Article Rationalizations

These excuses appear across multiple Articles:

| Excuse | Reality | Articles |
|--------|---------|----------|
| "Just this once" | No exceptions. Rules exist for this exact moment. | All |
| "I'm being pragmatic" | Pragmatic = following rules. Shortcuts = technical debt. | All |
| "Time is tight" | Rushed work = bugs = more time spent debugging. | All |
| "It's obvious it works" | Nothing is obvious. Prove with tests. | I, VI |
| "Everyone does this" | Everyone is wrong. We do it right. | All |
| "Senior says skip it" | Constitution > authority. No skipping. | All |
| "Emergency situation" | Emergencies especially need rules. | III, VI |
| "This is different" | It's not different. Follow the rules. | All |
| "Spirit over letter" | Violating letter IS violating spirit. | VI |
| "Being practical" | Practical = disciplined. Shortcuts = impractical. | All |

---

## Adding New Rationalizations

When you encounter a new excuse not in this library:

1. **Capture verbatim** - Record exact words used
2. **Identify Article** - Which Constitutional Article does it violate?
3. **Craft Reality response** - Brief, direct, no compromise
4. **Add to library** - PR to update this document
5. **Update guardrails** - Add pattern to relevant skill if blocking needed

---

## Integration Points

This library is consumed by:
- `.claude/rules/project-constitution.md` (inline tables per Article)
- `.claude/agents/*.md` (relevant tables per agent role)
- `.claude/skills/devflow-tdd-enforcer/SKILL.md`
- `.claude/skills/constitution-guardian/SKILL.md`
- `tests/pressure-scenarios/` (test scenarios)

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
