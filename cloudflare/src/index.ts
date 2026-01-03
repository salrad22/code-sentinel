import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { analyzeSecurityIssues } from './analyzers/security.js';
import { analyzeDeceptivePatterns } from './analyzers/deceptive.js';
import { analyzePlaceholders } from './analyzers/placeholders.js';
import { analyzeErrors } from './analyzers/errors.js';
import { analyzeStrengths } from './analyzers/strengths.js';
import { analyzePatterns, inferLevelFromQuery, analyzeDesignPatterns, formatDesignAnalysis } from './analyzers/patterns.js';
import type { PatternLevel } from './analyzers/patterns.js';
import { generateHtmlReport } from './report.js';
import type { AnalysisResult, Issue, Severity } from './types.js';

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

// Environment bindings
interface Env {
  MCP_OBJECT: DurableObjectNamespace;
}

// CodeSentinel MCP Agent
export class CodeSentinelMCP extends McpAgent<Env, {}, {}> {
  server = new McpServer({
    name: "code-sentinel",
    version: "0.2.6",
  });

  async init() {
    // Tool: analyze_code
    this.server.tool(
      "analyze_code",
      "Analyze code for security issues, errors, deceptive patterns, and placeholders. Returns a structured analysis with issues and strengths.",
      {
        code: z.string().describe("The source code to analyze"),
        filename: z.string().describe("The filename (used to detect language). Example: 'app.ts'")
      },
      async ({ code, filename }) => {
        const result = analyzeCode(code, filename);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }]
        };
      }
    );

    // Tool: generate_report
    this.server.tool(
      "generate_report",
      "Analyze code and generate a detailed HTML report with visual indicators for issues and strengths.",
      {
        code: z.string().describe("The source code to analyze"),
        filename: z.string().describe("The filename (used to detect language). Example: 'app.ts'")
      },
      async ({ code, filename }) => {
        const result = analyzeCode(code, filename);
        const html = generateHtmlReport(result);
        const score = Math.max(0, 100 - (result.summary.critical * 25 + result.summary.high * 15 + result.summary.medium * 5 + result.summary.low));
        return {
          content: [{
            type: "text" as const,
            text: `## Analysis Summary for ${filename}\n\n` +
              `**Score:** ${score}%\n\n` +
              `- Critical: ${result.summary.critical}\n` +
              `- High: ${result.summary.high}\n` +
              `- Medium: ${result.summary.medium}\n` +
              `- Low: ${result.summary.low}\n` +
              `- Strengths: ${result.summary.strengths}\n\n` +
              `---\n\n` +
              `\`\`\`html\n${html}\n\`\`\``
          }]
        };
      }
    );

    // Tool: check_security
    this.server.tool(
      "check_security",
      "Check code for security vulnerabilities only (hardcoded secrets, SQL injection, XSS, etc.)",
      {
        code: z.string().describe("The source code to check"),
        filename: z.string().describe("The filename")
      },
      async ({ code, filename }) => {
        const issues = analyzeSecurityIssues(code, filename);
        return {
          content: [{
            type: "text" as const,
            text: issues.length === 0
              ? "No security issues detected."
              : `Found ${issues.length} security issue(s):\n\n${JSON.stringify(issues, null, 2)}`
          }]
        };
      }
    );

    // Tool: check_deceptive_patterns
    this.server.tool(
      "check_deceptive_patterns",
      "Check for code patterns that hide errors or create false confidence (empty catches, silent failures, etc.)",
      {
        code: z.string().describe("The source code to check"),
        filename: z.string().describe("The filename")
      },
      async ({ code, filename }) => {
        const issues = analyzeDeceptivePatterns(code, filename);
        return {
          content: [{
            type: "text" as const,
            text: issues.length === 0
              ? "No deceptive patterns detected."
              : `Found ${issues.length} deceptive pattern(s):\n\n${JSON.stringify(issues, null, 2)}`
          }]
        };
      }
    );

    // Tool: check_placeholders
    this.server.tool(
      "check_placeholders",
      "Check for placeholder code, dummy data, TODO/FIXME comments, and incomplete implementations",
      {
        code: z.string().describe("The source code to check"),
        filename: z.string().describe("The filename")
      },
      async ({ code, filename }) => {
        const issues = analyzePlaceholders(code, filename);
        return {
          content: [{
            type: "text" as const,
            text: issues.length === 0
              ? "No placeholders or incomplete code detected."
              : `Found ${issues.length} placeholder(s):\n\n${JSON.stringify(issues, null, 2)}`
          }]
        };
      }
    );

    // Tool: analyze_patterns
    this.server.tool(
      "analyze_patterns",
      "Analyze code for architectural, design, and implementation patterns. Detects pattern usage, inconsistencies, and provides actionable suggestions for improvement.",
      {
        code: z.string().describe("The source code to analyze"),
        filename: z.string().describe("The filename (used to detect language)"),
        level: z.enum(["architectural", "design", "code", "all"]).optional().describe("Pattern level to analyze: 'architectural' (system structure), 'design' (GoF patterns), 'code' (implementation idioms), or 'all' (default)"),
        query: z.string().optional().describe("Optional natural language query to focus analysis (e.g., 'how is error handling done?')")
      },
      async ({ code, filename, level, query }) => {
        // Determine level from explicit param or infer from query
        let analysisLevel: PatternLevel = 'all';

        if (level && ['architectural', 'design', 'code', 'all'].includes(level)) {
          analysisLevel = level as PatternLevel;
        } else if (query) {
          const inferred = inferLevelFromQuery(query);
          if (inferred) analysisLevel = inferred;
        }

        const patternResult = analyzePatterns(code, filename, analysisLevel);

        // Format output optimized for LLM action
        const output = {
          summary: patternResult.summary,
          detectedPatterns: patternResult.detectedPatterns.map(p => ({
            pattern: p.name,
            level: p.level,
            confidence: p.confidence,
            description: p.description,
            foundAt: p.locations.map(l => `Line ${l.line}`)
          })),
          inconsistencies: patternResult.inconsistencies.map(i => ({
            issue: i.title,
            severity: i.severity,
            variants: i.variants.map(v => `${v.approach}: ${v.count} occurrences`),
            recommendation: i.recommendation
          })),
          suggestions: patternResult.suggestions.map(s => ({
            title: s.title,
            priority: s.priority,
            currentApproach: s.currentApproach.name,
            suggestedPattern: s.suggestedApproach.name,
            why: s.suggestedApproach.why,
            benefits: s.suggestedApproach.benefits,
            tradeoffs: s.suggestedApproach.tradeoffs,
            example: s.suggestedApproach.example
          })),
          actionItems: patternResult.actionItems
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }]
        };
      }
    );

    // Tool: analyze_design_patterns
    this.server.tool(
      "analyze_design_patterns",
      "Focused analysis of Gang of Four (GoF) design patterns in code. Detects Singleton, Factory, Observer, Strategy, and other classic patterns with confidence levels and implementation details.",
      {
        code: z.string().describe("The source code to analyze"),
        filename: z.string().describe("The filename (used to detect language)")
      },
      async ({ code, filename }) => {
        const result = analyzeDesignPatterns(code, filename);
        const formatted = formatDesignAnalysis(result);
        return {
          content: [{ type: "text" as const, text: formatted }]
        };
      }
    );
  }
}

// Export the Durable Object
export { CodeSentinelMCP as MCP_OBJECT };

// Default export with fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle SSE transport (legacy)
    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return CodeSentinelMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    // Handle Streamable HTTP transport (recommended)
    if (url.pathname === "/mcp") {
      return CodeSentinelMCP.serve("/mcp").fetch(request, env, ctx);
    }

    // Health check / info page
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(JSON.stringify({
        name: "code-sentinel",
        version: "0.2.6",
        description: "MCP server for code quality analysis",
        endpoints: {
          mcp: "/mcp (Streamable HTTP - recommended)",
          sse: "/sse (Server-Sent Events - legacy)"
        },
        tools: [
          "analyze_code",
          "generate_report",
          "check_security",
          "check_deceptive_patterns",
          "check_placeholders",
          "analyze_patterns",
          "analyze_design_patterns"
        ],
        docs: "https://github.com/salrad22/code-sentinel"
      }, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
