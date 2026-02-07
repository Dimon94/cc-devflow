/**
 * [INPUT]: 依赖 DELTA_SPEC_TEMPLATE.md 格式的 delta 文件
 * [OUTPUT]: 对外提供 DeltaBlock[], parseDelta(), applyDelta()
 * [POS]: scripts 的 Delta 解析器，被 flow-delta-apply.sh 调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 借鉴 OpenSpec 的 requirement-blocks.ts 实现
 */

// ============================================================================
// Types
// ============================================================================

export type DeltaType = 'ADDED' | 'MODIFIED' | 'REMOVED' | 'RENAMED';

export interface DeltaBlock {
  type: DeltaType;
  name: string;
  content: string;
  previousContent?: string;  // for MODIFIED
  reason?: string;           // for REMOVED
  newName?: string;          // for RENAMED
}

export interface DeltaMetadata {
  delta_id: string;
  req_id: string;
  title: string;
  created_at: string;
  status: 'draft' | 'review' | 'approved' | 'applied';
}

export interface ParsedDelta {
  metadata: DeltaMetadata;
  summary: string;
  blocks: DeltaBlock[];
}

// ============================================================================
// Utilities
// ============================================================================

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/g, '\n');
}

function extractYamlFrontmatter(content: string): { metadata: Record<string, string>; body: string } {
  const normalized = normalizeLineEndings(content);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { metadata: {}, body: normalized };
  }

  const yamlContent = match[1];
  const body = match[2];
  const metadata: Record<string, string> = {};

  for (const line of yamlContent.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      metadata[key] = value;
    }
  }

  return { metadata, body };
}

// ============================================================================
// Section Parsing
// ============================================================================

interface SectionContent {
  title: string;
  body: string;
}

function splitSections(content: string): SectionContent[] {
  const lines = normalizeLineEndings(content).split('\n');
  const sections: SectionContent[] = [];
  let currentSection: SectionContent | null = null;
  let bodyLines: string[] = [];

  for (const line of lines) {
    // Match ## level headers
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.body = bodyLines.join('\n').trim();
        sections.push(currentSection);
      }
      currentSection = { title: headerMatch[1].trim(), body: '' };
      bodyLines = [];
    } else if (currentSection) {
      bodyLines.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.body = bodyLines.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

function findSection(sections: SectionContent[], titlePattern: string): SectionContent | undefined {
  const pattern = titlePattern.toLowerCase();
  return sections.find(s => s.title.toLowerCase().includes(pattern));
}

// ============================================================================
// Requirement Block Parsing
// ============================================================================

const REQUIREMENT_HEADER_REGEX = /^###\s*Requirement:\s*(.+)\s*$/;

interface RequirementBlock {
  name: string;
  content: string;
}

function parseRequirementBlocks(sectionBody: string): RequirementBlock[] {
  if (!sectionBody) return [];

  const lines = normalizeLineEndings(sectionBody).split('\n');
  const blocks: RequirementBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    // Seek next requirement header
    while (i < lines.length && !REQUIREMENT_HEADER_REGEX.test(lines[i])) {
      i++;
    }
    if (i >= lines.length) break;

    const headerLine = lines[i];
    const match = headerLine.match(REQUIREMENT_HEADER_REGEX);
    if (!match) {
      i++;
      continue;
    }

    const name = match[1].trim();
    const contentLines: string[] = [headerLine];
    i++;

    // Gather lines until next requirement header or section header
    while (i < lines.length &&
           !REQUIREMENT_HEADER_REGEX.test(lines[i]) &&
           !/^##\s+/.test(lines[i])) {
      contentLines.push(lines[i]);
      i++;
    }

    blocks.push({
      name,
      content: contentLines.join('\n').trim()
    });
  }

  return blocks;
}

// ============================================================================
// RENAMED Section Parsing
// ============================================================================

interface RenamedPair {
  from: string;
  to: string;
}

function parseRenamedPairs(sectionBody: string): RenamedPair[] {
  if (!sectionBody) return [];

  const pairs: RenamedPair[] = [];
  const lines = normalizeLineEndings(sectionBody).split('\n');
  let currentFrom: string | null = null;

  for (const line of lines) {
    const fromMatch = line.match(/^\s*-?\s*FROM:\s*(.+)\s*$/i);
    const toMatch = line.match(/^\s*-?\s*TO:\s*(.+)\s*$/i);

    if (fromMatch) {
      currentFrom = fromMatch[1].trim();
    } else if (toMatch && currentFrom) {
      pairs.push({ from: currentFrom, to: toMatch[1].trim() });
      currentFrom = null;
    }
  }

  return pairs;
}

// ============================================================================
// REMOVED Section Parsing
// ============================================================================

interface RemovedBlock {
  name: string;
  reason?: string;
  migration?: string;
}

function parseRemovedBlocks(sectionBody: string): RemovedBlock[] {
  if (!sectionBody) return [];

  const blocks: RemovedBlock[] = [];
  const reqBlocks = parseRequirementBlocks(sectionBody);

  for (const block of reqBlocks) {
    const lines = block.content.split('\n');
    let reason: string | undefined;
    let migration: string | undefined;

    for (const line of lines) {
      const reasonMatch = line.match(/^\*\*Reason\*\*:\s*(.+)$/i);
      const migrationMatch = line.match(/^\*\*Migration\*\*:\s*(.+)$/i);

      if (reasonMatch) {
        reason = reasonMatch[1].trim();
      } else if (migrationMatch) {
        migration = migrationMatch[1].trim();
      }
    }

    blocks.push({ name: block.name, reason, migration });
  }

  return blocks;
}

// ============================================================================
// MODIFIED Section Parsing
// ============================================================================

interface ModifiedBlock {
  name: string;
  content: string;
  previousContent?: string;
}

function parseModifiedBlocks(sectionBody: string): ModifiedBlock[] {
  if (!sectionBody) return [];

  const blocks: ModifiedBlock[] = [];
  const reqBlocks = parseRequirementBlocks(sectionBody);

  for (const block of reqBlocks) {
    const lines = block.content.split('\n');
    let previousContent: string | undefined;

    for (const line of lines) {
      const prevMatch = line.match(/^\(Previously:\s*(.+)\)$/i);
      if (prevMatch) {
        previousContent = prevMatch[1].trim();
        break;
      }
    }

    blocks.push({
      name: block.name,
      content: block.content,
      previousContent
    });
  }

  return blocks;
}

// ============================================================================
// Main Parser
// ============================================================================

export function parseDelta(content: string): DeltaBlock[] {
  const { body } = extractYamlFrontmatter(content);
  const sections = splitSections(body);
  const blocks: DeltaBlock[] = [];

  // Parse ADDED Requirements
  const addedSection = findSection(sections, 'ADDED Requirements');
  if (addedSection) {
    const reqBlocks = parseRequirementBlocks(addedSection.body);
    for (const block of reqBlocks) {
      blocks.push({
        type: 'ADDED',
        name: block.name,
        content: block.content
      });
    }
  }

  // Parse MODIFIED Requirements
  const modifiedSection = findSection(sections, 'MODIFIED Requirements');
  if (modifiedSection) {
    const modBlocks = parseModifiedBlocks(modifiedSection.body);
    for (const block of modBlocks) {
      blocks.push({
        type: 'MODIFIED',
        name: block.name,
        content: block.content,
        previousContent: block.previousContent
      });
    }
  }

  // Parse REMOVED Requirements
  const removedSection = findSection(sections, 'REMOVED Requirements');
  if (removedSection) {
    const remBlocks = parseRemovedBlocks(removedSection.body);
    for (const block of remBlocks) {
      blocks.push({
        type: 'REMOVED',
        name: block.name,
        content: '',
        reason: block.reason
      });
    }
  }

  // Parse RENAMED Requirements
  const renamedSection = findSection(sections, 'RENAMED Requirements');
  if (renamedSection) {
    const pairs = parseRenamedPairs(renamedSection.body);
    for (const pair of pairs) {
      blocks.push({
        type: 'RENAMED',
        name: pair.from,
        content: '',
        newName: pair.to
      });
    }
  }

  return blocks;
}

export function parseFullDelta(content: string): ParsedDelta {
  const { metadata, body } = extractYamlFrontmatter(content);
  const sections = splitSections(body);
  const blocks = parseDelta(content);

  // Extract summary
  const summarySection = findSection(sections, 'Summary');
  const summary = summarySection?.body || '';

  return {
    metadata: {
      delta_id: metadata.delta_id || '',
      req_id: metadata.req_id || '',
      title: metadata.title || '',
      created_at: metadata.created_at || '',
      status: (metadata.status as DeltaMetadata['status']) || 'draft'
    },
    summary,
    blocks
  };
}

// ============================================================================
// Delta Application
// ============================================================================

export function applyDelta(prdContent: string, delta: DeltaBlock[]): string {
  let result = normalizeLineEndings(prdContent);

  // Build a map of existing requirements
  const { body } = extractYamlFrontmatter(result);
  const existingBlocks = parseRequirementBlocks(body);
  const nameToContent = new Map<string, string>();

  for (const block of existingBlocks) {
    nameToContent.set(block.name.toLowerCase(), block.content);
  }

  // Apply operations in order: RENAMED → REMOVED → MODIFIED → ADDED

  // 1. RENAMED
  for (const block of delta.filter(b => b.type === 'RENAMED')) {
    const oldName = block.name.toLowerCase();
    const newName = block.newName!;

    if (nameToContent.has(oldName)) {
      const content = nameToContent.get(oldName)!;
      // Replace header in content
      const updatedContent = content.replace(
        /^###\s*Requirement:\s*.+$/m,
        `### Requirement: ${newName}`
      );
      nameToContent.delete(oldName);
      nameToContent.set(newName.toLowerCase(), updatedContent);

      // Update in result
      const oldHeaderRegex = new RegExp(`###\\s*Requirement:\\s*${escapeRegex(block.name)}`, 'i');
      result = result.replace(oldHeaderRegex, `### Requirement: ${newName}`);
    }
  }

  // 2. REMOVED
  for (const block of delta.filter(b => b.type === 'REMOVED')) {
    const name = block.name.toLowerCase();
    nameToContent.delete(name);

    // Remove from result - find the requirement block and remove it
    const headerRegex = new RegExp(
      `###\\s*Requirement:\\s*${escapeRegex(block.name)}[\\s\\S]*?(?=###\\s*Requirement:|##\\s+|$)`,
      'i'
    );
    result = result.replace(headerRegex, '');
  }

  // 3. MODIFIED
  for (const block of delta.filter(b => b.type === 'MODIFIED')) {
    const name = block.name.toLowerCase();

    if (nameToContent.has(name)) {
      nameToContent.set(name, block.content);

      // Replace in result
      const headerRegex = new RegExp(
        `###\\s*Requirement:\\s*${escapeRegex(block.name)}[\\s\\S]*?(?=###\\s*Requirement:|##\\s+|$)`,
        'i'
      );
      result = result.replace(headerRegex, block.content + '\n\n');
    }
  }

  // 4. ADDED
  for (const block of delta.filter(b => b.type === 'ADDED')) {
    const name = block.name.toLowerCase();

    if (!nameToContent.has(name)) {
      nameToContent.set(name, block.content);

      // Find Requirements section and append
      const reqSectionMatch = result.match(/^##\s+Requirements\s*$/m);
      if (reqSectionMatch) {
        // Find end of Requirements section
        const reqSectionIndex = result.indexOf(reqSectionMatch[0]);
        const afterReqSection = result.slice(reqSectionIndex + reqSectionMatch[0].length);
        const nextSectionMatch = afterReqSection.match(/^##\s+/m);

        if (nextSectionMatch) {
          const insertIndex = reqSectionIndex + reqSectionMatch[0].length + nextSectionMatch.index!;
          result = result.slice(0, insertIndex) + '\n\n' + block.content + '\n' + result.slice(insertIndex);
        } else {
          // Append at end
          result = result.trimEnd() + '\n\n' + block.content + '\n';
        }
      } else {
        // No Requirements section, create one
        result = result.trimEnd() + '\n\n## Requirements\n\n' + block.content + '\n';
      }
    }
  }

  // Clean up multiple newlines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// CLI Interface
// ============================================================================

if (require.main === module) {
  const fs = require('fs');
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: delta-parser.ts <command> [args]');
    console.error('Commands:');
    console.error('  parse <delta-file>           Parse delta file and output JSON');
    console.error('  apply <prd-file> <delta-file> Apply delta to PRD and output result');
    process.exit(1);
  }

  const command = args[0];

  switch (command) {
    case 'parse': {
      const deltaFile = args[1];
      if (!deltaFile) {
        console.error('Error: delta-file required');
        process.exit(1);
      }
      const content = fs.readFileSync(deltaFile, 'utf-8');
      const parsed = parseFullDelta(content);
      console.log(JSON.stringify(parsed, null, 2));
      break;
    }

    case 'apply': {
      const prdFile = args[1];
      const deltaFile = args[2];
      if (!prdFile || !deltaFile) {
        console.error('Error: prd-file and delta-file required');
        process.exit(1);
      }
      const prdContent = fs.readFileSync(prdFile, 'utf-8');
      const deltaContent = fs.readFileSync(deltaFile, 'utf-8');
      const blocks = parseDelta(deltaContent);
      const result = applyDelta(prdContent, blocks);
      console.log(result);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}
