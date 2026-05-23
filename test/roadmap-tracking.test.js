const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

describe('cc-roadmap tracking sync', () => {
  test('renders canonical v3 roadmap state from legacy tracking data', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const script = path.join(
      repoRoot,
      '.claude/skills/cc-roadmap/scripts/roadmap-tracking.js'
    );
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-roadmap-v3-state-'));
    const roadmapDir = path.join(tempDir, 'devflow');
    const roadmapPath = path.join(roadmapDir, 'ROADMAP.md');
    const backlogPath = path.join(roadmapDir, 'BACKLOG.md');
    const statePath = path.join(roadmapDir, 'roadmap.json');
    const legacyTrackingPath = path.join(roadmapDir, 'roadmap-tracking.json');

    fs.mkdirSync(roadmapDir, { recursive: true });
    fs.writeFileSync(roadmapPath, '# ROADMAP\n');
    fs.writeFileSync(backlogPath, '# BACKLOG\n');
    fs.writeFileSync(
      legacyTrackingPath,
      `${JSON.stringify(
        {
          version: 2,
          lastSyncedAt: '2026-04-30',
          backlogMeta: {
            roadmapVersion: 'roadmap.v1',
            skillVersion: '4.4.1',
            currentFocusStage: 'Stage 1'
          },
          dependencyHandoff: {
            serialSpine: 'RM-001',
            parallelReadyNextWave: 'RM-002',
            notesOnBlockers: 'keep the first wedge serial'
          },
          items: [
            {
              rmId: 'RM-001',
              item: 'Unify roadmap truth',
              stage: 'Stage 1',
              priority: 'P0',
              primaryCapability: 'roadmap-truth-model',
              secondaryCapabilities: ['adapter-distribution'],
              expectedSpecDelta: 'replace tracking sidecar with roadmap state',
              dependsOn: [],
              status: 'Planned',
              req: 'REQ-002',
              progress: '0%',
              backlog: {
                capabilityGap: 'roadmap and backlog duplicate RM state',
                evidence: 'three files carry overlapping roadmap data',
                parallelWith: [],
                unknowns: '',
                nextDecision: 'freeze v3 state contract',
                ready: true,
                whyNow: 'the sidecar is already acting as shared truth',
                successSignal: 'one structured state renders all roadmap views',
                entryConstraints: 'preserve legacy input migration',
                openRisks: 'downstream projects may still have old tracking files',
                reviewGateHints: 'run plan review; implementation review can skip unless renderer code changes',
                firstPlanningQuestion: 'can this stay one compatibility release?',
                requiredContextToLoad: 'roadmap scripts and examples',
                whyReadyNow: 'the drift surface is visible and bounded',
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

    const result = spawnSync(
      'node',
      [script, 'render', '--roadmap', roadmapPath, '--backlog', backlogPath, '--tracking', statePath],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    expect(result.status).toBe(0);

    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    expect(state.version).toBe(3);
    expect(state.meta).toEqual(
      expect.objectContaining({
        roadmapVersion: 'roadmap.v1',
        skillVersion: '4.4.1',
        currentFocusStage: 'Stage 1'
      })
    );
    expect(state.context).toEqual(expect.any(Object));
    expect(state.handoff).toEqual(
      expect.objectContaining({
        readyForCcPlan: ['RM-001'],
        parked: [],
        serialSpine: ['RM-001'],
        parallelWaves: ['RM-002']
      })
    );
    expect(state.architecture).toEqual(
      expect.objectContaining({
        diagramType: 'flowchart',
        nodes: expect.any(Array),
        edges: expect.any(Array)
      })
    );
    expect(state.items).toEqual([
      expect.objectContaining({
        rmId: 'RM-001',
        item: 'Unify roadmap truth',
        primaryCapability: 'roadmap-truth-model',
        secondaryCapabilities: ['adapter-distribution'],
        expectedSpecDelta: 'replace tracking sidecar with roadmap state',
        backlog: expect.objectContaining({
          capabilityGap: 'roadmap and backlog duplicate RM state',
          ready: true,
          whyNow: 'the sidecar is already acting as shared truth',
          reviewGateHints: 'run plan review; implementation review can skip unless renderer code changes'
        })
      })
    ]);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('renders roadmap and deprecated backlog projections from v3 state', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const script = path.join(
      repoRoot,
      '.claude/skills/cc-roadmap/scripts/roadmap-tracking.js'
    );
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-roadmap-v3-render-'));
    const roadmapDir = path.join(tempDir, 'devflow');
    const roadmapPath = path.join(roadmapDir, 'ROADMAP.md');
    const backlogPath = path.join(roadmapDir, 'BACKLOG.md');
    const statePath = path.join(roadmapDir, 'roadmap.json');

    fs.mkdirSync(roadmapDir, { recursive: true });
    fs.writeFileSync(roadmapPath, '# ROADMAP\n');
    fs.writeFileSync(backlogPath, '# BACKLOG\n');
    fs.writeFileSync(
      statePath,
      `${JSON.stringify(
        {
          version: 3,
          meta: {
            roadmapVersion: 'roadmap.v2',
            skillVersion: '5.2.0',
            status: 'active',
            lastUpdated: '2026-05-01',
            currentFocusStage: 'Stage 1'
          },
          context: {
            projectDirectionMode: 'founder-business',
            projectDirectionRationale: 'the roadmap is choosing a paid wedge',
            directionQuestionsSelected: ['demand reality', 'narrowest paid wedge'],
            directionQuestionsSkipped: ['long-term platform architecture'],
            directionGuardrailsApplied: ['brand-neutral founder advice'],
            planningPosture: 'startup',
            evidenceMaturity: 'idea'
          },
          items: [
            {
              rmId: 'RM-010',
              item: 'Generate roadmap views from state',
              stage: 'Stage 1',
              priority: 'P0',
              primaryCapability: 'roadmap-truth-model',
              secondaryCapabilities: [],
              expectedSpecDelta: 'render views from roadmap.json',
              dependsOn: [],
              status: 'Ready',
              req: 'REQ-010',
              progress: '20%',
              backlog: {
                capabilityGap: 'views are not state generated',
                evidence: 'manual markdown drift',
                parallelWith: [],
                unknowns: '',
                nextDecision: 'ship renderer',
                ready: true,
                whyNow: 'state is canonical',
                successSignal: 'generated views cite roadmap.json',
                entryConstraints: '',
                openRisks: '',
                reviewGateHints: 'run plan review because this changes generated projections',
                firstPlanningQuestion: '',
                requiredContextToLoad: '',
                whyReadyNow: 'contract is frozen',
                parked: false
              }
            }
          ],
          handoff: {
            readyForCcPlan: ['RM-010'],
            parked: [],
            serialSpine: ['RM-010'],
            parallelWaves: []
          },
          architecture: {
            diagramType: 'flowchart',
            nodes: [
              { id: 'roadmap_json', label: 'roadmap.json' },
              { id: 'roadmap_md', label: 'ROADMAP.md' },
              { id: 'cc_plan', label: 'cc-plan' }
            ],
            edges: [
              { from: 'roadmap_json', to: 'roadmap_md', label: 'renders' },
              { from: 'roadmap_md', to: 'cc_plan', label: 'hands off' }
            ]
          }
        },
        null,
        2
      )}\n`
    );

    const result = spawnSync(
      'node',
      [script, 'render', '--roadmap', roadmapPath, '--backlog', backlogPath, '--tracking', statePath],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    expect(result.status).toBe(0);

    const renderedRoadmap = fs.readFileSync(roadmapPath, 'utf8');
    expect(renderedRoadmap).toContain('- Roadmap state source: `roadmap.json`');
    expect(renderedRoadmap).toContain('- Output language: en');
    expect(renderedRoadmap).toContain('## Technical Architecture');
    expect(renderedRoadmap).toContain('```mermaid');
    expect(renderedRoadmap).toContain('flowchart TD');
    expect(renderedRoadmap).toContain('roadmap_json["roadmap.json"]');
    expect(renderedRoadmap).toContain('roadmap_json -->|renders| roadmap_md');
    expect(renderedRoadmap).toContain('roadmap_md -->|hands off| cc_plan');

    const renderedBacklog = fs.readFileSync(backlogPath, 'utf8');
    expect(renderedBacklog.startsWith('# BACKLOG\n\n> Deprecated projection. Edit `roadmap.json` instead.')).toBe(
      true
    );
    expect(renderedBacklog).toContain('- Skill version: `5.2.0`');
    expect(renderedBacklog).toContain('- Roadmap state source: `roadmap.json`');
    expect(renderedBacklog).toContain('- Output language: en');
    expect(renderedBacklog).toContain('## Project Direction Handoff');
    expect(renderedBacklog).toContain('- Project direction mode: founder-business');
    expect(renderedBacklog).toContain(
      '- Direction-specific questions selected: demand reality, narrowest paid wedge'
    );
    expect(renderedBacklog).toContain(
      '- Direction guardrails applied: brand-neutral founder advice'
    );
    expect(renderedBacklog).toContain(
      '- Review gate hints: run plan review because this changes generated projections'
    );
    expect(renderedBacklog).toContain('| RM-010 | Generate roadmap views from state |');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('renders roadmap and backlog projections in configured Chinese', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const script = path.join(
      repoRoot,
      '.claude/skills/cc-roadmap/scripts/roadmap-tracking.js'
    );
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-roadmap-v3-zh-'));
    const roadmapDir = path.join(tempDir, 'devflow');
    const roadmapPath = path.join(roadmapDir, 'ROADMAP.md');
    const backlogPath = path.join(roadmapDir, 'BACKLOG.md');
    const statePath = path.join(roadmapDir, 'roadmap.json');

    fs.mkdirSync(roadmapDir, { recursive: true });
    fs.writeFileSync(roadmapPath, '# ROADMAP\n');
    fs.writeFileSync(backlogPath, '# BACKLOG\n');
    fs.writeFileSync(
      statePath,
      `${JSON.stringify(
        {
          version: 3,
          outputPolicy: {
            documentLanguage: 'zh-CN'
          },
          meta: {
            roadmapVersion: 'roadmap.v2',
            skillVersion: '5.2.0',
            status: 'active',
            lastUpdated: '2026-05-01',
            currentFocusStage: 'Stage 1'
          },
          context: {
            projectDirectionMode: 'founder-business',
            projectDirectionRationale: '需要选择付费楔子',
            directionQuestionsSelected: ['需求现实'],
            directionQuestionsSkipped: [],
            directionGuardrailsApplied: ['保持项目语言'],
            planningPosture: 'startup',
            evidenceMaturity: 'idea'
          },
          items: [
            {
              rmId: 'RM-010',
              item: '生成中文投影',
              stage: 'Stage 1',
              priority: 'P0',
              primaryCapability: 'roadmap-truth-model',
              secondaryCapabilities: [],
              expectedSpecDelta: 'render views from roadmap.json',
              dependsOn: [],
              status: 'Ready',
              req: 'REQ-010',
              progress: '20%',
              backlog: {
                capabilityGap: 'views are not state generated',
                evidence: 'manual markdown drift',
                parallelWith: [],
                unknowns: '',
                nextDecision: 'ship renderer',
                ready: true,
                whyNow: 'state is canonical',
                successSignal: 'generated views cite roadmap.json',
                entryConstraints: '',
                openRisks: '',
                firstPlanningQuestion: '',
                requiredContextToLoad: '',
                whyReadyNow: 'contract is frozen',
                parked: false
              }
            }
          ],
          handoff: {
            readyForCcPlan: ['RM-010'],
            parked: [],
            serialSpine: ['RM-010'],
            parallelWaves: []
          },
          architecture: {
            diagramType: 'flowchart',
            nodes: [{ id: 'roadmap_json', label: 'roadmap.json' }],
            edges: []
          }
        },
        null,
        2
      )}\n`
    );

    const result = spawnSync(
      'node',
      [script, 'render', '--roadmap', roadmapPath, '--backlog', backlogPath, '--tracking', statePath],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    expect(result.status).toBe(0);

    const renderedRoadmap = fs.readFileSync(roadmapPath, 'utf8');
    expect(renderedRoadmap).toContain('# 路线图');
    expect(renderedRoadmap).toContain('## 执行跟踪');
    expect(renderedRoadmap).toContain('- 路线图状态源: `roadmap.json`');
    expect(renderedRoadmap).toContain('- Output language: zh-CN');
    expect(renderedRoadmap).toContain('| RM-ID | 事项 | 阶段 | 优先级 | 主能力 |');

    const renderedBacklog = fs.readFileSync(backlogPath, 'utf8');
    expect(renderedBacklog).toContain('# 待办队列');
    expect(renderedBacklog).toContain('> 已废弃投影。请编辑 `roadmap.json`。');
    expect(renderedBacklog).toContain('- Output language: zh-CN');
    expect(renderedBacklog).toContain('## 项目方向交接');
    expect(renderedBacklog).toContain('- 项目方向模式: founder-business');
    expect(renderedBacklog).toContain('| RM-010 | 生成中文投影 |');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

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
