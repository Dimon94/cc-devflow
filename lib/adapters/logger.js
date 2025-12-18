/**
 * Structural Logger for Adapter System.
 * Outputs JSON format for machine readability and better observability.
 */
class Logger {
    constructor() {
        this.enabled = true;
    }

    log(level, message, context = {}) {
        if (!this.enabled) return;

        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...context
        };

        console.log(JSON.stringify(entry));
    }

    info(message, context) {
        this.log('INFO', message, context);
    }

    warn(message, context) {
        this.log('WARN', message, context);
    }

    error(message, context) {
        this.log('ERROR', message, context);
    }

    debug(message, context) {
        if (process.env.DEBUG) {
            this.log('DEBUG', message, context);
        }
    }
}

module.exports = new Logger();
