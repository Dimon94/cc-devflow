const fs = require('fs');
const os = require('os');
const path = require('path');

const { validateSkillInventory } = require('../inventory');

function writeFile(filePath, content = '') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function makeSkill(root, name, files = ['SKILL.md']) {
  for (const file of files) {
    writeFile(path.join(root, '.claude/skills', name, file), `# ${name}\n`);
  }
}

describe('compiler inventory parity', () => {
  test('rejects unconfigured managed skill directories', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-inventory-extra-'));
    makeSkill(root, 'cc-plan', ['SKILL.md', 'PLAYBOOK.md']);
    makeSkill(root, 'mystery-skill');

    const errors = validateSkillInventory({
      root,
      publicSkills: ['cc-plan'],
      distributedSkills: ['cc-plan'],
      internalSkills: []
    });

    expect(errors).toContain('Unconfigured skill directory: mystery-skill');
  });

  test('requires public mirrors to match public skill inventory when present', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-inventory-mirror-'));
    makeSkill(root, 'cc-plan', ['SKILL.md', 'PLAYBOOK.md']);
    writeFile(path.join(root, '.codex/skills/custom-public/SKILL.md'), '# custom-public\n');

    const errors = validateSkillInventory({
      root,
      publicSkills: ['cc-plan'],
      distributedSkills: ['cc-plan'],
      internalSkills: []
    });

    expect(errors).toEqual(expect.arrayContaining([
      'Codex mirror missing public skill: cc-plan',
      'Codex mirror has unconfigured public skill: custom-public'
    ]));
  });
});
