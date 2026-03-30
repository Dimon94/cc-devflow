/**
 * [INPUT]: 依赖 autopilot-shared、autopilot-core 与 autopilot-execution 提供的阶段工具与 runner。
 * [OUTPUT]: 对外聚合导出 autopilot 所需的共享、核心与执行阶段能力。
 * [POS]: autopilot 的薄聚合层，让总入口只依赖一个模块，同时保持内部文件边界清晰。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const shared = require('./autopilot-shared');
const core = require('./autopilot-core');
const execution = require('./autopilot-execution');

module.exports = {
  ...shared,
  ...core,
  ...execution
};
