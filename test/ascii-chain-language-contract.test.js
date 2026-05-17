const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

const CONTRACT_FILES = [
  '.claude/skills/cc-plan/SKILL.md',
  '.claude/skills/cc-plan/assets/TASKS_TEMPLATE.md',
  '.claude/skills/cc-investigate/SKILL.md',
  '.claude/skills/cc-investigate/assets/TASKS_TEMPLATE.md',
  '.claude/skills/cc-review/SKILL.md',
  '.claude/skills/cc-review/references/review-methods.md',
  '.claude/skills/cc-pr-review/SKILL.md'
];

describe('ASCII branch-chain language contract', () => {
  test('uses localized label tables instead of hard-coded English tree labels', () => {
    for (const relativePath of CONTRACT_FILES) {
      const body = fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');

      expect(body).toContain('Label table');
      expect(body).not.toMatch(/\nRequirement Impact Chain\nREQ: </);
      expect(body).not.toMatch(/\nBusiness Impact Chain\nOUTCOME: </);
      expect(body).not.toMatch(/\nProblem Chain\nSYMPTOM: </);
      expect(body).not.toMatch(/\nSolution Chain\nFIX: </);
      expect(body).not.toMatch(/\nImpact Chain\nBLAST RADIUS: </);
      expect(body).not.toMatch(/\nReview Chain\nFINDING: </);
      expect(body).not.toMatch(/\nPR Review Chain\nFINDING: </);
    }
  });
});
