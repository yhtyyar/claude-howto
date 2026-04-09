#!/bin/bash
#
# Qoder Enterprise System Installation Script
# Professional setup for claude-howto adaptation on Qoder IDE
#
# Version: 1.0.0
# Author: CTO Architecture Team
# Date: 2026-04-09
#

set -euo pipefail

# =============================================================================
# CONSTANTS & CONFIGURATION
# =============================================================================

readonly VERSION="1.0.0"
readonly SCRIPT_NAME="qoder-enterprise-installer"
readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly QODER_DIR=".qoder"
readonly SPECS_DIR="specs"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') - $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') - $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%H:%M:%S') - $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') - $*" >&2
}

log_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $*${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

get_node_version() {
    node --version | sed 's/v//'
}

version_gte() {
    # Compare version strings: returns 0 if $1 >= $2
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

prompt_yn() {
    local prompt="$1"
    local response

    while true; do
        read -rp "${prompt} [Y/n]: " response
        case "${response,,}" in
            y|yes|"" ) return 0 ;;
            n|no ) return 1 ;;
            * ) echo "Please answer yes or no." ;;
        esac
    done
}

# =============================================================================
# PREREQUISITE CHECKS
# =============================================================================

check_prerequisites() {
    log_section "CHECKING PREREQUISITES"

    local has_errors=0

    # Check Node.js
    if check_command node; then
        local node_version
        node_version=$(get_node_version)
        log_info "Found Node.js v${node_version}"

        if ! version_gte "${node_version}" "18.0.0"; then
            log_error "Node.js 18.0.0+ required, found v${node_version}"
            has_errors=1
        else
            log_success "Node.js version OK"
        fi
    else
        log_error "Node.js not found. Please install Node.js 18+"
        log_info "Visit: https://nodejs.org/"
        has_errors=1
    fi

    # Check npm
    if check_command npm; then
        local npm_version
        npm_version=$(npm --version)
        log_info "Found npm v${npm_version}"
    else
        log_error "npm not found"
        has_errors=1
    fi

    # Check Git
    if check_command git; then
        local git_version
        git_version=$(git --version | cut -d' ' -f3)
        log_info "Found Git v${git_version}"
    else
        log_warn "Git not found. Some features may be limited."
    fi

    # Check if in a git repository
    if [ -d ".git" ]; then
        log_success "Git repository detected"
    else
        log_warn "Not in a Git repository. Checkpoint functionality will be limited."
    fi

    if [ $has_errors -ne 0 ]; then
        log_error "Prerequisite checks failed. Please install missing dependencies."
        exit 1
    fi

    log_success "All prerequisites met"
}

# =============================================================================
# DIRECTORY STRUCTURE SETUP
# =============================================================================

setup_directories() {
    log_section "SETTING UP DIRECTORY STRUCTURE"

    local dirs=(
        "${QODER_DIR}"
        "${QODER_DIR}/checkpoints"
        "${QODER_DIR}/context"
        "${QODER_DIR}/logs"
        "${QODER_DIR}/skills"
        "${SPECS_DIR}"
        "${SPECS_DIR}/system"
        "${SPECS_DIR}/skills"
        "${SPECS_DIR}/agents"
        "${SPECS_DIR}/tasks"
        "${SPECS_DIR}/panels"
        "${SPECS_DIR}/_templates"
        "workflows"
    )

    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "Created: ${dir}/"
        else
            log_info "Exists: ${dir}/"
        fi
    done

    log_success "Directory structure ready"
}

# =============================================================================
# MCP SERVER INSTALLATION
# =============================================================================

install_mcp_servers() {
    log_section "INSTALLING MCP SERVERS"

    local servers=(
        "mcp-intent-router"
        "mcp-checkpoint-manager"
        "mcp-hook-runner"
    )

    for server in "${servers[@]}"; do
        local server_path="${PROJECT_ROOT}/core/${server}"

        if [ ! -d "$server_path" ]; then
            log_warn "MCP server not found: ${server}"
            continue
        fi

        log_info "Installing ${server}..."

        (
            cd "$server_path"

            # Check if already built
            if [ -d "node_modules" ] && [ -d "dist" ]; then
                log_info "  ${server} already built, skipping"
                continue
            fi

            # Install dependencies
            if ! npm ci --silent 2>&1 | grep -v "npm WARN" | grep -v "npm notice"; then
                log_error "Failed to install dependencies for ${server}"
                exit 1
            fi

            # Build
            if ! npm run build --silent; then
                log_error "Failed to build ${server}"
                exit 1
            fi

            log_success "  ${server} installed and built"
        ) || {
            log_error "Installation failed for ${server}"
            exit 1
        }
    done

    log_success "All MCP servers installed"
}

# =============================================================================
# CONFIGURATION FILES
# =============================================================================

create_config_files() {
    log_section "CREATING CONFIGURATION FILES"

    # Create .qoder/project-spec.md if not exists
    if [ ! -f "${QODER_DIR}/project-spec.md" ]; then
        cat > "${QODER_DIR}/project-spec.md" << 'EOF'
---
type: project-spec
version: 1.0
---

# Project Specification

## Overview
<!-- Edit this section with your project details -->
- **Name**: My Project
- **Tech Stack**: TypeScript, Node.js
- **Architecture**: Microservices / Monolith
- **Team Size**: 3-5 developers

## Development Standards

### Code Style
- Language: TypeScript/JavaScript
- Formatter: Prettier
- Linter: ESLint
- Line length: 100 characters
- Indentation: 2 spaces

### Testing
- Framework: Jest
- Coverage: Minimum 80%
- Test naming: `*.test.ts`

### Git Workflow
- Branch naming: `feature/description`, `fix/description`
- Commit style: Conventional Commits
- PR required: Yes

## Qoder Integration

### Available Skills
- code-review
- performance-optimization
- test-generation
- documentation

### MCP Servers
- intent-router: Intent detection and routing
- checkpoint: Git-based state management
- hooks: Automation workflows

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development |
| `npm test` | Run tests |
| `npm run build` | Production build |
| `npm run lint` | Check code style |

---
*Generated by Qoder Enterprise System v1.0.0*
EOF
        log_success "Created: ${QODER_DIR}/project-spec.md"
    else
        log_info "Exists: ${QODER_DIR}/project-spec.md"
    fi

    # Create .gitignore entries for Qoder
    if [ -f ".gitignore" ]; then
        if ! grep -q "# Qoder Enterprise System" .gitignore; then
            cat >> .gitignore << 'EOF'

# Qoder Enterprise System
.qoder/logs/
.qoder/context/
.qoder/checkpoints/*.tmp
*.qoder-cache
EOF
            log_success "Updated: .gitignore"
        fi
    else
        cat > .gitignore << 'EOF'
# Qoder Enterprise System
.qoder/logs/
.qoder/context/
.qoder/checkpoints/*.tmp
*.qoder-cache
EOF
        log_success "Created: .gitignore"
    fi
}

# =============================================================================
# GIT HOOKS SETUP
# =============================================================================

setup_git_hooks() {
    log_section "SETTING UP GIT HOOKS"

    if [ ! -d ".git" ]; then
        log_warn "Not a Git repository. Skipping git hooks."
        return 0
    fi

    mkdir -p .git/hooks

    # Create pre-commit hook
    cat > .git/hooks/pre-commit << HOOK
#!/bin/bash
# Qoder Enterprise System - Pre-commit Hook

set -e

echo "[Qoder] Running pre-commit checks..."

# Run via MCP server if available
if command -v node &> /dev/null && [ -f "${PROJECT_ROOT}/core/mcp-hook-runner/dist/hook-wrapper.js" ]; then
    node "${PROJECT_ROOT}/core/mcp-hook-runner/dist/hook-wrapper.js" pre-commit
else
    echo "[Qoder] Hook runner not available, skipping automated checks"
fi

echo "[Qoder] Pre-commit complete"
HOOK
    chmod +x .git/hooks/pre-commit
    log_success "Created: .git/hooks/pre-commit"

    log_success "Git hooks configured"
}

# =============================================================================
# TEMPLATE CREATION
# =============================================================================

create_templates() {
    log_section "CREATING SPEC TEMPLATES"

    # Agent spec template
    cat > "${SPECS_DIR}/_templates/agent-spec.md" << 'EOF'
---
type: agent-spec
version: 1.0
mode: expert-panel
role: {{ROLE_NAME}}
---

# {{AGENT_NAME}} Agent Specification

## Role
You are a specialized AI agent focused on {{DOMAIN}}.

## Capabilities
- {{CAPABILITY_1}}
- {{CAPABILITY_2}}
- {{CAPABILITY_3}}

## Execution Flow
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

## Output Format
```
{{OUTPUT_FORMAT}}
```

## Constraints
- {{CONSTRAINT_1}}
- {{CONSTRAINT_2}}

## Examples

### Example 1
**Input:** {{EXAMPLE_INPUT}}
**Output:** {{EXAMPLE_OUTPUT}}

## Activation
Use in Expert Panel Mode or invoke with: "Work as {{ROLE_NAME}}"
EOF

    # Skill spec template
    cat > "${SPECS_DIR}/_templates/skill-spec.md" << 'EOF'
---
type: skill-spec
version: 1.0
name: {{SKILL_NAME}}
triggers:
  - "{{TRIGGER_1}}"
  - "{{TRIGGER_2}}"
confidence_threshold: 0.8
---

# {{SKILL_NAME}} Skill

## Purpose
{{PURPOSE_DESCRIPTION}}

## When to Use
- {{USE_CASE_1}}
- {{USE_CASE_2}}

## Execution Steps
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

## Output Format
{{OUTPUT_SPECIFICATION}}

## Validation
- {{VALIDATION_1}}
- {{VALIDATION_2}}
EOF

    log_success "Created spec templates"
}

# =============================================================================
# VALIDATION
# =============================================================================

validate_installation() {
    log_section "VALIDATING INSTALLATION"

    local has_errors=0

    # Check directory structure
    for dir in "${QODER_DIR}" "${SPECS_DIR}"; do
        if [ ! -d "$dir" ]; then
            log_error "Missing directory: ${dir}"
            has_errors=1
        fi
    done

    # Check MCP servers built
    for server in "mcp-intent-router" "mcp-checkpoint-manager" "mcp-hook-runner"; do
        local dist_path="${PROJECT_ROOT}/core/${server}/dist/index.js"
        if [ ! -f "$dist_path" ]; then
            log_error "MCP server not built: ${server}"
            has_errors=1
        fi
    done

    # Check config files
    if [ ! -f "${QODER_DIR}/project-spec.md" ]; then
        log_error "Missing: ${QODER_DIR}/project-spec.md"
        has_errors=1
    fi

    if [ $has_errors -ne 0 ]; then
        log_error "Validation failed. Please check errors above."
        return 1
    fi

    log_success "Validation passed"
    return 0
}

# =============================================================================
# MCP CONFIGURATION INTEGRATION
# =============================================================================

integrate_mcp_config() {
    log_section "MCP CONFIGURATION INTEGRATION"

    local mcp_config="${PROJECT_ROOT}/config/mcp-servers.json"

    if [ ! -f "$mcp_config" ]; then
        log_warn "MCP config not found: ${mcp_config}"
        return 0
    fi

    log_info "MCP servers configuration available at:"
    log_info "  ${mcp_config}"
    log_info ""
    log_info "To integrate with Qoder:"
    log_info "  1. Open Qoder Settings"
    log_info "  2. Navigate to MCP Configuration"
    log_info "  3. Add the path to mcp-servers.json"
    log_info ""
    log_info "Or use environment variable:"
    log_info "  export QODER_MCP_CONFIG=${mcp_config}"
}

# =============================================================================
# SUMMARY
# =============================================================================

print_summary() {
    log_section "INSTALLATION COMPLETE"

    echo ""
    echo -e "${GREEN}Qoder Enterprise System v${VERSION} installed successfully!${NC}"
    echo ""
    echo "Project structure:"
    tree -L 2 "${QODER_DIR}" "${SPECS_DIR}" 2>/dev/null || find "${QODER_DIR}" "${SPECS_DIR}" -maxdepth 2 -type d | head -20
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Edit ${QODER_DIR}/project-spec.md with your project details"
    echo "  2. Configure MCP servers in Qoder IDE"
    echo "  3. Try: 'Create checkpoint test' in Qoder Chat"
    echo "  4. Try: 'Run code review' to test intent routing"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  - Setup Guide: ${PROJECT_ROOT}/docs/setup-guide.md"
    echo "  - Developer Guide: ${PROJECT_ROOT}/docs/developer-guide.md"
    echo "  - Architecture: ${PROJECT_ROOT}/ARCHITECTURE.md"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  npm run test          - Run test suite"
    echo "  npm run lint          - Check code style"
    echo "  npm run validate:specs - Validate spec files"
    echo ""
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        Qoder Enterprise System Installer v${VERSION}         ║${NC}"
    echo -e "${BLUE}║         Claude-Howto Adaptation for Qoder IDE            ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Check if running in project root
    if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
        log_error "Please run this script from the qoder-enterprise-system directory"
        exit 1
    fi

    log_info "Installation directory: $(pwd)"
    log_info "Project root: ${PROJECT_ROOT}"

    # Check prerequisites
    check_prerequisites

    # Setup directories
    setup_directories

    # Install MCP servers
    if prompt_yn "Install and build MCP servers?"; then
        install_mcp_servers
    else
        log_warn "Skipping MCP server installation"
    fi

    # Create config files
    create_config_files

    # Setup git hooks
    if [ -d ".git" ] && prompt_yn "Setup Git hooks?"; then
        setup_git_hooks
    fi

    # Create templates
    create_templates

    # Validate
    validate_installation

    # MCP integration info
    integrate_mcp_config

    # Print summary
    print_summary
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
