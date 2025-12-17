# Quickstart: REQ-004 Agent Adapter Architecture

## 1. Environment Setup

### Prerequisites
- Node.js >= 18
- `npm` or `pnpm`

### Installation
```bash
npm install
```

## 2. Verification Steps

### 2.1 Validate TypeScript Contracts
```bash
npx tsc --noEmit devflow/requirements/REQ-004/contracts/adapter-interface.ts
```

### 2.2 Run Adapter Tests (Once Implemented)
```bash
npm test test/adapters/registry.test.js
```

### 2.3 Verify Spec-Kit Alignment
Ensure you have access to `spec-kit` reference material if needed.
The adapter logic should respect the `.claude/` vs `.codex/` directory convention.

## 3. Configuration
Create `config/adapters.yml` to test overrides:
```yaml
adapters:
  preferred: "codex"
  policies:
    allow_shell: true
```
