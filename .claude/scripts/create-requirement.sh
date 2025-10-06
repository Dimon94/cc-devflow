#!/usr/bin/env bash

# Create new requirement structure for cc-devflow
#
# This script initializes a new requirement or BUG directory structure.
# Based on spec-kit's create-new-feature.sh design.
#
# Usage: ./create-requirement.sh [REQ_ID] [OPTIONS]
#
# ARGUMENTS:
#   REQ_ID              Requirement ID (REQ-XXX or BUG-XXX format)
#                       Optional if --interactive mode is used
#
# OPTIONS:
#   --title TITLE       Requirement title (for git branch)
#   --description DESC  Brief description (optional)
#   --skip-git          Skip git branch creation
#   --interactive, -i   Interactive mode (prompts for inputs)
#   --json              Output in JSON format
#   --help, -h          Show help message
#
# EXAMPLES:
#   # Create requirement with title
#   ./create-requirement.sh REQ-123 --title "User authentication"
#
#   # Interactive mode
#   ./create-requirement.sh --interactive
#
#   # Create BUG structure
#   ./create-requirement.sh BUG-456 --title "Fix login issue" --skip-git
#
#   # JSON output for automation
#   ./create-requirement.sh REQ-123 --title "API Gateway" --json

set -e

# Parse command line arguments
REQ_ID=""
TITLE=""
DESCRIPTION=""
SKIP_GIT=false
INTERACTIVE=false
JSON_MODE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --title)
            TITLE="$2"
            shift 2
            ;;
        --description)
            DESCRIPTION="$2"
            shift 2
            ;;
        --skip-git)
            SKIP_GIT=true
            shift
            ;;
        --interactive|-i)
            INTERACTIVE=true
            shift
            ;;
        --json)
            JSON_MODE=true
            shift
            ;;
        --help|-h)
            cat << 'EOF'
Usage: create-requirement.sh [REQ_ID] [OPTIONS]

Create new requirement or BUG structure for cc-devflow.

ARGUMENTS:
  REQ_ID              Requirement ID (REQ-XXX or BUG-XXX format)
                      Optional if --interactive mode is used

OPTIONS:
  --title TITLE       Requirement title (for git branch naming)
  --description DESC  Brief description (optional)
  --skip-git          Skip git branch creation
  --interactive, -i   Interactive mode (prompts for inputs)
  --json              Output results in JSON format
  --help, -h          Show this help message

EXAMPLES:
  # Create requirement with title
  ./create-requirement.sh REQ-123 --title "User authentication"

  # Interactive mode
  ./create-requirement.sh --interactive

  # Create BUG structure
  ./create-requirement.sh BUG-456 --title "Fix login issue"

  # JSON output
  ./create-requirement.sh REQ-123 --title "API Gateway" --json

STRUCTURE CREATED:
  Requirements (REQ-XXX):
    devflow/requirements/REQ-XXX/
    ├── research/              # External research materials
    ├── EXECUTION_LOG.md       # Event log
    └── orchestration_status.json  # Status tracking

  BUG Fixes (BUG-XXX):
    devflow/bugs/BUG-XXX/
    ├── EXECUTION_LOG.md
    └── status.json

GIT BRANCH:
  - Requirements: feature/REQ-XXX-title
  - BUG Fixes: bugfix/BUG-XXX-title

EOF
            exit 0
            ;;
        -*)
            echo "ERROR: Unknown option '$1'. Use --help for usage information." >&2
            exit 1
            ;;
        *)
            if [[ -z "$REQ_ID" ]]; then
                REQ_ID="$1"
            else
                echo "ERROR: Too many arguments. Use --help for usage information." >&2
                exit 1
            fi
            shift
            ;;
    esac
done

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Interactive mode
if $INTERACTIVE; then
    if ! $JSON_MODE; then
        echo "=== Create New Requirement ==="
        echo ""
    fi

    # Prompt for requirement ID if not provided
    if [[ -z "$REQ_ID" ]]; then
        read -p "Requirement ID (REQ-XXX or BUG-XXX): " REQ_ID
        REQ_ID=$(echo "$REQ_ID" | tr '[:lower:]' '[:upper:]')
    fi

    # Prompt for title if not provided
    if [[ -z "$TITLE" ]]; then
        read -p "Requirement Title: " TITLE
    fi

    # Prompt for description
    if [[ -z "$DESCRIPTION" ]]; then
        read -p "Brief Description (optional): " DESCRIPTION
    fi

    # Prompt for git branch creation
    if ! $SKIP_GIT && has_git; then
        read -p "Create git branch? (y/n): " create_branch
        if [[ "$create_branch" != "y" && "$create_branch" != "Y" ]]; then
            SKIP_GIT=true
        fi
    fi
fi

# Validate requirement ID is provided
if [[ -z "$REQ_ID" ]]; then
    echo "ERROR: Requirement ID is required" >&2
    echo "Use --interactive mode or provide REQ_ID as argument" >&2
    exit 1
fi

# Normalize requirement ID to uppercase
REQ_ID=$(echo "$REQ_ID" | tr '[:lower:]' '[:upper:]')

# Validate requirement ID format
validate_req_id "$REQ_ID" || exit 1

# Get repository root
REPO_ROOT=$(get_repo_root)

# Get requirement type and directory
REQ_TYPE=$(get_req_type "$REQ_ID")
REQ_DIR=$(get_req_dir "$REPO_ROOT" "$REQ_ID")

# Check if requirement already exists
if [[ -d "$REQ_DIR" ]]; then
    echo "ERROR: Requirement directory already exists: $REQ_DIR" >&2
    echo "Use a different requirement ID or remove existing directory first." >&2
    exit 1
fi

# Create directory structure
if ! $JSON_MODE; then
    echo "Creating requirement structure at $REQ_DIR..." >&2
fi

# Create directories
mkdir -p "$REQ_DIR/research"

# Initialize EXECUTION_LOG.md
cat > "$REQ_DIR/EXECUTION_LOG.md" <<EOF
# Execution Log: $REQ_ID

**Title**: ${TITLE:-"To be defined"}
**Type**: $REQ_TYPE
**Created**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

EOF

if [[ -n "$DESCRIPTION" ]]; then
    cat >> "$REQ_DIR/EXECUTION_LOG.md" <<EOF
## Description
$DESCRIPTION

EOF
fi

cat >> "$REQ_DIR/EXECUTION_LOG.md" <<'EOF'
## Events

EOF

# Initialize status file
if [[ "$REQ_TYPE" == "bug" ]]; then
    # BUG-specific status file
    cat > "$REQ_DIR/status.json" <<EOF
{
  "bugId": "$REQ_ID",
  "title": "${TITLE:-"To be defined"}",
  "status": "initialized",
  "phase": "analysis",
  "severity": "unknown",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
else
    # Requirement status file
    cat > "$REQ_DIR/orchestration_status.json" <<EOF
{
  "reqId": "$REQ_ID",
  "title": "${TITLE:-"To be defined"}",
  "status": "initialized",
  "phase": "planning",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
fi

# Create README.md for the requirement
cat > "$REQ_DIR/README.md" <<EOF
# $REQ_ID: ${TITLE:-"To be defined"}

**Status**: Initialized
**Type**: $REQ_TYPE
**Created**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

EOF

if [[ -n "$DESCRIPTION" ]]; then
    cat >> "$REQ_DIR/README.md" <<EOF
## Description
$DESCRIPTION

EOF
fi

cat >> "$REQ_DIR/README.md" <<'EOF'
## Documents

### Planning Phase
- [ ] PRD.md - Product Requirements Document
- [ ] EPIC.md - Epic Planning
- [ ] TASKS.md - Task Breakdown

### Execution Phase
- [ ] TEST_PLAN.md - Test Plan
- [ ] SECURITY_PLAN.md - Security Plan
- [ ] EXECUTION_LOG.md - Event Log

### Review Phase
- [ ] TEST_REPORT.md - Test Report
- [ ] SECURITY_REPORT.md - Security Report
- [ ] RELEASE_PLAN.md - Release Plan

## Research Materials
Place external research materials in `research/` directory:
- API documentation
- Design specifications
- Reference implementations
- Planning documents

## Workflow
1. **Planning**: Create PRD → Generate EPIC → Break down TASKS
2. **Development**: Implement tasks following TDD approach
3. **Quality**: Execute test plan and security review
4. **Release**: Create release plan and merge to main

EOF

# Log the creation event
log_event "$REQ_ID" "Requirement structure initialized"

if [[ -n "$TITLE" ]]; then
    log_event "$REQ_ID" "Title: $TITLE"
fi

if [[ -n "$DESCRIPTION" ]]; then
    log_event "$REQ_ID" "Description: $DESCRIPTION"
fi

# Create git branch if requested and available
GIT_BRANCH=""
if ! $SKIP_GIT && has_git; then
    # Generate branch name from title
    if [[ -n "$TITLE" ]]; then
        # Convert title to kebab-case
        BRANCH_SUFFIX=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
    else
        BRANCH_SUFFIX="new-requirement"
    fi

    # Determine branch prefix based on type
    if [[ "$REQ_TYPE" == "bug" ]]; then
        GIT_BRANCH="bugfix/$REQ_ID-$BRANCH_SUFFIX"
    else
        GIT_BRANCH="feature/$REQ_ID-$BRANCH_SUFFIX"
    fi

    # Check if branch already exists
    if git rev-parse --verify "$GIT_BRANCH" >/dev/null 2>&1; then
        if ! $JSON_MODE; then
            echo "WARNING: Git branch already exists: $GIT_BRANCH" >&2
            echo "Skipping branch creation." >&2
        fi
    else
        # Create and checkout new branch
        git checkout -b "$GIT_BRANCH" >/dev/null 2>&1
        log_event "$REQ_ID" "Created git branch: $GIT_BRANCH"

        if ! $JSON_MODE; then
            echo "Created and checked out branch: $GIT_BRANCH" >&2
        fi
    fi

    # Set environment variable for non-branch-based workflows
    export DEVFLOW_REQ_ID="$REQ_ID"
fi

# Output results
if $JSON_MODE; then
    # JSON output
    printf '{"req_id":"%s","req_type":"%s","req_dir":"%s","title":"%s","git_branch":"%s","created_at":"%s"}\n' \
        "$REQ_ID" \
        "$REQ_TYPE" \
        "$REQ_DIR" \
        "${TITLE:-""}" \
        "${GIT_BRANCH:-""}" \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
else
    # Human-readable output
    echo ""
    echo "✅ Requirement structure created successfully!"
    echo ""
    echo "Requirement ID:    $REQ_ID"
    echo "Type:              $REQ_TYPE"
    echo "Directory:         $REQ_DIR"
    if [[ -n "$TITLE" ]]; then
        echo "Title:             $TITLE"
    fi
    if [[ -n "$GIT_BRANCH" ]]; then
        echo "Git Branch:        $GIT_BRANCH"
    fi
    echo ""
    echo "Next Steps:"
    if [[ "$REQ_TYPE" == "bug" ]]; then
        echo "  1. Run bug-analyzer agent to analyze the BUG"
        echo "  2. Run /flow-fix to start BUG fix workflow"
    else
        echo "  1. Add research materials to research/ directory (optional)"
        echo "  2. Run prd-writer agent to create PRD.md"
        echo "  3. Run /flow-new to start development workflow"
    fi
    echo ""
fi