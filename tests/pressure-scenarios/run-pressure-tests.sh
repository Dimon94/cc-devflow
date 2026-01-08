#!/bin/bash
# ============================================================
# Pressure Test Runner
# Run pressure scenarios to validate AI agent behavior
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENARIOS_DIR="${SCRIPT_DIR}/scenarios"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 [OPTIONS] [SCENARIO]"
    echo ""
    echo "Options:"
    echo "  --all           Run all scenarios"
    echo "  --article N     Run scenarios for Article N (I-X)"
    echo "  --list          List available scenarios"
    echo "  --help          Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 scenarios/tdd-violation.md"
    echo "  $0 --all"
    echo "  $0 --article VI"
}

list_scenarios() {
    echo "Available Pressure Scenarios:"
    echo ""
    for scenario in "${SCENARIOS_DIR}"/*.md; do
        if [[ -f "$scenario" ]]; then
            name=$(basename "$scenario" .md)
            title=$(grep "^# Scenario:" "$scenario" | sed 's/# Scenario: //')
            echo "  - ${name}: ${title}"
        fi
    done
}

run_scenario() {
    local scenario_file="$1"

    if [[ ! -f "$scenario_file" ]]; then
        echo -e "${RED}Error: Scenario file not found: ${scenario_file}${NC}"
        exit 1
    fi

    local name=$(basename "$scenario_file" .md)
    local title=$(grep "^# Scenario:" "$scenario_file" | sed 's/# Scenario: //')

    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Scenario: ${title}${NC}"
    echo -e "${YELLOW}File: ${scenario_file}${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Extract key sections
    echo -e "${GREEN}Pressure Combination:${NC}"
    sed -n '/^## Pressure Combination/,/^## /p' "$scenario_file" | head -n -1 | tail -n +2
    echo ""

    echo -e "${GREEN}Trigger:${NC}"
    sed -n '/^## Trigger/,/^## /p' "$scenario_file" | head -n -1 | tail -n +2
    echo ""

    echo -e "${GREEN}Expected Behavior (With Skills):${NC}"
    sed -n '/^## Expected Behavior/,/^## /p' "$scenario_file" | head -n -1 | tail -n +2
    echo ""

    echo -e "${GREEN}Related Articles:${NC}"
    sed -n '/^## Related Articles/,/^## /p' "$scenario_file" | head -n -1 | tail -n +2
    echo ""

    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "To test this scenario:"
    echo "1. Present the 'Trigger' to an AI agent"
    echo "2. Verify response matches 'Expected Behavior'"
    echo "3. Check all verification items are satisfied"
    echo ""
}

run_all() {
    local count=0
    for scenario in "${SCENARIOS_DIR}"/*.md; do
        if [[ -f "$scenario" ]]; then
            run_scenario "$scenario"
            ((count++))
        fi
    done
    echo -e "${GREEN}Completed ${count} scenarios${NC}"
}

run_by_article() {
    local article="$1"
    local found=0

    for scenario in "${SCENARIOS_DIR}"/*.md; do
        if [[ -f "$scenario" ]]; then
            if grep -q "Article ${article}:" "$scenario"; then
                run_scenario "$scenario"
                ((found++))
            fi
        fi
    done

    if [[ $found -eq 0 ]]; then
        echo -e "${YELLOW}No scenarios found for Article ${article}${NC}"
    else
        echo -e "${GREEN}Found ${found} scenarios for Article ${article}${NC}"
    fi
}

# Main
case "${1:-}" in
    --help|-h)
        usage
        ;;
    --list|-l)
        list_scenarios
        ;;
    --all|-a)
        run_all
        ;;
    --article)
        if [[ -z "${2:-}" ]]; then
            echo "Error: --article requires an argument (I-X)"
            exit 1
        fi
        run_by_article "$2"
        ;;
    "")
        usage
        ;;
    *)
        run_scenario "$1"
        ;;
esac
