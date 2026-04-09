# MCP Intent Router

Enterprise-grade intent detection and routing for Qoder IDE.

## Overview

The Intent Router is a Model Context Protocol (MCP) server that provides intelligent intent detection and routing capabilities for Qoder IDE. It compensates for the lack of native slash commands by providing a sophisticated pattern matching system.

## Features

- **Multi-pattern Matching**: Supports exact, regex, semantic, and fuzzy matching
- **Context-aware Routing**: Boosts confidence based on current file, selection, and session history
- **LRU Caching**: High-performance caching for frequently used intents
- **Hot Reload**: Reload intents without restarting the server
- **Comprehensive Statistics**: Track routing performance and cache metrics

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Intent Router                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pattern    │  │   Context    │  │     LRU      │      │
│  │   Matcher    │  │   Booster    │  │     Cache    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Config Manager                        │  │
│  │  - YAML/JSON config loading                          │  │
│  │  - Environment variable support                      │  │
│  │  - Intent validation (Zod)                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```bash
npm ci
npm run build
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `QODER_SPECS_PATH` | Path to specs directory | `./specs` |
| `QODER_CACHE_ENABLED` | Enable LRU cache | `true` |
| `QODER_CACHE_TTL` | Cache TTL in seconds | `300` |
| `QODER_MIN_CONFIDENCE` | Minimum confidence threshold | `0.8` |
| `QODER_FALLBACK_ENABLED` | Enable fallback suggestions | `true` |

### Intent Definition

```yaml
---
id: "code-review"
name: "Code Review"
description: "Comprehensive code review"
category: "quality"
priority: 1
spec_path: "specs/skills/code-review.md"

patterns:
  - type: "exact"
    value: "code review"
    weight: 1.0
  - type: "regex"
    value: "(review|check)\s+(this|the)\s+code"
    weight: 0.9
  - type: "semantic"
    value: "code analysis security quality"
    weight: 0.8

confidence_threshold: 0.8
```

## MCP Tools

### `detect_intent`

Detect user intent from input text.

```json
{
  "input": "check this code for bugs",
  "context": {
    "currentFile": "src/app.ts",
    "selectedCode": "function test() {}"
  },
  "includeSpec": true
}
```

### `list_intents`

List all available intents.

```json
{
  "category": "quality",
  "includePatterns": true
}
```

### `reload_intents`

Hot reload intents from disk.

```json
{
  "validate": true
}
```

## Testing

```bash
npm test
npm run test:coverage
```

## License

MIT
