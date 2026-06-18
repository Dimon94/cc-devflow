# Hard Deny Only Definite Workflow Violations

Pre-tool runtime gates will hard-deny only definite workflow violations: production code or test edits before a frozen task contract, manual corruption or bypass of durable workflow truth, and delivery actions such as commit, push, PR creation, or merge before fresh verification and explicit delivery mode. Other writes stay silent and proceed, because advisory noise would degrade the harness and broad write blocking would lock the planning and evidence-writing paths that cc-devflow itself requires.
