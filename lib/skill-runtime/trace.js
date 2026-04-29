/**
 * [INPUT]: 接收 query/doctor/preflight 的事件名、artifact refs 与下一动作。
 * [OUTPUT]: 生成统一 trace shape，供恢复、排查和 report-card 引用。
 * [POS]: skill runtime 的 operational trace 层，不承载 workflow 决策。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const crypto = require('crypto');

function createTrace({ event, changeId, artifactRefs = [], nextAction = 'inspect-result' } = {}) {
  return {
    eventId: `trace-${crypto.randomUUID()}`,
    event: event || 'runtime-event',
    changeId: changeId || '',
    artifactRefs,
    nextAction
  };
}

module.exports = {
  createTrace
};
