/**
 * [INPUT]: 接收 query id、repoRoot/changeId 与只读 handler registry。
 * [OUTPUT]: 返回 typed query result：ok/data 或 named error，并附 operational trace。
 * [POS]: skill runtime 的查询分发表，只读派生已有 artifact，不承载 workflow 语义。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');

const { namedError, serializeError } = require('./errors');
const { createTrace } = require('./trace');

function resolveArtifactRefs(entry, context, key) {
  const refs = entry[key];
  return typeof refs === 'function' ? refs(context) : refs || [];
}

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

    let artifactRefs = [];
    try {
      artifactRefs = resolveArtifactRefs(entry, context, 'artifactRefs');
      const requiredArtifactRefs = resolveArtifactRefs(entry, context, 'requiredArtifactRefs');
      const missingRefs = requiredArtifactRefs.filter((ref) => !fs.existsSync(ref));
      if (missingRefs.length > 0) {
        throw namedError(
          'MissingQueryArtifactError',
          `Missing required query artifact: ${missingRefs.join(', ')}`,
          {
            artifactRefs: missingRefs,
            rescueAction: 'create required workflow artifacts before running this query'
          }
        );
      }

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
          nextAction: error.rescueAction || 'inspect-workflow-artifacts'
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
