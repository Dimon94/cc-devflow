#!/usr/bin/env node

const AdapterRegistry = require('../lib/adapters/registry');
const ClaudeAdapter = require('../lib/adapters/claude-adapter');
const CodexAdapter = require('../lib/adapters/codex-adapter');
const { validateConfig, getDefaultConfig } = require('../lib/adapters/config-validator');
const logger = require('../lib/adapters/logger');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

async function main() {
    try {
        // 1. Initialize Registry
        const registry = AdapterRegistry.getInstance();

        // 2. Register known adapters
        registry.register(new ClaudeAdapter());
        registry.register(new CodexAdapter());

        // 3. Load and Validate Config
        let config = getDefaultConfig();
        const configPath = path.resolve(__dirname, '../config/adapters.yml');

        if (fs.existsSync(configPath)) {
            try {
                const fileContents = fs.readFileSync(configPath, 'utf8');
                const rawConfig = yaml.load(fileContents);
                const result = validateConfig(rawConfig);

                if (result.success) {
                    config = result.data;
                    logger.debug('Config loaded', { path: configPath });
                } else {
                    logger.error('Config validation failed', { error: result.error });
                    process.exit(1);
                }
            } catch (e) {
                logger.warn('Failed to load config, using defaults', { error: e.message });
            }
        }

        registry.setConfig(config.adapters);

        // 4. Parse Command
        // Usage: cc-devflow <command> [args...]
        const [, , command, ...args] = process.argv;

        if (!command) {
            logger.info('Usage: cc-devflow <command> [args...]');
            process.exit(0);
        }

        // 5. Detect & Execute
        // Note: executeCommand will auto-detect if no adapter specified
        logger.info('Processing command', { command });

        try {
            const result = await registry.executeCommand(command, args);
            // If result has output/code, handle it. 
            // Claude adapter pipes to stdio, so result might be just an exit code.
            if (result && result.msg) {
                logger.info('Command completed', { msg: result.msg, code: result.code });
            }
            process.exit(result.code || 0);

        } catch (err) {
            logger.error('Execution failed', { error: err.message });
            process.exit(1);
        }

    } catch (error) {
        logger.error('Fatal error', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

main();
