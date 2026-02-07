/**
 * T011: Parser Tests
 * Tests for parsing .claude/commands/*.md files
 * Expected: All tests FAIL (parser not implemented)
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================================
// Parser imports - will fail until lib/compiler/parser.js exists
// ============================================================
let parser;
let errors;
try {
  parser = require('../parser.js');
  errors = require('../errors.js');
} catch (e) {
  parser = null;
  errors = null;
}

// Helper to create temp files for testing
const createTempFile = (content) => {
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `test-${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
  fs.writeFileSync(tmpFile, content);
  return tmpFile;
};

const cleanup = (filePath) => {
  try {
    fs.unlinkSync(filePath);
  } catch (e) {
    // ignore
  }
};

describe('Parser Module', () => {
  beforeEach(() => {
    if (!parser) {
      throw new Error('parser.js not implemented');
    }
  });

  // ----------------------------------------------------------
  // AC1: Parse file with YAML frontmatter
  // ----------------------------------------------------------
  describe('AC1: Parse YAML frontmatter', () => {
    it('should parse file with valid frontmatter and return IR', () => {
      const content = `---
name: flow-prd
description: Generate PRD document
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
---
# Flow PRD Command

Run {SCRIPT:prereq}
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        expect(ir.frontmatter.name).toBe('flow-prd');
        expect(ir.frontmatter.description).toBe('Generate PRD document');
        expect(ir.frontmatter.scripts).toBeDefined();
        expect(ir.frontmatter.scripts.prereq).toBe('.claude/scripts/check-prerequisites.sh');
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should extract body content without frontmatter', () => {
      const content = `---
name: test-cmd
description: Test command
---
# Test Command

Body content here
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        expect(ir.body).toContain('# Test Command');
        expect(ir.body).toContain('Body content here');
        expect(ir.body).not.toContain('---');
        expect(ir.body).not.toContain('name: test-cmd');
      } finally {
        cleanup(tmpFile);
      }
    });
  });

  // ----------------------------------------------------------
  // AC2: Parse frontmatter scripts mapping
  // ----------------------------------------------------------
  describe('AC2: Parse scripts alias-path mapping', () => {
    it('should parse multiple scripts aliases', () => {
      const content = `---
name: flow-test
description: Test
scripts:
  prereq: .claude/scripts/prereq.sh
  validate: .claude/scripts/validate.sh
  check_tasks: .claude/scripts/check-tasks.sh
---
Body
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        expect(Object.keys(ir.frontmatter.scripts)).toHaveLength(3);
        expect(ir.frontmatter.scripts.prereq).toBe('.claude/scripts/prereq.sh');
        expect(ir.frontmatter.scripts.validate).toBe('.claude/scripts/validate.sh');
        expect(ir.frontmatter.scripts.check_tasks).toBe('.claude/scripts/check-tasks.sh');
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should handle frontmatter without scripts', () => {
      const content = `---
name: simple-cmd
description: Simple command without scripts
---
Body
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        expect(ir.frontmatter.scripts).toBeUndefined();
      } finally {
        cleanup(tmpFile);
      }
    });
  });

  // ----------------------------------------------------------
  // AC3: Detect {SCRIPT:*} placeholders in body
  // ----------------------------------------------------------
  describe('AC3: Detect SCRIPT placeholders', () => {
    it('should detect single {SCRIPT:alias} placeholder', () => {
      const content = `---
name: test
description: Test
scripts:
  prereq: .claude/scripts/prereq.sh
---
Run {SCRIPT:prereq}
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        const scriptPlaceholders = ir.placeholders.filter(p => p.type === 'SCRIPT');
        expect(scriptPlaceholders).toHaveLength(1);
        expect(scriptPlaceholders[0].alias).toBe('prereq');
        expect(scriptPlaceholders[0].raw).toBe('{SCRIPT:prereq}');
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should detect multiple {SCRIPT:*} placeholders', () => {
      const content = `---
name: test
description: Test
scripts:
  first: .claude/scripts/first.sh
  second: .claude/scripts/second.sh
---
Run {SCRIPT:first} then {SCRIPT:second}
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        const scriptPlaceholders = ir.placeholders.filter(p => p.type === 'SCRIPT');
        expect(scriptPlaceholders).toHaveLength(2);
        expect(scriptPlaceholders.map(p => p.alias).sort()).toEqual(['first', 'second']);
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should detect {AGENT_SCRIPT} placeholder', () => {
      const content = `---
name: test
description: Test
agent_scripts:
  sh: echo "test"
---
Execute {AGENT_SCRIPT}
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        const agentPlaceholders = ir.placeholders.filter(p => p.type === 'AGENT_SCRIPT');
        expect(agentPlaceholders).toHaveLength(1);
        expect(agentPlaceholders[0].raw).toBe('{AGENT_SCRIPT}');
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should detect $ARGUMENTS placeholder', () => {
      const content = `---
name: test
description: Test
---
Input: $ARGUMENTS
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        const argPlaceholders = ir.placeholders.filter(p => p.type === 'ARGUMENTS');
        expect(argPlaceholders).toHaveLength(1);
        expect(argPlaceholders[0].raw).toBe('$ARGUMENTS');
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should record placeholder positions', () => {
      const content = `---
name: test
description: Test
scripts:
  x: .claude/scripts/test.sh
---
Start {SCRIPT:x} end
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        const placeholder = ir.placeholders.find(p => p.type === 'SCRIPT');
        expect(placeholder.position).toBeDefined();
        expect(typeof placeholder.position.start).toBe('number');
        expect(typeof placeholder.position.end).toBe('number');
        expect(placeholder.position.end).toBeGreaterThan(placeholder.position.start);
      } finally {
        cleanup(tmpFile);
      }
    });
  });

  // ----------------------------------------------------------
  // AC4: Throw MissingFrontmatterError
  // ----------------------------------------------------------
  describe('AC4: Error on missing frontmatter', () => {
    it('should throw MissingFrontmatterError for file without frontmatter', () => {
      const content = `# No Frontmatter

Just markdown content
`;
      const tmpFile = createTempFile(content);
      try {
        expect(() => parser.parseCommand(tmpFile)).toThrow(errors.MissingFrontmatterError);
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should throw MissingFrontmatterError for empty file', () => {
      const tmpFile = createTempFile('');
      try {
        expect(() => parser.parseCommand(tmpFile)).toThrow(errors.MissingFrontmatterError);
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should throw InvalidFrontmatterError for missing required fields', () => {
      const content = `---
name: test-only-name
---
Body
`;
      const tmpFile = createTempFile(content);
      try {
        expect(() => parser.parseCommand(tmpFile)).toThrow(errors.InvalidFrontmatterError);
      } finally {
        cleanup(tmpFile);
      }
    });
  });

  // ----------------------------------------------------------
  // AC5: Throw UnknownAliasError for undefined script alias
  // ----------------------------------------------------------
  describe('AC5: Error on unknown script alias', () => {
    it('should throw UnknownAliasError for undefined alias in body', () => {
      const content = `---
name: test
description: Test
scripts:
  known: .claude/scripts/known.sh
---
Run {SCRIPT:unknown}
`;
      const tmpFile = createTempFile(content);
      try {
        expect(() => parser.parseCommand(tmpFile)).toThrow(errors.UnknownAliasError);
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should throw UnknownAliasError when scripts is undefined but alias used', () => {
      const content = `---
name: test
description: Test
---
Run {SCRIPT:prereq}
`;
      const tmpFile = createTempFile(content);
      try {
        expect(() => parser.parseCommand(tmpFile)).toThrow(errors.UnknownAliasError);
      } finally {
        cleanup(tmpFile);
      }
    });
  });

  // ----------------------------------------------------------
  // parseCommand() specific tests
  // ----------------------------------------------------------
  describe('parseCommand()', () => {
    it('should return valid CommandIR structure', () => {
      const content = `---
name: valid
description: Valid command
---
Content
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        expect(ir).toHaveProperty('source');
        expect(ir).toHaveProperty('frontmatter');
        expect(ir).toHaveProperty('body');
        expect(ir).toHaveProperty('placeholders');
        expect(ir.source).toHaveProperty('path');
        expect(ir.source).toHaveProperty('filename');
        expect(ir.source).toHaveProperty('hash');
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should compute SHA-256 hash', () => {
      const content = `---
name: hash-test
description: Test hash
---
Content
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        expect(ir.source.hash).toMatch(/^[a-f0-9]{64}$/);
      } finally {
        cleanup(tmpFile);
      }
    });

    it('should extract filename without extension', () => {
      const content = `---
name: test
description: Test
---
Body
`;
      const tmpFile = createTempFile(content);
      try {
        const ir = parser.parseCommand(tmpFile);
        expect(ir.source.filename).not.toContain('.md');
      } finally {
        cleanup(tmpFile);
      }
    });
  });

  // ----------------------------------------------------------
  // parseAllCommands() tests
  // ----------------------------------------------------------
  describe('parseAllCommands()', () => {
    it('should return array of CommandIR', async () => {
      // 使用临时目录测试，避免依赖真实代码库状态
      const tmpDir = path.join(os.tmpdir(), `test-array-${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'test.md'), `---
name: test
description: Test command
---
Body`);
      try {
        const result = await parser.parseAllCommands(tmpDir);
        expect(Array.isArray(result)).toBe(true);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should parse multiple .md files in directory', async () => {
      const tmpDir = path.join(os.tmpdir(), `test-multi-${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'cmd1.md'), `---
name: cmd1
description: Command 1
---
Body 1`);
      fs.writeFileSync(path.join(tmpDir, 'cmd2.md'), `---
name: cmd2
description: Command 2
---
Body 2`);
      try {
        const result = await parser.parseAllCommands(tmpDir);
        expect(result.length).toBe(2);
        result.forEach(ir => {
          expect(ir).toHaveProperty('source');
          expect(ir).toHaveProperty('frontmatter');
          expect(ir).toHaveProperty('body');
        });
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should skip non-.md files', async () => {
      // Create temp dir with mixed files
      const tmpDir = path.join(os.tmpdir(), `test-dir-${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      const mdFile = path.join(tmpDir, 'test.md');
      const txtFile = path.join(tmpDir, 'test.txt');

      fs.writeFileSync(mdFile, `---
name: test
description: Test
---
Body`);
      fs.writeFileSync(txtFile, 'not markdown');

      try {
        const result = await parser.parseAllCommands(tmpDir);
        expect(result).toHaveLength(1);
        expect(result[0].source.filename).toBe('test');
      } finally {
        fs.unlinkSync(mdFile);
        fs.unlinkSync(txtFile);
        fs.rmdirSync(tmpDir);
      }
    });

    it('should parse nested command files recursively', async () => {
      const tmpDir = path.join(os.tmpdir(), `test-nested-${Date.now()}`);
      const flowDir = path.join(tmpDir, 'flow');
      const utilDir = path.join(tmpDir, 'util');
      fs.mkdirSync(flowDir, { recursive: true });
      fs.mkdirSync(utilDir, { recursive: true });

      fs.writeFileSync(path.join(flowDir, 'new.md'), `---
name: flow-new
description: Flow new command
---
Body`);
      fs.writeFileSync(path.join(utilDir, 'code-review.md'), `---
name: code-review
description: Code review command
---
Body`);

      try {
        const result = await parser.parseAllCommands(tmpDir);
        expect(result).toHaveLength(2);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should preserve relative subpath in source filename', async () => {
      const tmpDir = path.join(os.tmpdir(), `test-relpath-${Date.now()}`);
      const flowDir = path.join(tmpDir, 'flow');
      fs.mkdirSync(flowDir, { recursive: true });

      fs.writeFileSync(path.join(flowDir, 'spec.md'), `---
name: flow-spec
description: Flow spec command
---
Body`);

      try {
        const result = await parser.parseAllCommands(tmpDir);
        expect(result).toHaveLength(1);
        expect(result[0].source.filename).toBe('flow/spec');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
