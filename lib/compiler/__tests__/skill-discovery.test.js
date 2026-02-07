/**
 * T042: Skill Discovery Tests
 *
 * [INPUT]: 临时技能目录结构
 * [OUTPUT]: 递归扫描结果断言
 * [POS]: skill-discovery 单元测试，验证分组/非分组技能发现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { discoverSkillEntries } = require('../skill-discovery.js');
const { generateSkillsRegistryV2 } = require('../skills-registry.js');

function setupSkillsFixture(rootDir) {
  // 非分组技能
  const rootSkillDir = path.join(rootDir, 'orchestrator');
  fs.mkdirSync(rootSkillDir, { recursive: true });
  fs.writeFileSync(path.join(rootSkillDir, 'SKILL.md'), `---
name: orchestrator
description: Root level skill
---`);

  // 分组技能
  const groupedSkillDir = path.join(rootDir, 'workflow', 'flow-dev');
  fs.mkdirSync(groupedSkillDir, { recursive: true });
  fs.writeFileSync(path.join(groupedSkillDir, 'SKILL.md'), `---
name: flow-dev
description: Grouped workflow skill
---`);

  // 需要跳过的目录
  const ignoredSkillDir = path.join(rootDir, '_reference', 'demo-skill');
  fs.mkdirSync(ignoredSkillDir, { recursive: true });
  fs.writeFileSync(path.join(ignoredSkillDir, 'SKILL.md'), `---
name: demo-skill
description: Should be ignored
---`);
}

describe('skill-discovery', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-discovery-'));
    setupSkillsFixture(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('discoverSkillEntries should include grouped and root skills', () => {
    const entries = discoverSkillEntries(tempDir);
    const names = entries.map(entry => entry.name);

    expect(names).toContain('orchestrator');
    expect(names).toContain('flow-dev');
    expect(names).not.toContain('demo-skill');
  });

  test('generateSkillsRegistryV2 should register grouped and root skills', async () => {
    const registry = await generateSkillsRegistryV2(tempDir);
    const names = registry.skills.map(skill => skill.name);

    expect(names).toContain('orchestrator');
    expect(names).toContain('flow-dev');
    expect(names).not.toContain('demo-skill');
  });
});
