/**
 * T044: Resource Copier Tests
 *
 * [INPUT]: 内联路径字符串
 * [OUTPUT]: scanInlineClaudePaths 扫描结果
 * [POS]: 资源扫描单元测试，防止 glob 误判为文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { scanInlineClaudePaths } = require('../resource-copier.js');

describe('resource-copier', () => {
  test('scanInlineClaudePaths should skip glob patterns', () => {
    const content = 'Templates: .claude/docs/templates/context/*.jsonl.template';
    const paths = scanInlineClaudePaths(content);

    expect(paths).toEqual([]);
  });

  test('scanInlineClaudePaths should keep concrete file paths', () => {
    const content = 'Use .claude/scripts/check-prerequisites.sh before execution.';
    const paths = scanInlineClaudePaths(content);

    expect(paths).toContain('.claude/scripts/check-prerequisites.sh');
  });
});
