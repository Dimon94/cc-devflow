const fs = require('fs');
const os = require('os');
const path = require('path');

const { runRelease } = require('../operations/release');
const {
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath,
  getReleaseNotePath
} = require('../store');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeReleaseFixture(repoRoot, reportOverrides = {}) {
  writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
    changeId: 'REQ-123',
    goal: 'Release only when ship ready',
    status: 'verified',
    initializedAt: '2026-03-25T01:00:00.000Z',
    plannedAt: '2026-03-25T01:01:00.000Z',
    verifiedAt: '2026-03-25T01:02:00.000Z',
    updatedAt: '2026-03-25T01:02:00.000Z'
  });

  writeJson(getTaskManifestPath(repoRoot, 'REQ-123'), {
    changeId: 'REQ-123',
    goal: 'Release only when ship ready',
    createdAt: '2026-03-25T01:00:00.000Z',
    updatedAt: '2026-03-25T01:02:00.000Z',
    tasks: [
      {
        id: 'T001',
        title: 'Finish change',
        type: 'IMPL',
        dependsOn: [],
        touches: ['src/a.ts'],
        run: ['echo ok'],
        checks: [],
        status: 'passed',
        attempts: 1,
        maxRetries: 1
      }
    ],
    metadata: {
      source: 'default',
      generatedBy: 'test',
      planVersion: 1
    }
  });

  writeJson(getReportCardPath(repoRoot, 'REQ-123'), {
    changeId: 'REQ-123',
    verdict: 'pass',
    overall: 'pass',
    specSyncReady: false,
    reroute: 'cc-do',
    quickGates: [],
    strictGates: [],
    review: { status: 'pass', summary: 'review-ok', details: '' },
    blockingFindings: [],
    gaps: [],
    timestamp: '2026-03-25T01:03:00.000Z',
    ...reportOverrides
  });
}

describe('runRelease', () => {
  test('blocks reports that pass verification but are not ship ready', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-release-readiness-'));
    writeReleaseFixture(repoRoot);

    await expect(runRelease({ repoRoot, changeId: 'REQ-123' })).rejects.toMatchObject({
      name: 'ReleaseReadinessError',
      rescueAction: 'run cc-check until ship-readiness is ready before release'
    });

    const runtimeState = JSON.parse(fs.readFileSync(getRuntimeStatePath(repoRoot, 'REQ-123'), 'utf8'));
    expect(runtimeState.status).toBe('verified');
    expect(fs.existsSync(getReleaseNotePath(repoRoot, 'REQ-123'))).toBe(false);
  });
});
