const logger = require('./logger');

class AdapterRegistry {
    constructor() {
        if (AdapterRegistry.instance) {
            return AdapterRegistry.instance;
        }
        this._adapters = new Map();
        this._config = { policies: { allow_shell: false, allow_network: false } };
        this._cachedSelection = null;
        AdapterRegistry.instance = this;
    }

    static getInstance() {
        if (!AdapterRegistry.instance) {
            AdapterRegistry.instance = new AdapterRegistry();
        }
        return AdapterRegistry.instance;
    }

    /**
     * Reset singleton for testing.
     */
    reset() {
        this._adapters.clear();
        this._config = { policies: { allow_shell: false, allow_network: false } };
        this._cachedSelection = null;
    }

    setConfig(config) {
        const next = config && typeof config === 'object' ? config : {};
        const policies = next.policies && typeof next.policies === 'object' ? next.policies : {};
        this._config = {
            ...next,
            policies: {
                allow_shell: false,
                allow_network: false,
                ...policies
            }
        };
        this._cachedSelection = null;
    }

    getAdapter(name) {
        return this._adapters.get(name);
    }

    register(adapter) {
        // If it's a class, instantiate it? Or assume instance?
        // Tech design says register(adapter). Let's support instances.
        if (!adapter.name) throw new Error("Adapter must have a name");
        this._adapters.set(adapter.name, adapter);
        this._cachedSelection = null;
    }

    async detectEnvironment() {
        // 1. Check override
        if (this._config.preferred) {
            const preferred = this._adapters.get(this._config.preferred);
            if (preferred) {
                this._cachedSelection = preferred;
                return preferred;
            }
            logger.warn('Preferred adapter not found', { preferred: this._config.preferred });
        }

        // 2. Detection loop
        // Sort adapters? For now iteration order.
        // Spec-kit pattern: could iterate AGENT_CONFIG keys, but we need registered instances to detect?
        // Or does registry instantiate them?
        // Current task T007 implies "Implement Singleton, register(), and detectEnvironment()".
        // We will iterate registered adapters.

        if (this._cachedSelection) return this._cachedSelection;

        const detected = [];
        for (const adapter of this._adapters.values()) {
            const isDetected = await adapter.detect();
            if (isDetected) detected.push(adapter);
        }

        if (detected.length === 0) return null;

        detected.sort((a, b) => {
            const aPriority = typeof a.priority === 'number' ? a.priority : 0;
            const bPriority = typeof b.priority === 'number' ? b.priority : 0;
            if (aPriority !== bPriority) return bPriority - aPriority;
            return String(a.name).localeCompare(String(b.name));
        });

        if (detected.length > 1) {
            logger.warn('Multiple adapters detected', {
                candidates: detected.map((a) => a.name),
                selected: detected[0].name,
                reason: 'priority/order'
            });
        }

        this._cachedSelection = detected[0];
        return detected[0];
    }

    /**
     * Execute command via selected/specific adapter, strictly enforcing security policies.
     */
    async executeCommand(command, args = [], options = {}) {
        // Mock selection for now, or use detected
        let adapter = options.adapter ? this.getAdapter(options.adapter) : await this.detectEnvironment();
        if (!adapter) throw new Error("No adapter selected/detected");

        // Security Check
        const policies = this._config.policies || {};
        const adapterCapabilities = adapter.capabilities || [];
        const requiredCapabilities = Array.isArray(options.requiredCapabilities)
            ? options.requiredCapabilities
            : [];

        if (requiredCapabilities.includes('shell') && !policies.allow_shell) {
            throw new Error('Capability denied: shell');
        }

        if (requiredCapabilities.includes('network') && !policies.allow_network) {
            throw new Error('Capability denied: network');
        }

        for (const capability of requiredCapabilities) {
            if (!adapterCapabilities.includes(capability)) {
                throw new Error(`Adapter missing capability: ${capability}`);
            }
        }

        return adapter.execute(command, args, options);
    }
}

// spec-kit pattern: Metadata-driven configuration for supported agents
// This can be used to auto-register or suggest adapters.
AdapterRegistry.AGENT_CONFIG = {
    "claude": {
        "name": "Claude Code",
        "folder": ".claude",
        "install_url": "https://docs.anthropic.com/en/docs/claude-code/setup",
        "requires_cli": true
    },
    "codex": {
        "name": "Codex CLI",
        "folder": ".codex",
        "install_url": "https://github.com/openai/codex",
        "requires_cli": true
    }
};

module.exports = AdapterRegistry;
