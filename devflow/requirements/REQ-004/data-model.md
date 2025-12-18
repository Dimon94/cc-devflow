# Data Model: REQ-004

## 1. Configuration Schemas

### 1.1 Adapter Configuration (`config/adapters.yml`)

```yaml
type: object
properties:
  adapters:
    type: object
    properties:
      preferred:
        type: string
        description: "Explicitly force an adapter by name (e.g. 'claude', 'codex')"
      policies:
        type: object
        properties:
          allow_shell:
            type: boolean
            default: false
            description: "Allow execution of shell commands"
          allow_network:
            type: boolean
            default: false
            description: "Allow network access"
          audit_log_path:
            type: string
            description: "Path to write audit logs"
    required: ["policies"]
```

## 2. Runtime Structures

### 2.1 Adapter Metadata

```typescript
interface AdapterMetadata {
  name: string;          // e.g. "claude-code"
  version: string;       // e.g. "1.0.0"
  folder: string;        // e.g. ".claude" or ".codex"
  capabilities: Capability[];
}

type Capability = "shell" | "filesystem" | "network" | "browser";
```

### 2.2 Execution Context

```typescript
interface ExecutionContext {
  cwd: string;
  env: Record<string, string>;
  interactive: boolean;
  adapter: AdapterMetadata;
}
```

## 3. Storage

No persistent database storage required for this requirement. Configuration is file-based (`adapters.yml`).
