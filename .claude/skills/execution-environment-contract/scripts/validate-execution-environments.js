#!/usr/bin/env node

const fs = require('fs');

const REQUIRED_SECTIONS = [
  { label: '## Execution Environments', pattern: /^## Execution Environments$/ },
  { label: '## Environment Task Allocation', pattern: /^#{2,3} Environment Task Allocation$/ },
  { label: '## Environment Contracts', pattern: /^## Environment Contracts$/ }
];

const READY_STATUSES = new Set(['integrated', 'skipped']);
const NO_COMMIT_ROUTES = new Set(['cc-review', 'cc-check']);

function parseArgs(argv) {
  const args = { tasks: '', env: '', running: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--tasks') args.tasks = argv[++i] || '';
    else if (arg === '--env') args.env = (argv[++i] || '').toUpperCase();
    else if (arg === '--running') {
      args.running = (argv[++i] || '')
        .split(',')
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
    } else if (arg === '-h' || arg === '--help') {
      args.help = true;
    } else {
      args.unknown = arg;
    }
  }

  return args;
}

function usage() {
  console.error('Usage: validate-execution-environments.js --tasks task.md [--env E001] [--running E002,E003]');
}

function splitRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return [];
  return trimmed.slice(1, -1).split('|').map((cell) => cell.trim());
}

function normalizeToken(value) {
  return String(value || '')
    .trim()
    .replace(/^`|`$/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '');
}

function listFromCell(value) {
  const text = String(value || '').trim();
  if (!text || /^none$/i.test(text)) return [];
  return (text.match(/[A-Z]{1,2}\d{3}/g) || []).map((item) => item.toUpperCase());
}

function issue(level, code, env, message, extra = {}) {
  return { level, code, ...(env ? { env } : {}), message, ...extra };
}

function findSection(lines, title) {
  return lines.findIndex((line) => line.trim() === title);
}

function hasRequiredSection(lines, section) {
  return lines.some((line) => section.pattern.test(line.trim()));
}

function parseEnvRows(lines) {
  const header = lines.findIndex((line) => line.includes('| Env | Route | Status | DependsOn | Parallel |'));
  if (header < 0) return [];

  const envs = [];
  for (let i = header + 2; i < lines.length; i += 1) {
    const cells = splitRow(lines[i]);
    if (cells.length === 0) break;

    const [id, route, status, dependsOn, parallel] = cells;
    if (!/^(E|R|C|A|EF)\d{3}$/.test(id || '')) continue;

    envs.push({
      id: id.toUpperCase(),
      route,
      status: String(status || '').toLowerCase(),
      dependsOn: listFromCell(dependsOn),
      parallel: /^yes$/i.test(parallel || '')
    });
  }
  return envs;
}

function parseTaskAllocations(lines) {
  const header = lines.findIndex((line) => line.includes('| Env | Assigned tasks |'));
  if (header < 0) return new Map();

  const allocations = new Map();
  for (let i = header + 2; i < lines.length; i += 1) {
    const cells = splitRow(lines[i]);
    if (cells.length === 0) break;

    const env = String(cells[0] || '').toUpperCase();
    if (/^(E|R|C|A|EF)\d{3}$/.test(env)) allocations.set(env, listFromCell(cells[1]));
  }
  return allocations;
}

function parseBoundaries(lines) {
  const boundaries = new Map();

  for (let i = 0; i < lines.length; i += 1) {
    const start = lines[i].match(/^--- CHILD DISPATCH START ((?:E|R|C|A|EF)\d{3}) ---$/);
    if (!start) continue;

    const env = start[1].toUpperCase();
    const endText = `--- CHILD DISPATCH END ${env} ---`;
    const end = lines.findIndex((line, index) => index > i && line.trim() === endText);
    boundaries.set(env, {
      present: true,
      complete: end > i,
      startLine: i + 1,
      endLine: end > i ? end + 1 : null,
      startIndex: i,
      endIndex: end
    });
  }

  return boundaries;
}

function collectList(lines, boundary, label) {
  if (!boundary || !boundary.complete) return [];

  const values = [];
  for (let i = boundary.startIndex + 1; i < boundary.endIndex; i += 1) {
    if (lines[i].trim() !== `${label}:`) continue;

    for (let j = i + 1; j < boundary.endIndex; j += 1) {
      const item = lines[j].match(/^\s*-\s+(.+?)\s*$/);
      if (!item) break;
      const value = normalizeToken(item[1]);
      if (value && !/^none$/i.test(value)) values.push(value);
    }
    break;
  }

  return values;
}

function taskBlockInBoundary(lines, boundary, taskId, envId) {
  if (!boundary || !boundary.complete) return false;

  for (let i = boundary.startIndex + 1; i < boundary.endIndex; i += 1) {
    if (!new RegExp(`^- \\[( |x|X)\\] ${taskId}\\b`).test(lines[i])) continue;

    const nextTask = lines.findIndex((line, index) => (
      index > i && index < boundary.endIndex && /^- \[( |x|X)\] T\d{3}\b/.test(line)
    ));
    const end = nextTask > i ? nextTask : boundary.endIndex;
    return lines.slice(i, end).some((line) => line.trim() === `Environment: ${envId}`);
  }

  return false;
}

function taskExists(lines, taskId) {
  return lines.some((line) => new RegExp(`^- \\[( |x|X)\\] ${taskId}\\b`).test(line));
}

function isDependencyReady(env) {
  if (!env) return false;
  if (READY_STATUSES.has(env.status)) return true;
  return env.status === 'completed' && NO_COMMIT_ROUTES.has(env.route);
}

function pathConflict(a, b) {
  const left = normalizeToken(a);
  const right = normalizeToken(b);
  if (!left || !right) return false;
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

function validate(text, options = {}) {
  const lines = text.split(/\r?\n/);
  const errors = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!hasRequiredSection(lines, section)) {
      errors.push(issue('error', 'missing-section', null, `Missing required section: ${section.label}`, { section: section.label }));
    }
  }

  const envs = parseEnvRows(lines);
  if (findSection(lines, '## Execution Environments') >= 0 && envs.length === 0) {
    errors.push(issue('error', 'invalid-env-row', null, 'No valid environment rows found'));
  }

  const envById = new Map(envs.map((env) => [env.id, env]));
  const allocations = parseTaskAllocations(lines);
  const boundaries = parseBoundaries(lines);
  const running = new Set((options.running || []).map((item) => item.toUpperCase()));

  const environments = envs.map((env) => {
    const boundary = boundaries.get(env.id) || { present: false, complete: false, startLine: null, endLine: null };
    const tasks = allocations.get(env.id) || [];
    const touches = collectList(lines, boundary, 'Touches');
    const mutableResources = collectList(lines, boundary, 'Mutable resources');
    const blockers = [];

    if (!boundary.present || !boundary.complete) {
      const next = issue('error', 'missing-dispatch-boundary', env.id, `${env.id} is missing CHILD DISPATCH START/END boundary`);
      errors.push(next);
      blockers.push(next.code);
    }

    for (const taskId of tasks) {
      if (taskBlockInBoundary(lines, boundary, taskId, env.id)) continue;

      const code = taskExists(lines, taskId) ? 'task-outside-boundary' : 'missing-assigned-task';
      const next = issue('error', code, env.id, `${taskId} is not a complete task block inside ${env.id}`);
      errors.push(next);
      blockers.push(next.code);
    }

    for (const dependencyId of env.dependsOn) {
      const dependency = envById.get(dependencyId);
      if (isDependencyReady(dependency)) continue;

      const next = issue('blocker', 'dependency-not-ready', env.id, `${env.id} depends on ${dependencyId}, which is not ready`, { dependency: dependencyId });
      errors.push(next);
      blockers.push(next.code);
    }

    return {
      id: env.id,
      route: env.route,
      status: env.status,
      parallel: env.parallel,
      dependsOn: env.dependsOn,
      tasks,
      touches,
      mutableResources,
      dispatchBlock: {
        present: boundary.present,
        complete: boundary.complete,
        startLine: boundary.startLine,
        endLine: boundary.endLine
      },
      ready: env.status === 'planned' && blockers.length === 0,
      blockers
    };
  });

  const byId = new Map(environments.map((env) => [env.id, env]));
  const conflicts = [];
  for (const runningId of running) {
    const active = byId.get(runningId);
    if (!active) continue;

    for (const candidate of environments) {
      if (candidate.id === runningId) continue;

      for (const left of candidate.touches) {
        const right = active.touches.find((item) => pathConflict(left, item));
        if (!right) continue;
        const next = issue('blocker', 'running-touch-conflict', candidate.id, `${candidate.id} touches ${left}, which overlaps running ${runningId}`, { running: runningId, path: left, runningPath: right });
        errors.push(next);
        candidate.blockers.push(next.code);
        candidate.ready = false;
        conflicts.push(next);
      }

      for (const left of candidate.mutableResources) {
        const right = active.mutableResources.find((item) => pathConflict(left, item));
        if (!right) continue;
        const next = issue('blocker', 'running-resource-conflict', candidate.id, `${candidate.id} resource ${left} overlaps running ${runningId}`, { running: runningId, resource: left, runningResource: right });
        errors.push(next);
        candidate.blockers.push(next.code);
        candidate.ready = false;
        conflicts.push(next);
      }
    }
  }

  const filtered = options.env
    ? environments.filter((env) => env.id === options.env.toUpperCase())
    : environments;

  return {
    environments: filtered,
    conflicts,
    errors
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.unknown || !args.tasks) {
    usage();
    process.exit(2);
  }

  if (!fs.existsSync(args.tasks)) {
    console.error(`Task file not found: ${args.tasks}`);
    process.exit(2);
  }

  const result = validate(fs.readFileSync(args.tasks, 'utf8'), args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.errors.some((item) => item.level === 'error') ? 1 : 0);
}

if (require.main === module) main();

module.exports = { validate };
