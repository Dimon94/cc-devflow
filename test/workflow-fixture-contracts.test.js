const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const fixture = require('./fixtures/workflow-process-contracts.json');

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readSkill(skillName) {
  return matter(readText(`.claude/skills/${skillName}/SKILL.md`));
}

describe('workflow process contract fixtures', () => {
  test('serial workflow fixture covers handoff, execution selection, verification, and closeout input', () => {
    expect(fixture.serialWorkflow.stages.map((stage) => stage.stage)).toEqual([
      'cc-plan',
      'cc-do',
      'cc-check',
      'cc-act'
    ]);

    const workflow = readSkill('workflow-chain-contract').content;
    const task = readSkill('task-contract').content;
    const quality = readSkill('quality-gate-contract').content;

    expect(workflow).toMatch(/cc-plan\s+->\s+cc-do\s+->\s+cc-check\s+->\s+cc-act/);
    expect(task).toMatch(/assigned task block/i);
    expect(quality).toMatch(/pass, fail, and blocked/i);
    expect(quality).toMatch(/confirmed lessons/i);
  });

  test('parallel environment fixture covers dispatch boundary and integration gate shape', () => {
    const contract = readSkill('execution-environment-contract').content;

    for (const value of [
      ...fixture.parallelEnvironment.fields,
      ...fixture.parallelEnvironment.boundary,
      ...fixture.parallelEnvironment.finalReport,
      ...fixture.parallelEnvironment.integrationGate
    ]) {
      expect(contract).toMatch(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    }
  });

  test('quality gate fixture covers findings, ledger classification, and closeout trigger input', () => {
    const contract = readSkill('quality-gate-contract').content;

    for (const value of [
      ...fixture.qualityGate.findings,
      ...fixture.qualityGate.verificationVerdicts,
      fixture.qualityGate.ledgerCandidate,
      ...fixture.qualityGate.classification,
      fixture.qualityGate.closeoutInput
    ]) {
      expect(contract).toMatch(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    }
  });

  test('authoring gate fixture covers chain skill frontmatter, reads wiring, and completion criteria', () => {
    for (const skillName of fixture.authoringGate.chainSkills) {
      const skill = readSkill(skillName);

      expect(skill.data.description).toMatch(/Chain Skill/i);
      expect(skill.data).not.toHaveProperty('triggers');
    }

    for (const reader of fixture.authoringGate.readerSkills) {
      const reads = readSkill(reader).data.reads || [];

      expect(reads.some((entry) => entry.includes('task-contract'))).toBe(true);
    }

    const authoringGate = readSkill('skill-authoring-gate').content;

    for (const value of fixture.authoringGate.completionCriteria) {
      expect(authoringGate).toMatch(new RegExp(value, 'i'));
    }
  });
});
