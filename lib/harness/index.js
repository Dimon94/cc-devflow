/**
 * [INPUT]: 依赖 harness 各模块。
 * [OUTPUT]: 统一导出 schema/store/planner 与 operations 入口。
 * [POS]: harness 模块聚合出口，被 bin 与测试代码使用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const store = require('./store');
const schemas = require('./schemas');
const planner = require('./planner');

module.exports = {
  ...store,
  ...schemas,
  ...planner
};
