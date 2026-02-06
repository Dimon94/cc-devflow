#!/usr/bin/env node
/**
 * [INPUT]: 依赖 fs, path, types/context-injection.d.ts
 * [OUTPUT]: 对外提供 parseJsonl, resolveContextEntry 函数
 * [POS]: hooks/utils 的 JSONL 解析工具，被 inject-agent-context.ts 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import type {
  ContextEntry,
  ParseResult,
  ParseError,
  ResolvedFile,
} from '../types/context-injection';

// ============================================================================
// Constants
// ============================================================================

const MAX_FILE_SIZE = 50000; // 50KB per file
const MAX_DIRECTORY_DEPTH = 3;

// ============================================================================
// JSONL Parsing
// ============================================================================

/**
 * Parse a JSONL file into ContextEntry array
 *
 * @param filePath - Path to the JSONL file
 * @returns ParseResult with entries and any errors
 */
export function parseJsonl(filePath: string): ParseResult {
  const entries: ContextEntry[] = [];
  const errors: ParseError[] = [];

  if (!existsSync(filePath)) {
    return { entries, errors: [{ line: 0, content: '', error: `File not found: ${filePath}` }] };
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    try {
      const entry = JSON.parse(line) as ContextEntry;

      // Validate required fields
      if (!entry.type || !entry.path || !entry.purpose) {
        errors.push({
          line: i + 1,
          content: line,
          error: 'Missing required fields: type, path, purpose',
        });
        continue;
      }

      // Validate type
      if (!['file', 'directory', 'spec'].includes(entry.type)) {
        errors.push({
          line: i + 1,
          content: line,
          error: `Invalid type: ${entry.type}. Must be file, directory, or spec`,
        });
        continue;
      }

      entries.push(entry);
    } catch (e) {
      errors.push({
        line: i + 1,
        content: line,
        error: `JSON parse error: ${(e as Error).message}`,
      });
    }
  }

  return { entries, errors };
}

// ============================================================================
// Context Resolution
// ============================================================================

/**
 * Resolve a context entry to actual file content
 *
 * @param entry - The context entry to resolve
 * @param basePath - Base path for relative paths (requirement directory)
 * @param projectRoot - Project root for spec paths
 * @returns Array of resolved files
 */
export function resolveContextEntry(
  entry: ContextEntry,
  basePath: string,
  projectRoot: string
): ResolvedFile[] {
  const results: ResolvedFile[] = [];

  // Determine absolute path based on entry type
  let absolutePath: string;

  if (entry.type === 'spec') {
    // Spec paths are relative to project root
    absolutePath = resolve(projectRoot, entry.path);
  } else {
    // File and directory paths are relative to requirement directory
    absolutePath = resolve(basePath, entry.path);
  }

  if (entry.type === 'directory') {
    // Resolve directory contents
    const dirFiles = resolveDirectory(absolutePath, entry.depth || 1, entry.purpose);
    results.push(...dirFiles);
  } else {
    // Resolve single file
    const file = resolveFile(absolutePath, entry.path, entry.purpose);
    results.push(file);
  }

  return results;
}

/**
 * Resolve a single file
 */
function resolveFile(absolutePath: string, originalPath: string, purpose: string): ResolvedFile {
  if (!existsSync(absolutePath)) {
    return {
      path: originalPath,
      absolutePath,
      content: '',
      purpose,
      found: false,
      truncated: false,
      originalSize: 0,
    };
  }

  try {
    const stats = statSync(absolutePath);
    const originalSize = stats.size;

    let content = readFileSync(absolutePath, 'utf-8');
    let truncated = false;

    if (content.length > MAX_FILE_SIZE) {
      content = content.substring(0, MAX_FILE_SIZE) + '\n\n... [TRUNCATED]';
      truncated = true;
    }

    return {
      path: originalPath,
      absolutePath,
      content,
      purpose,
      found: true,
      truncated,
      originalSize,
    };
  } catch (e) {
    return {
      path: originalPath,
      absolutePath,
      content: `Error reading file: ${(e as Error).message}`,
      purpose,
      found: false,
      truncated: false,
      originalSize: 0,
    };
  }
}

/**
 * Resolve directory contents recursively
 */
function resolveDirectory(
  dirPath: string,
  maxDepth: number,
  purpose: string,
  currentDepth: number = 0
): ResolvedFile[] {
  const results: ResolvedFile[] = [];

  if (currentDepth >= maxDepth || currentDepth >= MAX_DIRECTORY_DEPTH) {
    return results;
  }

  if (!existsSync(dirPath)) {
    return results;
  }

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      // Skip hidden files and common non-content files
      if (entry.startsWith('.') || entry === 'node_modules') {
        continue;
      }

      const fullPath = join(dirPath, entry);
      const stats = statSync(fullPath);

      if (stats.isFile()) {
        // Only include markdown, yaml, json, and typescript files
        if (/\.(md|yaml|yml|json|ts|js)$/.test(entry)) {
          const file = resolveFile(fullPath, entry, `${purpose} - ${entry}`);
          results.push(file);
        }
      } else if (stats.isDirectory()) {
        // Recurse into subdirectories
        const subFiles = resolveDirectory(fullPath, maxDepth, purpose, currentDepth + 1);
        results.push(...subFiles);
      }
    }
  } catch (e) {
    // Directory read error, return empty
  }

  return results;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format resolved files into a context string for prompt injection
 */
export function formatContextForPrompt(files: ResolvedFile[]): string {
  const sections: string[] = [];

  for (const file of files) {
    if (!file.found) {
      continue;
    }

    sections.push(`
## ${file.purpose}
**File**: \`${file.path}\`
${file.truncated ? '**Note**: Content truncated due to size\n' : ''}
\`\`\`
${file.content}
\`\`\`
`);
  }

  if (sections.length === 0) {
    return '';
  }

  return `
# Injected Context

The following context has been automatically loaded based on your agent type:

${sections.join('\n---\n')}
`;
}

/**
 * Estimate token count for a string (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
