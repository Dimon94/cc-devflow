/**
 * T012: Transformer Tests
 * Tests for placeholder expansion and argument mapping
 * Expected: All tests FAIL (transformer not implemented)
 */

// ============================================================
// Transformer imports - will fail until lib/compiler/transformer.js exists
// ============================================================
let transformer;
let errors;
try {
  transformer = require('../../lib/compiler/transformer.js');
  errors = require('../../lib/compiler/errors.js');
} catch (e) {
  transformer = null;
  errors = null;
}

// Sample CommandIR for testing
const createTestIR = (overrides = {}) => ({
  source: {
    path: '/test/flow-test.md',
    filename: 'flow-test',
    hash: 'sha256:abc123'
  },
  frontmatter: {
    name: 'flow-test',
    description: 'Test command',
    scripts: {
      prereq: '.claude/scripts/check-prerequisites.sh',
      validate: '.claude/scripts/validate.sh'
    },
    ...overrides.frontmatter
  },
  body: overrides.body || 'Run {SCRIPT:prereq} and validate with {SCRIPT:validate}',
  placeholders: overrides.placeholders || [
    { type: 'SCRIPT', raw: '{SCRIPT:prereq}', alias: 'prereq', position: { start: 4, end: 19 } },
    { type: 'SCRIPT', raw: '{SCRIPT:validate}', alias: 'validate', position: { start: 40, end: 57 } }
  ]
});

describe('Transformer Module', () => {
  beforeEach(() => {
    if (!transformer) {
      throw new Error('transformer.js not implemented');
    }
  });

  // ----------------------------------------------------------
  // AC1: {SCRIPT:prereq} expanded to "bash .claude/scripts/..."
  // ----------------------------------------------------------
  describe('AC1: SCRIPT placeholder expansion', () => {
    it('should expand {SCRIPT:prereq} to bash path', () => {
      const ir = createTestIR({
        body: 'Run {SCRIPT:prereq}',
        placeholders: [
          { type: 'SCRIPT', raw: '{SCRIPT:prereq}', alias: 'prereq', position: { start: 4, end: 19 } }
        ]
      });
      const result = transformer.transformForPlatform(ir, 'codex');
      expect(result.body).toContain('bash .claude/scripts/check-prerequisites.sh');
      expect(result.body).not.toContain('{SCRIPT:prereq}');
    });

    it('should expand multiple {SCRIPT:*} placeholders', () => {
      const ir = createTestIR();
      const result = transformer.transformForPlatform(ir, 'codex');
      expect(result.body).toContain('bash .claude/scripts/check-prerequisites.sh');
      expect(result.body).toContain('bash .claude/scripts/validate.sh');
      expect(result.body).not.toContain('{SCRIPT:');
    });
  });

  // ----------------------------------------------------------
  // AC2: $ARGUMENTS -> {{args}} for Qwen
  // ----------------------------------------------------------
  describe('AC2: $ARGUMENTS -> {{args}} for Qwen', () => {
    it('should map $ARGUMENTS to {{args}} for Qwen', () => {
      const ir = createTestIR({
        body: 'Input: $ARGUMENTS',
        placeholders: [
          { type: 'ARGUMENTS', raw: '$ARGUMENTS', position: { start: 7, end: 17 } }
        ]
      });
      const result = transformer.transformForPlatform(ir, 'qwen');
      expect(result.body).toContain('{{args}}');
      expect(result.body).not.toContain('$ARGUMENTS');
    });
  });

  // ----------------------------------------------------------
  // AC3: $ARGUMENTS -> [arguments] for Antigravity
  // ----------------------------------------------------------
  describe('AC3: $ARGUMENTS -> [arguments] for Antigravity', () => {
    it('should map $ARGUMENTS to [arguments] for Antigravity', () => {
      const ir = createTestIR({
        body: 'Input: $ARGUMENTS',
        placeholders: [
          { type: 'ARGUMENTS', raw: '$ARGUMENTS', position: { start: 7, end: 17 } }
        ]
      });
      const result = transformer.transformForPlatform(ir, 'antigravity');
      expect(result.body).toContain('[arguments]');
      expect(result.body).not.toContain('$ARGUMENTS');
    });
  });

  // ----------------------------------------------------------
  // AC4: $ARGUMENTS unchanged for Codex/Cursor
  // ----------------------------------------------------------
  describe('AC4: $ARGUMENTS unchanged for Codex/Cursor', () => {
    it('should keep $ARGUMENTS unchanged for Codex', () => {
      const ir = createTestIR({
        body: 'Input: $ARGUMENTS',
        placeholders: [
          { type: 'ARGUMENTS', raw: '$ARGUMENTS', position: { start: 7, end: 17 } }
        ]
      });
      const result = transformer.transformForPlatform(ir, 'codex');
      expect(result.body).toContain('$ARGUMENTS');
    });

    it('should keep $ARGUMENTS unchanged for Cursor', () => {
      const ir = createTestIR({
        body: 'Input: $ARGUMENTS',
        placeholders: [
          { type: 'ARGUMENTS', raw: '$ARGUMENTS', position: { start: 7, end: 17 } }
        ]
      });
      const result = transformer.transformForPlatform(ir, 'cursor');
      expect(result.body).toContain('$ARGUMENTS');
    });
  });

  // ----------------------------------------------------------
  // AC5: {AGENT_SCRIPT} expansion with platform-specific marker
  // ----------------------------------------------------------
  describe('AC5: AGENT_SCRIPT expansion', () => {
    it('should expand {AGENT_SCRIPT} with shell script content', () => {
      const ir = createTestIR({
        frontmatter: {
          name: 'test',
          description: 'Test',
          agent_scripts: {
            sh: 'echo "Hello from __AGENT__"'
          }
        },
        body: 'Execute: {AGENT_SCRIPT}',
        placeholders: [
          { type: 'AGENT_SCRIPT', raw: '{AGENT_SCRIPT}', position: { start: 9, end: 23 } }
        ]
      });

      const result = transformer.transformForPlatform(ir, 'codex');
      expect(result.body).not.toContain('{AGENT_SCRIPT}');
      expect(result.body).toContain('echo "Hello from codex"');
    });

    it('should substitute __AGENT__ with platform name', () => {
      const ir = createTestIR({
        frontmatter: {
          name: 'test',
          description: 'Test',
          agent_scripts: {
            sh: 'agent=__AGENT__'
          }
        },
        body: '{AGENT_SCRIPT}',
        placeholders: [
          { type: 'AGENT_SCRIPT', raw: '{AGENT_SCRIPT}', position: { start: 0, end: 14 } }
        ]
      });

      expect(transformer.transformForPlatform(ir, 'codex').body).toContain('agent=codex');
      expect(transformer.transformForPlatform(ir, 'cursor').body).toContain('agent=cursor');
      expect(transformer.transformForPlatform(ir, 'qwen').body).toContain('agent=qwen');
      expect(transformer.transformForPlatform(ir, 'antigravity').body).toContain('agent=antigravity');
    });
  });

  // ----------------------------------------------------------
  // transformForPlatform() tests
  // ----------------------------------------------------------
  describe('transformForPlatform()', () => {
    it('should return transformed content with frontmatter', () => {
      const ir = createTestIR({ body: 'Simple body', placeholders: [] });
      const result = transformer.transformForPlatform(ir, 'codex');
      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('frontmatter');
    });

    it('should preserve frontmatter in result', () => {
      const ir = createTestIR({ body: 'Test', placeholders: [] });
      const result = transformer.transformForPlatform(ir, 'codex');
      expect(result.frontmatter.name).toBe('flow-test');
      expect(result.frontmatter.description).toBe('Test command');
    });

    it('should handle all four platforms', () => {
      const platforms = ['codex', 'cursor', 'qwen', 'antigravity'];
      const ir = createTestIR({ body: 'Test $ARGUMENTS', placeholders: [
        { type: 'ARGUMENTS', raw: '$ARGUMENTS', position: { start: 5, end: 15 } }
      ]});

      platforms.forEach(platform => {
        expect(() => transformer.transformForPlatform(ir, platform)).not.toThrow();
      });
    });
  });

  // ----------------------------------------------------------
  // expandScriptPlaceholders() tests
  // ----------------------------------------------------------
  describe('expandScriptPlaceholders()', () => {
    it('should expand {SCRIPT:alias} to bash path', () => {
      const scripts = { prereq: '.claude/scripts/prereq.sh' };
      const result = transformer.expandScriptPlaceholders('Run {SCRIPT:prereq}', scripts);
      expect(result).toBe('Run bash .claude/scripts/prereq.sh');
    });

    it('should handle multiple placeholders', () => {
      const scripts = { a: 'path/a.sh', b: 'path/b.sh' };
      const result = transformer.expandScriptPlaceholders('{SCRIPT:a} then {SCRIPT:b}', scripts);
      expect(result).toBe('bash path/a.sh then bash path/b.sh');
    });

    it('should handle content without placeholders', () => {
      const result = transformer.expandScriptPlaceholders('No placeholders here', {});
      expect(result).toBe('No placeholders here');
    });
  });

  // ----------------------------------------------------------
  // expandAgentScript() tests
  // ----------------------------------------------------------
  describe('expandAgentScript()', () => {
    it('should expand {AGENT_SCRIPT} with sh content', () => {
      const agentScripts = { sh: 'echo "test"' };
      const result = transformer.expandAgentScript('Run: {AGENT_SCRIPT}', agentScripts, 'codex');
      expect(result).toContain('echo "test"');
      expect(result).not.toContain('{AGENT_SCRIPT}');
    });

    it('should replace __AGENT__ marker', () => {
      const agentScripts = { sh: 'platform=__AGENT__' };
      const result = transformer.expandAgentScript('{AGENT_SCRIPT}', agentScripts, 'qwen');
      expect(result).toContain('platform=qwen');
    });

    it('should handle missing agent_scripts gracefully', () => {
      const result = transformer.expandAgentScript('{AGENT_SCRIPT}', undefined, 'codex');
      expect(result).toBe('{AGENT_SCRIPT}');
    });
  });

  // ----------------------------------------------------------
  // mapArguments() tests
  // ----------------------------------------------------------
  describe('mapArguments()', () => {
    it('should keep $ARGUMENTS for codex', () => {
      const result = transformer.mapArguments('Input: $ARGUMENTS', 'codex');
      expect(result).toBe('Input: $ARGUMENTS');
    });

    it('should keep $ARGUMENTS for cursor', () => {
      const result = transformer.mapArguments('Input: $ARGUMENTS', 'cursor');
      expect(result).toBe('Input: $ARGUMENTS');
    });

    it('should map to {{args}} for qwen', () => {
      const result = transformer.mapArguments('Input: $ARGUMENTS', 'qwen');
      expect(result).toBe('Input: {{args}}');
    });

    it('should map to [arguments] for antigravity', () => {
      const result = transformer.mapArguments('Input: $ARGUMENTS', 'antigravity');
      expect(result).toBe('Input: [arguments]');
    });

    it('should handle multiple $ARGUMENTS occurrences', () => {
      const result = transformer.mapArguments('$ARGUMENTS and $ARGUMENTS again', 'qwen');
      expect(result).toBe('{{args}} and {{args}} again');
    });
  });
});
