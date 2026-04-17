/**
 * [INPUT]: 依赖 delegation 层提供 worker handoff 与 journal/state 工件，接收 changeId/workerId 以准备本地 worker 会话。
 * [OUTPUT]: 返回 worker launch/prompt/state/assignment 路径，并写入 handoff 准备日志。
 * [POS]: skill runtime 的 worker 会话入口，为未来本地 subagent/worker shell 对接提供稳定接口。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  buildWorkerHandoff,
  appendWorkerJournal,
  appendMessageBus,
  updateWorkerState
} = require('../delegation');

async function runWorkerSession({ repoRoot, changeId, workerId }) {
  const handoff = await buildWorkerHandoff(repoRoot, changeId, workerId);

  await updateWorkerState(repoRoot, changeId, workerId, {
    role: handoff.role,
    planVersion: 1,
    status: 'handoff_ready',
    currentTask: handoff.currentTask || 'assigned',
    workspace: 'pending'
  });
  await appendWorkerJournal(repoRoot, changeId, workerId, 'handoff prepared for local worker session');
  await appendMessageBus(repoRoot, changeId, `${workerId} handoff prepared`);

  return handoff;
}

module.exports = {
  runWorkerSession
};
