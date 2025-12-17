/**
 * Runtime configuration validator using Zod.
 * Ensures adapters.yml conforms to expected schema with secure defaults.
 */
const { z } = require('zod');

// ============================================================================
// Schema Definition
// ============================================================================

const PoliciesSchema = z.object({
    allow_shell: z.boolean().default(false),
    allow_network: z.boolean().default(false),
    audit_log_path: z.string().optional()
}).strict();

const AdaptersConfigSchema = z.object({
    preferred: z.string().nullable().optional().default(null),
    policies: PoliciesSchema.default({})
}).strict();

const RootConfigSchema = z.object({
    adapters: AdaptersConfigSchema.default({})
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Parse and validate the raw YAML config object.
 * Returns validated config with defaults applied.
 * 
 * @param {unknown} rawConfig - Raw parsed YAML object
 * @returns {{ success: true, data: object } | { success: false, error: string }}
 */
function validateConfig(rawConfig) {
    const result = RootConfigSchema.safeParse(rawConfig ?? {});

    if (!result.success) {
        const issues = result.error.issues
            .map(i => `  - ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        return {
            success: false,
            error: `Configuration validation failed:\n${issues}`
        };
    }

    return { success: true, data: result.data };
}

/**
 * Get default config when file is missing or empty.
 * 
 * @returns {object} Default configuration
 */
function getDefaultConfig() {
    return RootConfigSchema.parse({});
}

module.exports = {
    validateConfig,
    getDefaultConfig,
    // Export schemas for testing
    AdaptersConfigSchema,
    RootConfigSchema
};
