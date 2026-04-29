/**
 * [INPUT]: 接收 query id、repoRoot/changeId 与只读 handler registry。
 * [OUTPUT]: 返回 typed query result：ok/data 或 named error，并附 operational trace。
 * [POS]: skill runtime 的查询分发表，只读派生已有 artifact，不承载 workflow 语义。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { namedError, serializeError } = require('./errors');
const { createTrace } = require('./trace');

function createQueryRegistry(entries) {
  const registry = new Map(entries.map((entry) => [entry.id, entry]));

  function listQueryIds() {
    return [...registry.keys()].sort();
  }

  async function runQuery(queryId, context = {}) {
    const entry = registry.get(queryId);

    if (!entry) {
      const supported = listQueryIds();
      const error = namedError(
        'UnknownQueryError',
        `Unknown query id: ${queryId}`,
        {
          rescueAction: `use one of: ${supported.join(', ')}`,
          details: { supported }
        }
      );

      return {
        ok: false,
        queryId,
        error: serializeError(error),
        trace: createTrace({
          event: 'query.unknown',
          changeId: context.changeId,
          nextAction: 'choose-supported-query'
        })
      };
    }

    const artifactRefs = typeof entry.artifactRefs === 'function'
      ? entry.artifactRefs(context)
      : entry.artifactRefs || [];

    try {
      return {
        ok: true,
        queryId,
        data: await entry.handler(context),
        trace: createTrace({
          event: `query.${queryId}`,
          changeId: context.changeId,
          artifactRefs,
          nextAction: entry.nextAction || 'read-query-result'
        })
      };
    } catch (error) {
      return {
        ok: false,
        queryId,
        error: serializeError(error),
        trace: createTrace({
          event: `query.${queryId}.failed`,
          changeId: context.changeId,
          artifactRefs,
          nextAction: error.rescueAction || 'inspect-runtime-artifacts'
        })
      };
    }
  }

  return {
    listQueryIds,
    runQuery
  };
}

module.exports = {
  createQueryRegistry
};
