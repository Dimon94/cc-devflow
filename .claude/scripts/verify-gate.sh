#!/bin/bash
# ============================================================
# Verification Gate Script
# Enforces "Evidence before assertions" principle
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

usage() {
    echo "Usage: $0 --type TYPE [OPTIONS]"
    echo ""
    echo "Types:"
    echo "  prd         Verify PRD completion"
    echo "  epic        Verify EPIC completion"
    echo "  dev         Verify development completion"
    echo "  qa          Verify QA completion"
    echo "  release     Verify release readiness"
    echo ""
    echo "Options:"
    echo "  --req-dir DIR    Requirement directory"
    echo "  --verbose        Show detailed output"
    echo "  --json           Output as JSON"
}

verify_prd() {
    local req_dir="$1"
    local errors=0

    echo -e "${YELLOW}Verifying PRD completion...${NC}"

    # Check PRD.md exists
    if [[ ! -f "${req_dir}/PRD.md" ]]; then
        echo -e "${RED}ERROR: PRD.md not found${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ PRD.md exists${NC}"
    fi

    # Check BRAINSTORM.md exists
    if [[ ! -f "${req_dir}/BRAINSTORM.md" ]]; then
        echo -e "${RED}ERROR: BRAINSTORM.md not found${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ BRAINSTORM.md exists${NC}"
    fi

    # Check for TODO/FIXME in PRD
    if grep -q "TODO\|FIXME\|{{" "${req_dir}/PRD.md" 2>/dev/null; then
        echo -e "${RED}ERROR: PRD.md contains TODO/FIXME/placeholders${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ PRD.md has no placeholders${NC}"
    fi

    return $errors
}

verify_epic() {
    local req_dir="$1"
    local errors=0

    echo -e "${YELLOW}Verifying EPIC completion...${NC}"

    # Check EPIC.md exists
    if [[ ! -f "${req_dir}/EPIC.md" ]]; then
        echo -e "${RED}ERROR: EPIC.md not found${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ EPIC.md exists${NC}"
    fi

    # Check TASKS.md exists
    if [[ ! -f "${req_dir}/TASKS.md" ]]; then
        echo -e "${RED}ERROR: TASKS.md not found${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ TASKS.md exists${NC}"
    fi

    return $errors
}

verify_dev() {
    local req_dir="$1"
    local errors=0

    echo -e "${YELLOW}Verifying development completion...${NC}"

    # Run tests
    echo "Running tests..."
    if npm test 2>/dev/null; then
        echo -e "${GREEN}✓ Tests pass${NC}"
    else
        echo -e "${RED}ERROR: Tests failed${NC}"
        ((errors++))
    fi

    # Run build
    echo "Running build..."
    if npm run build 2>/dev/null; then
        echo -e "${GREEN}✓ Build succeeds${NC}"
    else
        echo -e "${RED}ERROR: Build failed${NC}"
        ((errors++))
    fi

    # Run lint
    echo "Running lint..."
    if npm run lint 2>/dev/null; then
        echo -e "${GREEN}✓ Lint passes${NC}"
    else
        echo -e "${YELLOW}WARNING: Lint issues found${NC}"
    fi

    return $errors
}

verify_qa() {
    local req_dir="$1"
    local errors=0

    echo -e "${YELLOW}Verifying QA completion...${NC}"

    # Check TEST_REPORT.md exists
    if [[ ! -f "${req_dir}/TEST_REPORT.md" ]]; then
        echo -e "${RED}ERROR: TEST_REPORT.md not found${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ TEST_REPORT.md exists${NC}"
    fi

    # Check SECURITY_REPORT.md exists
    if [[ ! -f "${req_dir}/SECURITY_REPORT.md" ]]; then
        echo -e "${RED}ERROR: SECURITY_REPORT.md not found${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ SECURITY_REPORT.md exists${NC}"
    fi

    return $errors
}

verify_release() {
    local req_dir="$1"
    local errors=0

    echo -e "${YELLOW}Verifying release readiness...${NC}"

    # Check RELEASE_PLAN.md exists
    if [[ ! -f "${req_dir}/RELEASE_PLAN.md" ]]; then
        echo -e "${RED}ERROR: RELEASE_PLAN.md not found${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ RELEASE_PLAN.md exists${NC}"
    fi

    # Check git status
    if [[ -n "$(git status --porcelain)" ]]; then
        echo -e "${RED}ERROR: Uncommitted changes exist${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ Git working directory clean${NC}"
    fi

    # Check PR status if on feature branch
    local branch=$(git branch --show-current)
    if [[ "$branch" == feature/* ]] || [[ "$branch" == bugfix/* ]]; then
        echo "Checking PR status..."
        if gh pr checks 2>/dev/null; then
            echo -e "${GREEN}✓ PR checks pass${NC}"
        else
            echo -e "${YELLOW}WARNING: PR checks not available or failing${NC}"
        fi
    fi

    return $errors
}

# Main
TYPE=""
REQ_DIR=""
VERBOSE=false
JSON=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            TYPE="$2"
            shift 2
            ;;
        --req-dir)
            REQ_DIR="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --json)
            JSON=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

if [[ -z "$TYPE" ]]; then
    echo "Error: --type is required"
    usage
    exit 1
fi

# Default req_dir to current directory
REQ_DIR="${REQ_DIR:-.}"

case "$TYPE" in
    prd)
        verify_prd "$REQ_DIR"
        ;;
    epic)
        verify_epic "$REQ_DIR"
        ;;
    dev)
        verify_dev "$REQ_DIR"
        ;;
    qa)
        verify_qa "$REQ_DIR"
        ;;
    release)
        verify_release "$REQ_DIR"
        ;;
    *)
        echo "Unknown type: $TYPE"
        usage
        exit 1
        ;;
esac

exit_code=$?

if [[ $exit_code -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}VERIFICATION PASSED${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}VERIFICATION FAILED - ${exit_code} error(s)${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

exit $exit_code
