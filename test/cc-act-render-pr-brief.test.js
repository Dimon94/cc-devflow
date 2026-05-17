const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const RENDER_PR_BRIEF = path.join(
  REPO_ROOT,
  '.claude/skills/cc-act/scripts/render-pr-brief.sh'
);

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\n${result.stderr}\n${result.stdout}`);
  }

  return result;
}

describe('cc-act PR brief renderer', () => {
  test('renders handoff headings and placeholders in configured Chinese', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-act-pr-brief-'));
    const changeDir = path.join(repoRoot, 'devflow/changes/REQ-001-demo');
    const handoffPath = path.join(changeDir, 'handoff/pr-brief.md');

    try {
      fs.mkdirSync(path.join(repoRoot, '.cc-devflow'), { recursive: true });
      fs.writeFileSync(
        path.join(repoRoot, '.cc-devflow/config.yml'),
        [
          'version: 1',
          'output:',
          '  document_language: zh-CN',
          ''
        ].join('\n')
      );
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(
        path.join(changeDir, 'task.md'),
        [
          '# task.md',
          '',
          '## Plan Meta',
          '',
          '- Output language:',
          '',
          '## Tasks',
          '',
          '- [x] T001 Finish demo task',
          ''
        ].join('\n')
      );

      run('git', ['init'], repoRoot);
      run('git', ['config', 'user.name', 'Test User'], repoRoot);
      run('git', ['config', 'user.email', 'test@example.com'], repoRoot);
      run('git', ['add', '.'], repoRoot);
      run('git', ['commit', '-m', 'test: seed task'], repoRoot);

      run('bash', [RENDER_PR_BRIEF, '--dir', changeDir, '--repo-root', repoRoot], repoRoot);

      const rendered = fs.readFileSync(handoffPath, 'utf8');
      expect(rendered).toContain('# PR 交接简报');
      expect(rendered).toContain('- Output language: zh-CN');
      expect(rendered).toContain('## 任务摘要');
      expect(rendered).toContain('- 已完成: T001 Finish demo task');
      expect(rendered).toContain('## PR 正文草稿');
      expect(rendered).toContain('- <根据 task.md 和提交记录总结用户可见变化>');
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
