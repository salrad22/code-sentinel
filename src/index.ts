#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { analyzeSecurityIssues } from './analyzers/security.js';
import { analyzeDeceptivePatterns } from './analyzers/deceptive.js';
import { analyzePlaceholders } from './analyzers/placeholders.js';
import { analyzeErrors } from './analyzers/errors.js';
import { analyzeStrengths } from './analyzers/strengths.js';
import { analyzePatterns, inferLevelFromQuery, PatternLevel } from './analyzers/patterns.js';
import { analyzeDesignPatterns, formatDesignAnalysis } from './analyzers/patterns.js';
import { generateHtmlReport } from './report.js';
import { AnalysisResult, Issue, Severity } from './types.js';

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
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
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
            code: {
              type: "string",
              description: "The source code to analyze"
            },
            filename: {
              type: "string",
              description: "The filename (used to detect language). Example: 'app.ts'"
            }
          },
          required: ["code", "filename"]
        }
      },
      {
        name: "generate_report",
        description: "Analyze code and generate a detailed HTML report with visual indicators for issues and strengths.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The source code to analyze"
            },
            filename: {
              type: "string",
              description: "The filename (used to detect language). Example: 'app.ts'"
            }
          },
          required: ["code", "filename"]
        }
      },
      {
        name: "check_security",
        description: "Check code for security vulnerabilities only (hardcoded secrets, SQL injection, XSS, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The source code to check"
            },
            filename: {
              type: "string",
              description: "The filename"
            }
          },
          required: ["code", "filename"]
        }
      },
      {
        name: "check_deceptive_patterns",
        description: "Check for code patterns that hide errors or create false confidence (empty catches, silent failures, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The source code to check"
            },
            filename: {
              type: "string",
              description: "The filename"
            }
          },
          required: ["code", "filename"]
        }
      },
      {
        name: "check_placeholders",
        description: "Check for placeholder code, dummy data, TODO/FIXME comments, and incomplete implementations",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The source code to check"
            },
            filename: {
              type: "string",
              description: "The filename"
            }
          },
          required: ["code", "filename"]
        }
      },
      {
        name: "analyze_patterns",
        description: "Analyze code for architectural, design, and implementation patterns. Detects pattern usage, inconsistencies, and provides actionable suggestions for improvement. Returns LLM-optimized JSON with action items.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The source code to analyze"
            },
            filename: {
              type: "string",
              description: "The filename (used to detect language)"
            },
            level: {
              type: "string",
              enum: ["architectural", "design", "code", "all"],
              description: "Pattern level to analyze: 'architectural' (system structure), 'design' (GoF patterns), 'code' (implementation idioms), or 'all' (default)"
            },
            query: {
              type: "string",
              description: "Optional natural language query to focus analysis (e.g., 'how is error handling done?')"
            }
          },
          required: ["code", "filename"]
        }
      },
      {
        name: "analyze_design_patterns",
        description: "Focused analysis of Gang of Four (GoF) design patterns in code. Detects Singleton, Factory, Observer, Strategy, and other classic patterns with confidence levels and implementation details.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The source code to analyze"
            },
            filename: {
              type: "string",
              description: "The filename (used to detect language)"
            }
          },
          required: ["code", "filename"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args || typeof args.code !== 'string' || typeof args.filename !== 'string') {
    return {
      content: [
        {
          type: "text",
          text: "Error: 'code' and 'filename' are required string parameters"
        }
      ]
    };
  }

  const { code, filename } = args;

  try {
    switch (name) {
      case "analyze_code": {
        const result = analyzeCode(code, filename);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "generate_report": {
        const result = analyzeCode(code, filename);
        const html = generateHtmlReport(result);
        return {
          content: [
            {
              type: "text",
              text: `## Analysis Summary for ${filename}\n\n` +
                `**Score:** ${Math.max(0, 100 - (result.summary.critical * 25 + result.summary.high * 15 + result.summary.medium * 5 + result.summary.low))}%\n\n` +
                `- 🔴 Critical: ${result.summary.critical}\n` +
                `- 🟠 High: ${result.summary.high}\n` +
                `- 🟡 Medium: ${result.summary.medium}\n` +
                `- 🔵 Low: ${result.summary.low}\n` +
                `- 💪 Strengths: ${result.summary.strengths}\n\n` +
                `---\n\n` +
                `\`\`\`html\n${html}\n\`\`\``
            }
          ]
        };
      }

      case "check_security": {
        const issues = analyzeSecurityIssues(code, filename);
        return {
          content: [
            {
              type: "text",
              text: issues.length === 0 
                ? "✅ No security issues detected."
                : `Found ${issues.length} security issue(s):\n\n${JSON.stringify(issues, null, 2)}`
            }
          ]
        };
      }

      case "check_deceptive_patterns": {
        const issues = analyzeDeceptivePatterns(code, filename);
        return {
          content: [
            {
              type: "text",
              text: issues.length === 0 
                ? "✅ No deceptive patterns detected."
                : `Found ${issues.length} deceptive pattern(s):\n\n${JSON.stringify(issues, null, 2)}`
            }
          ]
        };
      }

      case "check_placeholders": {
        const issues = analyzePlaceholders(code, filename);
        return {
          content: [
            {
              type: "text",
              text: issues.length === 0 
                ? "✅ No placeholders or incomplete code detected."
                : `Found ${issues.length} placeholder(s):\n\n${JSON.stringify(issues, null, 2)}`
            }
          ]
        };
      }
      
      case "analyze_patterns": {
        // Determine level from explicit param or infer from query
        let level: PatternLevel = 'all';
        
        if (args.level && ['architectural', 'design', 'code', 'all'].includes(args.level as string)) {
          level = args.level as PatternLevel;
        } else if (args.query && typeof args.query === 'string') {
          const inferred = inferLevelFromQuery(args.query);
          if (inferred) level = inferred;
        }

        const patternResult = analyzePatterns(code, filename, level);
        
        // Format output optimized for LLM action
        const output = {
          // Summary for quick understanding
          summary: patternResult.summary,
          
          // What patterns were detected
          detectedPatterns: patternResult.detectedPatterns.map(p => ({
            pattern: p.name,
            level: p.level,
            confidence: p.confidence,
            description: p.description,
            foundAt: p.locations.map(l => `Line ${l.line}`)
          })),
          
          // Inconsistencies that should be fixed
          inconsistencies: patternResult.inconsistencies.map(i => ({
            issue: i.title,
            severity: i.severity,
            variants: i.variants.map(v => `${v.approach}: ${v.count} occurrences`),
            recommendation: i.recommendation
          })),
          
          // Suggestions for improvement
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
          
          // Ready-to-execute action items for LLM
          actionItems: patternResult.actionItems
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(output, null, 2)
            }
          ]
        };
      }

      case "analyze_design_patterns": {
        const result = analyzeDesignPatterns(code, filename);
        const formatted = formatDesignAnalysis(result);
        return {
          content: [
            {
              type: "text",
              text: formatted
            }
          ]
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`
            }
          ]
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error analyzing code: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
});
// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CodeSentinel MCP Server running on stdio");
}

main().catch(console.error);
