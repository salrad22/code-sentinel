#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { analyzeSecurityIssues } from './analyzers/security.js';
import { analyzeDeceptivePatterns } from './analyzers/deceptive.js';
import { analyzePlaceholders } from './analyzers/placeholders.js';
import { analyzeErrors } from './analyzers/errors.js';
import { analyzeStrengths } from './analyzers/strengths.js';
import { analyzePatterns, inferLevelFromQuery } from './analyzers/patterns.js';
import { analyzeDesignPatterns, formatDesignAnalysis } from './analyzers/patterns.js';
import { generateHtmlReport } from './report.js';
import { getDefinitions, getPatternStats } from './patterns/index.js';
// Detect language from filename
function detectLanguage(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const langMap = {
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
function analyzeCode(code, filename) {
    const language = detectLanguage(filename);
    // Run all analyzers
    const securityIssues = analyzeSecurityIssues(code, filename);
    const deceptiveIssues = analyzeDeceptivePatterns(code, filename);
    const placeholderIssues = analyzePlaceholders(code, filename);
    const errorIssues = analyzeErrors(code, filename);
    const strengths = analyzeStrengths(code, filename);
    // Combine all issues
    const allIssues = [
        ...securityIssues,
        ...deceptiveIssues,
        ...placeholderIssues,
        ...errorIssues
    ];
    // Sort by severity
    const severityOrder = {
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
const server = new Server({
    name: "code-sentinel",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
        prompts: {},
        resources: {},
    },
});
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
                let level = 'all';
                if (args.level && ['architectural', 'design', 'code', 'all'].includes(args.level)) {
                    level = args.level;
                }
                else if (args.query && typeof args.query === 'string') {
                    const inferred = inferLevelFromQuery(args.query);
                    if (inferred)
                        level = inferred;
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
    }
    catch (error) {
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
// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: "analyze-and-report",
                description: "Analyze code and generate a comprehensive markdown report with actionable items for fixing issues",
                arguments: [
                    {
                        name: "code",
                        description: "The source code to analyze",
                        required: true
                    },
                    {
                        name: "filename",
                        description: "The filename for language detection (e.g., 'app.ts')",
                        required: true
                    }
                ]
            },
            {
                name: "fix-issues",
                description: "Analyze code and generate step-by-step fix instructions that a coding agent can execute",
                arguments: [
                    {
                        name: "code",
                        description: "The source code to analyze",
                        required: true
                    },
                    {
                        name: "filename",
                        description: "The filename for language detection (e.g., 'app.ts')",
                        required: true
                    },
                    {
                        name: "category",
                        description: "Optional: Focus on specific category (security, deceptive, placeholder, error)",
                        required: false
                    }
                ]
            },
            {
                name: "security-audit",
                description: "Perform a security-focused audit with remediation steps",
                arguments: [
                    {
                        name: "code",
                        description: "The source code to audit",
                        required: true
                    },
                    {
                        name: "filename",
                        description: "The filename for language detection",
                        required: true
                    }
                ]
            },
            {
                name: "pre-commit-check",
                description: "Quick analysis suitable for pre-commit hooks - focuses on critical and high severity issues",
                arguments: [
                    {
                        name: "code",
                        description: "The source code to check",
                        required: true
                    },
                    {
                        name: "filename",
                        description: "The filename for language detection",
                        required: true
                    }
                ]
            }
        ]
    };
});
// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const code = args?.code || '';
    const filename = args?.filename || 'unknown.ts';
    const category = args?.category || '';
    // Run analysis
    const result = analyzeCode(code, filename);
    const score = Math.max(0, 100 - (result.summary.critical * 25 + result.summary.high * 15 + result.summary.medium * 5 + result.summary.low));
    switch (name) {
        case "analyze-and-report": {
            const issuesByCategory = {
                critical: result.issues.filter(i => i.severity === 'critical'),
                high: result.issues.filter(i => i.severity === 'high'),
                medium: result.issues.filter(i => i.severity === 'medium'),
                low: result.issues.filter(i => i.severity === 'low')
            };
            let markdown = `# CodeSentinel Analysis Report

## File: ${filename}
## Language: ${result.language}
## Quality Score: ${score}/100

---

## Summary

| Severity | Count |
|:---------|:------|
| Critical | ${result.summary.critical} |
| High | ${result.summary.high} |
| Medium | ${result.summary.medium} |
| Low | ${result.summary.low} |
| **Strengths** | ${result.summary.strengths} |

---

## Issues Found

`;
            if (issuesByCategory.critical.length > 0) {
                markdown += `### Critical Issues (Fix Immediately)\n\n`;
                issuesByCategory.critical.forEach(issue => {
                    markdown += `- **[${issue.id}] ${issue.title}** (Line ${issue.line || 'N/A'})\n`;
                    markdown += `  - ${issue.description}\n`;
                    markdown += `  - **Fix:** ${issue.suggestion || 'Review and fix manually'}\n`;
                    if (issue.code)
                        markdown += `  - Code: \`${issue.code}\`\n`;
                    markdown += `\n`;
                });
            }
            if (issuesByCategory.high.length > 0) {
                markdown += `### High Priority Issues\n\n`;
                issuesByCategory.high.forEach(issue => {
                    markdown += `- **[${issue.id}] ${issue.title}** (Line ${issue.line || 'N/A'})\n`;
                    markdown += `  - ${issue.description}\n`;
                    markdown += `  - **Fix:** ${issue.suggestion || 'Review and fix manually'}\n`;
                    markdown += `\n`;
                });
            }
            if (issuesByCategory.medium.length > 0) {
                markdown += `### Medium Priority Issues\n\n`;
                issuesByCategory.medium.forEach(issue => {
                    markdown += `- **[${issue.id}] ${issue.title}** (Line ${issue.line || 'N/A'})\n`;
                    markdown += `  - ${issue.description}\n`;
                    markdown += `  - **Fix:** ${issue.suggestion || 'Review and fix manually'}\n`;
                    markdown += `\n`;
                });
            }
            if (issuesByCategory.low.length > 0) {
                markdown += `### Low Priority Issues\n\n`;
                issuesByCategory.low.forEach(issue => {
                    markdown += `- **[${issue.id}] ${issue.title}** (Line ${issue.line || 'N/A'})\n`;
                    markdown += `  - ${issue.description}\n`;
                    markdown += `\n`;
                });
            }
            if (result.strengths.length > 0) {
                markdown += `---\n\n## Strengths Detected\n\n`;
                result.strengths.forEach(s => {
                    markdown += `- **${s.title}**: ${s.description}\n`;
                });
            }
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: markdown
                        }
                    }
                ]
            };
        }
        case "fix-issues": {
            let issues = result.issues;
            // Filter by category if specified
            if (category) {
                issues = issues.filter(i => i.category === category);
            }
            // Focus on critical and high first
            const priorityIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
            const otherIssues = issues.filter(i => i.severity !== 'critical' && i.severity !== 'high');
            let prompt = `# Code Fix Instructions for ${filename}

You are a coding agent. The following issues were detected in the code. Fix them in order of priority.

## Analysis Summary
- Total issues: ${issues.length}
- Critical: ${issues.filter(i => i.severity === 'critical').length}
- High: ${issues.filter(i => i.severity === 'high').length}
- Medium: ${issues.filter(i => i.severity === 'medium').length}
- Low: ${issues.filter(i => i.severity === 'low').length}

---

## Priority Fixes (Do These First)

`;
            priorityIssues.forEach((issue, index) => {
                prompt += `### Fix ${index + 1}: ${issue.title}
- **ID:** ${issue.id}
- **Severity:** ${issue.severity.toUpperCase()}
- **Line:** ${issue.line || 'Unknown'}
- **Problem:** ${issue.description}
- **Current Code:** \`${issue.code || 'N/A'}\`
- **Action Required:** ${issue.suggestion || 'Fix this issue'}

`;
            });
            if (otherIssues.length > 0) {
                prompt += `---

## Additional Fixes (Lower Priority)

`;
                otherIssues.forEach((issue, index) => {
                    prompt += `### ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}
- Line ${issue.line || 'Unknown'}: ${issue.description}
- Fix: ${issue.suggestion || 'Review and fix'}

`;
                });
            }
            prompt += `---

## Instructions for Agent

1. Read each issue carefully
2. Locate the line in the code
3. Apply the suggested fix
4. Verify the fix doesn't break other functionality
5. Move to the next issue

After fixing all issues, run CodeSentinel analysis again to verify fixes.
`;
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: prompt
                        }
                    }
                ]
            };
        }
        case "security-audit": {
            const securityIssues = result.issues.filter(i => i.category === 'security');
            let prompt = `# Security Audit Report: ${filename}

## Overview
- Security issues found: ${securityIssues.length}
- Critical: ${securityIssues.filter(i => i.severity === 'critical').length}
- High: ${securityIssues.filter(i => i.severity === 'high').length}
- Medium: ${securityIssues.filter(i => i.severity === 'medium').length}

`;
            if (securityIssues.length === 0) {
                prompt += `No security vulnerabilities detected. However, this automated scan may not catch all issues. Manual security review is recommended for sensitive code.
`;
            }
            else {
                prompt += `## Vulnerabilities Found

`;
                securityIssues.forEach((issue, index) => {
                    prompt += `### ${index + 1}. ${issue.title}
- **Severity:** ${issue.severity.toUpperCase()}
- **ID:** ${issue.id}
- **Line:** ${issue.line || 'Unknown'}
- **Description:** ${issue.description}
- **Vulnerable Code:** \`${issue.code || 'N/A'}\`
- **Remediation:** ${issue.suggestion || 'Fix immediately'}
`;
                    if (issue.verification) {
                        prompt += `- **Verification:** ${issue.verification.instruction || 'Manual verification required'}
`;
                    }
                    prompt += `\n`;
                });
                prompt += `## Remediation Priority

1. Fix all CRITICAL issues immediately - these may be actively exploitable
2. Address HIGH severity issues before deployment
3. Review MEDIUM issues in next sprint
4. LOW issues can be addressed as technical debt

## Next Steps

1. Fix issues in order of severity
2. Re-run security audit after fixes
3. Consider additional security testing (penetration testing, SAST/DAST)
`;
            }
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: prompt
                        }
                    }
                ]
            };
        }
        case "pre-commit-check": {
            const blockingIssues = result.issues.filter(i => i.severity === 'critical' || i.severity === 'high');
            let prompt = `# Pre-Commit Check: ${filename}

`;
            if (blockingIssues.length === 0) {
                prompt += `## PASS

No critical or high-severity issues detected. Safe to commit.

**Score:** ${score}/100
`;
            }
            else {
                prompt += `## FAIL - ${blockingIssues.length} blocking issue(s)

The following issues must be fixed before committing:

`;
                blockingIssues.forEach((issue, index) => {
                    prompt += `${index + 1}. **[${issue.severity.toUpperCase()}]** ${issue.title} (Line ${issue.line || '?'})
   - ${issue.suggestion || issue.description}
`;
                });
                prompt += `
---

Fix these issues and run the check again.
`;
            }
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: prompt
                        }
                    }
                ]
            };
        }
        default:
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Unknown prompt: ${name}`
                        }
                    }
                ]
            };
    }
});
// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "codesentinel://patterns/all",
                name: "All Patterns",
                description: "Complete list of all CodeSentinel detection patterns",
                mimeType: "application/json"
            },
            {
                uri: "codesentinel://patterns/security",
                name: "Security Patterns",
                description: "Patterns for detecting security vulnerabilities (hardcoded secrets, SQL injection, XSS, etc.)",
                mimeType: "application/json"
            },
            {
                uri: "codesentinel://patterns/deceptive",
                name: "Deceptive Patterns",
                description: "Patterns for detecting error-hiding code (empty catches, silent failures, fake success)",
                mimeType: "application/json"
            },
            {
                uri: "codesentinel://patterns/placeholder",
                name: "Placeholder Patterns",
                description: "Patterns for detecting incomplete code (TODO, FIXME, dummy data, test values)",
                mimeType: "application/json"
            },
            {
                uri: "codesentinel://patterns/error",
                name: "Error Patterns",
                description: "Patterns for detecting code smells and potential bugs (loose equality, null refs, async issues)",
                mimeType: "application/json"
            },
            {
                uri: "codesentinel://stats",
                name: "Pattern Statistics",
                description: "Statistics about available patterns by category and severity",
                mimeType: "application/json"
            },
            {
                uri: "codesentinel://guide/categories",
                name: "Category Guide",
                description: "Explanation of each pattern category and when issues are detected",
                mimeType: "text/markdown"
            }
        ]
    };
});
// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    // Pattern by ID: codesentinel://pattern/CS-SEC001
    if (uri.startsWith("codesentinel://pattern/")) {
        const patternId = uri.replace("codesentinel://pattern/", "");
        const allPatterns = getDefinitions();
        const pattern = allPatterns.find(p => p.id === patternId);
        if (!pattern) {
            return {
                contents: [
                    {
                        uri,
                        mimeType: "application/json",
                        text: JSON.stringify({ error: `Pattern not found: ${patternId}` })
                    }
                ]
            };
        }
        return {
            contents: [
                {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify({
                        id: pattern.id,
                        title: pattern.title,
                        description: pattern.description,
                        severity: pattern.severity,
                        category: pattern.category,
                        suggestion: pattern.suggestion,
                        matchType: pattern.match.type
                    }, null, 2)
                }
            ]
        };
    }
    // All patterns
    if (uri === "codesentinel://patterns/all") {
        const allPatterns = getDefinitions();
        const simplified = allPatterns.map(p => ({
            id: p.id,
            title: p.title,
            severity: p.severity,
            category: p.category,
            description: p.description
        }));
        return {
            contents: [
                {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(simplified, null, 2)
                }
            ]
        };
    }
    // Patterns by category
    if (uri.startsWith("codesentinel://patterns/")) {
        const category = uri.replace("codesentinel://patterns/", "");
        const patterns = getDefinitions(category);
        const simplified = patterns.map(p => ({
            id: p.id,
            title: p.title,
            severity: p.severity,
            description: p.description,
            suggestion: p.suggestion
        }));
        return {
            contents: [
                {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(simplified, null, 2)
                }
            ]
        };
    }
    // Stats
    if (uri === "codesentinel://stats") {
        const stats = getPatternStats();
        return {
            contents: [
                {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(stats, null, 2)
                }
            ]
        };
    }
    // Category guide
    if (uri === "codesentinel://guide/categories") {
        const guide = `# CodeSentinel Pattern Categories

## Security (CS-SEC)
Detects vulnerabilities that could be exploited by attackers:
- Hardcoded secrets (API keys, passwords, tokens)
- SQL injection via string concatenation
- XSS via innerHTML or dangerouslySetInnerHTML
- Insecure cryptography (MD5, SHA1)
- Disabled SSL validation
- Wildcard CORS origins

**Severity:** Mostly Critical and High
**Action:** Fix immediately before deployment

---

## Deceptive (CS-DEC)
Detects code that hides errors or creates false confidence:
- Empty catch blocks that swallow errors
- Silent promise rejections
- Fallback values that mask failures (\`|| []\`, \`?? {}\`)
- Excessive optional chaining
- Fake success responses
- Linter/type suppression (\`@ts-ignore\`, \`eslint-disable\`)

**Severity:** Mostly High and Medium
**Action:** Review and add proper error handling

---

## Placeholder (CS-PH)
Detects incomplete implementations and test data:
- TODO/FIXME/HACK comments
- Lorem ipsum and dummy text
- Test emails and passwords
- Localhost URLs
- Debug console.log statements
- Commented-out code

**Severity:** Mostly Medium and Low
**Action:** Complete implementation or remove before release

---

## Error (CS-ERR)
Detects code smells and potential runtime bugs:
- Loose equality (\`==\` instead of \`===\`)
- Assignment in conditions
- Array mutation during iteration
- parseInt without radix
- Await in constructor
- Floating-point money comparison

**Severity:** Mixed
**Action:** Review and fix based on context
`;
        return {
            contents: [
                {
                    uri,
                    mimeType: "text/markdown",
                    text: guide
                }
            ]
        };
    }
    // Unknown resource
    return {
        contents: [
            {
                uri,
                mimeType: "text/plain",
                text: `Unknown resource: ${uri}`
            }
        ]
    };
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("CodeSentinel MCP Server running on stdio");
}
main().catch(console.error);
