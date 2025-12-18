/**
 * T020: Skills Registry Tests
 * Tests for skills registry generation
 * Expected: All tests FAIL (skills-registry not implemented)
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================================
// Skills Registry imports - will fail until lib/compiler/skills-registry.js exists
// ============================================================
let skillsRegistry;
try {
  skillsRegistry = require('../../lib/compiler/skills-registry.js');
} catch (e) {
  skillsRegistry = null;
}

describe('Skills Registry Module', () => {
  let tmpDir;

  beforeEach(() => {
    if (!skillsRegistry) {
      throw new Error('skills-registry.js not implemented');
    }
    tmpDir = path.join(os.tmpdir(), `skills-test-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Helper to create a skill directory with SKILL.md and skill-rules.json
  const createSkill = (skillName, skillMd, skillRules) => {
    const skillDir = path.join(tmpDir, skillName);
    fs.mkdirSync(skillDir, { recursive: true });

    if (skillMd) {
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMd);
    }
    if (skillRules) {
      fs.writeFileSync(path.join(skillDir, 'skill-rules.json'), JSON.stringify(skillRules));
    }

    return skillDir;
  };

  // ----------------------------------------------------------
  // AC1: Output JSON array with name, description, type, triggers, path
  // ----------------------------------------------------------
  describe('AC1: JSON output structure', () => {
    it('should return JSON array', () => {
      createSkill('test-skill', `---
name: test-skill
description: Test skill description
---
# Test Skill`, { triggers: [{ keyword: 'test' }] });

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(Array.isArray(registry)).toBe(true);
    });

    it('should include name field', () => {
      createSkill('named-skill', `---
name: named-skill
description: Description
---
# Skill`, {});

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(registry[0]).toHaveProperty('name');
      expect(registry[0].name).toBe('named-skill');
    });

    it('should include description field', () => {
      createSkill('desc-skill', `---
name: desc-skill
description: My skill description
---
# Skill`, {});

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(registry[0]).toHaveProperty('description');
      expect(registry[0].description).toBe('My skill description');
    });

    it('should include type field', () => {
      createSkill('typed-skill', `---
name: typed-skill
description: Description
type: utility
---
# Skill`, {});

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(registry[0]).toHaveProperty('type');
    });

    it('should include triggers field', () => {
      createSkill('trigger-skill', `---
name: trigger-skill
description: Description
---
# Skill`, {
        triggers: [
          { keyword: 'keyword1' },
          { keyword: 'keyword2' }
        ]
      });

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(registry[0]).toHaveProperty('triggers');
      expect(Array.isArray(registry[0].triggers)).toBe(true);
    });

    it('should include path field', () => {
      createSkill('path-skill', `---
name: path-skill
description: Description
---
# Skill`, {});

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(registry[0]).toHaveProperty('path');
      expect(registry[0].path).toContain('path-skill');
    });
  });

  // ----------------------------------------------------------
  // AC2: Parse SKILL.md frontmatter and skill-rules.json
  // ----------------------------------------------------------
  describe('AC2: Parse skill files', () => {
    it('should parse SKILL.md YAML frontmatter', () => {
      createSkill('frontmatter-skill', `---
name: frontmatter-skill
description: Parsed from frontmatter
custom_field: custom_value
---
# Body content`, {});

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(registry[0].name).toBe('frontmatter-skill');
      expect(registry[0].description).toBe('Parsed from frontmatter');
    });

    it('should parse skill-rules.json for triggers', () => {
      createSkill('rules-skill', `---
name: rules-skill
description: Description
---
# Skill`, {
        triggers: [
          { keyword: 'invoke-skill' },
          { pattern: '/test/' }
        ],
        enforcement: 'suggest'
      });

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(registry[0].triggers).toHaveLength(2);
    });

    it('should handle skill without skill-rules.json', () => {
      createSkill('no-rules-skill', `---
name: no-rules-skill
description: No rules file
---
# Skill`, null);

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(registry[0].name).toBe('no-rules-skill');
      expect(registry[0].triggers).toEqual([]);
    });

    it('should handle skill without SKILL.md', () => {
      const skillDir = path.join(tmpDir, 'no-skill-md');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'skill-rules.json'), JSON.stringify({
        triggers: [{ keyword: 'test' }]
      }));

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      // Should skip or handle gracefully
      expect(registry.find(s => s.name === 'no-skill-md')).toBeUndefined();
    });
  });

  // ----------------------------------------------------------
  // AC3: Generate Markdown table for Codex context
  // ----------------------------------------------------------
  describe('AC3: Markdown table generation', () => {
    it('should generate valid Markdown table', () => {
      createSkill('table-skill-1', `---
name: skill-1
description: First skill
---
# Skill`, { triggers: [{ keyword: 'one' }] });

      createSkill('table-skill-2', `---
name: skill-2
description: Second skill
---
# Skill`, { triggers: [{ keyword: 'two' }] });

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);
      const markdown = skillsRegistry.formatAsMarkdownTable(registry);

      expect(markdown).toContain('|');
      expect(markdown).toContain('Name');
      expect(markdown).toContain('Description');
      expect(markdown).toContain('skill-1');
      expect(markdown).toContain('skill-2');
    });

    it('should include table headers', () => {
      createSkill('header-skill', `---
name: header-skill
description: Description
---
# Skill`, {});

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);
      const markdown = skillsRegistry.formatAsMarkdownTable(registry);

      // Check for header row and separator
      expect(markdown).toMatch(/\|\s*Name\s*\|/);
      expect(markdown).toMatch(/\|[-:]+\|/);
    });

    it('should handle empty registry', () => {
      const emptyDir = path.join(tmpDir, 'empty');
      fs.mkdirSync(emptyDir, { recursive: true });

      const registry = skillsRegistry.generateSkillsRegistry(emptyDir);
      const markdown = skillsRegistry.formatAsMarkdownTable(registry);

      expect(markdown).toContain('No skills');
    });
  });

  // ----------------------------------------------------------
  // generateSkillsRegistry() Tests
  // ----------------------------------------------------------
  describe('generateSkillsRegistry()', () => {
    it('should scan all subdirectories', () => {
      createSkill('skill-a', `---
name: skill-a
description: Skill A
---
# A`, {});

      createSkill('skill-b', `---
name: skill-b
description: Skill B
---
# B`, {});

      createSkill('skill-c', `---
name: skill-c
description: Skill C
---
# C`, {});

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(registry).toHaveLength(3);
    });

    it('should skip non-directory entries', () => {
      createSkill('valid-skill', `---
name: valid-skill
description: Valid
---
# Valid`, {});

      // Create a file (not directory) in the skills folder
      fs.writeFileSync(path.join(tmpDir, 'not-a-skill.txt'), 'text file');

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      expect(registry).toHaveLength(1);
      expect(registry[0].name).toBe('valid-skill');
    });

    it('should handle nested skill directories', () => {
      // Skills should be direct children, not nested
      const nestedDir = path.join(tmpDir, 'nested-skill', 'sub-skill');
      fs.mkdirSync(nestedDir, { recursive: true });
      fs.writeFileSync(path.join(nestedDir, 'SKILL.md'), `---
name: nested
description: Nested
---
# Nested`);

      createSkill('direct-skill', `---
name: direct-skill
description: Direct
---
# Direct`, {});

      const registry = skillsRegistry.generateSkillsRegistry(tmpDir);

      // Should only find direct children
      expect(registry.find(s => s.name === 'direct-skill')).toBeDefined();
    });
  });
});
