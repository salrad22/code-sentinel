# CodeSentinel MCP Server

A comprehensive code quality analysis server for the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). CodeSentinel integrates with Claude Code and other MCP-compatible clients to detect security vulnerabilities, deceptive patterns, incomplete code, and highlight good practices.

## Why CodeSentinel?

AI coding assistants can inadvertently introduce subtle issues: hardcoded secrets, empty catch blocks, TODO placeholders left behind, or patterns that hide errors. CodeSentinel acts as a quality gate, analyzing code for **93 distinct patterns** across 5 categories before issues reach production.

**Key differentiators:**
- **Verification-aware detection**: Many patterns include verification steps to reduce false positives
- **LLM-optimized output**: Structured JSON output designed for AI consumption and action
- **Balanced analysis**: Detects both issues AND strengths for fair code assessment
- **Multi-language support**: Works with TypeScript, JavaScript, Python, Go, Rust, Java, and more

## Features

- **Security Analysis** (16 patterns): Hardcoded secrets, SQL injection, XSS, command injection, insecure crypto, disabled SSL, and more
- **Deceptive Pattern Detection** (17 patterns): Empty catch blocks, silent failures, error-hiding fallbacks, linter suppression
- **Placeholder Detection** (19 patterns): TODO/FIXME/HACK comments, lorem ipsum, test data, incomplete implementations
- **Error & Code Smell Detection** (18 patterns): Type coercion issues, null references, async anti-patterns, floating point comparison
- **Strength Recognition** (23 patterns): Highlights good practices like proper typing, error handling, testing patterns, documentation
- **HTML Reports**: Visual reports with quality scores and actionable suggestions

## Installation

### From npm

```bash
npm install -g code-sentinel-mcp
```

### From source

```bash
git clone https://github.com/your-username/code-sentinel.git
cd code-sentinel
npm install
npm run build
```

## Usage with Claude Code

### Quick setup

```bash
claude mcp add code-sentinel -- npx code-sentinel-mcp
```

### Or if installed globally

```bash
claude mcp add code-sentinel -- code-sentinel
```

### Manual configuration

Add to your Claude Code MCP configuration file (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "code-sentinel": {
      "command": "npx",
      "args": ["code-sentinel-mcp"]
    }
  }
}
```

## Available Tools

### `analyze_code`
Full analysis returning structured JSON with all issues and strengths. Best for programmatic processing.

**Parameters:**
- `code` (string, required): The source code to analyze
- `filename` (string, required): Filename for language detection (e.g., "app.ts")

**Returns:** JSON object with issues, strengths, and summary statistics.

### `generate_report`
Full analysis with a visual HTML report. Best for human review.

**Parameters:**
- `code` (string, required): The source code to analyze
- `filename` (string, required): Filename for language detection

**Returns:** Markdown summary plus complete HTML report.

### `check_security`
Security-focused analysis only. Use when you specifically want to audit for vulnerabilities.

**Parameters:**
- `code` (string, required): The source code to check
- `filename` (string, required): Filename

**Returns:** List of security issues or confirmation of none found.

### `check_deceptive_patterns`
Check for code patterns that hide errors or create false confidence.

**Parameters:**
- `code` (string, required): The source code to check
- `filename` (string, required): Filename

**Returns:** List of deceptive patterns found.

### `check_placeholders`
Find TODOs, dummy data, and incomplete implementations.

**Parameters:**
- `code` (string, required): The source code to check
- `filename` (string, required): Filename

**Returns:** List of placeholder code found.

### `analyze_patterns`
Analyze code for architectural, design, and implementation patterns. Detects pattern usage, inconsistencies, and provides actionable suggestions.

**Parameters:**
- `code` (string, required): The source code to analyze
- `filename` (string, required): Filename for language detection
- `level` (string, optional): Pattern level to analyze:
  - `architectural`: System structure patterns (layering, modules)
  - `design`: Gang of Four patterns (Singleton, Factory, Observer)
  - `code`: Implementation idioms (error handling, async patterns)
  - `all`: All levels (default)
- `query` (string, optional): Natural language query to focus analysis (e.g., "how is error handling done?")

**Returns:** LLM-optimized JSON with detected patterns, inconsistencies, suggestions, and ready-to-execute action items.

### `analyze_design_patterns`
Focused analysis of Gang of Four (GoF) design patterns. Best for understanding OOP structure.

**Parameters:**
- `code` (string, required): The source code to analyze
- `filename` (string, required): Filename for language detection

**Returns:** Detected design patterns with confidence levels, locations, and implementation details.

## Example Usage

Ask Claude to analyze code:

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

CodeSentinel will detect:
- **Critical** (CS-SEC003): OpenAI API key hardcoded in source
- **High** (CS-DEC001): Empty catch block silently swallowing errors
- **Low** (CS-PH001): TODO comment indicating incomplete implementation

## Detection Categories

### Security Issues (CS-SEC)
| ID | Pattern |
|:---|:--------|
| SEC001 | Hardcoded secrets (API keys, tokens, passwords) |
| SEC002 | GitHub tokens |
| SEC003 | OpenAI API keys |
| SEC004 | AWS access keys |
| SEC005-010 | SQL injection patterns |
| SEC011-015 | XSS vulnerabilities |
| SEC016 | Command injection (eval, exec) |

### Deceptive Patterns (CS-DEC)
| ID | Pattern |
|:---|:--------|
| DEC001-003 | Empty/comment-only catch blocks |
| DEC010-012 | Silent promise rejections |
| DEC020-025 | Error-hiding fallbacks (|| [], || {}, ?? default) |
| DEC030+ | Linter suppression, fake success responses |

### Placeholders (CS-PH)
| ID | Pattern |
|:---|:--------|
| PH001-005 | TODO/FIXME/HACK/XXX/NOTE comments |
| PH010-015 | Lorem ipsum, placeholder text |
| PH020-025 | Test/dummy data (test@example.com, password123) |
| PH030+ | console.log debugging, debugger statements |

### Errors & Code Smells (CS-ERR)
| ID | Pattern |
|:---|:--------|
| ERR001-005 | Loose equality (==), type coercion issues |
| ERR010-015 | Null reference risks |
| ERR020-025 | Async anti-patterns |
| ERR030+ | parseInt without radix, array mutation in loops |

### Strengths (CS-STR)
| ID | Pattern |
|:---|:--------|
| STR001-005 | TypeScript strict typing |
| STR010-015 | Proper error handling patterns |
| STR020-025 | Test coverage indicators |
| STR030+ | Documentation, input validation |

## Scoring Algorithm

Quality score (0-100) calculated as:

```
Score = 100 - (critical × 25) - (high × 15) - (medium × 5) - (low × 1) + (strengths × 2)
```

| Severity | Point Deduction |
|:---------|:----------------|
| Critical | -25 points |
| High | -15 points |
| Medium | -5 points |
| Low | -1 point |
| Strength | +2 points (bonus) |

## Supported Languages

CodeSentinel detects language from file extensions:

| Extension | Language |
|:----------|:---------|
| `.ts`, `.tsx` | TypeScript |
| `.js`, `.jsx` | JavaScript |
| `.py` | Python |
| `.go` | Go |
| `.rs` | Rust |
| `.java` | Java |
| `.kt` | Kotlin |
| `.swift` | Swift |
| `.cs` | C# |
| `.cpp`, `.c` | C/C++ |
| `.php` | PHP |
| `.vue` | Vue |
| `.svelte` | Svelte |

## Extending CodeSentinel

Add custom patterns by editing files in `src/analyzers/`:

```
src/analyzers/
├── security.ts      # Security vulnerability patterns
├── deceptive.ts     # Error-hiding patterns
├── placeholders.ts  # Incomplete code patterns
├── errors.ts        # Code smell patterns
└── strengths.ts     # Good practice patterns
```

Each pattern follows this structure:

```typescript
{
  id: 'CS-SEC001',           // Unique ID with category prefix
  pattern: /regex/g,          // RegExp to match
  title: 'Short description',
  description: 'Detailed explanation',
  severity: 'critical',       // critical | high | medium | low | info
  category: 'security',
  suggestion: 'How to fix',
  verification: {             // Optional: reduce false positives
    assumption: 'What we assume is true',
    confirmIf: 'When to confirm as real issue',
    falsePositiveIf: 'When to dismiss'
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch

# Test with MCP inspector
npm run inspector
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add patterns following the existing format
4. Submit a pull request

## License

MIT

## Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code](https://claude.ai/code)
- [npm package](https://www.npmjs.com/package/code-sentinel-mcp)
