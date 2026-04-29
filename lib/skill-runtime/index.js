/**
 * [INPUT]: 依赖 skill runtime 各模块。
 * [OUTPUT]: 统一导出 schema/store/planner/query 与 operations 入口。
 * [POS]: skill runtime 模块聚合出口，被内部测试与脚本使用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const store = require('./store');
const schemas = require('./schemas');
const planner = require('./planner');
const query = require('./query');
const queryRegistry = require('./query-registry');
const errors = require('./errors');
const trace = require('./trace');
const readiness = require('./readiness');
const intent = require('./intent');
const artifacts = require('./artifacts');
const lifecycle = require('./lifecycle');
const teamState = require('./team-state');
const delegation = require('./delegation');
const paths = require('./paths');
const config = require('./config');
const worker = require('./operations/worker');
const workerRun = require('./operations/worker-run');

module.exports = {
  ...store,
  ...schemas,
  ...planner,
  ...query,
  ...queryRegistry,
  ...errors,
  ...trace,
  ...readiness,
  ...artifacts,
  ...intent,
  ...lifecycle,
  ...teamState,
  ...delegation,
  ...paths,
  ...config,
  ...worker,
  ...workerRun
};
