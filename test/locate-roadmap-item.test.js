const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

describe('cc-roadmap locator', () => {
  test('prefers roadmap-tracking.json when locating RM and REQ ids', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const script = path.join(
      repoRoot,
      '.claude/skills/cc-roadmap/scripts/locate-roadmap-item.sh'
    );
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-roadmap-locate-'));
    const roadmapDir = path.join(tempDir, 'devflow');
    const roadmapPath = path.join(roadmapDir, 'ROADMAP.md');
    const backlogPath = path.join(roadmapDir, 'BACKLOG.md');
    const trackingPath = path.join(roadmapDir, 'roadmap-tracking.json');

    fs.mkdirSync(roadmapDir, { recursive: true });
    fs.writeFileSync(
      roadmapPath,
      ['# ROADMAP', '', '## Implementation Tracking', '', '| RM-ID | Item | Stage | Priority | Status | REQ | Progress |', '|------|------|-------|----------|--------|-----|----------|', '| RM-001 | Add one-click copy action | Stage 1 | P1 | In review | REQ-001 | 100% |', ''].join('\n')
    );
    fs.writeFileSync(
      backlogPath,
      ['# BACKLOG', '', '## Queue', '', '| RM-ID | Title | Source Stage | Priority | Ready |', '|------|-------|--------------|----------|-------|', '| RM-001 | Add one-click copy action | Stage 1 | P1 | Yes |', ''].join('\n')
    );
    fs.writeFileSync(
      trackingPath,
      `${JSON.stringify(
        {
          version: 1,
          lastSyncedAt: '2026-04-19',
          items: [
            {
              rmId: 'RM-001',
              item: 'Add one-click copy action',
              stage: 'Stage 1',
              priority: 'P1',
              primaryCapability: 'cap-invite-links',
              secondaryCapabilities: ['cap-share-dialog'],
              expectedSpecDelta: 'tighten invite-link copy truth',
              dependsOn: [],
              status: 'In review',
              req: 'REQ-001',
              progress: '100%',
              backlog: {
                capabilityGap: 'share dialog exposes invite URL but not direct copy action',
                evidence: 'repeated support friction',
                parallelWith: [],
                unknowns: 'copied-state feedback shape',
                nextDecision: 'freeze tiny design and execute',
                ready: true,
                whyNow: 'it removes the first visible collaboration friction in the beta flow',
                successSignal: 'users can copy the invite link with one click',
                entryConstraints: 'no backend changes',
                openRisks: 'clipboard failure follow-up UX may still be needed',
                firstPlanningQuestion: 'can this stay a tiny-design patch?',
                requiredContextToLoad: 'share dialog, invite URL source, existing tests',
                whyReadyNow: 'the ask is narrow and evidence-backed',
                parked: false,
                parkedReason: '',
                triggerToReopen: '',
                missingEvidence: ''
              }
            }
          ]
        },
        null,
        2
      )}\n`
    );

    const locateReq = spawnSync('bash', [script, 'REQ-001', '--roadmap', roadmapPath, '--backlog', backlogPath], {
      cwd: repoRoot,
      encoding: 'utf8'
    });
    expect(locateReq.status).toBe(0);
    expect(locateReq.stdout).toContain('[TRACKING]');
    expect(locateReq.stdout).toContain('RM-ID: RM-001');
    expect(locateReq.stdout).toContain('REQ: REQ-001');
    expect(locateReq.stdout).toContain('Primary Capability: cap-invite-links');
    expect(locateReq.stdout).toContain('Queue Ready: Yes');
    expect(locateReq.stdout).toContain('Why now: it removes the first visible collaboration friction in the beta flow');

    const locateRm = spawnSync('bash', [script, 'RM-001', '--roadmap', roadmapPath, '--backlog', backlogPath], {
      cwd: repoRoot,
      encoding: 'utf8'
    });
    expect(locateRm.status).toBe(0);
    expect(locateRm.stdout).toContain('[TRACKING]');
    expect(locateRm.stdout).toContain('Secondary Capabilities: cap-share-dialog');
    expect(locateRm.stdout).toContain('Next Decision: freeze tiny design and execute');
    expect(locateRm.stdout).toContain('Why this is ready now: the ask is narrow and evidence-backed');
    expect(locateRm.stdout).toContain('[ROADMAP]');
    expect(locateRm.stdout).toContain('[BACKLOG]');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
