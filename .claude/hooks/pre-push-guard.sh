#!/usr/bin/env bash
set -euo pipefail

# 预推送质量闸脚本
# 在 git push 或 PR 创建前运行，确保代码质量
#
# Rules Integration:
# - Follows .claude/rules/standard-patterns.md (Fail Fast, Clear Errors)
# - Implements .claude/rules/test-execution.md (coverage thresholds)
# - Enforces .claude/rules/github-operations.md (pre-push validation)
# - Uses .claude/rules/datetime.md (ISO 8601 timestamps)
# - Applies .claude/rules/devflow-patterns.md (branch protection)

echo "🔎 Running pre-push quality gates..."

# 获取当前分支信息
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
echo "📋 Current branch: $CURRENT_BRANCH"

# 初始化检查结果
PASSED=true
WARNINGS=()
ERRORS=()

# 函数：添加错误
add_error() {
    ERRORS+=("❌ $1")
    PASSED=false
}

# 函数：添加警告
add_warning() {
    WARNINGS+=("⚠️ $1")
}

# 检查是否在 feature 分支
if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]] || [[ "$CURRENT_BRANCH" == "develop" ]]; then
    add_error "Cannot push directly to protected branch: $CURRENT_BRANCH"
fi

# 检查 Git 状态
echo "📊 Checking git status..."
if ! git diff --quiet; then
    add_error "Working directory has uncommitted changes"
fi

if ! git diff --cached --quiet; then
    add_warning "Staging area has changes - ensure they're intentional"
fi

# Node.js 项目检查
if [ -f package.json ]; then
    echo "📦 Node.js project detected, running quality checks..."

    # 检查 package-lock.json 是否存在且同步
    if [ -f package-lock.json ]; then
        if [ package.json -nt package-lock.json ]; then
            add_warning "package.json is newer than package-lock.json - run npm install"
        fi
    fi

    # TypeScript 类型检查
    if npm run --silent 2>/dev/null | grep -q "typecheck"; then
        echo "🔍 Running TypeScript type checking..."
        if ! npm run typecheck --silent; then
            add_error "TypeScript type checking failed"
        else
            echo "✅ TypeScript type checking passed"
        fi
    fi

    # 运行测试
    if npm run --silent 2>/dev/null | grep -q "test"; then
        echo "🧪 Running tests..."
        if ! npm run test --silent; then
            add_error "Tests failed"
        else
            echo "✅ Tests passed"
        fi
    fi

    # 运行 lint
    if npm run --silent 2>/dev/null | grep -q "lint"; then
        echo "🔍 Running linter..."
        if ! npm run lint --silent; then
            add_error "Linting failed"
        else
            echo "✅ Linting passed"
        fi
    fi

    # 检查构建
    if npm run --silent 2>/dev/null | grep -q "build"; then
        echo "🔨 Testing build..."
        if ! npm run build --silent; then
            add_error "Build failed"
        else
            echo "✅ Build successful"
        fi
    fi
fi

# Python 项目检查
if [ -f requirements.txt ] || [ -f pyproject.toml ] || [ -f setup.py ]; then
    echo "🐍 Python project detected, running quality checks..."

    # 检查是否有 flake8/black/mypy 等工具
    if command -v flake8 >/dev/null 2>&1; then
        echo "🔍 Running flake8..."
        if ! flake8 .; then
            add_error "Flake8 checks failed"
        fi
    fi

    if command -v black >/dev/null 2>&1; then
        echo "🎨 Checking code formatting with black..."
        if ! black --check .; then
            add_error "Code not formatted with black"
        fi
    fi

    if command -v mypy >/dev/null 2>&1; then
        echo "🔍 Running mypy type checking..."
        if ! mypy .; then
            add_error "MyPy type checking failed"
        fi
    fi

    # 运行 pytest
    if command -v pytest >/dev/null 2>&1; then
        echo "🧪 Running pytest..."
        if ! pytest; then
            add_error "Python tests failed"
        fi
    fi
fi

# 安全检查
echo "🔒 Running security checks..."

# 检查是否意外提交了敏感文件
SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    "*.key"
    "*.pem"
    "*.p12"
    "*.pfx"
    "id_rsa"
    "id_dsa"
    "id_ed25519"
    "secrets.json"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
    if git ls-files | grep -q "$pattern"; then
        add_error "Sensitive file detected in repository: $pattern"
    fi
done

# 检查提交中是否包含敏感信息
if git log --oneline -1 | grep -iE "(password|secret|key|token|api[_-]?key)" >/dev/null; then
    add_warning "Commit message may contain sensitive information"
fi

# 检查代码中的硬编码密钥（简单检查）
if git diff --cached | grep -iE "(password|secret|key|token)\s*[:=]\s*['\"][^'\"]{8,}['\"]" >/dev/null; then
    add_error "Potential hardcoded secrets detected in staged changes"
fi

# 依赖安全检查（如果工具可用）
if command -v npm >/dev/null 2>&1 && [ -f package.json ]; then
    echo "🔍 Checking for known vulnerabilities..."
    if ! npm audit --audit-level=high --silent; then
        add_warning "npm audit found high severity vulnerabilities"
    fi
fi

# 检查文件大小
echo "📏 Checking file sizes..."
LARGE_FILES=$(git ls-files | xargs ls -la | awk '$5 > 10485760 {print $9, $5}' || true)
if [ -n "$LARGE_FILES" ]; then
    add_warning "Large files detected (>10MB):\n$LARGE_FILES"
fi

# 检查提交消息格式（conventional commits）
COMMIT_MSG=$(git log -1 --pretty=format:"%s")
if ! echo "$COMMIT_MSG" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|ci|build|perf|revert)(\(.+\))?: .+"; then
    add_warning "Commit message doesn't follow conventional commit format"
fi

# Claude Code 特定检查
if command -v claude >/dev/null 2>&1; then
    echo "🤖 Claude Code detected, running additional checks..."

    # 可以在这里添加自定义的安全审查命令
    # 例如：claude /security-review 或调用 security-reviewer 子代理
    echo "⚠️ Consider running /security-review before merge (enforced in agent flow)."
fi

# 显示结果
echo ""
echo "📊 Quality Gate Summary:"
echo "===================="

# 显示警告
if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo "Warnings:"
    printf '%s\n' "${WARNINGS[@]}"
    echo ""
fi

# 显示错误
if [ ${#ERRORS[@]} -gt 0 ]; then
    echo "Errors:"
    printf '%s\n' "${ERRORS[@]}"
    echo ""
fi

# 最终判断
if [ "$PASSED" = true ]; then
    echo "✅ All quality gates passed!"
    echo "🚀 Ready for push/merge"
    exit 0
else
    echo "❌ Quality gates failed!"
    echo "🛑 Please fix the errors before pushing"
    echo ""
    echo "💡 Tips:"
    echo "  - Fix all TypeScript/linting errors"
    echo "  - Ensure all tests pass"
    echo "  - Remove any sensitive files"
    echo "  - Follow conventional commit format"
    echo "  - Run 'npm run test' and 'npm run typecheck' locally"
    exit 2
fi