# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CodeSentinel is an MCP (Model Context Protocol) server for code quality analysis. It provides tools to detect security issues, deceptive patterns, placeholders, and code strengths via Claude Code integration.

## Build Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to build/
npm run watch        # Watch mode for development
npm run inspector    # Test MCP server with inspector
```

## Project Structure

The expected structure uses `src/` as root:
```
src/
  index.ts           # MCP server entry point (tool definitions, handlers)
  types.ts           # Core types: Issue, Strength, Pattern, Severity, Category
  report.ts          # HTML report generator
  analyzers/
    security.ts      # Security patterns (SEC001-SEC060)
    deceptive.ts     # Error-hiding patterns (DEC001-DEC080)
    placeholders.ts  # Incomplete code patterns (PH001-PH070)
    errors.ts        # Code smell patterns (ERR001-ERR140)
    strengths.ts     # Good practice patterns (STR001-STR090)
```

**Current Issue**: Source files are in root instead of `src/`, causing build failure. The `tsconfig.json` expects `"rootDir": "./src"`.

## Architecture

### Pattern-Based Analysis
Each analyzer file defines patterns with the same structure:
- `id`: Unique identifier with prefix (SEC, DEC, PH, ERR, STR)
- `pattern`: RegExp for matching
- `title`: Short description
- `description`: Detailed explanation
- `severity`: critical | high | medium | low | info
- `suggestion`: Fix recommendation (optional)

The analyzer functions scan code against patterns and return `Issue[]` or `Strength[]` with line numbers.

### MCP Tools Exposed
- `analyze_code`: Full analysis returning JSON
- `generate_report`: Full analysis with HTML report
- `check_security`: Security-only analysis
- `check_deceptive_patterns`: Error-hiding patterns only
- `check_placeholders`: Incomplete code only

### Scoring Algorithm (in report.ts)
Score = 100 - (critical×25 + high×15 + medium×5 + low×1) + (strengths×2)

## Adding New Patterns

Add patterns to the appropriate analyzer file following the existing format. Pattern IDs should follow the prefix convention and increment sequentially within each category.

## Testing with Claude Code

```bash
claude mcp add code-sentinel -- node /path/to/code-sentinel/build/index.js
```
