// These patterns detect code that hides errors or creates false confidence
const deceptivePatterns = [
    // Empty catch blocks
    {
        id: 'CS-DEC001',
        pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
        title: 'Empty Catch Block',
        description: 'Silently swallowing errors makes debugging impossible.',
        severity: 'high',
        category: 'deceptive',
        suggestion: 'At minimum, log the error. Better: handle it appropriately or rethrow.'
    },
    {
        id: 'CS-DEC002',
        pattern: /catch\s*\([^)]*\)\s*\{\s*\/\/.*?\s*\}/gs,
        title: 'Catch Block with Only Comments',
        description: 'A catch block with only comments still swallows errors.',
        severity: 'high',
        category: 'deceptive',
        suggestion: 'Add actual error handling, not just comments.'
    },
    {
        id: 'CS-DEC003',
        pattern: /catch\s*\([^)]*\)\s*\{\s*(?:console\.log|print)\s*\([^)]*\)\s*;?\s*\}/g,
        title: 'Catch with Only Console.log',
        description: 'Logging alone does not handle the error - execution continues as if nothing happened.',
        severity: 'medium',
        category: 'deceptive',
        suggestion: 'Decide: should execution continue? Add recovery logic or rethrow.'
    },
    // Silent promise rejections
    {
        id: 'CS-DEC010',
        pattern: /\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g,
        title: 'Empty Promise Catch',
        description: 'Silently ignoring promise rejections hides async errors.',
        severity: 'high',
        category: 'deceptive',
        suggestion: 'Handle the rejection or let it propagate for proper error handling.'
    },
    {
        id: 'CS-DEC011',
        pattern: /\.catch\s*\(\s*\(\s*\)\s*=>\s*(?:null|undefined|false|true|''|"")\s*\)/g,
        title: 'Promise Catch Returns Silent Value',
        description: 'Returning a value from catch masks the error - callers won\'t know something failed.',
        severity: 'high',
        category: 'deceptive',
        suggestion: 'Return a distinguishable error state or rethrow.'
    },
    {
        id: 'CS-DEC012',
        pattern: /\.catch\s*\(\s*_\s*=>\s*\{?\s*\}?\s*\)/g,
        title: 'Catch with Ignored Error Parameter',
        description: 'Using _ for error parameter signals intentional ignore - but is it really safe to ignore?',
        severity: 'medium',
        category: 'deceptive',
        suggestion: 'Document why ignoring this error is safe, or handle it.'
    },
    // Fallback values that mask failures
    {
        id: 'CS-DEC020',
        pattern: /\|\|\s*\[\s*\]/g,
        title: 'Empty Array Fallback',
        description: 'Falling back to [] can mask failed data fetching - code continues as if data was empty.',
        severity: 'medium',
        category: 'deceptive',
        suggestion: 'Distinguish between "no data" and "failed to fetch". Consider throwing or returning null.'
    },
    {
        id: 'CS-DEC021',
        pattern: /\|\|\s*\{\s*\}/g,
        title: 'Empty Object Fallback',
        description: 'Falling back to {} can hide parsing or fetching failures.',
        severity: 'medium',
        category: 'deceptive',
        suggestion: 'Handle the undefined/null case explicitly rather than masking it.'
    },
    {
        id: 'CS-DEC022',
        pattern: /\?\?\s*(?:\[\s*\]|\{\s*\}|''|"")/g,
        title: 'Nullish Coalescing to Empty Value',
        description: 'Defaulting to empty values with ?? can mask null responses that indicate errors.',
        severity: 'low',
        category: 'deceptive',
        suggestion: 'Verify that null/undefined truly means "use default" vs "something went wrong".'
    },
    // Optional chaining abuse
    {
        id: 'CS-DEC030',
        pattern: /\?\.\w+\?\.\w+\?\.\w+\?\.\w+/g,
        title: 'Excessive Optional Chaining',
        description: 'Deep optional chaining (4+ levels) often masks structural problems or missing validation.',
        severity: 'medium',
        category: 'deceptive',
        suggestion: 'Validate data shape upfront rather than optional-chaining through uncertain structures.'
    },
    // Error-hiding returns
    {
        id: 'CS-DEC040',
        pattern: /return\s+(?:null|undefined|false)\s*;?\s*\/\/\s*(?:error|fail|todo|fixme)/gi,
        title: 'Silent Error Return',
        description: 'Returning null/false on error with a comment - callers may not check for this.',
        severity: 'high',
        category: 'deceptive',
        suggestion: 'Throw an error or return a Result/Either type that forces handling.'
    },
    {
        id: 'CS-DEC041',
        pattern: /if\s*\([^)]*error[^)]*\)\s*\{\s*return\s*;?\s*\}/gi,
        title: 'Silent Return on Error',
        description: 'Returning silently when an error is detected - no logging, no propagation.',
        severity: 'high',
        category: 'deceptive',
        suggestion: 'Log the error or throw it. Silent returns make debugging a nightmare.'
    },
    // Timeout-based "fixes"
    {
        id: 'CS-DEC050',
        pattern: /setTimeout\s*\([^,]+,\s*\d+\s*\)\s*;?\s*\/\/.*?(?:fix|hack|workaround|retry)/gi,
        title: 'Timeout as Error Workaround',
        description: 'Using setTimeout to "fix" timing issues often masks race conditions.',
        severity: 'medium',
        category: 'deceptive',
        suggestion: 'Fix the underlying race condition. Use proper async coordination.'
    },
    // Suppressed warnings/errors
    {
        id: 'CS-DEC060',
        pattern: /\/\/\s*(?:@ts-ignore|@ts-expect-error|eslint-disable|noqa)/g,
        title: 'Linter/Type Check Suppression',
        description: 'Suppressing type errors or linter warnings may hide real issues.',
        severity: 'low',
        category: 'deceptive',
        suggestion: 'Fix the underlying issue. If suppression is needed, document why.'
    },
    {
        id: 'CS-DEC061',
        pattern: /as\s+any(?!\w)/g,
        title: 'TypeScript "as any" Cast',
        description: 'Casting to any defeats TypeScript\'s type safety.',
        severity: 'medium',
        category: 'deceptive',
        suggestion: 'Use proper type definitions or unknown with type guards.'
    },
    // Fake success responses
    {
        id: 'CS-DEC070',
        pattern: /return\s*\{\s*(?:success|ok|status)\s*:\s*true[^}]*\}\s*;?\s*\/\/.*?(?:todo|fixme|hack)/gi,
        title: 'Fake Success Response',
        description: 'Returning success without actually doing the work.',
        severity: 'critical',
        category: 'deceptive',
        suggestion: 'Implement the actual functionality or return an honest error.'
    },
    // Console.error without throwing
    {
        id: 'CS-DEC080',
        pattern: /console\.error\s*\([^)]+\)\s*;?\s*(?!\s*throw)/g,
        title: 'console.error Without Throw',
        description: 'Logging an error but continuing execution - the error may not be handled.',
        severity: 'low',
        category: 'deceptive',
        suggestion: 'Consider if execution should continue. If not, throw after logging.'
    }
];
export function analyzeDeceptivePatterns(code, filename) {
    const issues = [];
    const lines = code.split('\n');
    for (const patternDef of deceptivePatterns) {
        patternDef.pattern.lastIndex = 0;
        let match;
        while ((match = patternDef.pattern.exec(code)) !== null) {
            const beforeMatch = code.substring(0, match.index);
            const lineNumber = beforeMatch.split('\n').length;
            const lineContent = lines[lineNumber - 1] || '';
            // Build verification with actual values substituted
            let verification = patternDef.verification;
            if (verification) {
                verification = {
                    ...verification,
                    commands: verification.commands?.map(cmd => cmd.replace(/<filename>/g, filename))
                };
            }
            issues.push({
                id: patternDef.id,
                category: patternDef.category,
                severity: patternDef.severity,
                title: patternDef.title,
                description: patternDef.description,
                line: lineNumber,
                code: lineContent.trim(),
                suggestion: patternDef.suggestion,
                verification
            });
            if (!patternDef.pattern.global)
                break;
        }
    }
    return issues;
}
