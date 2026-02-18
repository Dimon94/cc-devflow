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
const { runDispatch } = require('./operations/dispatch');
const { runResume } = require('./operations/resume');
const { runVerify } = require('./operations/verify');
const { runRelease } = require('./operations/release');
const { runJanitor } = require('./operations/janitor');

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = {
    command,
    changeId: null,
    goal: null,
    parallel: 3,
    maxRetries: undefined,
    strict: false,
    skipReview: false,
    overwrite: false,
    hours: 72
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

    if (token === '--strict') {
      args.strict = true;
      continue;
    }

    if (token === '--skip-review') {
      args.skipReview = true;
      continue;
    }

    if (token === '--overwrite') {
      args.overwrite = true;
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
  verify    --change-id <REQ-ID> [--strict] [--skip-review]
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
