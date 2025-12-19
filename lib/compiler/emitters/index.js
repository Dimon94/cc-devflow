/**
 * T036: Emitter Index
 *
 * 导出所有 Emitter 类
 * 提供 getEmitter(platform) 工厂函数
 */
const BaseEmitter = require('./base-emitter.js');
const CodexEmitter = require('./codex-emitter.js');
const CursorEmitter = require('./cursor-emitter.js');
const QwenEmitter = require('./qwen-emitter.js');
const AntigravityEmitter = require('./antigravity-emitter.js');

// ============================================================
// Emitter Registry
// ============================================================
const EMITTERS = {
  codex: CodexEmitter,
  cursor: CursorEmitter,
  qwen: QwenEmitter,
  antigravity: AntigravityEmitter
};

// ============================================================
// getEmitter - 工厂函数
// ============================================================
function getEmitter(platform) {
  const EmitterClass = EMITTERS[platform];
  if (!EmitterClass) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return new EmitterClass();
}

// ============================================================
// getAllEmitters - 获取所有平台 Emitter 实例
// ============================================================
function getAllEmitters() {
  return Object.keys(EMITTERS).map(platform => getEmitter(platform));
}

module.exports = {
  BaseEmitter,
  CodexEmitter,
  CursorEmitter,
  QwenEmitter,
  AntigravityEmitter,
  getEmitter,
  getAllEmitters,
  PLATFORMS: Object.keys(EMITTERS)
};
