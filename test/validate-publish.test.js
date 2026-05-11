const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const {
  collectDecisionQuestionOptionErrors,
  collectExternalBestPracticeErrors,
  collectSlimManifestErrors,
  validateArtifactOwnershipContracts,
  ensureStringArray
} = require('../scripts/validate-publish');

const ROOT = path.resolve(__dirname, '..');

describe('validate-publish', () => {
  test('passes even when npm dry-run env is inherited', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-publish.js'], {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_dry_run: 'true'
      }
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Publish validation passed.');
    expect(result.stdout).toContain('Pack runtime smoke passed.');
  });

  test('fails when example bindings drift from current skill versions', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-bindings-'));
    const tempBindings = path.join(tempDir, 'example-bindings.json');
    const originalBindings = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'docs/examples/example-bindings.json'), 'utf8')
    );

    originalBindings.skills['cc-check'] = '9.9.9';
    fs.writeFileSync(tempBindings, JSON.stringify(originalBindings, null, 2));

    const result = spawnSync(process.execPath, ['scripts/validate-publish.js'], {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        EXAMPLE_BINDINGS_FILE: tempBindings
      }
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('example bindings check failed');
    expect(result.stderr).toContain('Binding mismatch for cc-check');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('reports yaml mapping list items with a precise repair hint', () => {
    const errors = [];

    ensureStringArray(
      [{ 'For non-trivial designs, compare named option roles': 'minimal viable' }],
      'cc-plan frontmatter.entry_gate',
      errors
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('cc-plan frontmatter.entry_gate[0]');
    expect(errors[0]).toContain('got object');
    expect(errors[0]).toContain('Quote YAML list items that contain ": "');
  });

  test('cc-plan carries the fixed decision question contract', () => {
    const skill = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/SKILL.md'),
      'utf8'
    );
    const fullDesign = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/assets/DESIGN_TEMPLATE.md'),
      'utf8'
    );
    const manifest = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/assets/TASK_MANIFEST_TEMPLATE.json'),
      'utf8'
    );
    const planningContract = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/references/planning-contract.md'),
      'utf8'
    );

    expect(skill).toContain('## Decision Question Protocol');
    expect(skill).toContain('D<N> - <decision title>');
    expect(skill).toContain('A) <label> (recommended)');
    expect(skill).toContain('B) <label>');
    expect(skill).toContain('禁止输出 `1)` / `2)` / `3)`');
    expect(skill).toContain('STOP: wait for the user answer before continuing.');
    expect(fullDesign).toContain('## Decision Questions');
    expect(manifest).toContain('"decisionQuestions"');
    expect(planningContract).toContain('options：只能使用 `A` / `B` / `C`');
  });

  test('rejects numeric decision option ids in planning manifests', () => {
    const errors = [];

    collectDecisionQuestionOptionErrors({
      planningMeta: {
        decisionQuestions: [
          {
            questionId: 'D1',
            options: [
              { id: '1', label: 'Numeric option' },
              { id: '2', label: 'Another numeric option' }
            ],
            userChoice: '1'
          }
        ]
      }
    }, 'manifest', errors);

    expect(errors).toEqual(expect.arrayContaining([
      'manifest.planningMeta.decisionQuestions[0].options[0].id must be A, B, or C; got "1"',
      'manifest.planningMeta.decisionQuestions[0].options[1].id must be A, B, or C; got "2"',
      'manifest.planningMeta.decisionQuestions[0].userChoice must match a lettered option id'
    ]));
  });

  test('cc-plan carries the opt-in external best-practice validation contract', () => {
    const skill = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/SKILL.md'),
      'utf8'
    );
    const playbook = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/PLAYBOOK.md'),
      'utf8'
    );
    const fullDesign = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/assets/DESIGN_TEMPLATE.md'),
      'utf8'
    );
    const tinyDesign = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/assets/TINY_DESIGN_TEMPLATE.md'),
      'utf8'
    );
    const tasks = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/assets/TASKS_TEMPLATE.md'),
      'utf8'
    );
    const manifest = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/assets/TASK_MANIFEST_TEMPLATE.json'),
      'utf8'
    );

    expect(skill).toContain('## External Best-Practice Validation');
    expect(skill).toContain('external-best-practice');
    expect(skill).toContain('generalized');
    expect(playbook).toContain('external best-practice validation');
    expect(fullDesign).toContain('## External Best-Practice Validation');
    expect(tinyDesign).toContain('## External Best-Practice Validation');
    expect(tasks).toContain('External best-practice validation');
    expect(manifest).toContain('"externalBestPractice"');
  });

  test('cc-plan carries the AI leverage decision lens contract', () => {
    const skill = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/SKILL.md'),
      'utf8'
    );
    const fullDesign = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/assets/DESIGN_TEMPLATE.md'),
      'utf8'
    );
    const tinyDesign = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/assets/TINY_DESIGN_TEMPLATE.md'),
      'utf8'
    );
    const tasks = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/assets/TASKS_TEMPLATE.md'),
      'utf8'
    );
    const manifest = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/assets/TASK_MANIFEST_TEMPLATE.json'),
      'utf8'
    );
    const parsedManifest = JSON.parse(manifest);
    const planningContract = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-plan/references/planning-contract.md'),
      'utf8'
    );

    expect(skill).toContain('## AI Leverage Decision Lens');
    expect(skill).toContain('`boil-lake` / `sharp-wedge` / `needs-evidence` / `pivot`');
    expect(fullDesign).toContain('## AI Leverage Decision Lens');
    expect(tinyDesign).toContain('## AI Leverage Decision Lens');
    expect(tasks).toContain('AI Leverage Decision Lens: boil-lake | sharp-wedge | needs-evidence | pivot');
    expect(manifest).toContain('"aiLeverageDecisionLens"');
    expect(manifest).toContain('"humanTeamEffortForFullScope"');
    expect(manifest).toContain('"completeLakeBoundary"');
    expect(parsedManifest.planningMeta.reqPlanSkillVersion).toBe('3.8.3');
    expect(parsedManifest.sourceRoadmap).toBeUndefined();
    expect(parsedManifest.spec).toBeUndefined();
    expect(parsedManifest.status).toBeUndefined();
    expect(parsedManifest.activePhase).toBeUndefined();
    expect(planningContract).toContain('AI Leverage Decision Lens 必须在任务生成前闭合');
    expect(skill).toContain('## ClaudeCode / Codex Execution Compliance');
    expect(tasks).toContain('## Execution Protocol');
    expect(tasks).toContain('mark-task-complete.sh');
    expect(parsedManifest.executionProtocol).toBeUndefined();
    expect(parsedManifest.tasks[0].completion).toBeUndefined();
    expect(parsedManifest.tasks[0].run).toContain('npm test -- src/feature/feature.test.ts');
    expect(planningContract).toContain('## Execution Protocol Fields');
  });

  test('rejects retired cc-plan manifest fields', () => {
    const errors = [];

    collectSlimManifestErrors({
      executionProtocol: {},
      sourceEvidence: [],
      sourceRoadmap: {},
      spec: {},
      status: 'planned',
      activePhase: 1,
      planningMeta: {
        requirementBrief: {},
        ambiguityGate: {},
        reviewLoop: {}
      },
      tasks: [
        {
          id: 'T001',
          completion: {},
          testQuality: {},
          allowedMocks: []
        }
      ]
    }, 'manifest', errors);

    expect(errors).toEqual(expect.arrayContaining([
      'manifest.executionProtocol is retired; keep that detail in planning/design.md or planning/tasks.md',
      'manifest.sourceEvidence is retired; keep that detail in planning/design.md or planning/tasks.md',
      'manifest.sourceRoadmap is retired; keep that detail in planning/design.md or planning/tasks.md',
      'manifest.spec is retired; keep that detail in planning/design.md or planning/tasks.md',
      'manifest.status is retired; keep that detail in planning/design.md or planning/tasks.md',
      'manifest.activePhase is retired; keep that detail in planning/design.md or planning/tasks.md',
      'manifest.planningMeta.requirementBrief is retired; keep that detail in planning/design.md',
      'manifest.planningMeta.ambiguityGate is retired; keep that detail in planning/design.md',
      'manifest.planningMeta.reviewLoop is retired; keep that detail in planning/design.md',
      'manifest.tasks[0].completion is retired; keep that detail in planning/tasks.md',
      'manifest.tasks[0].testQuality is retired; keep that detail in planning/tasks.md',
      'manifest.tasks[0].allowedMocks is retired; keep that detail in planning/tasks.md'
    ]));
  });

  test('carries the shared artifact ownership contract', () => {
    const errors = [];

    validateArtifactOwnershipContracts(errors);

    expect(errors).toEqual([]);
  });

  test('cc-roadmap carries the AI leverage route lens contract', () => {
    const skill = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-roadmap/SKILL.md'),
      'utf8'
    );
    const roadmap = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-roadmap/assets/ROADMAP_TEMPLATE.md'),
      'utf8'
    );
    const tracking = fs.readFileSync(
      path.join(ROOT, '.claude/skills/cc-roadmap/assets/TRACKING_TEMPLATE.json'),
      'utf8'
    );

    expect(skill).toContain('## AI Leverage Route Lens');
    expect(skill).toContain('`boil-lake`：已有真实用户');
    expect(roadmap).toContain('## AI Leverage Route Lens');
    expect(roadmap).toContain('Verdict: `boil-lake` | `sharp-wedge` | `needs-evidence` | `pivot`');
    expect(tracking).toContain('"aiLeverageRouteLens"');
    expect(tracking).toContain('"completeLakeBoundary"');
  });

  test('rejects invalid external best-practice handoff metadata', () => {
    const errors = [];

    collectExternalBestPracticeErrors({
      planningMeta: {
        externalBestPractice: {
          needed: true,
          decisionStatus: 'not-needed',
          privacyGuard: 'send project details',
          generalizedSearchTerms: 'best practices',
          sourcesChecked: 'none',
          repoFitVerdict: 'maybe',
          designImpacts: 'none',
          skippedReason: ''
        }
      }
    }, 'manifest', errors);
    collectExternalBestPracticeErrors({
      planningMeta: {
        externalBestPractice: {
          needed: true,
          decisionStatus: 'approved',
          privacyGuard: 'generalized terms only',
          generalizedSearchTerms: [],
          sourcesChecked: [{}],
          conventionalWisdom: '',
          currentDiscourse: '',
          repoFitVerdict: 'skipped',
          designImpacts: []
        }
      }
    }, 'approvedManifest', errors);

    expect(errors).toEqual(expect.arrayContaining([
      'manifest.planningMeta.externalBestPractice.privacyGuard must require generalized terms only',
      'manifest.planningMeta.externalBestPractice.generalizedSearchTerms must be an array',
      'manifest.planningMeta.externalBestPractice.sourcesChecked must be an array',
      'manifest.planningMeta.externalBestPractice.repoFitVerdict must be one of confirmed, adjusted, contradicted, skipped',
      'manifest.planningMeta.externalBestPractice.designImpacts must be an array',
      'manifest.planningMeta.externalBestPractice.decisionStatus must not be not-needed when needed is true',
      'manifest.planningMeta.externalBestPractice.skippedReason must be a non-empty string',
      'approvedManifest.planningMeta.externalBestPractice.sourcesChecked[0].source must be a non-empty string',
      'approvedManifest.planningMeta.externalBestPractice.sourcesChecked[0].trustLevel must be one of internal-contract, repo-evidence, external-evidence, untrusted-text',
      'approvedManifest.planningMeta.externalBestPractice.sourcesChecked[0].keyPoint must be a non-empty string',
      'approvedManifest.planningMeta.externalBestPractice.generalizedSearchTerms must be a non-empty array',
      'approvedManifest.planningMeta.externalBestPractice.conventionalWisdom must be a non-empty string',
      'approvedManifest.planningMeta.externalBestPractice.currentDiscourse must be a non-empty string',
      'approvedManifest.planningMeta.externalBestPractice.repoFitVerdict must not be skipped when decisionStatus is approved'
    ]));
  });
});
