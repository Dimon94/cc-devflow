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
#   --title TITLE       Requirement title (docs; branch fallback)
#   --branch-title TITLE Branch title used for git branch naming (optional)
#   --description DESC  Brief description (optional)
#   --skip-git          Skip git branch creation
#   --interactive, -i   Interactive mode (prompts for inputs)
#   --json              Output in JSON format
#   --help, -h          Show help message
#
# EXAMPLES:
#   # Create requirement with title
#   ./create-requirement.sh REQ-123 --title "User authentication"
#   ./create-requirement.sh REQ-123 --title "User authentication" --branch-title "Auth"
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
BRANCH_TITLE=""
DESCRIPTION=""
SKIP_GIT=false
INTERACTIVE=false
JSON_MODE=false
AUTO_ID=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --title)
            TITLE="$2"
            shift 2
            ;;
        --branch-title)
            BRANCH_TITLE="$2"
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
        --auto-id)
            AUTO_ID=true
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
  --title TITLE       Requirement title (docs; branch fallback)
  --branch-title TITLE Branch title used for git branch naming (optional)
  --description DESC  Brief description (optional)
  --skip-git          Skip git branch creation
  --interactive, -i   Interactive mode (prompts for inputs)
  --json              Output results in JSON format
  --auto-id           Auto-select next available REQ-ID when missing or duplicated
  --help, -h          Show this help message

EXAMPLES:
  # Create requirement with title
  ./create-requirement.sh REQ-123 --title "User authentication"

  # Create requirement with custom branch title
  ./create-requirement.sh REQ-123 --title "User authentication" --branch-title "Auth"

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
REPO_ROOT=$(get_repo_root)

# Interactive mode
if $INTERACTIVE; then
    if ! $JSON_MODE; then
        echo "=== Create New Requirement ==="
        echo ""
    fi

    # Prompt for requirement ID if not provided
    if [[ -z "$REQ_ID" ]]; then
        suggested_req_id=$(next_available_req_id "$REPO_ROOT")
        read -p "Requirement ID (REQ-XXX or BUG-XXX) [${suggested_req_id}]: " input_req_id
        input_req_id=$(echo "${input_req_id}" | tr '[:lower:]' '[:upper:]')
        if [[ -z "$input_req_id" ]]; then
            AUTO_ID=true
            REQ_ID="$suggested_req_id"
        else
            REQ_ID="$input_req_id"
        fi
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

# Ensure requirement ID is set, auto-select when allowed
if [[ -z "$REQ_ID" ]]; then
    AUTO_ID=true
    REQ_ID=$(next_available_req_id "$REPO_ROOT")
    if [[ -z "$REQ_ID" ]]; then
        echo "ERROR: Unable to determine next requirement ID" >&2
        exit 1
    fi
    if ! $JSON_MODE; then
        echo "Auto-selected requirement ID: $REQ_ID" >&2
    fi
fi

# Normalize requirement ID to uppercase
REQ_ID=$(echo "$REQ_ID" | tr '[:lower:]' '[:upper:]')

# Validate requirement ID format
validate_req_id "$REQ_ID" || exit 1

# Resolve conflicts when requirement ID already exists
if req_id_in_use "$REPO_ROOT" "$REQ_ID"; then
    if $AUTO_ID; then
        original_req_id="$REQ_ID"
        while req_id_in_use "$REPO_ROOT" "$REQ_ID"; do
            next_candidate=$(next_available_req_id "$REPO_ROOT")
            if [[ "$next_candidate" == "$REQ_ID" ]]; then
                next_candidate="REQ-$(date +%Y%m%d%H%M%S)"
            fi
            REQ_ID="$next_candidate"
        done
        if [[ "$REQ_ID" != "$original_req_id" ]] && ! $JSON_MODE; then
            echo "Requirement ID in use; switched to $REQ_ID" >&2
        fi
    else
        suggested_req_id=$(next_available_req_id "$REPO_ROOT")
        conflict_dir=$(get_req_dir "$REPO_ROOT" "$REQ_ID")
        echo "ERROR: Requirement directory already exists: $conflict_dir" >&2
        if [[ "$suggested_req_id" != "$REQ_ID" ]]; then
            echo "Suggested next available ID: $suggested_req_id" >&2
        fi
        exit 1
    fi
fi

# Get requirement type and directory
REQ_TYPE=$(get_req_type "$REQ_ID")
REQ_DIR=$(get_req_dir "$REPO_ROOT" "$REQ_ID")

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
**Created**: $(get_beijing_time_full)

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
  "createdAt": "$(get_beijing_time_iso)",
  "updatedAt": "$(get_beijing_time_iso)"
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
  "createdAt": "$(get_beijing_time_iso)",
  "updatedAt": "$(get_beijing_time_iso)"
}
EOF
fi

# Create README.md for the requirement
cat > "$REQ_DIR/README.md" <<EOF
# $REQ_ID: ${TITLE:-"To be defined"}

**Status**: Initialized
**Type**: $REQ_TYPE
**Created**: $(get_beijing_time_full)

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
    if [[ -n "$BRANCH_TITLE" ]]; then
        BRANCH_SUFFIX=$(slugify "$BRANCH_TITLE")
    elif [[ -n "$TITLE" ]]; then
        BRANCH_SUFFIX=$(slugify "$TITLE")
    else
        BRANCH_SUFFIX="new-requirement"
    fi
    if [[ -z "$BRANCH_SUFFIX" ]]; then
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

# Sync developer workspace pointer when workspace is initialized.
# This keeps follow-up sessions aligned to the same requirement.
DEVELOPER="${DEVFLOW_DEVELOPER:-$(whoami)}"
DEV_WORKSPACE_DIR="$REPO_ROOT/devflow/workspace/$DEVELOPER"
if [[ -d "$DEV_WORKSPACE_DIR" ]]; then
    echo "$REQ_ID" > "$DEV_WORKSPACE_DIR/.current-req"
    log_event "$REQ_ID" "Workspace pointer updated: $DEVELOPER -> $REQ_ID"
    if ! $JSON_MODE; then
        echo "Updated workspace current requirement: $DEVELOPER -> $REQ_ID" >&2
    fi
fi

# Output results
if $JSON_MODE; then
    printf '{"req_id":"%s","req_type":"%s","req_dir":"%s","title":"%s","git_branch":"%s","created_at":"%s"}\n' \
        "$REQ_ID" \
        "$REQ_TYPE" \
        "$REQ_DIR" \
        "${TITLE:-""}" \
        "${GIT_BRANCH:-""}" \
        "$(get_beijing_time_iso)"
else
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
        echo "  3. Keep EXECUTION_LOG.md updated during fixes"
    else
        echo "  1. Add research materials to research/ (optional)"
        echo "  2. Run prd-writer agent to create PRD.md"
        echo "  3. Continue with planner and subsequent flow commands"
    fi
    echo ""
fi
