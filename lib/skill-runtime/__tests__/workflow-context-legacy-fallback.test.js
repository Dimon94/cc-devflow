/**
 * [INPUT]: 依赖 getWorkflowContext 查询 seam、仓库内真实 legacy workflow artifacts。
 * [OUTPUT]: 验证 legacy design.md fallback 在 compact context 中仍是一等合同入口。
 * [POS]: REQ-003-minimize-workflow-artifacts T010 的 Red/Green 证据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const path = require('path');

const { getWorkflowContext } = require('../query');

const repoRoot = path.resolve(__dirname, '../../..');

describe('workflow-context legacy fallback refs', () => {
  test.each([
    ['REQ-001', 'REQ-001-personal-output-config'],
    ['REQ-002', 'REQ-002-unified-roadmap-truth']
  ])('%s keeps design.md as the first fallback contract ref', async (changeId, changeKey) => {
    const context = await getWorkflowContext(repoRoot, changeId, { changeKey });
    const designRef = `devflow/changes/${changeKey}/planning/design.md#approved-direction`;

    expect(context.legacyFallback).toBe(true);
    expect(context.source.contract.path).toBe(`devflow/changes/${changeKey}/planning/design.md`);
    expect(context.progressiveDisclosure.defaultOpen[0]).toEqual(expect.objectContaining({
      ref: designRef,
      reason: 'primary task contract',
      exists: true
    }));
    expect(context.progressiveDisclosure.defaultOpen.every((entry) => entry.exists === true))
      .toBe(true);
  });
});
