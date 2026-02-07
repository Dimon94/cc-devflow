/**
 * [INPUT]: 依赖 fs, path, yaml (js-yaml) 模块
 * [OUTPUT]: 对外提供 WorkflowStatus 类型、isArtifactComplete, getNextActions, getWorkflowStatus 函数
 * [POS]: .claude/scripts 的工作流状态检测工具，被 flow-* 命令和 hooks 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';

// =============================================================================
// 类型定义
// =============================================================================

/** 工件定义 */
export interface Artifact {
  id: string;
  generates: string;
  requires: string[];
  skill: string;
  optional?: boolean;
  glob?: boolean;
  instruction?: string;
}

/** 工件状态 */
export type ArtifactStatus = 'complete' | 'ready' | 'blocked';

/** 工件状态详情 */
export interface ArtifactStatusDetail {
  id: string;
  status: ArtifactStatus;
  generates: string;
  resolvedPath: string;
  skill: string;
  optional: boolean;
  blockedBy?: string[];
}

/** 工作流状态 */
export interface WorkflowStatus {
  reqId: string;
  complete: ArtifactStatusDetail[];
  ready: ArtifactStatusDetail[];
  optionalPending: ArtifactStatusDetail[];
  blocked: ArtifactStatusDetail[];
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  nextAction?: {
    artifactId: string;
    skill: string;
    command: string;
  };
}

/** workflow.yaml 结构 */
interface WorkflowSchema {
  name: string;
  version: string;
  description: string;
  artifacts: Artifact[];
  detection: {
    method: string;
    fallback: string;
    glob_options?: {
      ignore?: string[];
    };
  };
  skills: Record<string, Array<{ id: string; path: string; description: string }>>;
  context: {
    global: Array<{ file: string; reason: string }>;
    defaults: Record<string, Array<{ file: string; reason: string; optional?: boolean }>>;
  };
  deprecated: Array<{ id: string; replacement: string; message: string }>;
}

// =============================================================================
// 配置
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const WORKFLOW_YAML_PATH = path.join(PROJECT_ROOT, '.claude/skills/workflow.yaml');

// =============================================================================
// 核心函数
// =============================================================================

/** 加载 workflow.yaml */
export function loadWorkflowSchema(): WorkflowSchema {
  const content = fs.readFileSync(WORKFLOW_YAML_PATH, 'utf-8');
  return yaml.load(content) as WorkflowSchema;
}

/** 替换路径中的占位符 */
export function resolvePath(pattern: string, reqId: string, bugId?: string): string {
  let resolved = pattern.replace(/\{REQ\}/g, reqId);
  if (bugId) {
    resolved = resolved.replace(/\{BUG\}/g, bugId);
  }
  return resolved;
}

/** 检查文件/目录是否存在（支持 glob） */
export async function checkExists(pattern: string, isGlob: boolean): Promise<boolean> {
  const fullPath = path.join(PROJECT_ROOT, pattern);

  if (isGlob) {
    // glob 模式：检查是否有匹配的文件
    const matches = await glob(fullPath, { nodir: false });
    return matches.length > 0;
  } else {
    // 精确路径：检查文件或目录存在
    return fs.existsSync(fullPath);
  }
}

/** 同步版本的检查存在性 */
export function checkExistsSync(pattern: string, isGlob: boolean): boolean {
  const fullPath = path.join(PROJECT_ROOT, pattern);

  if (isGlob) {
    // 简化的 glob 检查：使用 fs.readdirSync
    const dir = path.dirname(fullPath);
    const filePattern = path.basename(fullPath);

    if (!fs.existsSync(dir)) return false;

    try {
      const files = fs.readdirSync(dir);
      // 简单的通配符匹配
      const regex = new RegExp('^' + filePattern.replace(/\*/g, '.*') + '$');
      return files.some(f => regex.test(f));
    } catch {
      return false;
    }
  } else {
    return fs.existsSync(fullPath);
  }
}

/** 检查工件是否完成 */
export function isArtifactComplete(artifact: Artifact, reqId: string): boolean {
  const resolvedPath = resolvePath(artifact.generates, reqId);
  return checkExistsSync(resolvedPath, artifact.glob ?? false);
}

/** 获取工件的依赖状态 */
export function getBlockingDependencies(
  artifact: Artifact,
  reqId: string,
  schema: WorkflowSchema
): string[] {
  const blocking: string[] = [];

  for (const depId of artifact.requires) {
    const depArtifact = schema.artifacts.find(a => a.id === depId);
    if (!depArtifact) continue;

    if (!isArtifactComplete(depArtifact, reqId)) {
      blocking.push(depId);
    }
  }

  return blocking;
}

/** 获取工件状态 */
export function getArtifactStatus(
  artifact: Artifact,
  reqId: string,
  schema: WorkflowSchema
): ArtifactStatus {
  if (isArtifactComplete(artifact, reqId)) {
    return 'complete';
  }

  const blocking = getBlockingDependencies(artifact, reqId, schema);
  if (blocking.length === 0) {
    return 'ready';
  }

  return 'blocked';
}

/** 获取下一步可执行的工件 */
export function getNextActions(reqId: string): Artifact[] {
  const schema = loadWorkflowSchema();
  const ready: Artifact[] = [];

  // 筛选需求级工件
  const reqArtifacts = schema.artifacts.filter(a => a.generates.includes('{REQ}'));

  for (const artifact of reqArtifacts) {
    const status = getArtifactStatus(artifact, reqId, schema);

    // 只返回非可选的 ready 工件
    if (status === 'ready' && !artifact.optional) {
      ready.push(artifact);
    }
  }

  return ready;
}

/** 获取完整的工作流状态 */
export function getWorkflowStatus(reqId: string): WorkflowStatus {
  const schema = loadWorkflowSchema();

  const complete: ArtifactStatusDetail[] = [];
  const ready: ArtifactStatusDetail[] = [];
  const optionalPending: ArtifactStatusDetail[] = [];
  const blocked: ArtifactStatusDetail[] = [];

  // 筛选需求级工件
  const reqArtifacts = schema.artifacts.filter(a => a.generates.includes('{REQ}'));

  for (const artifact of reqArtifacts) {
    const status = getArtifactStatus(artifact, reqId, schema);
    const resolvedPath = resolvePath(artifact.generates, reqId);

    const detail: ArtifactStatusDetail = {
      id: artifact.id,
      status,
      generates: artifact.generates,
      resolvedPath,
      skill: artifact.skill,
      optional: artifact.optional ?? false,
    };

    if (status === 'blocked') {
      detail.blockedBy = getBlockingDependencies(artifact, reqId, schema);
    }

    switch (status) {
      case 'complete':
        complete.push(detail);
        break;
      case 'ready':
        if (artifact.optional) {
          optionalPending.push(detail);
        } else {
          ready.push(detail);
        }
        break;
      case 'blocked':
        blocked.push(detail);
        break;
    }
  }

  // 计算进度
  const total = complete.length + ready.length + blocked.length;
  const percent = total > 0 ? Math.round((complete.length / total) * 100) : 0;

  // 确定下一步
  let nextAction: WorkflowStatus['nextAction'];
  if (ready.length > 0) {
    const next = ready[0];
    nextAction = {
      artifactId: next.id,
      skill: next.skill,
      command: `/${next.skill} "${reqId}"`,
    };
  }

  return {
    reqId,
    complete,
    ready,
    optionalPending,
    blocked,
    progress: {
      completed: complete.length,
      total,
      percent,
    },
    nextAction,
  };
}

/** 获取项目级工件状态 */
export function getProjectStatus(): {
  complete: ArtifactStatusDetail[];
  missing: ArtifactStatusDetail[];
} {
  const schema = loadWorkflowSchema();

  const complete: ArtifactStatusDetail[] = [];
  const missing: ArtifactStatusDetail[] = [];

  // 筛选项目级工件（不包含 {REQ} 或 {BUG}）
  const projectArtifacts = schema.artifacts.filter(
    a => !a.generates.includes('{REQ}') && !a.generates.includes('{BUG}')
  );

  for (const artifact of projectArtifacts) {
    const exists = checkExistsSync(artifact.generates, artifact.glob ?? false);

    const detail: ArtifactStatusDetail = {
      id: artifact.id,
      status: exists ? 'complete' : 'ready',
      generates: artifact.generates,
      resolvedPath: artifact.generates,
      skill: artifact.skill,
      optional: artifact.optional ?? false,
    };

    if (exists) {
      complete.push(detail);
    } else {
      missing.push(detail);
    }
  }

  return { complete, missing };
}

/** 格式化输出工作流状态 */
export function formatWorkflowStatus(status: WorkflowStatus): string {
  const lines: string[] = [];

  lines.push(`\n=== 需求 ${status.reqId} 工作流状态 ===\n`);

  if (status.complete.length > 0) {
    lines.push(`已完成 (${status.complete.length}):`);
    for (const a of status.complete) {
      lines.push(`  ✓ ${a.id} → ${a.resolvedPath}`);
    }
    lines.push('');
  }

  if (status.ready.length > 0) {
    lines.push(`可执行 (${status.ready.length}):`);
    for (const a of status.ready) {
      lines.push(`  → ${a.id} (skill: ${a.skill})`);
    }
    lines.push('');
  }

  if (status.optionalPending.length > 0) {
    lines.push(`可选工件 (${status.optionalPending.length}):`);
    for (const a of status.optionalPending) {
      lines.push(`  ○ ${a.id} (skill: ${a.skill})`);
    }
    lines.push('');
  }

  if (status.blocked.length > 0) {
    lines.push(`阻塞中 (${status.blocked.length}):`);
    for (const a of status.blocked) {
      lines.push(`  ✗ ${a.id} (等待: ${a.blockedBy?.join(', ')})`);
    }
    lines.push('');
  }

  lines.push(`进度: ${status.progress.completed}/${status.progress.total} (${status.progress.percent}%)`);

  if (status.nextAction) {
    lines.push('');
    lines.push(`建议下一步: ${status.nextAction.command}`);
  }

  return lines.join('\n');
}

// =============================================================================
// CLI 入口
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
用法: npx ts-node workflow-status.ts [REQ-ID] [选项]

选项:
  --json      JSON 格式输出
  --next      仅输出下一步可执行的工件
  --project   检查项目级工件状态
  -h, --help  显示帮助
`);
    process.exit(0);
  }

  const isJson = args.includes('--json');
  const isNext = args.includes('--next');
  const isProject = args.includes('--project');
  const reqId = args.find(a => a.startsWith('REQ-'));

  if (isProject) {
    const status = getProjectStatus();
    if (isJson) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      console.log('\n=== 项目级工件状态 ===\n');
      if (status.complete.length > 0) {
        console.log(`已完成 (${status.complete.length}):`);
        for (const a of status.complete) {
          console.log(`  ✓ ${a.id} → ${a.generates}`);
        }
      }
      if (status.missing.length > 0) {
        console.log(`\n缺失 (${status.missing.length}):`);
        for (const a of status.missing) {
          console.log(`  ○ ${a.id} → ${a.generates} (skill: ${a.skill})`);
        }
      }
    }
  } else if (reqId) {
    if (isNext) {
      const actions = getNextActions(reqId);
      for (const a of actions) {
        console.log(`${a.id}:${a.skill}`);
      }
    } else {
      const status = getWorkflowStatus(reqId);
      if (isJson) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log(formatWorkflowStatus(status));
      }
    }
  } else {
    console.error('错误: 需要指定 REQ-ID 或使用 --project');
    process.exit(1);
  }
}
