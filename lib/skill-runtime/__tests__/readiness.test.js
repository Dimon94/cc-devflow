const {
  assertShipReady,
  deriveShipReadiness
} = require('../readiness');

describe('ship readiness', () => {
  test('derives one shared readiness verdict from report-card truth', () => {
    const report = {
      verdict: 'pass',
      overall: 'pass',
      reroute: 'none',
      specSyncReady: true,
      blockingFindings: [],
      gaps: [],
      timestamp: '2026-03-25T01:11:00.000Z'
    };

    expect(deriveShipReadiness(report, { reportPath: '/tmp/report-card.json' })).toEqual({
      ready: true,
      verdict: 'pass',
      reroute: 'none',
      specSyncReady: true,
      blockers: [],
      reportPath: '/tmp/report-card.json',
      timestamp: '2026-03-25T01:11:00.000Z'
    });
  });

  test('throws named release errors from the same readiness blockers', () => {
    const report = {
      verdict: 'pass',
      overall: 'pass',
      reroute: 'cc-do',
      specSyncReady: false,
      blockingFindings: ['review: stale'],
      gaps: ['spec gap'],
      timestamp: '2026-03-25T01:11:00.000Z'
    };

    expect(() => assertShipReady(report, {
      reportPath: '/tmp/report-card.json',
      errorName: 'ReleaseReadinessError',
      rescueAction: 'run cc-check until ship-readiness is ready before release'
    })).toThrow(expect.objectContaining({
      name: 'ReleaseReadinessError',
      artifactRefs: ['/tmp/report-card.json'],
      rescueAction: 'run cc-check until ship-readiness is ready before release',
      details: {
        blockers: ['reroute is cc-do', 'specSyncReady is not true', 'review: stale', 'spec gap']
      }
    }));
  });
});
