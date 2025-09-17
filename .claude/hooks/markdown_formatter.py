#!/usr/bin/env python3
"""
Markdown formatter for Claude Code output.
Fixes missing language tags and spacing issues while preserving code content.

Rules Integration:
- Follows .claude/rules/standard-patterns.md (Clear Errors, Minimal Output)
- Implements .claude/rules/datetime.md (cross-platform compatibility)
- Uses .claude/rules/devflow-patterns.md (document quality standards)
"""
import json
import sys
import re
import os

def detect_language(code):
    """Best-effort language detection from code content."""
    s = code.strip()

    # JSON detection
    if re.search(r'^\s*[{\[]', s):
        try:
            json.loads(s)
            return 'json'
        except:
            pass

    # Python detection
    if re.search(r'^\s*def\s+\w+\s*\(', s, re.M) or \
       re.search(r'^\s*(import|from)\s+\w+', s, re.M):
        return 'python'

    # JavaScript detection
    if re.search(r'\b(function\s+\w+\s*\(|const\s+\w+\s*=)', s) or \
       re.search(r'=>|console\.(log|error)', s):
        return 'javascript'

    # TypeScript detection
    if re.search(r'\b(interface|type)\s+\w+', s) or \
       re.search(r':\s*(string|number|boolean|any)\b', s):
        return 'typescript'

    # Bash detection
    if re.search(r'^#!.*\b(bash|sh)\b', s, re.M) or \
       re.search(r'\b(if|then|fi|for|in|do|done)\b', s):
        return 'bash'

    # SQL detection
    if re.search(r'\b(SELECT|INSERT|UPDATE|DELETE|CREATE)\s+', s, re.I):
        return 'sql'

    # YAML detection
    if re.search(r'^\s*[\w-]+:\s*[\w-]', s, re.M) and \
       re.search(r'^\s*-\s+', s, re.M):
        return 'yaml'

    # HTML detection
    if re.search(r'<[^>]+>', s):
        return 'html'

    # CSS detection
    if re.search(r'[.#]?\w+\s*\{[^}]*\}', s):
        return 'css'

    return 'text'

def format_markdown(content):
    """Format markdown content with language detection."""
    # Fix unlabeled code fences
    def add_lang_to_fence(match):
        indent, info, body, closing = match.groups()
        if not info.strip():
            lang = detect_language(body)
            return f"{indent}```{lang}\n{body}{closing}\n"
        return match.group(0)

    fence_pattern = r'(?ms)^([ \t]{0,3})```([^\n]*)\n(.*?)(\n\1```)\s*$'
    content = re.sub(fence_pattern, add_lang_to_fence, content)

    # Fix excessive blank lines (only outside code fences)
    # Split content into code and non-code sections
    sections = re.split(r'(```.*?```)', content, flags=re.DOTALL)

    for i in range(0, len(sections), 2):  # Only process non-code sections
        sections[i] = re.sub(r'\n{3,}', '\n\n', sections[i])

    content = ''.join(sections)

    # Fix spacing around headers
    content = re.sub(r'\n{3,}(#+ )', r'\n\n\1', content)
    content = re.sub(r'(#+ [^\n]+)\n{3,}', r'\1\n\n', content)

    # Fix list spacing
    content = re.sub(r'\n{3,}([-*+]\s)', r'\n\n\1', content)
    content = re.sub(r'\n{3,}(\d+\.\s)', r'\n\n\1', content)

    return content.rstrip() + '\n'

# Main execution
try:
    input_data = json.load(sys.stdin)
    file_path = input_data.get('tool_input', {}).get('file_path', '')

    if not file_path.endswith(('.md', '.mdx')):
        sys.exit(0)  # Not a markdown file

    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        formatted = format_markdown(content)

        if formatted != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(formatted)
            print(f"✓ Fixed markdown formatting in {file_path}")

except Exception as e:
    print(f"Error formatting markdown: {e}", file=sys.stderr)
    sys.exit(1)