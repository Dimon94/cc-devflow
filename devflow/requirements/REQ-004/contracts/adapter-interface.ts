/**
 * REQ-004: Agent Adapter Interface Contract
 */

export interface AdapterMetadata {
    name: string;
    version: string;
    folder: string; // Directory name, e.g. ".claude" or ".codex"
    capabilities: Capability[];
}

export type Capability = 'shell' | 'filesystem' | 'network' | 'browser';

export interface CommandResult {
    success: boolean;
    output: string;
    error?: string;
    metadata?: Record<string, any>;
}

export interface AgentAdapter {
    /**
     * Unique name of the adapter (e.g., 'claude', 'codex')
     */
    name: string;

    /**
     * The configuration folder used by this agent (e.g., '.claude')
     */
    folder: string;

    /**
     * List of capabilities supported by this adapter
     */
    capabilities: Capability[];

    /**
     * Detect if the current environment matches this adapter.
     * Must return within 50ms and cache the result.
     */
    detect(): Promise<boolean>;

    /**
     * Execute a command in this environment.
     */
    executeCommand(command: string, args: string[], cwd: string): Promise<CommandResult>;
}

export interface AdapterRegistry {
    register(adapter: AgentAdapter): void;
    detectEnvironment(): Promise<AgentAdapter>;
    getSelectedAdapter(): AgentAdapter;
}
