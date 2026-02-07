/**
 * T043: Compile Regression Tests
 *
 * [INPUT]: 临时 .claude 项目
 * [OUTPUT]: compile() 端到端回归验证
 * [POS]: 修复 adapt 回归，确保命令与技能正确落盘
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { compile } = require('../index.js');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function setupProjectFixture(rootDir) {
  writeFile(path.join(rootDir, '.claude/commands/flow/new.md'), `---
name: flow-new
description: Create new requirement
---
# Flow New

Run flow new
`);

  writeFile(path.join(rootDir, '.claude/skills/workflow/flow-dev/SKILL.md'), `---
name: flow-dev
description: Workflow dev skill
---
# flow-dev
`);

  writeFile(path.join(rootDir, '.claude/skills/orchestrator/SKILL.md'), `---
name: orchestrator
description: Root level skill
---
# orchestrator
`);

  writeFile(path.join(rootDir, '.claude/agents/planner.md'), `---
name: planner
description: Plan tasks
---
# planner
`);

  writeFile(path.join(rootDir, '.claude/rules/base-rule.md'), `---
description: Base rule
alwaysApply: true
---
# rule
`);
}

describe('compile() regression', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compile-regression-'));
    setupProjectFixture(tempDir);
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should compile nested commands and emit skills for codex', async () => {
    const result = await compile({
      sourceDir: '.claude/commands',
      skillsDir: '.claude/skills',
      outputBaseDir: '.',
      platforms: ['codex'],
      verbose: false
    });

    expect(result.success).toBe(true);
    expect(result.filesCompiled).toBe(1);
    expect(result.skillsRegistered).toBe(2);
    expect(result.skillsEmitted).toBe(2);
    expect(fs.existsSync('.codex/prompts/flow/new.md')).toBe(true);
    expect(fs.existsSync('.codex/skills/flow-dev/SKILL.md')).toBe(true);
    expect(fs.existsSync('.codex/skills/orchestrator/SKILL.md')).toBe(true);
    expect(fs.existsSync('AGENTS.md')).toBe(true);
  });
});
