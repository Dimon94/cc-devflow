const fs = require('fs');
const os = require('os');
const path = require('path');

const { validateSkillInventory, validateSkillSuiteGraph } = require('../inventory');

function writeFile(filePath, content = '') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function makeSkill(root, name, files = ['SKILL.md']) {
  for (const file of files) {
    writeFile(path.join(root, '.claude/skills', name, file), `# ${name}\n`);
  }
}

function makeSuiteSkill(root, name, frontmatter = {}) {
  const {
    skillClass = 'user-entry',
    routeFamily = 'main',
    triggers = ['run this skill'],
    reads = [],
    reroutes = []
  } = frontmatter;
  const data = [
    '---',
    `name: ${name}`,
    `skill_class: ${skillClass}`,
    `route_family: ${routeFamily}`,
    ...(triggers === null ? [] : ['triggers:', ...triggers.map((trigger) => `  - ${trigger}`)]),
    'reads:',
    ...reads.map((read) => `  - ${read}`),
    'writes: []',
    ...(reroutes.length > 0 ? ['reroutes:', ...reroutes.flatMap((reroute) => [
      `  - when: ${reroute.when}`,
      `    target: ${reroute.target}`
    ])] : []),
    '---',
    `# ${name}`,
    ''
  ].join('\n');

  writeFile(path.join(root, '.claude/skills', name, 'SKILL.md'), data);
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

describe('skill suite graph validation', () => {
  test('rejects missing explicit classification fields', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-suite-missing-'));
    writeFile(path.join(root, '.claude/skills/cc-plan/SKILL.md'), [
      '---',
      'name: cc-plan',
      'reads: []',
      'writes: []',
      '---',
      '# cc-plan',
      ''
    ].join('\n'));

    const errors = validateSkillSuiteGraph({
      root,
      publicSkills: ['cc-plan'],
      distributedSkills: ['cc-plan'],
      internalSkills: []
    });

    expect(errors).toEqual(expect.arrayContaining([
      '.claude/skills/cc-plan/SKILL.md missing skill_class',
      '.claude/skills/cc-plan/SKILL.md missing route_family'
    ]));
  });

  test('rejects chain triggers and public maintenance skills', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-suite-class-'));
    makeSuiteSkill(root, 'task-contract', {
      skillClass: 'chain',
      routeFamily: 'contract',
      triggers: ['do task contract']
    });
    makeSuiteSkill(root, 'docs-sync', {
      skillClass: 'maintenance',
      routeFamily: 'maintenance',
      triggers: null
    });

    const errors = validateSkillSuiteGraph({
      root,
      publicSkills: ['docs-sync'],
      distributedSkills: ['task-contract'],
      internalSkills: ['docs-sync']
    });

    expect(errors).toEqual(expect.arrayContaining([
      '.claude/skills/task-contract/SKILL.md chain skill must not define triggers',
      '.claude/skills/docs-sync/SKILL.md maintenance skill must not be public'
    ]));
  });

  test('rejects missing local reads and unknown reroute targets', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-suite-links-'));
    makeSuiteSkill(root, 'cc-plan', {
      reads: [
        'PLAYBOOK.md',
        '../missing-skill/SKILL.md',
        'devflow/changes/<change-key>/task.md',
        'devflow/changes/archive/'
      ],
      reroutes: [{ when: 'done', target: 'missing-skill' }]
    });

    const errors = validateSkillSuiteGraph({
      root,
      publicSkills: ['cc-plan'],
      distributedSkills: ['cc-plan'],
      internalSkills: []
    });

    expect(errors).toEqual(expect.arrayContaining([
      '.claude/skills/cc-plan/SKILL.md missing read target: PLAYBOOK.md',
      '.claude/skills/cc-plan/SKILL.md missing read target: ../missing-skill/SKILL.md',
      '.claude/skills/cc-plan/SKILL.md unknown reroute target: missing-skill'
    ]));
    expect(errors).not.toContain('.claude/skills/cc-plan/SKILL.md missing read target: devflow/changes/archive/');
  });
});
