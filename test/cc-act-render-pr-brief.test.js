const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const RENDER_PR_BRIEF = path.join(
  REPO_ROOT,
  '.claude/skills/cc-act/scripts/render-pr-brief.sh'
);
const EVALUATE_POSTMORTEM_TRIGGER = path.join(
  REPO_ROOT,
  '.claude/skills/cc-act/scripts/evaluate-postmortem-trigger.sh'
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
      expect(rendered).toContain('## 尸检触发');
      expect(rendered).toContain('- 是否需要尸检: no');
      expect(rendered).toContain('- <根据 task.md 和提交记录总结用户可见变化>');
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});

describe('cc-act postmortem trigger evaluator', () => {
  function createRepo(changeKey, taskLines = []) {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-act-postmortem-'));
    const changeDir = path.join(repoRoot, 'devflow/changes', changeKey);

    fs.mkdirSync(changeDir, { recursive: true });
    fs.writeFileSync(
      path.join(changeDir, 'task.md'),
      [
        '# task.md',
        '',
        '## Tasks',
        '',
        '- [x] T001 Finish task',
        ...taskLines,
        ''
      ].join('\n')
    );

    run('git', ['init'], repoRoot);
    run('git', ['config', 'user.name', 'Test User'], repoRoot);
    run('git', ['config', 'user.email', 'test@example.com'], repoRoot);
    run('git', ['add', '.'], repoRoot);
    run('git', ['commit', '-m', 'test: seed task'], repoRoot);

    return { repoRoot, changeDir };
  }

  test('requires a postmortem for FIX change keys', () => {
    const { repoRoot, changeDir } = createRepo('FIX-001-broken-closeout');

    try {
      const result = run(
        'bash',
        [EVALUATE_POSTMORTEM_TRIGGER, '--dir', changeDir, '--date', '2026-05-17'],
        repoRoot
      );

      expect(result.stdout).toContain('POSTMORTEM_REQUIRED=yes');
      expect(result.stdout).toContain('TRIGGERS=change-key:FIX');
      expect(result.stdout).toContain(
        'INCIDENT_PATH=devflow/postmortems/incidents/2026-05-17-FIX-001-broken-closeout.md'
      );
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  test('carries task and session postmortem triggers into the gate decision', () => {
    const { repoRoot, changeDir } = createRepo('REQ-001-demo', [
      '',
      '- Postmortem signal: yes'
    ]);

    try {
      const result = run(
        'bash',
        [
          EVALUATE_POSTMORTEM_TRIGGER,
          '--dir',
          changeDir,
          '--trigger',
          'cc-check-reroute'
        ],
        repoRoot
      );

      expect(result.stdout).toContain('POSTMORTEM_REQUIRED=yes');
      expect(result.stdout).toContain('task:postmortem-required');
      expect(result.stdout).toContain('session:cc-check-reroute');
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  test('requires a postmortem for confirmed Failure Ledger lessons', () => {
    const { repoRoot, changeDir } = createRepo('REQ-002-ledger-learning', [
      '',
      '## Failure Ledger',
      '',
      '| ID | Symptom | Evidence | Attempted fix | Result | Lesson candidate | Status | Keep for postmortem |',
      '|----|---------|----------|---------------|--------|------------------|--------|---------------------|',
      '| FL-001 | stale validation reused | cc-check output | rerun gate | fixed | require fresh proof | confirmed-lesson | yes |'
    ]);

    try {
      const result = run(
        'bash',
        [EVALUATE_POSTMORTEM_TRIGGER, '--dir', changeDir],
        repoRoot
      );

      expect(result.stdout).toContain('POSTMORTEM_REQUIRED=yes');
      expect(result.stdout).toContain('task:failure-ledger');
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
