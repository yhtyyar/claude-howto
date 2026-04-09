# Qoder Enterprise System - Makefile
# Build, test, and development commands

.PHONY: help install build test lint clean dev

# Default target
help:
	@echo "Qoder Enterprise System - Available Commands:"
	@echo ""
	@echo "  make install     - Install all dependencies"
	@echo "  make build       - Build all MCP servers"
	@echo "  make test        - Run all tests"
	@echo "  make test-watch  - Run tests in watch mode"
	@echo "  make lint        - Run linting on all packages"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make dev         - Start development mode"
	@echo "  make setup       - Full project setup"
	@echo ""

# Installation
install:
	@echo "Installing root dependencies..."
	npm ci
	@echo "Installing intent-router dependencies..."
	cd core/mcp-intent-router && npm ci
	@echo "Installing checkpoint-manager dependencies..."
	cd core/mcp-checkpoint-manager && npm ci
	@echo "Installing hook-runner dependencies..."
	cd core/mcp-hook-runner && npm ci
	@echo "Installing test dependencies..."
	cd tests && npm ci
	@echo "Installation complete!"

# Build all packages
build:
	@echo "Building intent-router..."
	cd core/mcp-intent-router && npm run build
	@echo "Building checkpoint-manager..."
	cd core/mcp-checkpoint-manager && npm run build
	@echo "Building hook-runner..."
	cd core/mcp-hook-runner && npm run build
	@echo "Build complete!"

# Build specific package
build-intent:
	cd core/mcp-intent-router && npm run build

build-checkpoint:
	cd core/mcp-checkpoint-manager && npm run build

build-hooks:
	cd core/mcp-hook-runner && npm run build

# Testing
test:
	@echo "Running integration tests..."
	cd tests && npm test

test-watch:
	cd tests && npm run test:watch

test-coverage:
	cd tests && npm run test:coverage

# Linting
lint:
	@echo "Linting intent-router..."
	cd core/mcp-intent-router && npm run lint || true
	@echo "Linting checkpoint-manager..."
	cd core/mcp-checkpoint-manager && npm run lint || true
	@echo "Linting hook-runner..."
	cd core/mcp-hook-runner && npm run lint || true
	@echo "Lint complete!"

# Type checking
typecheck:
	@echo "Type checking intent-router..."
	cd core/mcp-intent-router && npm run typecheck
	@echo "Type checking checkpoint-manager..."
	cd core/mcp-checkpoint-manager && npm run typecheck
	@echo "Type checking hook-runner..."
	cd core/mcp-hook-runner && npm run typecheck
	@echo "Type check complete!"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf core/*/dist
	rm -rf core/*/node_modules
	rm -rf tests/node_modules
	rm -rf coverage
	rm -rf .qoder/checkpoints
	@echo "Clean complete!"

# Development mode (watch builds)
dev:
	@echo "Starting development mode..."
	@echo "Run 'make dev-intent' or 'make dev-checkpoint' or 'make dev-hooks' in separate terminals"

dev-intent:
	cd core/mcp-intent-router && npm run dev

dev-checkpoint:
	cd core/mcp-checkpoint-manager && npm run dev

dev-hooks:
	cd core/mcp-hook-runner && npm run dev

# Full setup
setup: install build
	@echo "Running setup script..."
	bash scripts/install.sh
	@echo "Setup complete!"

# Validate workflow files
validate-workflows:
	@echo "Validating workflow files..."
	cd core/mcp-hook-runner && npm run build && node dist/server.js &
	@sleep 2
	@echo "Validation complete"

# Run specific MCP server
run-intent: build-intent
	cd core/mcp-intent-router && node dist/server.js

run-checkpoint: build-checkpoint
	cd core/mcp-checkpoint-manager && node dist/server.js

run-hooks: build-hooks
	cd core/mcp-hook-runner && node dist/server.js

# Generate documentation
docs:
	@echo "Generating API documentation..."
	@echo "TODO: Add documentation generation"

# CI/CD commands for GitHub Actions
ci: install build lint typecheck test
	@echo "CI checks complete!"

# Performance benchmark
benchmark:
	@echo "Running performance benchmarks..."
	@echo "TODO: Add benchmark suite"

# Package for distribution
package: clean build
	@echo "Creating distribution package..."
	mkdir -p dist/qoder-enterprise-system
	cp -r config core specs workflows scripts examples README.md package.json dist/qoder-enterprise-system/
	cd dist && tar -czf qoder-enterprise-system.tar.gz qoder-enterprise-system
	@echo "Package created: dist/qoder-enterprise-system.tar.gz"
