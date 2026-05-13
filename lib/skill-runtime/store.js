/**
 * [INPUT]: 依赖 fs/path/child_process，依赖调用方提供 changeId 与命令参数。
 * [OUTPUT]: 对外提供 shared path、文本读写与命令执行工具。
 * [POS]: skill runtime 的轻量 IO 层，不承载流程 JSON 契约。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');
const {
  getDevflowRoot,
  getChangesRoot,
  getChangePaths
} = require('./paths');

function nowIso() {
  return new Date().toISOString();
}

function resolveRepoRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);

  while (true) {
    const hasPackage = fs.existsSync(path.join(current, 'package.json'));
    const hasGit = fs.existsSync(path.join(current, '.git'));
    const hasDevflow = fs.existsSync(getDevflowRoot(current));

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

function getChangeDir(repoRoot, changeId, options = {}) {
  return getChangePaths(repoRoot, changeId, options).changeDir;
}

function getTasksMarkdownPath(repoRoot, changeId, options = {}) {
  return path.join(getChangePaths(repoRoot, changeId, options).changeDir, 'task.md');
}

function getRuntimeRoot(repoRoot) {
  return getChangesRoot(repoRoot);
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

async function removePath(targetPath) {
  if (!(await exists(targetPath))) {
    return;
  }

  await fsp.rm(targetPath, { force: true, recursive: true });
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
  getChangeDir,
  getTasksMarkdownPath,
  getRuntimeRoot,
  exists,
  ensureDir,
  readText,
  writeText,
  readJson,
  writeJson,
  removePath,
  appendJsonl,
  listDirectories,
  runCommand,
  getPackageScripts
};
