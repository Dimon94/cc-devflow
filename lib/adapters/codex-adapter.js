const fs = require('fs');
const path = require('path');
const AgentAdapter = require('./adapter-interface');

class CodexAdapter extends AgentAdapter {
    get priority() {
        for (const key of Object.keys(process.env)) {
            if (key.startsWith('CODEX_')) return 100;
        }
        return 0;
    }

    get name() {
        return 'codex';
    }

    get folder() {
        return '.codex';
    }

    async detect() {
        for (const key of Object.keys(process.env)) {
            if (key.startsWith('CODEX_')) return true;
        }

        const configPath = path.resolve(process.cwd(), this.folder);
        return fs.existsSync(configPath);
    }

    async execute(command, args = [], options = {}) {
        console.log(`[CodexAdapter] Executing: ${command} ${args.join(' ')}`);
        return { code: 0, msg: 'Codex executed (simulated)' };
    }

    get capabilities() {
        return ['code-generation'];
    }
}

module.exports = CodexAdapter;
