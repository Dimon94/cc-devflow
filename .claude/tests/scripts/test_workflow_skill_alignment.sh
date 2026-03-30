#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 .claude/tests/test-framework.sh、workflow.yaml 与 flow-prepare-pr skill 目录。
# [OUTPUT]: 回归验证 prepare-pr 在 schema、skill 目录与 .claude 文档中的同构对齐。
# [POS]: .claude/tests/scripts 的 workflow schema 漂移测试，防止 command/skill/harness 再次失配。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
WORKFLOW_YAML="$REPO_ROOT/.claude/skills/workflow.yaml"
CLAUDE_DOC="$REPO_ROOT/.claude/CLAUDE.md"
FLOW_PREPARE_PR_DIR="$REPO_ROOT/.claude/skills/flow-prepare-pr"

test_flow_prepare_pr_skill_scaffold_exists() {
    describe "flow-prepare-pr skill scaffold should exist"

    assert_file_exists "$FLOW_PREPARE_PR_DIR/SKILL.md" "Should create flow-prepare-pr SKILL"
    assert_file_exists "$FLOW_PREPARE_PR_DIR/CLAUDE.md" "Should create flow-prepare-pr CLAUDE"
    assert_file_exists "$FLOW_PREPARE_PR_DIR/context.jsonl" "Should create flow-prepare-pr context"
}

test_workflow_schema_maps_pr_brief_to_flow_prepare_pr() {
    describe "workflow schema should map pr_brief to flow-prepare-pr"

    if ! node - "$WORKFLOW_YAML" <<'EOF'
const fs = require('fs');
const yaml = require('js-yaml');

const schemaPath = process.argv[2];
const schema = yaml.load(fs.readFileSync(schemaPath, 'utf8'));

const prBrief = schema.artifacts.find((artifact) => artifact.id === 'pr_brief');
if (!prBrief) {
  console.error('Missing pr_brief artifact');
  process.exit(1);
}

if (prBrief.skill !== 'flow-prepare-pr') {
  console.error(`Expected pr_brief.skill=flow-prepare-pr, got ${prBrief.skill}`);
  process.exit(2);
}

const registered = (schema.skills.workflow || []).some(
  (skill) => skill.id === 'flow-prepare-pr' && skill.path === 'flow-prepare-pr'
);

if (!registered) {
  console.error('flow-prepare-pr missing from skills.workflow');
  process.exit(3);
}
EOF
    then
        return 1
    fi
}

test_claude_directory_map_mentions_flow_prepare_pr() {
    describe ".claude directory map should mention flow-prepare-pr"

    local content
    content=$(cat "$CLAUDE_DOC")

    assert_contains "$content" "flow-prepare-pr/" "Should list flow-prepare-pr in .claude map"
    assert_contains "$content" '`/flow:prepare-pr`' "Should list /flow:prepare-pr in active flow modules"
}

run_tests \
    test_flow_prepare_pr_skill_scaffold_exists \
    test_workflow_schema_maps_pr_brief_to_flow_prepare_pr \
    test_claude_directory_map_mentions_flow_prepare_pr
