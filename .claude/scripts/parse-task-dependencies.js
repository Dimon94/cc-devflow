#!/usr/bin/env node
/**
 * [INPUT]: 依赖 TASKS.md 文件格式 (Phase/[P]/[US*]/checkbox 标记)
 * [OUTPUT]: 对外提供 TaskInfo, ParallelGroup, parseTasks(), getParallelGroups()
 * [POS]: scripts 的任务依赖解析器，被 Team Hook 调用以确定可并行任务
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use strict';

const fs = require('fs');

// ============================================================================
// Regex Patterns
// ============================================================================

// Phase header: ## Phase 1: Setup, ## Phase 2: Tests First (TDD) ⚠️
const PHASE_HEADER_REGEX = /^##\s+Phase\s+(\d+):\s*(.+?)(?:\s+\[([^\]]+)\])?$/;

// Task line: - [x] **T001** [P] [US1] Title `file.ts`
// or: - [ ] T001 [P1] [US2] Title
const TASK_LINE_REGEX = /^-\s+\[([ xX])\]\s+(?:\*\*)?([Tt]\d+)(?:\*\*)?\s+(.*)$/;

// Markers within task line
const PARALLEL_MARKER = /\[P\]/;
const USER_STORY_MARKER = /\[US(\d+)\]/;
const PRIORITY_MARKER = /\[P(\d+)\]/;
const FILE_PATH_MARKER = /`([^`]+)`/;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Normalize line endings to \n
 * @param {string} content
 * @returns {string}
 */
function normalizeLineEndings(content) {
  return content.replace(/\r\n?/g, '\n');
}

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * @typedef {Object} TaskInfo
 * @property {string} id - Task ID (T001, T002, etc.)
 * @property {string} title - Task title without markers
 * @property {boolean} parallel - true if [P] marker present
 * @property {string} userStory - US1, US2, etc. (empty if none)
 * @property {number} phase - Phase number (1, 2, 3, etc.)
 * @property {string} filePath - File path from backticks (empty if none)
 * @property {boolean} completed - true if [x], false if [ ]
 * @property {string} priority - P1, P2, P3 (empty if none)
 * @property {string} rawLine - Original line for debugging
 */

/**
 * @typedef {Object} ParallelGroup
 * @property {number} phase - Phase number
 * @property {string} userStory - User story identifier
 * @property {TaskInfo[]} tasks - Tasks in this group
 */

/**
 * @typedef {Object} ParseResult
 * @property {TaskInfo[]} tasks - All parsed tasks
 * @property {ParallelGroup[]} parallelGroups - Grouped parallel tasks
 * @property {number[]} phases - List of phase numbers
 * @property {Object} stats - Statistics
 * @property {number} stats.total - Total tasks
 * @property {number} stats.completed - Completed tasks
 * @property {number} stats.pending - Pending tasks
 * @property {number} stats.parallelizable - Parallelizable pending tasks
 */

/**
 * Parse a single task line and extract TaskInfo
 * @param {string} line - The line to parse
 * @param {number} currentPhase - Current phase number
 * @param {string} currentUserStory - Current user story from phase header
 * @returns {TaskInfo|null}
 */
function parseTaskLine(line, currentPhase, currentUserStory) {
  const match = line.match(TASK_LINE_REGEX);
  if (!match) return null;

  const [, checkboxState, taskId, rest] = match;
  const completed = checkboxState.toLowerCase() === 'x';

  // Extract markers from rest of line
  const isParallel = PARALLEL_MARKER.test(rest);

  const userStoryMatch = rest.match(USER_STORY_MARKER);
  const userStory = userStoryMatch ? `US${userStoryMatch[1]}` : currentUserStory;

  const priorityMatch = rest.match(PRIORITY_MARKER);
  const priority = priorityMatch ? `P${priorityMatch[1]}` : '';

  const filePathMatch = rest.match(FILE_PATH_MARKER);
  const filePath = filePathMatch ? filePathMatch[1] : '';

  // Clean title: remove all markers and file path
  let title = rest
    .replace(PARALLEL_MARKER, '')
    .replace(USER_STORY_MARKER, '')
    .replace(PRIORITY_MARKER, '')
    .replace(FILE_PATH_MARKER, '')
    .replace(/\[Setup\]/gi, '')
    .replace(/\*\*/g, '')
    .trim();

  // Remove leading/trailing punctuation and whitespace
  title = title.replace(/^[\s\-:]+|[\s\-:]+$/g, '').trim();

  // Clean up multiple spaces left after removing markers
  title = title.replace(/\s{2,}/g, ' ').trim();

  return {
    id: taskId.toUpperCase(),
    title,
    parallel: isParallel,
    userStory,
    phase: currentPhase,
    filePath,
    completed,
    priority,
    rawLine: line
  };
}

/**
 * Parse TASKS.md content and extract all tasks
 * @param {string} content - TASKS.md file content
 * @returns {TaskInfo[]}
 */
function parseTasks(content) {
  const lines = normalizeLineEndings(content).split('\n');
  const tasks = [];

  let currentPhase = 0;
  let currentUserStory = '';

  for (const line of lines) {
    // Check for phase header
    const phaseMatch = line.match(PHASE_HEADER_REGEX);
    if (phaseMatch) {
      currentPhase = parseInt(phaseMatch[1], 10);
      // Extract user story from phase header if present
      const headerUserStory = phaseMatch[3];
      if (headerUserStory) {
        const usMatch = headerUserStory.match(/US(\d+)/);
        currentUserStory = usMatch ? `US${usMatch[1]}` : '';
      } else {
        currentUserStory = '';
      }
      continue;
    }

    // Check for task line
    const task = parseTaskLine(line, currentPhase, currentUserStory);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Group tasks into parallel execution groups
 * Tasks in the same phase with [P] marker can run in parallel
 * @param {TaskInfo[]} tasks - All tasks
 * @returns {ParallelGroup[]}
 */
function getParallelGroups(tasks) {
  const groups = [];
  const groupMap = new Map();

  // Group by phase + userStory
  for (const task of tasks) {
    if (task.completed) continue; // Skip completed tasks

    const key = `${task.phase}-${task.userStory}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key).push(task);
  }

  // Convert to ParallelGroup array
  for (const [key, groupTasks] of groupMap) {
    const [phaseStr, userStory] = key.split('-');
    const phase = parseInt(phaseStr, 10);

    // Only include groups with parallel tasks
    const parallelTasks = groupTasks.filter(t => t.parallel);
    if (parallelTasks.length > 0) {
      groups.push({
        phase,
        userStory: userStory || '',
        tasks: parallelTasks
      });
    }
  }

  // Sort by phase
  groups.sort((a, b) => a.phase - b.phase);

  return groups;
}

/**
 * Get next available tasks (not completed, not blocked by phase dependencies)
 * @param {TaskInfo[]} tasks - All tasks
 * @returns {TaskInfo[]}
 */
function getNextAvailableTasks(tasks) {
  const pendingTasks = tasks.filter(t => !t.completed);
  if (pendingTasks.length === 0) return [];

  // Find minimum phase with pending tasks
  const minPhase = Math.min(...pendingTasks.map(t => t.phase));

  // Return all pending tasks in that phase
  return pendingTasks.filter(t => t.phase === minPhase);
}

/**
 * Full parse with statistics
 * @param {string} content - TASKS.md file content
 * @returns {ParseResult}
 */
function parseTasksWithStats(content) {
  const tasks = parseTasks(content);
  const parallelGroups = getParallelGroups(tasks);

  const phases = [...new Set(tasks.map(t => t.phase))].sort((a, b) => a - b);

  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  const parallelizable = tasks.filter(t => t.parallel && !t.completed).length;

  return {
    tasks,
    parallelGroups,
    phases,
    stats: {
      total: tasks.length,
      completed,
      pending,
      parallelizable
    }
  };
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  parseTasks,
  parseTaskLine,
  getParallelGroups,
  getNextAvailableTasks,
  parseTasksWithStats
};

// ============================================================================
// CLI Interface
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: parse-task-dependencies.js <command> [args]');
    console.error('Commands:');
    console.error('  parse <tasks-file>     Parse TASKS.md and output JSON');
    console.error('  groups <tasks-file>    Get parallel groups');
    console.error('  next <tasks-file>      Get next available tasks');
    console.error('  stats <tasks-file>     Get task statistics');
    process.exit(1);
  }

  const command = args[0];
  const tasksFile = args[1];

  if (!tasksFile) {
    console.error('Error: tasks-file required');
    process.exit(1);
  }

  if (!fs.existsSync(tasksFile)) {
    console.error(`Error: File not found: ${tasksFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(tasksFile, 'utf-8');

  switch (command) {
    case 'parse': {
      const result = parseTasksWithStats(content);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'groups': {
      const tasks = parseTasks(content);
      const groups = getParallelGroups(tasks);
      console.log(JSON.stringify(groups, null, 2));
      break;
    }

    case 'next': {
      const tasks = parseTasks(content);
      const nextTasks = getNextAvailableTasks(tasks);
      console.log(JSON.stringify(nextTasks, null, 2));
      break;
    }

    case 'stats': {
      const result = parseTasksWithStats(content);
      console.log(JSON.stringify(result.stats, null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}
