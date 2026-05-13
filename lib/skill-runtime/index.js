/**
 * [INPUT]: 依赖 skill runtime 基础模块。
 * [OUTPUT]: 统一导出 config/path/store/query helpers。
 * [POS]: skill runtime 模块聚合出口，只保留 CLI 仍需的轻量能力。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const store = require('./store');
const query = require('./query');
const queryRegistry = require('./query-registry');
const errors = require('./errors');
const trace = require('./trace');
const paths = require('./paths');
const config = require('./config');
const archiveChange = require('./archive-change');

module.exports = {
  ...store,
  ...query,
  ...queryRegistry,
  ...errors,
  ...trace,
  ...paths,
  ...config,
  ...archiveChange
};
