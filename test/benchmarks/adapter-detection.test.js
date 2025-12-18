const AdapterRegistry = require('../../lib/adapters/registry');

describe('Performance Benchmarks', () => {
    let registry;

    beforeEach(() => {
        registry = AdapterRegistry.getInstance();
        registry.reset();
        // Simulate some adapters
        registry.register({
            name: 'fast',
            folder: '.fast',
            detect: async () => true,
            capabilities: []
        });
    });

    test('detection should be under 50ms', async () => {
        const start = process.hrtime();
        await registry.detectEnvironment();
        const end = process.hrtime(start);
        const timeMs = (end[0] * 1000 + end[1] / 1e6);
        expect(timeMs).toBeLessThan(50);
    });

    test('cached detection should be under 5ms', async () => {
        await registry.detectEnvironment(); // Prime cache

        const start = process.hrtime();
        await registry.detectEnvironment();
        const end = process.hrtime(start);
        const timeMs = (end[0] * 1000 + end[1] / 1e6);
        expect(timeMs).toBeLessThan(5);
    });
});
