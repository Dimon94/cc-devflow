/**
 * [INPUT]: 接收 runtime/query/compiler 边界抛出的错误或失败字段。
 * [OUTPUT]: 生成可序列化 named error，保留 artifact refs 与 rescue action。
 * [POS]: skill runtime 的失败语义层，避免用 null/false/string 表达可恢复失败。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

class SkillRuntimeError extends Error {
  constructor(name, message, options = {}) {
    super(message);
    this.name = name;
    this.artifactRefs = options.artifactRefs || [];
    this.rescueAction = options.rescueAction || 'inspect-runtime-artifacts';
    this.details = options.details || {};
  }
}

function namedError(name, message, options = {}) {
  return new SkillRuntimeError(name, message, options);
}

function serializeError(error, fallbackName = 'SkillRuntimeError') {
  const name = error?.name || fallbackName;
  const message = error?.message || String(error || 'Unknown runtime error');

  return {
    name,
    message,
    artifactRefs: error?.artifactRefs || [],
    rescueAction: error?.rescueAction || 'inspect-runtime-artifacts',
    details: error?.details || {}
  };
}

module.exports = {
  SkillRuntimeError,
  namedError,
  serializeError
};
