/**
 * [INPUT]: 接收 report-card 对象与 report artifact path。
 * [OUTPUT]: 派生 ship-readiness 结果，并在未 ready 时抛出 named error。
 * [POS]: skill runtime 的交付就绪单一真相源，被 query/release 共享。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { namedError } = require('./errors');

function deriveVerdict(report) {
  return report.verdict || (report.overall === 'pass' ? 'pass' : 'fail');
}

function collectShipReadinessBlockers(report) {
  const verdict = deriveVerdict(report);
  const blockers = [];

  if (report.overall !== 'pass') {
    blockers.push('report-card overall is not pass');
  }

  if (verdict !== 'pass') {
    blockers.push(`verdict is ${verdict}`);
  }

  if ((report.reroute || 'none') !== 'none') {
    blockers.push(`reroute is ${report.reroute}`);
  }

  if (report.specSyncReady !== true) {
    blockers.push('specSyncReady is not true');
  }

  blockers.push(...(report.blockingFindings || []));
  blockers.push(...(report.gaps || []));
  return blockers;
}

function deriveShipReadiness(report, { reportPath = '' } = {}) {
  const verdict = deriveVerdict(report);
  const reroute = report.reroute || 'none';
  const specSyncReady = report.specSyncReady === true;
  const blockers = collectShipReadinessBlockers(report);

  return {
    ready: blockers.length === 0,
    verdict,
    reroute,
    specSyncReady,
    blockers,
    reportPath,
    timestamp: report.timestamp || ''
  };
}

function assertShipReady(report, {
  reportPath = '',
  errorName = 'ShipReadinessError',
  rescueAction = 'run cc-check until ship-readiness is ready'
} = {}) {
  const readiness = deriveShipReadiness(report, { reportPath });

  if (readiness.ready) {
    return readiness;
  }

  throw namedError(
    errorName,
    `Ship readiness blocked: ${readiness.blockers.join('; ')}`,
    {
      artifactRefs: reportPath ? [reportPath] : [],
      rescueAction,
      details: {
        blockers: readiness.blockers
      }
    }
  );
}

module.exports = {
  collectShipReadinessBlockers,
  deriveShipReadiness,
  assertShipReady
};
