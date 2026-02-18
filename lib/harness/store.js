/**
 * [INPUT]: 依赖 fs/path/child_process，依赖调用方提供 changeId 与命令参数。
 * [OUTPUT]: 对外提供 harness 路径约定、JSON/文本读写、JSONL 追加、命令执行工具。
 * [POS]: harness 内核的数据与 IO 基础设施层，被全部 operations 复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');

function nowIso() {
  return new Date().toISOString();
}

function resolveRepoRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);

  while (true) {
    const hasPackage = fs.existsSync(path.join(current, 'package.json'));
    const hasGit = fs.existsSync(path.join(current, '.git'));
    const hasDevflow = fs.existsSync(path.join(current, 'devflow'));

    if (hasPackage && (hasGit || hasDevflow)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDir);
    }
    current = parent;
  }
}

function getRequirementDir(repoRoot, changeId) {
  return path.join(repoRoot, 'devflow', 'requirements', changeId);
}

function getContextPackagePath(repoRoot, changeId) {
  return path.join(getRequirementDir(repoRoot, changeId), 'context-package.md');
}

function getTaskManifestPath(repoRoot, changeId) {
  return path.join(getRequirementDir(repoRoot, changeId), 'task-manifest.json');
}

function getReportCardPath(repoRoot, changeId) {
  return path.join(getRequirementDir(repoRoot, changeId), 'report-card.json');
}

function getReleaseNotePath(repoRoot, changeId) {
  return path.join(getRequirementDir(repoRoot, changeId), 'RELEASE_NOTE.md');
}

function getHarnessStatePath(repoRoot, changeId) {
  return path.join(getRequirementDir(repoRoot, changeId), 'harness-state.json');
}

function getTasksMarkdownPath(repoRoot, changeId) {
  return path.join(getRequirementDir(repoRoot, changeId), 'TASKS.md');
}

function getRuntimeRoot(repoRoot) {
  return path.join(repoRoot, '.harness', 'runtime');
}

function getRuntimeChangeDir(repoRoot, changeId) {
  return path.join(getRuntimeRoot(repoRoot), changeId);
}

function getRuntimeTaskDir(repoRoot, changeId, taskId) {
  return path.join(getRuntimeChangeDir(repoRoot, changeId), taskId);
}

function getEventsPath(repoRoot, changeId, taskId) {
  return path.join(getRuntimeTaskDir(repoRoot, changeId, taskId), 'events.jsonl');
}

function getCheckpointPath(repoRoot, changeId, taskId) {
  return path.join(getRuntimeTaskDir(repoRoot, changeId, taskId), 'checkpoint.json');
}

async function exists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function readText(filePath, fallback = '') {
  if (!(await exists(filePath))) {
    return fallback;
  }
  return fsp.readFile(filePath, 'utf8');
}

async function writeText(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, content, 'utf8');
}

async function readJson(filePath, fallback = null) {
  if (!(await exists(filePath))) {
    return fallback;
  }
  const content = await readText(filePath);
  return JSON.parse(content);
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function appendJsonl(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fsp.appendFile(filePath, `${JSON.stringify(value)}\n`, 'utf8');
}

async function listDirectories(dirPath) {
  if (!(await exists(dirPath))) {
    return [];
  }

  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dirPath, entry.name));
}

async function runCommand(command, options = {}) {
  const {
    cwd = process.cwd(),
    env = {},
    timeoutMs = 0,
    stream = false
  } = options;

  const startedAt = Date.now();

  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      env: { ...process.env, ...env },
      shell: true,
      stdio: stream ? 'inherit' : 'pipe'
    });

    let stdout = '';
    let stderr = '';
    let killedByTimeout = false;
    let timeoutId = null;

    if (!stream) {
      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });

      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });
    }

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        killedByTimeout = true;
        child.kill('SIGTERM');
      }, timeoutMs);
    }

    child.on('close', (code) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      resolve({
        code: typeof code === 'number' ? code : 1,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
        killedByTimeout
      });
    });

    child.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      resolve({
        code: 1,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        durationMs: Date.now() - startedAt,
        killedByTimeout
      });
    });
  });
}

async function getPackageScripts(repoRoot) {
  const pkgPath = path.join(repoRoot, 'package.json');
  const pkg = await readJson(pkgPath, {});
  return pkg && pkg.scripts ? pkg.scripts : {};
}

module.exports = {
  nowIso,
  resolveRepoRoot,
  getRequirementDir,
  getContextPackagePath,
  getTaskManifestPath,
  getReportCardPath,
  getReleaseNotePath,
  getHarnessStatePath,
  getTasksMarkdownPath,
  getRuntimeRoot,
  getRuntimeChangeDir,
  getRuntimeTaskDir,
  getEventsPath,
  getCheckpointPath,
  exists,
  ensureDir,
  readText,
  writeText,
  readJson,
  writeJson,
  appendJsonl,
  listDirectories,
  runCommand,
  getPackageScripts
};
