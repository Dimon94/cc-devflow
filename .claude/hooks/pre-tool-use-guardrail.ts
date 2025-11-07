#!/usr/bin/env node
/**
 * ==============================================
 * PreToolUse Hook: Guardrail Enforcer
 * ==============================================
 *
 * 功能: 在文件编辑前检查 Guardrail Skills 的触发条件
 *      如果匹配到 guardrail 且 enforcement="block"，返回 exit code 2 阻止操作
 *
 * 集成: devflow-tdd-enforcer, constitution-guardian
 *
 * Exit Codes:
 *   0 - Allow (no violations)
 *   2 - Block (guardrail violation detected)
 *   1 - Error (unexpected failure)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// 📋 Type Definitions
// ============================================================================

interface HookInput {
    session_id: string;
    file_path: string;
    content: string;
    tool_name: string;
}

interface FileTriggers {
    pathPatterns?: string[];
    contentPatterns?: string[];
}

interface SkipConditions {
    sessionSkillUsed?: boolean;
    fileMarkers?: string[];
    envOverride?: string;
}

interface GuardrailSkill {
    type: 'guardrail';
    enforcement: 'block' | 'suggest' | 'warn';
    priority: 'critical' | 'high' | 'medium' | 'low';
    fileTriggers?: FileTriggers;
    blockMessage?: string;
    skipConditions?: SkipConditions;
}

interface SkillRules {
    version: string;
    skills: Record<string, GuardrailSkill>;
}

interface Violation {
    skillName: string;
    matchType: 'pathPattern' | 'contentPattern';
    matchedPattern: string;
    line?: number;
}

// ============================================================================
// 📦 Helper Functions
// ============================================================================

/**
 * 归一化文件路径为项目相对路径
 *
 * 【问题】
 * hook payload 传递的是绝对路径，但 skill-rules.json 中的 glob 是相对路径
 * 直接比较会导致永不匹配
 *
 * 【解决】
 * 将绝对路径转为相对于项目根目录的路径
 *
 * @example
 * normalizeFilePath('/Users/dimon/cc-devflow/devflow/requirements/REQ-001/TASKS.md', '/Users/dimon/cc-devflow')
 * // → 'devflow/requirements/REQ-001/TASKS.md'
 */
function normalizeFilePath(filePath: string, projectRoot: string): string {
    // 如果是绝对路径且在项目内，转为相对路径
    if (filePath.startsWith(projectRoot)) {
        const relative = filePath.slice(projectRoot.length);
        // 去除前导斜杠
        return relative.startsWith('/') ? relative.slice(1) : relative;
    }
    // 已经是相对路径或不在项目内
    return filePath;
}

/**
 * 检查文件路径是否匹配 glob 模式
 *
 * 【修复】
 * 1. 先转义正则元字符（防止 . + ^ $ 等被误解释）
 * 2. 再替换 glob 通配符（两个星号、一个星号、问号）
 *
 * 【为什么顺序重要】
 * 错误顺序: "foo.md".replace(星号→点星).escape() → "foo.md" (点匹配任意字符 ❌)
 * 正确顺序: "foo.md".escape().replace(星号→点星) → "foo\.md" (点匹配字面点号 ✓)
 *
 * @example
 * matchesPath('devflow/requirements/REQ-001/TASKS.md', 'devflow/requirements/双星/TASKS.md')
 * // → true
 */
function matchesPath(filePath: string, pattern: string): boolean {
    // Step 1: 转义所有正则特殊字符（保留 glob 通配符）
    const escapeRegex = (str: string) => {
        // 转义: . + ^ $ { } ( ) | [ ] \
        // 不转义: * ? (因为这些是 glob 语法)
        return str.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    };

    // Step 2: 先转义，再替换 glob 通配符
    // 注意：escapeRegex 不转义 *，所以字符串中的 * 仍然是 *，不是 \*
    const regexPattern = escapeRegex(pattern)
        .replace(/\*\*/g, '.*')          // ** → .* (任意字符，包括 /)
        .replace(/\*/g, '[^/]*')         // * → [^/]* (任意字符，不包括 /)
        .replace(/\?/g, '.');            // ? → . (单个字符)

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
}

/**
 * 检查内容是否匹配正则模式,并返回匹配的行号
 */
function matchesContent(content: string, pattern: string): { matched: boolean; line?: number } {
    const regex = new RegExp(pattern, 'im'); // i = case-insensitive, m = multiline
    const match = regex.exec(content);

    if (!match) {
        return { matched: false };
    }

    // 计算匹配位置所在的行号
    const textBeforeMatch = content.substring(0, match.index);
    const lineNumber = textBeforeMatch.split('\n').length;

    return { matched: true, line: lineNumber };
}

/**
 * 检查是否应该跳过此 guardrail
 */
function shouldSkip(
    skillName: string,
    content: string,
    skipConditions?: SkipConditions,
    sessionId?: string
): boolean {
    if (!skipConditions) {
        return false;
    }

    // Check 1: Environment variable override
    if (skipConditions.envOverride && process.env[skipConditions.envOverride] === '1') {
        console.error(`ℹ️  Skipping ${skillName}: ${skipConditions.envOverride}=1`);
        return true;
    }

    // Check 2: File markers (e.g., @skip-tdd-check)
    if (skipConditions.fileMarkers) {
        for (const marker of skipConditions.fileMarkers) {
            if (content.includes(marker)) {
                console.error(`ℹ️  Skipping ${skillName}: Found marker '${marker}'`);
                return true;
            }
        }
    }

    // Check 3: Session skill used (已实现完整持久化)
    if (skipConditions.sessionSkillUsed && sessionId) {
        const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
        const stateDir = join(projectDir, '.claude', 'hooks', 'state');
        const stateFile = join(stateDir, `skills-used-${sessionId}.json`);

        try {
            if (existsSync(stateFile)) {
                const usedSkills: string[] = JSON.parse(readFileSync(stateFile, 'utf-8'));
                if (usedSkills.includes(skillName)) {
                    console.error(`ℹ️  Skipping ${skillName}: Already used in this session`);
                    return true;
                }
            }
        } catch (error) {
            // 状态文件损坏或读取失败，忽略错误（fail open）
            console.error(`⚠️  Warning: Failed to read session state for ${skillName}:`, error);
        }
    }

    return false;
}

// ============================================================================
// 🎯 Main Logic
// ============================================================================

async function main() {
    try {
        // ===== 1. 读取输入 =====
        const input = readFileSync(0, 'utf-8');
        const data: HookInput = JSON.parse(input);

        const { session_id, file_path, content, tool_name } = data;

        // 只在文件编辑工具时触发 (Edit, Write)
        if (!['Edit', 'Write'].includes(tool_name)) {
            process.exit(0); // Allow non-edit operations
        }

        // ===== 2. 加载 Guardrail Rules =====
        const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

        // ===== 归一化文件路径 =====
        // hook payload 是绝对路径，需转为相对路径才能与 skill-rules.json 中的 glob 匹配
        const normalizedPath = normalizeFilePath(file_path, projectDir);
        const rulesPath = join(projectDir, '.claude', 'skills', 'skill-rules.json');

        if (!existsSync(rulesPath)) {
            // No skill rules configured, allow all
            process.exit(0);
        }

        const rules: SkillRules = JSON.parse(readFileSync(rulesPath, 'utf-8'));

        // ===== 3. 检查所有 Guardrail Skills =====
        const violations: Violation[] = [];

        for (const [skillName, config] of Object.entries(rules.skills)) {
            // 只处理 type="guardrail" 且 enforcement="block"
            if (config.type !== 'guardrail' || config.enforcement !== 'block') {
                continue;
            }

            // 检查是否应该跳过
            if (shouldSkip(skillName, content, config.skipConditions, session_id)) {
                continue;
            }

            const triggers = config.fileTriggers;
            if (!triggers) {
                continue;
            }

            // Check 1: Path patterns
            if (triggers.pathPatterns) {
                for (const pattern of triggers.pathPatterns) {
                    // 使用归一化后的相对路径进行匹配
                    if (matchesPath(normalizedPath, pattern)) {
                        // Path matched, now check content patterns
                        if (triggers.contentPatterns) {
                            for (const contentPattern of triggers.contentPatterns) {
                                const result = matchesContent(content, contentPattern);
                                if (result.matched) {
                                    violations.push({
                                        skillName,
                                        matchType: 'contentPattern',
                                        matchedPattern: contentPattern,
                                        line: result.line
                                    });
                                }
                            }
                        }
                        break; // Path matched, no need to check other path patterns
                    }
                }
            }
        }

        // ===== 4. 处理违规 =====
        if (violations.length > 0) {
            // 按 priority 排序 (critical > high > medium > low)
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            violations.sort((a, b) => {
                const priorityA = priorityOrder[rules.skills[a.skillName].priority] || 999;
                const priorityB = priorityOrder[rules.skills[b.skillName].priority] || 999;
                return priorityA - priorityB;
            });

            // 显示第一个违规的 blockMessage
            const firstViolation = violations[0];
            const skill = rules.skills[firstViolation.skillName];

            let blockMessage = skill.blockMessage || `⚠️ BLOCKED by ${firstViolation.skillName}`;

            // 替换占位符
            blockMessage = blockMessage.replace('{file_path}', file_path);

            // 如果有行号,添加到消息中
            if (firstViolation.line) {
                blockMessage += `\n\n📍 Violation at Line ${firstViolation.line}`;
            }

            // 输出到 stderr (用户可见)
            console.error('\n' + blockMessage + '\n');

            // ===== 记录 Session 状态（用于 sessionSkillUsed 跳过条件）=====
            // 在阻塞前记录，以便下次同一 session 中跳过
            if (skill.skipConditions?.sessionSkillUsed) {
                try {
                    const stateDir = join(projectDir, '.claude', 'hooks', 'state');
                    const stateFile = join(stateDir, `skills-used-${session_id}.json`);

                    // 确保目录存在
                    if (!existsSync(stateDir)) {
                        require('fs').mkdirSync(stateDir, { recursive: true });
                    }

                    // 读取现有状态
                    let usedSkills: string[] = [];
                    if (existsSync(stateFile)) {
                        usedSkills = JSON.parse(readFileSync(stateFile, 'utf-8'));
                    }

                    // 添加当前 skill（去重）
                    if (!usedSkills.includes(firstViolation.skillName)) {
                        usedSkills.push(firstViolation.skillName);
                        require('fs').writeFileSync(stateFile, JSON.stringify(usedSkills, null, 2), 'utf-8');
                    }
                } catch (error) {
                    // 状态写入失败不应影响阻塞（fail closed）
                    console.error(`⚠️  Warning: Failed to write session state:`, error);
                }
            }

            // 返回 exit code 2 (阻塞)
            process.exit(2);
        }

        // ===== 5. 无违规,允许操作 =====
        process.exit(0);

    } catch (error) {
        console.error('❌ PreToolUse Hook Error:', error);
        process.exit(1); // Error, but don't block (fail open)
    }
}

main();
