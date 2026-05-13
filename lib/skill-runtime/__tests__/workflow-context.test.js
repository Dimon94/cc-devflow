/**
 * [INPUT]: 依赖 getWorkflowContext 查询 seam、真实临时 workflow artifacts。
 * [OUTPUT]: 验证 workflow-context 对新 tasks.md contract refs 的默认打开顺序。
 * [POS]: REQ-003-minimize-workflow-artifacts T009 的 Red/Green 证据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const { getWorkflowContext } = require('../query');
const { getTaskManifestPath } = require('../store');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('workflow-context contract refs', () => {
  test.each([
    ['REQ-130', '## Contract Summary', 'contract-summary', 'PDCA'],
    ['FIX-130', '## Root Cause Contract', 'root-cause-contract', 'IDCA']
  ])('primary ref is tasks.md#%s for a new change', async (
    changeId,
    contractHeading,
    fragment,
    route
  ) => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-workflow-context-'));
    const manifestPath = getTaskManifestPath(repoRoot, changeId);
    const planningDir = path.dirname(manifestPath);
    const relativeTasksPath = path.relative(repoRoot, path.join(planningDir, 'tasks.md'));

    fs.mkdirSync(planningDir, { recursive: true });
    fs.writeFileSync(
      path.join(planningDir, 'tasks.md'),
      [
        '# TASKS',
        '',
        contractHeading,
        '',
        `Change: ${changeId}`,
        'Mode: plan',
        'Profile: standard',
        contractHeading.includes('Root Cause') ? 'Diagnosis: Keep root-cause truth in tasks.md.' : 'Approval: approved',
        '',
        '## Phase 1: Execute',
        '',
        '- [ ] T001 Execute new contract'
      ].join('\n')
    );
    writeJson(manifestPath, {
      changeId,
      goal: 'Expose new contract refs',
      createdAt: '2026-05-12T01:00:00.000Z',
      updatedAt: '2026-05-12T01:05:00.000Z',
      currentTaskId: 'T001',
      tasks: [
        {
          id: 'T001',
          title: 'Execute new contract',
          type: 'OTHER',
          phase: 1,
          dependsOn: [],
          run: ['npm test -- lib/skill-runtime/__tests__/workflow-context.test.js'],
          verification: ['npm test -- lib/skill-runtime/__tests__/workflow-context.test.js'],
          context: {
            readFiles: ['tasks.md'],
            commands: ['npm test -- lib/skill-runtime/__tests__/workflow-context.test.js'],
            notes: []
          },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'tasks.md',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    const context = await getWorkflowContext(repoRoot, changeId);

    expect(context.route).toBe(route);
    expect(context.legacyFallback).toBe(false);
    expect(context.source.contract.path).toBe(relativeTasksPath);
    expect(context.progressiveDisclosure.defaultOpen[0]).toEqual(expect.objectContaining({
      ref: `${relativeTasksPath}#${fragment}`,
      exists: true,
      reason: 'primary task contract'
    }));

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
});
