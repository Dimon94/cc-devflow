# TASKS: REQ-004 - Agent Adapter Architecture

**Status**: Planned
**EPIC**: [EPIC.md](file:///Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/devflow/requirements/REQ-004/EPIC.md)

---

## Phase 1: Setup & Infrastructure
*Goal: Initialize foundational structures and configuration.*

- [ ] **T001** [P] [Setup] Create config schema definition
  - File: `config/schema/adapters.schema.json` (or add to existing config schema)
  - Action: Define strict schema for `adapters.yml` (allow_shell, allow_network).

- [ ] **T002** [P] [Setup] Create default configuration
  - File: `config/adapters.yml`
  - Action: Create default config with secure defaults (preferred: null, policies: { allow_shell: false }).

---

## Phase 2: Foundational (Contracts & TDD) ⚠️
*Goal: Define interfaces and write failing tests for the contract.*

- [ ] **T003** [Setup] Define AgentAdapter Interface
  - File: `lib/adapters/adapter-interface.js` (and .d.ts)
  - Action: Implement the core `AgentAdapter` abstract class/interface from Tech Design.

- [ ] **T004** [US2] Create Test for Adapter Registry (Contract Test)
  - File: `test/adapters/registry.test.js`
  - Action: Write tests for `register`, `detect`, `select`. Test priority logic.
  - **Expectation**: Fails because Registry is not implemented.

- [ ] **T005** [US3] Create Security Policy Test
  - File: `test/adapters/security.test.js`
  - Action: Write tests attempting to use 'shell' capability when disabled in config.
  - **Expectation**: Fails.

- [ ] **T006** [US5] Create Performance Benchmark Test
  - File: `test/benchmarks/adapter-detection.test.js`
  - Action: Write test verifying `detect()` returns < 50ms and second call < 5ms.

---

## ⚠️ TEST VERIFICATION CHECKPOINT ⚠️
*Stop and Verify: All Phase 2 tests must exist and FAIL.*

---

## Phase 3: Story 2 & 3 - Registry & Security Core (MVP)
*Goal: Implement the Registry and Base Security mechanism.*

- [ ] **T007** [US2] Implement Adapter Registry
  - File: `lib/adapters/registry.js`
  - Action: Implement Singleton, `register()`, and `detectEnvironment()`.
  
- [ ] **T008** [US3] Implement Security Policy Check
  - File: `lib/adapters/registry.js` (or `security-guard.js`)
  - Action: Implement check against `config/adapters.yml` before returning adapter or executing command.

- [ ] **T009** [US2] Verify Registry Tests Pass
  - Action: Run `test/adapters/registry.test.js`.

---

## Phase 4: Story 1 - Adapter Implementations
*Goal: specific platform adapters.*

- [ ] **T010** [P] [US1] Implement Claude Adapter
  - File: `lib/adapters/claude-adapter.js`
  - Action: Implement `detect()` (check env vars) and `execute()`. Wrap existing logic.

- [ ] **T011** [P] [US1] Implement Codex Adapter (MVP)
  - File: `lib/adapters/codex-adapter.js`
  - Action: Implement basic `detect()` and `execute()`.

- [ ] **T012** [US1] Integrate Registry into CLI Entry Point
  - File: `bin/cc-devflow.js` (or equivalent entry)
  - Action: Replace direct logic with `Registry.getSelectedAdapter().execute()`.

---

## Phase 5: Story 4 & 5 - Polish & Observability
*Goal: Configuration overrides and logging.*

- [ ] **T013** [US4] Implement Config Override Logic
  - File: `lib/adapters/registry.js`
  - Action: Ensure `adapters.preferred` config takes precedence.

- [ ] **T014** [US5] Implement Structural Logging
  - File: `lib/adapters/logger.js` (or util)
  - Action: Ensure logs follow JSON schema defined in Tech Design.

---

## Dependencies
1.  T003 (Interface) -> all other tasks.
2.  T007 (Registry) -> T012 (Integration).
3.  T010, T011 (Adapters) -> can be parallel.

## Parallel Execution
- T010 (Claude Adapter) and T011 (Codex Adapter) are independent.
- T001 (Schema) and T003 (Interface) are independent.

## Constitution Check
- [x] **Setup**: Configuration separated from logic.
- [x] **TDD**: Tests defined in Phase 2 before Implementation in Phase 3.
- [x] **Security**: Security policy implementation is a primary task (T008).
