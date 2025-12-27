# CodeSentinel MCP Server

A code quality analysis MCP server that detects security issues, deceptive patterns, placeholders, and highlights code strengths.

## Features

- 🔒 **Security Analysis**: Hardcoded secrets, SQL injection, XSS, insecure crypto, and more
- 🎭 **Deceptive Pattern Detection**: Empty catch blocks, silent failures, error-hiding returns
- 📝 **Placeholder Detection**: TODO/FIXME, lorem ipsum, test data, incomplete implementations
- ⚠️ **Error & Code Smell Detection**: Type coercion, null references, async issues
- 💪 **Strength Recognition**: Highlights good practices like typing, error handling, tests
- 📊 **HTML Reports**: Beautiful visual reports with scores and suggestions

## Installation

```bash
# Clone or copy the project
cd code-sentinel

# Install dependencies
npm install

# Build
npm run build
```

## Usage with Claude Code

Add to your Claude Code MCP configuration:

```bash
claude mcp add code-sentinel -- node /path/to/code-sentinel/build/index.js
```

Or manually add to your config:

```json
{
  "mcpServers": {
    "code-sentinel": {
      "command": "node",
      "args": ["/path/to/code-sentinel/build/index.js"]
    }
  }
}
```

## Available Tools

### `analyze_code`
Full analysis returning structured JSON with all issues and strengths.

### `generate_report`
Full analysis with HTML report output.

### `check_security`
Security-focused analysis only.

### `check_deceptive_patterns`
Check for error-hiding and deceptive code patterns.

### `check_placeholders`
Find TODOs, dummy data, and incomplete code.

## Example Usage in Claude Code

```
Analyze this code for quality issues:

const API_KEY = "sk-abc123456789";

async function fetchData() {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (e) {
    // TODO: handle error
  }
}
```

Claude will automatically use CodeSentinel to analyze and report:
- Critical: Hardcoded API key detected
- High: Empty catch block (deceptive pattern)
- Low: TODO comment found

## Detection Categories

### Security Issues (SEC)
- Hardcoded secrets (API keys, tokens, passwords)
- SQL injection patterns
- XSS vulnerabilities
- Insecure random, weak crypto
- Disabled SSL validation
- Eval and dynamic code execution

### Deceptive Patterns (DEC)
- Empty catch blocks
- Silent promise rejections
- Error-hiding fallbacks (|| [], || {})
- Fake success responses
- Excessive optional chaining
- Linter suppression comments

### Placeholders (PH)
- TODO/FIXME/HACK/XXX comments
- Lorem ipsum text
- Test emails and passwords
- Debug console.log
- Debugger statements
- Not implemented errors

### Errors & Smells (ERR)
- Loose equality (==)
- Assignment in conditions
- parseInt without radix
- Array mutation during iteration
- Floating point comparison
- Await in constructor

## Scoring

The quality score (0-100) is calculated based on:
- Critical issues: -25 points each
- High issues: -15 points each
- Medium issues: -5 points each
- Low issues: -1 point each
- Strengths: +2 points each

## Extending

Add new patterns by editing the analyzer files in `src/analyzers/`:
- `security.ts` - Security vulnerability patterns
- `deceptive.ts` - Error-hiding patterns
- `placeholders.ts` - Incomplete code patterns
- `errors.ts` - Code smell patterns
- `strengths.ts` - Good practice patterns

Each pattern includes:
- `id`: Unique identifier (e.g., SEC001)
- `pattern`: RegExp to match
- `title`: Short description
- `description`: Detailed explanation
- `severity`: critical | high | medium | low
- `suggestion`: How to fix (optional)

## License

MIT
