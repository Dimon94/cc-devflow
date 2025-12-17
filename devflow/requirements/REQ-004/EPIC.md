# EPIC: REQ-004 - Agent Adapter Architecture

**Status**: In Progress
**Owner**: cc-devflow Team
**Type**: Architecture
**PRD**: [PRD.md](file:///Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/devflow/requirements/REQ-004/PRD.md)
**Tech Design**: [TECH_DESIGN.md](file:///Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/devflow/requirements/REQ-004/TECH_DESIGN.md)

---

## 1. Phase -1: Constitutional Gates

*Must be verified BEFORE technical implementation begins.*

### Article VII: Simplicity Gate
- [x] **Project Count ≤ 3**: Core Logic (Adapter/Registry) + Claude Adapter + Codex Adapter.
- [x] **No Future Proofing**: Focusing ONLY on Claude and Codex CLI. No "generic plugin system" beyond what is needed.
- [x] **Minimal Dependencies**: Only standard Node.js libs + existing project deps.

### Article VIII: Anti-Abstraction Gate
- [x] **Direct Usage**: `AgentAdapter` interface serves specific, immediate need.
- [x] **Single Model**: `AdapterRegistry` is the single source of truth.
- [x] **No unnecessary interfaces**: Contract is minimal (`detect`, `execute`).

### Article IX: Integration-First Gate
- [x] **Contracts First**: `adapter-interface.ts` defined in Tech Design.
- [x] **Contract Tests**: Planned as Phase 2 priority.
- [x] **Real Environment**: Testing requires running against actual CLI environments.

### Complexity Tracking
| Decision | Rationale | Complexity Score (1-10) |
|----------|-----------|-------------------------|
| Strategy Pattern | Needed for runtime switching | 3 |
| Registry Singleton | Centralized management | 2 |
| **Total** | | **5** (Low) |

---

## 2. Success Metrics

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SM-001 | Claude Code Compatibility | 100% Pass | Existing Regression Suite |
| SM-002 | Platform Support | 2 Platforms | Manual Verification (Claude + Codex) |
| SM-003 | Detection Latency | < 50ms | `Registry.detect()` benchmark |
| SM-004 | Security | 0 Unaudited Ops | Audit Log Verification |

---

## 3. Technical Approach (Summary)

Based on [TECH_DESIGN.md](file:///Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/devflow/requirements/REQ-004/TECH_DESIGN.md):

1.  **Core Interface**: `lib/adapters/adapter-interface.js` defining the `AgentAdapter` contract.
2.  **Registry**: `lib/adapters/registry.js` for discovery and selection.
3.  **Config**: `config/adapters.yml` for policy and overrides.
4.  **Adapters**:
    - `ClaudeAdapter`: Wraps existing Claude Code interactions.
    - `CodexAdapter`: MVP implementation for Codex CLI.

---

## 4. Rollout Plan

- **Phase 1: Foundation**: Create Interface, Registry, and Config schema.
- **Phase 2: Adapters**: Implement Claude (migrate) and Codex (new).
- **Phase 3: Integration**: Switch Command entry points to use Registry.
- **Phase 4: Verification**: full regression test.

---

## 5. Constitution Check (Epic Level)

- [x] **II.1 No Duplication**: Platform logic encapsulated in Adapters.
- [x] **III.3 Least Privilege**: Default deny for Shell/Network capabilities.
- [x] **X.3 Independent Test**: Tasks organized by User Story with independent verification.
