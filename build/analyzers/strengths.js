const strengthPatterns = [
    // TypeScript usage
    {
        id: 'STR001',
        pattern: /:\s*(?:string|number|boolean|void|never|unknown|null|undefined|\w+\[\]|Record<|Map<|Set<|Promise<)/g,
        title: 'Strong Typing',
        description: 'Explicit type annotations improve code safety and documentation.'
    },
    {
        id: 'STR002',
        pattern: /interface\s+\w+\s*\{/g,
        title: 'Interface Definitions',
        description: 'Well-defined interfaces create clear contracts.'
    },
    {
        id: 'STR003',
        pattern: /type\s+\w+\s*=\s*/g,
        title: 'Type Aliases',
        description: 'Type aliases improve code readability and reusability.'
    },
    // Error handling
    {
        id: 'STR010',
        pattern: /try\s*\{[\s\S]+?\}\s*catch\s*\([^)]+\)\s*\{[\s\S]+?\}/g,
        title: 'Proper Try/Catch',
        description: 'Structured error handling with meaningful catch blocks.'
    },
    {
        id: 'STR011',
        pattern: /\.catch\s*\(\s*(?:error|err|e)\s*=>\s*\{[^}]+\}/g,
        title: 'Promise Error Handling',
        description: 'Promise chains have explicit error handling.'
    },
    {
        id: 'STR012',
        pattern: /class\s+\w+Error\s+extends\s+Error/g,
        title: 'Custom Error Classes',
        description: 'Custom errors enable better error classification.'
    },
    // Documentation
    {
        id: 'STR020',
        pattern: /\/\*\*[\s\S]*?@(?:param|returns?|throws|example)[\s\S]*?\*\//g,
        title: 'JSDoc Documentation',
        description: 'Functions have proper JSDoc documentation.'
    },
    {
        id: 'STR021',
        pattern: /\/\/\s+[A-Z][^.!?]*[.!?]\s*$/gm,
        title: 'Meaningful Comments',
        description: 'Code has explanatory comments in complete sentences.'
    },
    // Clean code patterns
    {
        id: 'STR030',
        pattern: /const\s+\w+\s*=/g,
        title: 'Immutable Variables',
        description: 'Using const by default prevents accidental reassignment.'
    },
    {
        id: 'STR031',
        pattern: /(?:readonly|Object\.freeze|as\s+const)/g,
        title: 'Immutability Patterns',
        description: 'Code uses immutability patterns for data safety.'
    },
    {
        id: 'STR032',
        pattern: /(?:private|protected|#\w+)/g,
        title: 'Encapsulation',
        description: 'Proper use of access modifiers for encapsulation.'
    },
    // Async patterns
    {
        id: 'STR040',
        pattern: /async\s+\w+\s*\([^)]*\)\s*(?::\s*Promise<[^>]+>)?/g,
        title: 'Async/Await Usage',
        description: 'Modern async/await syntax for readable asynchronous code.'
    },
    {
        id: 'STR041',
        pattern: /Promise\.all\s*\(/g,
        title: 'Parallel Promise Execution',
        description: 'Using Promise.all for efficient parallel async operations.'
    },
    {
        id: 'STR042',
        pattern: /Promise\.allSettled\s*\(/g,
        title: 'Resilient Promise Handling',
        description: 'Using allSettled handles both fulfilled and rejected promises.'
    },
    // Testing
    {
        id: 'STR050',
        pattern: /(?:describe|it|test|expect)\s*\(/g,
        title: 'Test Coverage',
        description: 'Code includes tests with standard testing patterns.'
    },
    {
        id: 'STR051',
        pattern: /\.test\.|\.spec\.|__tests__/g,
        title: 'Test Files Present',
        description: 'Dedicated test files follow conventions.'
    },
    // Validation
    {
        id: 'STR060',
        pattern: /(?:z\.|yup\.|joi\.|validator\.)\w+/g,
        title: 'Schema Validation',
        description: 'Using validation libraries for input/data validation.'
    },
    {
        id: 'STR061',
        pattern: /if\s*\(\s*!?\w+\s*(?:&&|\|\|)?\s*typeof\s+\w+/g,
        title: 'Type Guards',
        description: 'Runtime type checking before operations.'
    },
    // Modern JavaScript
    {
        id: 'STR070',
        pattern: /(?:\?\.|&&\s*\w+\?\.)/g,
        title: 'Optional Chaining',
        description: 'Using ?. for safe property access.'
    },
    {
        id: 'STR071',
        pattern: /\?\?\s*(?![\[\{])/g,
        title: 'Nullish Coalescing',
        description: 'Using ?? for proper null/undefined handling.'
    },
    {
        id: 'STR072',
        pattern: /\.\.\.\w+/g,
        title: 'Spread Operator',
        description: 'Using spread for immutable operations.'
    },
    // Environment handling
    {
        id: 'STR080',
        pattern: /process\.env\.\w+|import\.meta\.env\.\w+/g,
        title: 'Environment Variables',
        description: 'Configuration via environment variables.'
    },
    // Logging
    {
        id: 'STR090',
        pattern: /(?:logger|log)\.\w+\s*\(/g,
        title: 'Structured Logging',
        description: 'Using a logging library instead of console.log.'
    }
];
export function analyzeStrengths(code, filename) {
    const strengths = [];
    const foundPatterns = new Set();
    for (const patternDef of strengthPatterns) {
        patternDef.pattern.lastIndex = 0;
        const matches = code.match(patternDef.pattern);
        if (matches && matches.length > 0 && !foundPatterns.has(patternDef.id)) {
            foundPatterns.add(patternDef.id);
            // Only report each strength once, with example count
            strengths.push({
                id: patternDef.id,
                title: patternDef.title,
                description: patternDef.description,
                examples: matches.slice(0, 3).map(m => m.trim())
            });
        }
    }
    return strengths;
}
