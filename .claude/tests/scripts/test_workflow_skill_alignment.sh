#!/usr/bin/env bash
# =============================================================================
# [INPUT]: 依赖 .claude/tests/test-framework.sh、workflow.yaml 与 roadmap + PDCA 结构。
# [OUTPUT]: 回归验证 roadmap Skill 与 PDCA 四闭环 Skill 在 schema、目录与 .claude 文档中的同构对齐。
# [POS]: .claude/tests/scripts 的 workflow schema 漂移测试，防止主链重新膨胀。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../test-framework.sh"

REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
WORKFLOW_YAML="$REPO_ROOT/.claude/skills/workflow.yaml"
CLAUDE_DOC="$REPO_ROOT/.claude/CLAUDE.md"
ROADMAP_DIR="$REPO_ROOT/.claude/skills/roadmap"
REQ_PLAN_DIR="$REPO_ROOT/.claude/skills/req-plan"
REQ_DO_DIR="$REPO_ROOT/.claude/skills/req-do"
REQ_CHECK_DIR="$REPO_ROOT/.claude/skills/req-check"
REQ_ACT_DIR="$REPO_ROOT/.claude/skills/req-act"

test_skill_scaffolds_exist() {
    describe "roadmap plus PDCA requirement skills should exist"

    assert_file_exists "$ROADMAP_DIR/SKILL.md" "Should create roadmap SKILL"
    assert_file_exists "$REQ_PLAN_DIR/SKILL.md" "Should create req-plan SKILL"
    assert_file_exists "$REQ_DO_DIR/SKILL.md" "Should create req-do SKILL"
    assert_file_exists "$REQ_CHECK_DIR/SKILL.md" "Should create req-check SKILL"
    assert_file_exists "$REQ_ACT_DIR/SKILL.md" "Should create req-act SKILL"
    assert_file_not_exists "$ROADMAP_DIR/context.jsonl" "roadmap should not rely on default context injection"
    assert_file_not_exists "$REQ_PLAN_DIR/context.jsonl" "req-plan should not rely on default context injection"
    assert_file_not_exists "$REQ_DO_DIR/context.jsonl" "req-do should not rely on default context injection"
    assert_file_not_exists "$REQ_CHECK_DIR/context.jsonl" "req-check should not rely on default context injection"
    assert_file_not_exists "$REQ_ACT_DIR/context.jsonl" "req-act should not rely on default context injection"
}

test_workflow_schema_maps_pdca_loop() {
    describe "workflow schema should map roadmap and the PDCA loop"

    local content
    content=$(cat "$WORKFLOW_YAML")

    assert_contains "$content" "skill: roadmap" "workflow should reference roadmap"
    assert_contains "$content" "skill: req-plan" "workflow should reference req-plan"
    assert_contains "$content" "skill: req-do" "workflow should reference req-do"
    assert_contains "$content" "skill: req-check" "workflow should reference req-check"
    assert_contains "$content" "skill: req-act" "workflow should reference req-act"
    assert_contains "$content" "- id: backlog_feedback" "workflow should allow act stage to feed backlog"
    assert_contains "$content" "- id: roadmap" "skills.workflow should register roadmap"
    assert_contains "$content" "- id: req-plan" "skills.workflow should register req-plan"
    assert_contains "$content" "- id: req-do" "skills.workflow should register req-do"
    assert_contains "$content" "- id: req-check" "skills.workflow should register req-check"
    assert_contains "$content" "- id: req-act" "skills.workflow should register req-act"
}

test_claude_directory_map_mentions_pdca_loop() {
    describe ".claude directory map should mention roadmap and PDCA"

    local content
    content=$(cat "$CLAUDE_DOC")

    assert_contains "$content" "roadmap/" "Should list roadmap in .claude map"
    assert_contains "$content" "req-plan/" "Should list req-plan in .claude map"
    assert_contains "$content" "req-do/" "Should list req-do in .claude map"
    assert_contains "$content" "req-check/" "Should list req-check in .claude map"
    assert_contains "$content" "req-act/" "Should list req-act in .claude map"
}

test_req_plan_stays_requirement_scoped() {
    describe "req-plan should stay requirement scoped"

    local content
    content=$(cat "$REQ_PLAN_DIR/SKILL.md")

    assert_not_contains "$content" "ARCHITECTURE.md" "req-plan should not own project architecture docs"
    assert_not_contains "$content" "GUIDELINES.md" "req-plan should not own project guidelines docs"
    assert_not_contains "$content" "STYLE.md" "req-plan should not own project style docs"
    assert_not_contains "$content" "ROADMAP.md" "req-plan should not regenerate roadmap"
    assert_not_contains "$content" "BACKLOG.md" "req-plan should not own backlog planning"
}

run_tests \
    test_skill_scaffolds_exist \
    test_workflow_schema_maps_pdca_loop \
    test_claude_directory_map_mentions_pdca_loop \
    test_req_plan_stays_requirement_scoped
