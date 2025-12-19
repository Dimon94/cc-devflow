/**
 * Rules Emitters Index
 *
 * 规则入口文件 Emitter 工厂:
 * - getRulesEmitter(platform): 获取对应平台的 emitter
 * - emitAllRules(registry, commands): 为所有平台生成规则文件
 *
 * Reference: TECH_DESIGN.md#RulesEmitter
 */
const { CursorRulesEmitter } = require('./cursor-rules-emitter');
const { CodexRulesEmitter } = require('./codex-rules-emitter');
const { QwenRulesEmitter } = require('./qwen-rules-emitter');
const { AntigravityRulesEmitter } = require('./antigravity-rules-emitter');
const { PLATFORMS } = require('../platforms');

// ============================================================
// Emitter Registry
// ============================================================
const EMITTER_REGISTRY = {
  cursor: CursorRulesEmitter,
  codex: CodexRulesEmitter,
  qwen: QwenRulesEmitter,
  antigravity: AntigravityRulesEmitter
};

// ============================================================
// getRulesEmitter - 获取平台 Rules Emitter
// ============================================================
function getRulesEmitter(platform) {
  const EmitterClass = EMITTER_REGISTRY[platform];

  if (!EmitterClass) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  return new EmitterClass();
}

// ============================================================
// emitAllRules - 为所有平台生成规则文件
// ============================================================
async function emitAllRules(registry, commands, options = {}) {
  const { platforms = PLATFORMS } = options;
  const results = [];

  for (const platform of platforms) {
    try {
      const emitter = getRulesEmitter(platform);
      const result = await emitter.emit(registry, commands);

      // 处理多文件输出（Antigravity 分块）
      if (Array.isArray(result)) {
        for (const r of result) {
          results.push({ platform, ...r });
        }
      } else {
        results.push({ platform, ...result });
      }
    } catch (error) {
      results.push({ platform, error: error.message });
    }
  }

  return results;
}

module.exports = {
  getRulesEmitter,
  emitAllRules,
  EMITTER_REGISTRY
};
