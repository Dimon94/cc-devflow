const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

describe('cc-roadmap tracking sync', () => {
  test('bootstraps legacy tracking tables into json truth and rerenders roadmap', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const script = path.join(
      repoRoot,
      '.claude/skills/cc-roadmap/scripts/sync-roadmap-progress.sh'
    );
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-roadmap-tracking-'));
    const roadmapDir = path.join(tempDir, 'devflow');
    const roadmapPath = path.join(roadmapDir, 'ROADMAP.md');
    const backlogPath = path.join(roadmapDir, 'BACKLOG.md');
    const trackingPath = path.join(roadmapDir, 'roadmap-tracking.json');

    fs.mkdirSync(roadmapDir, { recursive: true });
    fs.writeFileSync(
      roadmapPath,
      [
        '# ROADMAP',
        '',
        '## Implementation Tracking',
        '',
        '| RM-ID | Item | Stage | Priority | Status | REQ | Progress |',
        '|------|------|-------|----------|--------|-----|----------|',
        '| RM-001 | Add one-click copy action to the share dialog | Stage 1 | P1 | In progress | - | 20% |',
        ''
      ].join('\n')
    );
    fs.writeFileSync(
      backlogPath,
      [
        '# BACKLOG',
        '',
        '## Backlog Meta',
        '',
        '- Roadmap version: `roadmap.v1`',
        '- Skill version: `4.2.1`',
        '- Last synced: `2026-04-18`',
        '- Current focus stage: `Stage 1`',
        '',
        '## Queue',
        '',
        '| RM-ID | Title | Source Stage | Priority | Primary Capability | Secondary Capabilities | Capability Gap | Expected Spec Delta | Evidence | Depends On | Parallel With | Unknowns | Next Decision | Ready |',
        '|------|-------|--------------|----------|--------------------|------------------------|----------------|---------------------|----------|------------|---------------|----------|---------------|-------|',
        '| RM-001 | Add one-click copy action to the share dialog | Stage 1 | P1 | cap-invite-links | - | share dialog exposes invite URL but not direct copy action | tighten invite-link copy truth | repeated support friction | - | - | copied-state feedback shape | freeze tiny design and execute | Yes |',
        '',
        '## Dependency Handoff',
        '',
        '- Serial spine: `RM-001`',
        '- Parallel-ready next wave: `-`',
        '- Notes on blockers: wait for the copy action to settle before feedback polish',
        '',
        '## Ready For Req-Plan',
        '',
        '- RM-001:',
        '  - Primary Capability: `cap-invite-links`',
        '  - Secondary Capabilities: `-`',
        '  - Why now: it removes the first visible collaboration friction in the beta flow',
        '  - Success signal: users can copy the invite link with one click',
        '  - Entry constraints: no backend changes',
        '  - Capability gap: share dialog exposes invite URL but not direct copy action',
        '  - Expected spec delta: tighten invite-link copy truth',
        '  - Open risks: clipboard failure follow-up UX may still be needed',
        '  - First planning question: can this stay a tiny-design patch?',
        '  - Required context to load: share dialog, invite URL source, existing tests',
        '  - Depends On: `-`',
        '  - Parallel With: `-`',
        '  - Why this is ready now: the ask is narrow and evidence-backed',
        '',
        '## Parked',
        '',
        '- RM-099:',
        '  - Reason parked: analytics is premature',
        '  - Trigger to reopen: invite usage becomes weekly',
        '  - Missing evidence: stable collaboration volume',
        ''
      ].join('\n')
    );

    const result = spawnSync(
      'bash',
      [
        script,
        '--rm',
        'RM-001',
        '--status',
        'In review',
        '--req',
        'REQ-001',
        '--progress',
        '100%',
        '--primary-capability',
        'cap-invite-links',
        '--secondary-capabilities',
        'cap-workspace-membership',
        '--spec-delta',
        'tighten invite-link copy truth',
        '--file',
        roadmapPath,
        '--backlog-file',
        backlogPath,
        '--tracking-file',
        trackingPath
      ],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    expect(result.status).toBe(0);

    const tracking = JSON.parse(fs.readFileSync(trackingPath, 'utf8'));
    expect(tracking.version).toBe(2);
    expect(tracking.backlogMeta).toEqual({
      roadmapVersion: 'roadmap.v1',
      skillVersion: '4.2.1',
      currentFocusStage: 'Stage 1'
    });
    expect(tracking.dependencyHandoff).toEqual({
      serialSpine: 'RM-001',
      parallelReadyNextWave: '',
      notesOnBlockers: 'wait for the copy action to settle before feedback polish'
    });
    expect(tracking.items).toEqual([
      expect.objectContaining({
        rmId: 'RM-001',
        item: 'Add one-click copy action to the share dialog',
        stage: 'Stage 1',
        priority: 'P1',
        primaryCapability: 'cap-invite-links',
        secondaryCapabilities: ['cap-workspace-membership'],
        expectedSpecDelta: 'tighten invite-link copy truth',
        status: 'In review',
        req: 'REQ-001',
        progress: '100%',
        backlog: expect.objectContaining({
          capabilityGap: 'share dialog exposes invite URL but not direct copy action',
          evidence: 'repeated support friction',
          nextDecision: 'freeze tiny design and execute',
          ready: true,
          whyNow: 'it removes the first visible collaboration friction in the beta flow'
        })
      }),
      expect.objectContaining({
        rmId: 'RM-099',
        backlog: expect.objectContaining({
          parked: true,
          parkedReason: 'analytics is premature',
          triggerToReopen: 'invite usage becomes weekly',
          missingEvidence: 'stable collaboration volume'
        })
      })
    ]);

    const updatedRoadmap = fs.readFileSync(roadmapPath, 'utf8');
    expect(updatedRoadmap).toContain('- Tracking source: `roadmap-tracking.json`');
    expect(updatedRoadmap).toContain(
      '| RM-ID | Item | Stage | Priority | Primary Capability | Secondary Capabilities | Expected Spec Delta | Depends On | Status | REQ | Progress |'
    );
    expect(updatedRoadmap).toContain(
      '| RM-001 | Add one-click copy action to the share dialog | Stage 1 | P1 | cap-invite-links | cap-workspace-membership | tighten invite-link copy truth | - | In review | REQ-001 | 100% |'
    );
    const updatedBacklog = fs.readFileSync(backlogPath, 'utf8');
    expect(updatedBacklog).toContain('- Tracking source: `roadmap-tracking.json`');
    expect(updatedBacklog).toContain(
      '| RM-001 | Add one-click copy action to the share dialog | Stage 1 | P1 | cap-invite-links | cap-workspace-membership | share dialog exposes invite URL but not direct copy action | tighten invite-link copy truth | repeated support friction | - | - | copied-state feedback shape | freeze tiny design and execute | Yes |'
    );
    expect(updatedBacklog).toContain('- RM-099:');
    expect(updatedBacklog).toContain('  - Reason parked: analytics is premature');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
