#!/usr/bin/env node

/**
 * [INPUT]: 依赖 lib/harness/cli 的 runCli 函数与 shell argv。
 * [OUTPUT]: 将 harness 子命令分发到内核，并用 exit code 返回执行结果。
 * [POS]: Harness 命令行入口，被 npm scripts(harness:*) 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { runCli } = require('../lib/harness/cli');

async function main() {
  try {
    const code = await runCli(process.argv.slice(2));
    process.exit(code);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
