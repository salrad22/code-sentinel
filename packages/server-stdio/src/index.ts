#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import everything from core package
import {
  analyzeSecurityIssues,
  analyzeDeceptivePatterns,
  analyzePlaceholders,
  analyzeErrors,
  analyzeStrengths,
  analyzePatterns,
  analyzeDesignPatterns,
  formatDesignAnalysis,
  inferLevelFromQuery,
  generateHtmlReport,
  getDefinitions,
  getPatternStats,
  type AnalysisResult,
  type Issue,
  type Severity,
  type PatternLevel
} from "@codesentinel/core";

// Detect language from filename
function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    'ts': 'TypeScript',
    'tsx': 'TypeScript React',
    'js': 'JavaScript',
    'jsx': 'JavaScript React',
    'py': 'Python',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'java': 'Java',
    'kt': 'Kotlin',
    'swift': 'Swift',
    'cs': 'C#',
    'cpp': 'C++',
    'c': 'C',
    'php': 'PHP',
    'vue': 'Vue',
    'svelte': 'Svelte'
  };
  return langMap[ext] || 'Unknown';
}

// Main analysis function
function analyzeCode(code: string, filename: string): AnalysisResult {
  const language = detectLanguage(filename);

  // Run all analyzers
  const securityIssues = analyzeSecurityIssues(code, filename);
  const deceptiveIssues = analyzeDeceptivePatterns(code, filename);
  const placeholderIssues = analyzePlaceholders(code, filename);
  const errorIssues = analyzeErrors(code, filename);
  const strengths = analyzeStrengths(code, filename);

  // Combine all issues
  const allIssues: Issue[] = [
    ...securityIssues,
    ...deceptiveIssues,
    ...placeholderIssues,
    ...errorIssues
  ];

  // Sort by severity
  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4
  };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Calculate summary
  const summary = {
    totalIssues: allIssues.length,
    critical: allIssues.filter(i => i.severity === 'critical').length,
    high: allIssues.filter(i => i.severity === 'high').length,
    medium: allIssues.filter(i => i.severity === 'medium').length,
    low: allIssues.filter(i => i.severity === 'low').length,
    strengths: strengths.length
  };

  return {
    filename,
    language,
    timestamp: new Date().toISOString(),
    summary,
    issues: allIssues,
    strengths
  };
}

// Create the MCP server
const server = new Server(
  {
    name: "code-sentinel",
    version: "0.2.6",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze_code",
        description: "Analyze code for security issues, errors, deceptive patterns, and placeholders. Returns a structured analysis with issues and strengths.",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "The source code to analyze" },
            filename: { type: "string", description: "The filename (used to detect language). Example: 'app.ts'" }
          },
          required: ["code", "filename"]
        },
        annotations: { title: "Full Code Analysis", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
      },
      {
        name: "generate_report",
        description: "Analyze code and generate a detailed HTML report with visual indicators for issues and strengths.",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "The source code to analyze" },
            filename: { type: "string", description: "The filename (used to detect language). Example: 'app.ts'" }
          },
          required: ["code", "filename"]
        },
        annotations: { title: "Generate HTML Report", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
      },
      {
        name: "check_security",
        description: "Check code for security vulnerabilities only (hardcoded secrets, SQL injection, XSS, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "The source code to check" },
            filename: { type: "string", description: "The filename" }
          },
          required: ["code", "filename"]
        },
        annotations: { title: "Security Vulnerability Check", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
      },
      {
        name: "check_deceptive_patterns",
        description: "Check for code patterns that hide errors or create false confidence (empty catches, silent failures, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "The source code to check" },
            filename: { type: "string", description: "The filename" }
          },
          required: ["code", "filename"]
        },
        annotations: { title: "Deceptive Pattern Check", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
      },
      {
        name: "check_placeholders",
        description: "Check for placeholder code, dummy data, TODO/FIXME comments, and incomplete implementations",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "The source code to check" },
            filename: { type: "string", description: "The filename" }
          },
          required: ["code", "filename"]
        },
        annotations: { title: "Placeholder Code Check", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
      },
      {
        name: "analyze_patterns",
        description: "Analyze code for architectural, design, and implementation patterns. Detects pattern usage, inconsistencies, and provides actionable suggestions.",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "The source code to analyze" },
            filename: { type: "string", description: "The filename (used to detect language)" },
            level: { type: "string", enum: ["architectural", "design", "code", "all"], description: "Pattern level to analyze" },
            query: { type: "string", description: "Optional natural language query to focus analysis" }
          },
          required: ["code", "filename"]
        },
        annotations: { title: "Architecture Pattern Analysis", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
      },
      {
        name: "analyze_design_patterns",
        description: "Focused analysis of Gang of Four (GoF) design patterns in code.",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "The source code to analyze" },
            filename: { type: "string", description: "The filename (used to detect language)" }
          },
          required: ["code", "filename"]
        },
        annotations: { title: "GoF Design Pattern Analysis", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args || typeof args.code !== 'string' || typeof args.filename !== 'string') {
    return { content: [{ type: "text", text: "Error: 'code' and 'filename' are required string parameters" }] };
  }

  const { code, filename } = args;

  try {
    switch (name) {
      case "analyze_code": {
        const result = analyzeCode(code, filename);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "generate_report": {
        const result = analyzeCode(code, filename);
        const html = generateHtmlReport(result);
        const score = Math.max(0, 100 - (result.summary.critical * 25 + result.summary.high * 15 + result.summary.medium * 5 + result.summary.low));
        return {
          content: [{
            type: "text",
            text: `## Analysis Summary for ${filename}\n\n**Score:** ${score}%\n\n- Critical: ${result.summary.critical}\n- High: ${result.summary.high}\n- Medium: ${result.summary.medium}\n- Low: ${result.summary.low}\n- Strengths: ${result.summary.strengths}\n\n---\n\n\`\`\`html\n${html}\n\`\`\``
          }]
        };
      }

      case "check_security": {
        const issues = analyzeSecurityIssues(code, filename);
        return {
          content: [{
            type: "text",
            text: issues.length === 0 ? "No security issues detected." : `Found ${issues.length} security issue(s):\n\n${JSON.stringify(issues, null, 2)}`
          }]
        };
      }

      case "check_deceptive_patterns": {
        const issues = analyzeDeceptivePatterns(code, filename);
        return {
          content: [{
            type: "text",
            text: issues.length === 0 ? "No deceptive patterns detected." : `Found ${issues.length} deceptive pattern(s):\n\n${JSON.stringify(issues, null, 2)}`
          }]
        };
      }

      case "check_placeholders": {
        const issues = analyzePlaceholders(code, filename);
        return {
          content: [{
            type: "text",
            text: issues.length === 0 ? "No placeholders or incomplete code detected." : `Found ${issues.length} placeholder(s):\n\n${JSON.stringify(issues, null, 2)}`
          }]
        };
      }

      case "analyze_patterns": {
        let level: PatternLevel = 'all';
        if (args.level && ['architectural', 'design', 'code', 'all'].includes(args.level as string)) {
          level = args.level as PatternLevel;
        } else if (args.query && typeof args.query === 'string') {
          const inferred = inferLevelFromQuery(args.query);
          if (inferred) level = inferred;
        }

        const patternResult = analyzePatterns(code, filename, level);
        const output = {
          summary: patternResult.summary,
          detectedPatterns: patternResult.detectedPatterns.map(p => ({
            pattern: p.name, level: p.level, confidence: p.confidence,
            description: p.description, foundAt: p.locations.map(l => `Line ${l.line}`)
          })),
          inconsistencies: patternResult.inconsistencies.map(i => ({
            issue: i.title, severity: i.severity,
            variants: i.variants.map(v => `${v.approach}: ${v.count} occurrences`),
            recommendation: i.recommendation
          })),
          suggestions: patternResult.suggestions.map(s => ({
            title: s.title, priority: s.priority,
            currentApproach: s.currentApproach.name,
            suggestedPattern: s.suggestedApproach.name,
            why: s.suggestedApproach.why,
            benefits: s.suggestedApproach.benefits,
            tradeoffs: s.suggestedApproach.tradeoffs,
            example: s.suggestedApproach.example
          })),
          actionItems: patternResult.actionItems
        };
        return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
      }

      case "analyze_design_patterns": {
        const result = analyzeDesignPatterns(code, filename);
        const formatted = formatDesignAnalysis(result);
        return { content: [{ type: "text", text: formatted }] };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error analyzing code: ${error instanceof Error ? error.message : String(error)}` }] };
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      { name: "analyze-and-report", description: "Analyze code and generate a comprehensive markdown report", arguments: [{ name: "code", description: "Source code", required: true }, { name: "filename", description: "Filename", required: true }] },
      { name: "fix-issues", description: "Generate step-by-step fix instructions for a coding agent", arguments: [{ name: "code", description: "Source code", required: true }, { name: "filename", description: "Filename", required: true }, { name: "category", description: "Category filter", required: false }] },
      { name: "security-audit", description: "Security-focused audit with remediation steps", arguments: [{ name: "code", description: "Source code", required: true }, { name: "filename", description: "Filename", required: true }] },
      { name: "pre-commit-check", description: "Quick pre-commit check for critical issues", arguments: [{ name: "code", description: "Source code", required: true }, { name: "filename", description: "Filename", required: true }] }
    ]
  };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const code = args?.code as string || '';
  const filename = args?.filename as string || 'unknown.ts';
  const category = args?.category as string || '';

  const result = analyzeCode(code, filename);
  const score = Math.max(0, 100 - (result.summary.critical * 25 + result.summary.high * 15 + result.summary.medium * 5 + result.summary.low));

  switch (name) {
    case "analyze-and-report": {
      let markdown = `# CodeSentinel Analysis Report\n\n## File: ${filename}\n## Quality Score: ${score}/100\n\n| Severity | Count |\n|:---------|:------|\n| Critical | ${result.summary.critical} |\n| High | ${result.summary.high} |\n| Medium | ${result.summary.medium} |\n| Low | ${result.summary.low} |\n\n## Issues\n\n`;
      result.issues.forEach(issue => {
        markdown += `- **[${issue.severity.toUpperCase()}] ${issue.title}** (Line ${issue.line || 'N/A'}): ${issue.description}\n`;
      });
      return { messages: [{ role: "user", content: { type: "text", text: markdown } }] };
    }

    case "fix-issues": {
      let issues = category ? result.issues.filter(i => i.category === category) : result.issues;
      let prompt = `# Fix Instructions for ${filename}\n\nTotal issues: ${issues.length}\n\n`;
      issues.forEach((issue, i) => {
        prompt += `## ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}\n- Line: ${issue.line || 'Unknown'}\n- Fix: ${issue.suggestion || issue.description}\n\n`;
      });
      return { messages: [{ role: "user", content: { type: "text", text: prompt } }] };
    }

    case "security-audit": {
      const securityIssues = result.issues.filter(i => i.category === 'security');
      let prompt = `# Security Audit: ${filename}\n\nIssues found: ${securityIssues.length}\n\n`;
      securityIssues.forEach((issue, i) => {
        prompt += `## ${i + 1}. ${issue.title}\n- Severity: ${issue.severity.toUpperCase()}\n- Line: ${issue.line}\n- Remediation: ${issue.suggestion}\n\n`;
      });
      return { messages: [{ role: "user", content: { type: "text", text: prompt } }] };
    }

    case "pre-commit-check": {
      const blocking = result.issues.filter(i => i.severity === 'critical' || i.severity === 'high');
      let prompt = blocking.length === 0
        ? `# Pre-Commit: PASS\n\nNo blocking issues. Score: ${score}/100`
        : `# Pre-Commit: FAIL\n\n${blocking.length} blocking issue(s):\n\n${blocking.map((i, n) => `${n + 1}. [${i.severity.toUpperCase()}] ${i.title}`).join('\n')}`;
      return { messages: [{ role: "user", content: { type: "text", text: prompt } }] };
    }

    default:
      return { messages: [{ role: "user", content: { type: "text", text: `Unknown prompt: ${name}` } }] };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      { uri: "codesentinel://patterns/all", name: "All Patterns", description: "Complete list of detection patterns", mimeType: "application/json", annotations: { audience: ["assistant"], priority: 0.8 } },
      { uri: "codesentinel://patterns/security", name: "Security Patterns", description: "Security vulnerability patterns", mimeType: "application/json", annotations: { audience: ["assistant"], priority: 0.9 } },
      { uri: "codesentinel://patterns/deceptive", name: "Deceptive Patterns", description: "Error-hiding code patterns", mimeType: "application/json", annotations: { audience: ["assistant"], priority: 0.9 } },
      { uri: "codesentinel://patterns/placeholder", name: "Placeholder Patterns", description: "Incomplete code patterns", mimeType: "application/json", annotations: { audience: ["assistant"], priority: 0.7 } },
      { uri: "codesentinel://patterns/error", name: "Error Patterns", description: "Code smell patterns", mimeType: "application/json", annotations: { audience: ["assistant"], priority: 0.8 } },
      { uri: "codesentinel://stats", name: "Pattern Statistics", description: "Pattern stats by category", mimeType: "application/json", annotations: { audience: ["user", "assistant"], priority: 0.5 } },
      { uri: "codesentinel://guide/categories", name: "Category Guide", description: "Category explanations", mimeType: "text/markdown", annotations: { audience: ["user"], priority: 0.6 } }
    ]
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri.startsWith("codesentinel://pattern/")) {
    const patternId = uri.replace("codesentinel://pattern/", "");
    const allPatterns = getDefinitions();
    const pattern = allPatterns.find(p => p.id === patternId);
    if (!pattern) {
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: `Pattern not found: ${patternId}` }) }] };
    }
    return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ id: pattern.id, title: pattern.title, description: pattern.description, severity: pattern.severity, category: pattern.category, suggestion: pattern.suggestion, matchType: pattern.match.type }, null, 2) }] };
  }

  if (uri === "codesentinel://patterns/all") {
    const patterns = getDefinitions().map(p => ({ id: p.id, title: p.title, severity: p.severity, category: p.category, description: p.description }));
    return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(patterns, null, 2) }] };
  }

  if (uri.startsWith("codesentinel://patterns/")) {
    const category = uri.replace("codesentinel://patterns/", "") as 'security' | 'deceptive' | 'placeholder' | 'error';
    const patterns = getDefinitions(category).map(p => ({ id: p.id, title: p.title, severity: p.severity, description: p.description, suggestion: p.suggestion }));
    return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(patterns, null, 2) }] };
  }

  if (uri === "codesentinel://stats") {
    return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(getPatternStats(), null, 2) }] };
  }

  if (uri === "codesentinel://guide/categories") {
    const guide = `# CodeSentinel Pattern Categories\n\n## Security (CS-SEC)\nHardcoded secrets, SQL injection, XSS, insecure crypto.\n\n## Deceptive (CS-DEC)\nEmpty catches, silent failures, error-hiding fallbacks.\n\n## Placeholder (CS-PH)\nTODO comments, lorem ipsum, test data, debug logs.\n\n## Error (CS-ERR)\nLoose equality, null refs, async anti-patterns.`;
    return { contents: [{ uri, mimeType: "text/markdown", text: guide }] };
  }

  return { contents: [{ uri, mimeType: "text/plain", text: `Unknown resource: ${uri}` }] };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CodeSentinel MCP Server running on stdio");
}

main().catch(console.error);
