const AdapterRegistry = require('../../lib/adapters/registry');
const AgentAdapter = require('../../lib/adapters/adapter-interface');

// Mock adapter for testing
class MockAdapter extends AgentAdapter {
    constructor(name = 'mock') {
        super();
        this._name = name;
    }
    get name() { return this._name; }
    get folder() { return `.${this._name}`; }
    async detect() { return true; }
    async execute(cmd) { return { output: `${this._name}: ${cmd}` }; }
    get capabilities() { return ['shell']; }
}

describe('AdapterRegistry', () => {
    let registry;

    beforeEach(() => {
        // Reset singleton if possible, or create new instance logic validation
        registry = AdapterRegistry.getInstance();
        registry.reset(); // Need to implement reset for testing
    });

    test('should register and retrieve an adapter', () => {
        const adapter = new MockAdapter('test-adapter');
        registry.register(adapter);
        expect(registry.getAdapter('test-adapter')).toBe(adapter);
    });

    test('should detect environment and select adapter', async () => {
        const adapter = new MockAdapter('auto-detect');
        registry.register(adapter);

        // Mock environment detection logic if complex, but here simplistic
        const selected = await registry.detectEnvironment();
        expect(selected).toBe(adapter);
    });

    test('should respect preferred adapter config', async () => {
        const adapter1 = new MockAdapter('adapter1');
        const adapter2 = new MockAdapter('adapter2');
        registry.register(adapter1);
        registry.register(adapter2);

        registry.setConfig({ preferred: 'adapter2' });
        const selected = await registry.detectEnvironment();
        expect(selected.name).toBe('adapter2');
    });

    test('benchmark: detection should be fast', async () => {
        const start = process.hrtime();
        await registry.detectEnvironment();
        const end = process.hrtime(start);
        const timeInMs = (end[0] * 1000 + end[1] / 1e6);
        expect(timeInMs).toBeLessThan(50);
    });

    // spec-kit pattern validation
    test('should have metadata-based configuration support', () => {
        expect(AdapterRegistry.AGENT_CONFIG).toBeDefined();
        expect(AdapterRegistry.AGENT_CONFIG['claude']).toBeDefined();
        expect(AdapterRegistry.AGENT_CONFIG['codex']).toBeDefined();
    });

    test('reset should clear cached selection', async () => {
        const adapter1 = new MockAdapter('one');
        registry.register(adapter1);
        const selected1 = await registry.detectEnvironment();
        expect(selected1.name).toBe('one');

        registry.reset();
        const adapter2 = new MockAdapter('two');
        registry.register(adapter2);
        const selected2 = await registry.detectEnvironment();
        expect(selected2.name).toBe('two');
    });
});
