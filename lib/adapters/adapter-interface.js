/**
 * Abstract class representing an Agent Adapter.
 * Adapters bridge the gap between cc-devflow and specific AI agent CLI tools.
 */
class AgentAdapter {
    constructor() {
        if (this.constructor === AgentAdapter) {
            throw new Error("Cannot instantiate abstract class AgentAdapter");
        }
    }

    /**
     * The unique name of the adapter (e.g., 'claude', 'codex').
     * @returns {string}
     */
    get name() {
        throw new Error("Method 'name' must be implemented.");
    }

    /**
     * The configuration folder name expected in the user's project (e.g., '.claude').
     * @returns {string}
     */
    get folder() {
        throw new Error("Method 'folder' must be implemented.");
    }

    /**
     * Detects if this adapter is applicable for the current environment.
     * Checks for folder existence, environment variables, or other indicators.
     * @returns {Promise<boolean>}
     */
    async detect() {
        throw new Error("Method 'detect()' must be implemented.");
    }

    /**
     * Executes a command using this adapter's underlying agent.
     * @param {string} command - The command to execute.
     * @param {string[]} args - Arguments for the command.
     * @param {Object} options - Execution options.
     * @returns {Promise<Object>} The result of the execution.
     */
    async execute(command, args = [], options = {}) {
        throw new Error("Method 'execute()' must be implemented.");
    }

    /**
     * Returns the capabilities of this adapter.
     * @returns {string[]} List of capabilities (e.g., 'shell', 'network').
     */
    get capabilities() {
        return [];
    }
}

module.exports = AgentAdapter;
