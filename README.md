# CodeSentinel MCP Server

A comprehensive code quality analysis server for the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). CodeSentinel integrates with Claude Code and other MCP-compatible clients to detect security vulnerabilities, deceptive patterns, incomplete code, and highlight good practices.

## Why CodeSentinel?

AI coding assistants can inadvertently introduce subtle issues: hardcoded secrets, empty catch blocks, TODO placeholders left behind, or patterns that hide errors. CodeSentinel acts as a quality gate, analyzing code for **93 distinct patterns** across 5 categories before issues reach production.

**Key differentiators:**
- **Verification-aware detection**: Many patterns include verification steps to reduce false positives
- **LLM-optimized output**: Structured JSON output designed for AI consumption and action
- **Balanced analysis**: Detects both issues AND strengths for fair code assessment
- **Multi-language support**: Works with TypeScript, JavaScript, Python, Go, Rust, Java, and more

## Why Not Tree-sitter or AST-Based Tools?

CodeSentinel intentionally uses a **pattern-based approach** rather than AST parsing. Here's why:

### The Problem We Solve Is Different

Traditional linters (ESLint, tree-sitter) detect **syntax errors** and **style violations**. CodeSentinel detects **semantically deceptive patterns** - code that is:

- Syntactically valid (passes all linters)
- Structurally correct (valid AST)
- **But hides serious issues** that AI agents commonly produce

### Examples AST Tools Miss

```javascript
// AST sees: valid try-catch block
// CodeSentinel sees: error swallowing that masks failures
try { riskyOperation(); } catch(e) { }

// AST sees: valid function returning boolean
// CodeSentinel sees: fake implementation that always succeeds
function validateUser() { return true; } // TODO: implement

// AST sees: valid fallback expression
// CodeSentinel sees: failure masking - "no data" vs "fetch failed" indistinguishable
const users = response.data || [];

// AST sees: valid return statement
// CodeSentinel sees: silent failure hiding
if (error) { return null; } // error case
```

### What Each Approach Detects

| Issue Type | AST/Tree-sitter | CodeSentinel |
|:-----------|:----------------|:-------------|
| Syntax errors | Yes | No (not our goal) |
| Missing semicolons | Yes | No |
| Unused variables | Yes | No |
| **Empty catch blocks** | Partially | Yes |
| **Silent error returns** | No | Yes |
| **Fake success responses** | No | Yes |
| **TODO/placeholder code** | No | Yes |
| **Error-masking fallbacks** | No | Yes |
| **Hardcoded secrets** | Limited | Yes |
| **Deceptive comments** | No | Yes |

### The Real Issue: Agent Behavior

AI coding agents produce code that **looks correct** but contains subtle deceptions:

1. **"Making the error go away"** - Empty catches, silent returns, swallowed exceptions
2. **Placeholder implementations** - `return true`, `return []`, TODO comments
3. **False confidence patterns** - `|| []` fallbacks that mask fetch failures
4. **Suppression abuse** - `@ts-ignore`, `eslint-disable` to hide type errors

These patterns pass every linter and compile successfully. AST tools see valid structure. Only pattern-based detection catches the **semantic intent** behind the code.

### When to Use What

| Tool | Use For |
|:-----|:--------|
| ESLint/TSLint | Style consistency, syntax rules, unused code |
| Tree-sitter | Syntax highlighting, code navigation, refactoring |
| TypeScript | Type safety, compile-time errors |
| **CodeSentinel** | Agent-generated deceptions, error hiding, incomplete implementations |

CodeSentinel complements these tools - it catches what they structurally cannot.

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
git clone https://github.com/salrad22/code-sentinel.git
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

## Remote Server (Cloudflare Workers)

CodeSentinel is also available as a remote MCP server on Cloudflare Workers. **No local installation required!**

### Quick connect (Claude Code)

```bash
claude mcp add-remote code-sentinel https://code-sentinel-mcp.sharara.dev/sse
```

Or use the Streamable HTTP endpoint (recommended for newer clients):
```bash
claude mcp add --transport http code-sentinel https://code-sentinel-mcp.sharara.dev/mcp
```

### Endpoints

| Endpoint | Protocol | Description |
|:---------|:---------|:------------|
| `https://code-sentinel-mcp.sharara.dev/mcp` | Streamable HTTP | Recommended |
| `https://code-sentinel-mcp.sharara.dev/sse` | Server-Sent Events | Legacy support |
| `https://code-sentinel-mcp.sharara.dev/` | HTTP GET | Health check / server info |

### Self-hosting on Cloudflare

Deploy your own instance:

```bash
cd cloudflare
npm install
npm run dev      # Local development at localhost:8787
npm run deploy   # Deploy to your Cloudflare account
```

**Requirements:**
- Cloudflare account (free tier works)
- Wrangler CLI (`npm install -g wrangler`)
- `wrangler login` to authenticate

The server uses Durable Objects for persistent MCP connections. No database required.

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

CodeSentinel uses a **data-driven pattern system** that separates pattern definitions from regex generation. This makes adding new patterns easier and more maintainable.

### Project Structure

```
src/
├── patterns/
│   ├── types.ts           # Type definitions for pattern configs
│   ├── builders.ts        # Functions that generate regex from configs
│   ├── compiler.ts        # Compiles definitions to executable patterns
│   └── definitions/
│       ├── security.ts    # Security vulnerability patterns
│       ├── deceptive.ts   # Error-hiding patterns
│       ├── placeholders.ts # Incomplete code patterns
│       ├── errors.ts      # Code smell patterns
│       └── index.ts       # Exports all definitions
├── analyzers/
│   ├── core.ts            # Unified analyzer using compiled patterns
│   ├── security.ts        # Security analyzer (delegates to core)
│   ├── deceptive.ts       # Deceptive analyzer (delegates to core)
│   ├── placeholders.ts    # Placeholder analyzer (delegates to core)
│   ├── errors.ts          # Error analyzer (delegates to core)
│   └── strengths.ts       # Strength analyzer
└── index.ts               # MCP server entry point
```

### Adding a New Pattern

Instead of writing regex manually, you define **what** to detect and the system generates the regex:

```typescript
// Old approach (manual regex)
{
  id: 'CS-DEC001',
  pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,  // Error-prone
  title: 'Empty Catch Block',
  // ...
}

// New approach (data-driven)
{
  id: 'CS-DEC001',
  title: 'Empty Catch Block',
  description: 'Silently swallowing errors makes debugging impossible.',
  severity: 'high',
  category: 'deceptive',
  suggestion: 'At minimum, log the error. Better: handle it appropriately.',
  match: {
    type: 'catch_handler',
    behavior: 'empty'
  }
}
```

### Available Match Types

| Match Type | Description | Example Config |
|:-----------|:------------|:---------------|
| `empty_block` | Empty catch/finally/promise blocks | `{ type: 'empty_block', constructs: ['catch', '.catch'] }` |
| `function_call` | Function/method calls | `{ type: 'function_call', names: ['eval', 'exec'] }` |
| `returns_only` | Return statements with specific values | `{ type: 'returns_only', values: ['null', '[]', '{}'] }` |
| `contains_text` | Text in comments/strings | `{ type: 'contains_text', terms: ['TODO', 'FIXME'], context: 'comment' }` |
| `fallback_value` | Fallback patterns | `{ type: 'fallback_value', operators: ['\|\|'], values: ['[]'] }` |
| `catch_handler` | Catch block behaviors | `{ type: 'catch_handler', behavior: 'empty' }` |
| `promise_catch` | Promise .catch() behaviors | `{ type: 'promise_catch', behavior: 'returns_silent' }` |
| `comment_marker` | TODO/FIXME/HACK markers | `{ type: 'comment_marker', markers: ['TODO', 'FIXME'] }` |
| `string_literal` | Patterns inside strings | `{ type: 'string_literal', patterns: ['password', 'secret'] }` |
| `secret_pattern` | API keys and tokens | `{ type: 'secret_pattern', kind: 'github' }` |
| `url_pattern` | URL patterns | `{ type: 'url_pattern', protocol: 'http', excludeLocalhost: true }` |
| `suppression_comment` | Linter suppressions | `{ type: 'suppression_comment', tools: ['ts-ignore', 'eslint-disable'] }` |
| `type_cast` | Type casts | `{ type: 'type_cast', targets: ['any'] }` |
| `comparison` | Comparison operators | `{ type: 'comparison', operators: ['==', '!='] }` |
| `loop_pattern` | Loop patterns | `{ type: 'loop_pattern', kind: 'while_true' }` |
| `raw_regex` | Escape hatch for complex patterns | `{ type: 'raw_regex', pattern: 'your-regex', flags: 'gi' }` |

### Step-by-Step: Adding a Pattern

1. **Choose the category** - security, deceptive, placeholder, or error
2. **Open the definition file** - `src/patterns/definitions/<category>.ts`
3. **Add a new pattern definition** using the appropriate match type
4. **Build** - `npm run build`
5. **Test** - Use the MCP inspector to verify detection

### Pattern Definition Structure

```typescript
{
  id: string;              // Unique ID: CS-<CAT><NUM> (e.g., CS-SEC001)
  title: string;           // Short description (displayed in results)
  description: string;     // Detailed explanation of the issue
  severity: Severity;      // 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: Category;      // 'security' | 'deceptive' | 'placeholder' | 'error'
  suggestion?: string;     // How to fix the issue
  match: MatchConfig;      // What to detect (see match types above)
  verification?: {         // Optional: reduce false positives
    status: 'needs_verification' | 'confirmed';
    assumption?: string;
    confirmIf?: string;
    falsePositiveIf?: string;
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

- [GitHub Repository](https://github.com/salrad22/code-sentinel)
- [npm package](https://www.npmjs.com/package/code-sentinel-mcp)
- [Remote Server](https://code-sentinel-mcp.sharara.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code](https://claude.ai/code)
