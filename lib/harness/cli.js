/**
 * [INPUT]: 依赖 operations 子模块与命令行参数。
 * [OUTPUT]: 对外提供 runCli(argv) 统一命令分发入口。
 * [POS]: harness 命令编排层，被 bin/harness.js 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  resolveRepoRoot,
  ChangeIdSchema
} = require('./index');
const { runInit } = require('./operations/init');
const { runPack } = require('./operations/pack');
const { runPlan } = require('./operations/plan');
const { runPreparePr } = require('./operations/prepare-pr');
const { runDispatch } = require('./operations/dispatch');
const { runResume } = require('./operations/resume');
const { runVerify } = require('./operations/verify');
const { runRelease } = require('./operations/release');
const { runJanitor } = require('./operations/janitor');
const { runAutopilot } = require('./operations/autopilot');
const { runWorkerSession } = require('./operations/worker');
const { runWorkerCommand } = require('./operations/worker-run');

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = {
    command,
    changeId: null,
    goal: null,
    parallel: 3,
    maxRetries: undefined,
    resume: false,
    strict: false,
    skipReview: false,
    overwrite: false,
    hours: 72,
    from: null,
    release: false,
    workerId: null,
    taskId: null,
    commandText: null,
    provider: null,
    providerArgs: null,
    workerProvider: null,
    workerProviderArgs: null,
    workerCommand: null
  };

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];

    if (token === '--change-id') {
      args.changeId = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--goal') {
      args.goal = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--parallel') {
      args.parallel = Number.parseInt(rest[i + 1], 10);
      i += 1;
      continue;
    }

    if (token === '--max-retries') {
      args.maxRetries = Number.parseInt(rest[i + 1], 10);
      i += 1;
      continue;
    }

    if (token === '--hours') {
      args.hours = Number.parseInt(rest[i + 1], 10);
      i += 1;
      continue;
    }

    if (token === '--from') {
      args.from = rest[i + 1];
      i += 1;
      continue;
    }

    if (token.startsWith('--from=')) {
      args.from = token.slice('--from='.length);
      continue;
    }

    if (token === '--strict') {
      args.strict = true;
      continue;
    }

    if (token === '--skip-review') {
      args.skipReview = true;
      continue;
    }

    if (token === '--resume') {
      args.resume = true;
      continue;
    }

    if (token === '--overwrite') {
      args.overwrite = true;
      continue;
    }

    if (token === '--release') {
      args.release = true;
      continue;
    }

    if (token === '--worker') {
      args.workerId = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--task') {
      args.taskId = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--command') {
      args.commandText = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--provider') {
      args.provider = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--provider-args') {
      args.providerArgs = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--worker-provider') {
      args.workerProvider = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--worker-provider-args') {
      args.workerProviderArgs = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--worker-command') {
      args.workerCommand = rest[i + 1];
      i += 1;
      continue;
    }
  }

  return args;
}

function showHelp() {
  console.log(`
Usage: node bin/harness.js <command> [options]

Commands:
  init      --change-id <REQ-ID> [--goal "..."]
  pack      --change-id <REQ-ID> [--goal "..."]
  plan      --change-id <REQ-ID> [--goal "..."] [--overwrite]
  dispatch  --change-id <REQ-ID> [--parallel 3] [--max-retries 2]
  resume    --change-id <REQ-ID> [--parallel 3] [--max-retries 2]
  autopilot --change-id <REQ-ID> [--goal "..."] [--from stage] [--resume] [--strict] [--release] [--worker-provider codex|claude] [--worker-command "..."]
  worker    --change-id <REQ-ID> --worker <worker-id>
  worker-run --change-id <REQ-ID> --worker <worker-id> [--task <task-id>] (--command "<local command>" | --provider <codex|claude> [--provider-args "..."])
  verify    --change-id <REQ-ID> [--strict] [--skip-review]
  prepare-pr --change-id <REQ-ID>
  release   --change-id <REQ-ID>
  janitor   [--hours 72]
`);
}

function requireChangeId(changeId) {
  const parsed = ChangeIdSchema.safeParse(changeId);
  if (!parsed.success) {
    throw new Error('Missing or invalid --change-id (expected REQ-123 or BUG-123)');
  }
  return parsed.data;
}

function printResult(result) {
  console.log(JSON.stringify(result, null, 2));
}

async function runCli(argv) {
  const args = parseArgs(argv);

  if (!args.command || args.command === 'help' || args.command === '--help' || args.command === '-h') {
    showHelp();
    return 0;
  }

  const repoRoot = resolveRepoRoot(process.cwd());

  switch (args.command) {
    case 'init': {
      const changeId = requireChangeId(args.changeId);
      const result = await runInit({ repoRoot, changeId, goal: args.goal });
      printResult(result);
      return 0;
    }

    case 'pack': {
      const changeId = requireChangeId(args.changeId);
      const result = await runPack({ repoRoot, changeId, goal: args.goal });
      printResult(result);
      return 0;
    }

    case 'plan': {
      const changeId = requireChangeId(args.changeId);
      const result = await runPlan({
        repoRoot,
        changeId,
        goal: args.goal,
        overwrite: args.overwrite
      });
      printResult(result);
      return 0;
    }

    case 'dispatch': {
      const changeId = requireChangeId(args.changeId);
      const result = await runDispatch({
        repoRoot,
        changeId,
        parallel: args.parallel,
        maxRetries: Number.isInteger(args.maxRetries) ? args.maxRetries : undefined
      });
      printResult(result);
      return result.success ? 0 : 1;
    }

    case 'resume': {
      const changeId = requireChangeId(args.changeId);
      const result = await runResume({
        repoRoot,
        changeId,
        parallel: args.parallel,
        maxRetries: Number.isInteger(args.maxRetries) ? args.maxRetries : undefined
      });
      printResult(result);
      return result.success ? 0 : 1;
    }

    case 'autopilot': {
      const changeId = requireChangeId(args.changeId);
      const result = await runAutopilot({
        repoRoot,
        changeId,
        goal: args.goal,
        from: args.from,
        resume: args.resume,
        overwrite: args.overwrite,
        parallel: args.parallel,
        maxRetries: Number.isInteger(args.maxRetries) ? args.maxRetries : undefined,
        strict: args.strict,
        skipReview: args.skipReview,
        release: args.release,
        workerProvider: args.workerProvider,
        workerProviderArgs: args.workerProviderArgs,
        workerCommand: args.workerCommand
      });
      printResult(result);
      return 0;
    }

    case 'worker': {
      const changeId = requireChangeId(args.changeId);
      if (!args.workerId) {
        throw new Error('Missing --worker <worker-id>');
      }
      const result = await runWorkerSession({
        repoRoot,
        changeId,
        workerId: args.workerId
      });
      printResult(result);
      return 0;
    }

    case 'worker-run': {
      const changeId = requireChangeId(args.changeId);
      if (!args.workerId) {
        throw new Error('Missing --worker <worker-id>');
      }
      const result = await runWorkerCommand({
        repoRoot,
        changeId,
        workerId: args.workerId,
        taskId: args.taskId,
        command: args.commandText,
        provider: args.provider,
        providerArgs: args.providerArgs
      });
      printResult(result);
      return result.status === 'completed' ? 0 : 1;
    }

    case 'verify': {
      const changeId = requireChangeId(args.changeId);
      const result = await runVerify({
        repoRoot,
        changeId,
        strict: args.strict,
        skipReview: args.skipReview
      });
      printResult(result);
      return result.overall === 'pass' ? 0 : 1;
    }

    case 'prepare-pr': {
      const changeId = requireChangeId(args.changeId);
      const result = await runPreparePr({ repoRoot, changeId });
      printResult(result);
      return 0;
    }

    case 'release': {
      const changeId = requireChangeId(args.changeId);
      const result = await runRelease({ repoRoot, changeId });
      printResult(result);
      return 0;
    }

    case 'janitor': {
      const result = await runJanitor({ repoRoot, hours: args.hours });
      printResult(result);
      return 0;
    }

    default:
      throw new Error(`Unknown harness command: ${args.command}`);
  }
}

module.exports = {
  runCli
};
