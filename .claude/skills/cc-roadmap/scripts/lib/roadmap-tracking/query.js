function findTrackingMatches(tracking, target) {
  const items = Array.isArray(tracking.items) ? tracking.items : [];
  return items.filter((item) => item.rmId === target || item.req === target);
}

function formatTrackingMatches(matches) {
  const lines = ['[TRACKING]'];

  for (const item of matches) {
    const backlog = item.backlog || {};
    lines.push(`RM-ID: ${item.rmId || '-'}`);
    lines.push(`REQ: ${item.req || '-'}`);
    lines.push(`Item: ${item.item || '-'}`);
    lines.push(`Stage: ${item.stage || '-'}`);
    lines.push(`Priority: ${item.priority || '-'}`);
    lines.push(`Primary Capability: ${item.primaryCapability || '-'}`);
    lines.push(
      `Secondary Capabilities: ${
        Array.isArray(item.secondaryCapabilities) && item.secondaryCapabilities.length
          ? item.secondaryCapabilities.join(', ')
          : '-'
      }`
    );
    lines.push(`Expected Spec Delta: ${item.expectedSpecDelta || '-'}`);
    lines.push(
      `Depends On: ${
        Array.isArray(item.dependsOn) && item.dependsOn.length ? item.dependsOn.join(', ') : '-'
      }`
    );
    lines.push(`Status: ${item.status || '-'}`);
    lines.push(`Progress: ${item.progress || '-'}`);
    lines.push(`Queue Ready: ${backlog.ready ? 'Yes' : 'No'}`);
    lines.push(`Parked: ${backlog.parked ? 'Yes' : 'No'}`);
    lines.push(`Capability Gap: ${backlog.capabilityGap || '-'}`);
    lines.push(`Evidence: ${backlog.evidence || '-'}`);
    lines.push(
      `Parallel With: ${
        Array.isArray(backlog.parallelWith) && backlog.parallelWith.length
          ? backlog.parallelWith.join(', ')
          : '-'
      }`
    );
    lines.push(`Next Decision: ${backlog.nextDecision || '-'}`);
    lines.push(`Why now: ${backlog.whyNow || '-'}`);
    lines.push(`Success signal: ${backlog.successSignal || '-'}`);
    lines.push(`Entry constraints: ${backlog.entryConstraints || '-'}`);
    lines.push(`Open risks: ${backlog.openRisks || '-'}`);
    lines.push(`First planning question: ${backlog.firstPlanningQuestion || '-'}`);
    lines.push(`Required context to load: ${backlog.requiredContextToLoad || '-'}`);
    lines.push(`Why this is ready now: ${backlog.whyReadyNow || '-'}`);
    lines.push(`Reason parked: ${backlog.parkedReason || '-'}`);
    lines.push(`Trigger to reopen: ${backlog.triggerToReopen || '-'}`);
    lines.push(`Missing evidence: ${backlog.missingEvidence || '-'}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  findTrackingMatches,
  formatTrackingMatches
};
