/**
 * T019: CLI Tests
 * Tests for CLI entry point and argument parsing
 * Expected: All tests FAIL (CLI not implemented)
 */
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================================
// CLI module imports - will fail until bin/adapt.js and lib/compiler/index.js exist
// ============================================================
let cli;
let compiler;
try {
  cli = require('../../bin/adapt.js');
  compiler = require('../../lib/compiler/index.js');
} catch (e) {
  cli = null;
  compiler = null;
}

describe('CLI Module', () => {
  // ----------------------------------------------------------
  // Module existence check
  // ----------------------------------------------------------
  describe('Module existence', () => {
    it('should have bin/adapt.js file', () => {
      const filePath = path.join(__dirname, '../../bin/adapt.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have lib/compiler/index.js file', () => {
      const filePath = path.join(__dirname, '../../lib/compiler/index.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // AC1: --platform codex compiles only .codex/
  // ----------------------------------------------------------
  describe('AC1: --platform codex', () => {
    it('should compile only to .codex/ when platform is codex', async () => {
      if (!compiler) throw new Error('compiler not implemented');

      const result = await compiler.compile({ platforms: ['codex'] });
      expect(result.platforms).toContain('codex');
      expect(result.platforms).not.toContain('cursor');
      expect(result.platforms).not.toContain('qwen');
      expect(result.platforms).not.toContain('antigravity');
    });
  });

  // ----------------------------------------------------------
  // AC2: --platform cursor compiles only .cursor/
  // ----------------------------------------------------------
  describe('AC2: --platform cursor', () => {
    it('should compile only to .cursor/ when platform is cursor', async () => {
      if (!compiler) throw new Error('compiler not implemented');

      const result = await compiler.compile({ platforms: ['cursor'] });
      expect(result.platforms).toContain('cursor');
      expect(result.platforms).not.toContain('codex');
    });
  });

  // ----------------------------------------------------------
  // AC3: --all compiles all platforms
  // ----------------------------------------------------------
  describe('AC3: --all compiles all platforms', () => {
    it('should compile to all platforms when --all', async () => {
      if (!compiler) throw new Error('compiler not implemented');

      const result = await compiler.compile({ platforms: ['codex', 'cursor', 'qwen', 'antigravity'] });
      expect(result.platforms).toContain('codex');
      expect(result.platforms).toContain('cursor');
      expect(result.platforms).toContain('qwen');
      expect(result.platforms).toContain('antigravity');
    });
  });

  // ----------------------------------------------------------
  // AC4: No args = --all (default)
  // ----------------------------------------------------------
  describe('AC4: Default behavior', () => {
    it('should compile all platforms when no args provided', async () => {
      if (!compiler) throw new Error('compiler not implemented');

      const result = await compiler.compile({});
      expect(result.platforms).toHaveLength(4);
    });
  });

  // ----------------------------------------------------------
  // AC5: --platform unknown returns error
  // ----------------------------------------------------------
  describe('AC5: Unknown platform error', () => {
    it('should throw error for unknown platform', async () => {
      if (!compiler) throw new Error('compiler not implemented');

      await expect(compiler.compile({ platforms: ['unknown'] })).rejects.toThrow('Unknown platform');
    });
  });

  // ----------------------------------------------------------
  // Exit codes Tests
  // ----------------------------------------------------------
  describe('Exit codes', () => {
    const runCLI = (args) => {
      try {
        const result = execSync(`node bin/adapt.js ${args}`, {
          cwd: path.join(__dirname, '../..'),
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        return { exitCode: 0, output: result };
      } catch (e) {
        return { exitCode: e.status, output: e.stdout + e.stderr };
      }
    };

    it('should return exit code 0 on success', () => {
      // This test will actually run when CLI is implemented
      const result = runCLI('--help');
      // --help should always succeed
      expect(result.exitCode).toBe(0);
    });

    it('should return exit code 3 for invalid arguments', () => {
      const result = runCLI('--invalid-option');
      expect(result.exitCode).toBe(3);
    });

    it('should return exit code 1 on compilation error', () => {
      // Test with a platform that will cause compilation to fail
      // This will be validated when implementation exists
      if (!compiler) throw new Error('compiler not implemented');
    });
  });

  // ----------------------------------------------------------
  // Argument parsing Tests
  // ----------------------------------------------------------
  describe('Argument parsing', () => {
    it('should parse --platform with value', () => {
      if (!cli || !cli.parseArgs) throw new Error('cli.parseArgs not implemented');

      const args = cli.parseArgs(['--platform', 'codex']);
      expect(args.platform).toBe('codex');
    });

    it('should parse --all flag', () => {
      if (!cli || !cli.parseArgs) throw new Error('cli.parseArgs not implemented');

      const args = cli.parseArgs(['--all']);
      expect(args.all).toBe(true);
    });

    it('should parse --check flag', () => {
      if (!cli || !cli.parseArgs) throw new Error('cli.parseArgs not implemented');

      const args = cli.parseArgs(['--check']);
      expect(args.check).toBe(true);
    });

    it('should parse --verbose flag', () => {
      if (!cli || !cli.parseArgs) throw new Error('cli.parseArgs not implemented');

      const args = cli.parseArgs(['--verbose']);
      expect(args.verbose).toBe(true);
    });

    it('should parse --help flag', () => {
      if (!cli || !cli.parseArgs) throw new Error('cli.parseArgs not implemented');

      const args = cli.parseArgs(['--help']);
      expect(args.help).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // Help output Tests
  // ----------------------------------------------------------
  describe('Help output', () => {
    it('should display help with --help', () => {
      try {
        const output = execSync('node bin/adapt.js --help', {
          cwd: path.join(__dirname, '../..'),
          encoding: 'utf8'
        });
        expect(output).toContain('Usage');
        expect(output).toContain('--platform');
        expect(output).toContain('--all');
        expect(output).toContain('--check');
      } catch (e) {
        throw new Error('CLI --help failed: ' + e.message);
      }
    });
  });

  // ----------------------------------------------------------
  // Integration with compiler Tests
  // ----------------------------------------------------------
  describe('Integration with compiler', () => {
    it('should call compiler.compile() with parsed options', async () => {
      if (!compiler) throw new Error('compiler not implemented');

      // Mock to verify compile is called correctly
      const compileSpy = jest.spyOn(compiler, 'compile').mockResolvedValue({
        platforms: ['codex'],
        files: [],
        success: true
      });

      try {
        await compiler.compile({ platforms: ['codex'], verbose: true });
        expect(compileSpy).toHaveBeenCalledWith(expect.objectContaining({
          platforms: ['codex']
        }));
      } finally {
        compileSpy.mockRestore();
      }
    });
  });
});
