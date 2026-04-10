const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const AgentAdapter = require('./adapter-interface');

class ClaudeAdapter extends AgentAdapter {
    get name() {
        return 'claude';
    }

    get folder() {
        return '.claude';
    }

    /**
     * Detects if the current environment is set up for Claude.
     * Checks for .claude directory or ANTHROPIC_API_KEY env var.
     */
    async detect() {
        // 1. Check for directory presence
        const configPath = path.resolve(process.cwd(), this.folder);
        if (fs.existsSync(configPath)) {
            return true;
        }

        // 2. Check for environment variable
        if (process.env.ANTHROPIC_API_KEY) {
            return true;
        }

        return false;
    }

    /**
     * Executes a command using the 'claude' CLI tool.
     * Assumes 'claude' is in the PATH or handled via `npx claude`.
     * For MVP we assume it's installed globally or accessible.
     */
    async execute(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            // In a real scenario, we might want to sanitize input or map commands 
            // from our internal schema to claude-code's CLI schema.
            // For now, we pass through.

            const cliCmd = 'claude'; // Or 'npx', ['claude', ...args]
            const cliArgs = [command, ...args];

            const child = spawn(cliCmd, cliArgs, {
                stdio: 'inherit',
                shell: false,
                ...options
            });

            child.on('error', (err) => {
                reject(err);
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ code, msg: 'Success' });
                } else {
                    resolve({ code, msg: `Exited with code ${code}` }); // Or reject?
                }
            });
        });
    }

    get capabilities() {
        // Claude code is powerful, has shell and network usually.
        return ['shell', 'network', 'filesystem'];
    }
}

module.exports = ClaudeAdapter;
