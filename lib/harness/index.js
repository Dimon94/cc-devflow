/**
 * [INPUT]: 依赖 harness 各模块。
 * [OUTPUT]: 统一导出 schema/store/planner/query 与 operations 入口。
 * [POS]: harness 模块聚合出口，被 bin 与测试代码使用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const store = require('./store');
const schemas = require('./schemas');
const planner = require('./planner');
const query = require('./query');
const intent = require('./intent');
const teamState = require('./team-state');
const delegation = require('./delegation');
const worker = require('./operations/worker');
const workerRun = require('./operations/worker-run');

module.exports = {
  ...store,
  ...schemas,
  ...planner,
  ...query,
  ...intent,
  ...teamState,
  ...delegation,
  ...worker,
  ...workerRun
};
