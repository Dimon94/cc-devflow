const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DETECT_SHIP_TARGET = path.join(ROOT, '.claude', 'skills', 'cc-act', 'scripts', 'detect-ship-target.sh');
const ENSURE_SHIP_BRANCH = path.join(ROOT, '.claude', 'skills', 'cc-act', 'scripts', 'ensure-ship-branch.sh');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with ${result.status}`,
      result.stdout,
      result.stderr
    ].join('\n'));
  }

  return result;
}

function field(output, key) {
  const line = output.split('\n').find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : '';
}

function createDetachedRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-act-detached-'));
  run('git', ['init', '-b', 'main'], repoRoot);
  run('git', ['config', 'user.name', 'Test User'], repoRoot);
  run('git', ['config', 'user.email', 'test@example.com'], repoRoot);
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# fixture\n');
  run('git', ['add', 'README.md'], repoRoot);
  run('git', ['commit', '-m', 'feat: seed fixture'], repoRoot);
  run('git', ['remote', 'add', 'origin', 'https://example.com/acme/repo.git'], repoRoot);
  run('git', ['switch', '--detach', 'HEAD'], repoRoot);
  fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', 'REQ-046-business-chain-field-lineage-breakpoints'), {
    recursive: true
  });
  return repoRoot;
}

describe('cc-act detached HEAD ship rescue', () => {
  test('detects detached HEAD as create-pr with branch rescue when a remote exists', () => {
    const repoRoot = createDetachedRepo();

    const result = run('bash', [DETECT_SHIP_TARGET], repoRoot);

    expect(field(result.stdout, 'CURRENT_BRANCH')).toBe('');
    expect(field(result.stdout, 'BRANCH_STATE')).toBe('detached');
    expect(field(result.stdout, 'DECISION_HINT')).toBe('create-pr');
    expect(field(result.stdout, 'BRANCH_RESCUE')).toBe('create-branch-before-pr');
    expect(field(result.stdout, 'RESCUE_ACTION')).toContain('Create a named branch at HEAD');
  });

  test('creates a named branch from detached HEAD using the change key', () => {
    const repoRoot = createDetachedRepo();
    const changeDir = path.join(repoRoot, 'devflow', 'changes', 'REQ-046-business-chain-field-lineage-breakpoints');

    const result = run('bash', [ENSURE_SHIP_BRANCH, '--dir', changeDir], repoRoot);

    expect(field(result.stdout, 'BRANCH_ACTION')).toBe('created');
    expect(field(result.stdout, 'CURRENT_BRANCH')).toBe('codex/req-046-business-chain-field-lineage-breakpoints');

    const branch = run('git', ['branch', '--show-current'], repoRoot).stdout.trim();
    expect(branch).toBe('codex/req-046-business-chain-field-lineage-breakpoints');
  });
});
