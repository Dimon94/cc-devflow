/**
 * [INPUT]: 兼容旧的 runPack 调用。
 * [OUTPUT]: 转发到 snapshot.js，保持 discover 阶段行为不变。
 * [POS]: 内部兼容层，避免旧测试或外部脚本立刻失效。
 * [PROTOCOL]: 新代码优先引用 snapshot.js，然后检查 CLAUDE.md
 */

const { runPlanningSnapshot } = require('./snapshot');

async function runPack(options) {
  return runPlanningSnapshot(options);
}

module.exports = {
  runPack
};
