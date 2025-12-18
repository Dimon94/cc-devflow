const AdapterRegistry = require('../../lib/adapters/registry');
const AgentAdapter = require('../../lib/adapters/adapter-interface');

class ShellAdapter extends AgentAdapter {
    get name() { return 'shell-adapter'; }
    get folder() { return '.shell'; }
    async detect() { return true; }
    async execute(cmd) { return { output: 'executed' }; }
    get capabilities() { return ['shell']; }
}

describe('Security Policies', () => {
    let registry;

    beforeEach(() => {
        registry = AdapterRegistry.getInstance();
        registry.reset();
    });

    test('should block shell execution if disabled in config', async () => {
        registry.setConfig({
            policies: { allow_shell: false }
        });
        const adapter = new ShellAdapter();
        registry.register(adapter);

        const selected = await registry.detectEnvironment();
        expect(selected).toBe(adapter);

        await expect(
            registry.executeCommand('ls', [], { requiredCapabilities: ['shell'] })
        ).rejects.toThrow('Capability denied: shell');
    });

    test('should allow shell execution if permitted', async () => {
        registry.setConfig({
            policies: { allow_shell: true }
        });
        const adapter = new ShellAdapter();
        registry.register(adapter);

        await expect(
            registry.executeCommand('ls', [], { requiredCapabilities: ['shell'] })
        ).resolves.not.toThrow();
    });

    test('should allow command that does not require shell even if adapter has shell capability', async () => {
        registry.setConfig({
            policies: { allow_shell: false }
        });
        const adapter = new ShellAdapter();
        registry.register(adapter);

        await expect(
            registry.executeCommand('help', [], { requiredCapabilities: [] })
        ).resolves.not.toThrow();
    });
});
