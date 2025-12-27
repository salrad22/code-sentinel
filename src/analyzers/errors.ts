import { Issue, Pattern } from '../types.js';

const errorPatterns: Pattern[] = [
  // Unhandled promises
  {
    id: 'ERR001',
    pattern: /(?:^|\s)(?:await\s+)?(?:\w+\.)+\w+\s*\([^)]*\)\s*;?\s*$/gm,
    title: 'Potentially Unhandled Promise',
    description: 'Async call without await or .then()/.catch() may silently fail.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Use await with try/catch or add .catch() handler.'
  },
  
  // Missing error handling
  {
    id: 'ERR010',
    pattern: /async\s+(?:function\s+\w+|\w+\s*=\s*async)\s*\([^)]*\)\s*(?::\s*\w+\s*)?\{(?:(?!try\s*\{).)*\}/gs,
    title: 'Async Function Without Try/Catch',
    description: 'Async function has no error handling.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Wrap async operations in try/catch or handle at call site.'
  },

  // Variable shadowing and redeclaration
  {
    id: 'ERR020',
    pattern: /var\s+(\w+)[\s\S]*?var\s+\1\s*=/g,
    title: 'Variable Redeclaration with var',
    description: 'Same variable declared twice with var - potential bug.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Use let/const and avoid redeclaring variables.'
  },

  // Comparison issues
  {
    id: 'ERR030',
    pattern: /[^!=]==[^=]/g,
    title: 'Loose Equality (==)',
    description: 'Loose equality can cause unexpected type coercion.',
    severity: 'low',
    category: 'error',
    suggestion: 'Use strict equality (===) instead.'
  },
  {
    id: 'ERR031',
    pattern: /!=[^=]/g,
    title: 'Loose Inequality (!=)',
    description: 'Loose inequality can cause unexpected type coercion.',
    severity: 'low',
    category: 'error',
    suggestion: 'Use strict inequality (!==) instead.'
  },
  {
    id: 'ERR032',
    pattern: /if\s*\(\s*\w+\s*=\s*[^=]/g,
    title: 'Assignment in Condition',
    description: 'Assignment inside if condition - likely meant to use ==.',
    severity: 'high',
    category: 'error',
    suggestion: 'Use === for comparison. If assignment is intentional, wrap in extra parens.'
  },

  // Null/undefined issues
  {
    id: 'ERR040',
    pattern: /(\w+)\.(\w+)\s*(?:\(|\.)/g,
    title: 'Potential Null Reference',
    description: 'Accessing property without null check - may throw.',
    severity: 'low',
    category: 'error',
    suggestion: 'Use optional chaining (?.) or add null checks.'
  },

  // Loop issues
  {
    id: 'ERR050',
    pattern: /for\s*\(\s*(?:var|let)\s+\w+\s+in\s+/g,
    title: 'for...in on Array',
    description: 'for...in iterates over keys, not values - often wrong for arrays.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Use for...of, forEach(), or traditional for loop for arrays.'
  },
  {
    id: 'ERR051',
    pattern: /while\s*\(\s*true\s*\)/g,
    title: 'Infinite Loop Pattern',
    description: 'while(true) requires explicit break - easy to create infinite loop.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Ensure there is always a reachable break condition.'
  },

  // Floating point comparison
  {
    id: 'ERR060',
    pattern: /(?:\d+\.\d+|\w+)\s*===?\s*(?:\d+\.\d+|\w+).*?(?:price|amount|total|sum|money|currency|rate)/gi,
    title: 'Floating Point Comparison',
    description: 'Direct comparison of floats (especially money) can fail due to precision.',
    severity: 'high',
    category: 'error',
    suggestion: 'Use epsilon comparison or integer cents for money.'
  },

  // Array mutation issues
  {
    id: 'ERR070',
    pattern: /\.forEach\s*\([^)]*\)\s*\{[^}]*(?:\.push|\.pop|\.shift|\.splice)/g,
    title: 'Array Mutation During Iteration',
    description: 'Modifying array while iterating can cause skipped elements.',
    severity: 'high',
    category: 'error',
    suggestion: 'Create a new array or iterate backwards when mutating.'
  },

  // parseInt without radix
  {
    id: 'ERR080',
    pattern: /parseInt\s*\(\s*[^,)]+\s*\)(?!\s*,)/g,
    title: 'parseInt Without Radix',
    description: 'parseInt without radix can give unexpected results.',
    severity: 'low',
    category: 'error',
    suggestion: 'Always specify radix: parseInt(x, 10).'
  },

  // Unreachable code
  {
    id: 'ERR090',
    pattern: /return\s+[^;]+;\s*\n\s*(?![\s}]|case\s|default:)/g,
    title: 'Potentially Unreachable Code',
    description: 'Code after return statement will never execute.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Remove unreachable code or fix control flow.'
  },

  // Dangerous delete
  {
    id: 'ERR100',
    pattern: /delete\s+\w+\[\w+\]/g,
    title: 'delete Operator on Array',
    description: 'delete leaves holes in arrays - length unchanged.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Use splice() to remove array elements.'
  },

  // This binding issues
  {
    id: 'ERR110',
    pattern: /setTimeout\s*\(\s*(?:this\.\w+|function\s*\([^)]*\)\s*\{[^}]*this\.)/g,
    title: 'Potential "this" Binding Issue',
    description: 'Using "this" in setTimeout callback may not refer to expected context.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Use arrow function or .bind(this).'
  },

  // Constructor without new
  {
    id: 'ERR120',
    pattern: /(?:^|[^.])\b(?:Date|Array|Object|Map|Set|Promise)\s*\(\s*\)/g,
    title: 'Constructor Without "new"',
    description: 'Calling constructor without new may not work as expected.',
    severity: 'low',
    category: 'error',
    suggestion: 'Use "new" keyword with constructors.'
  },

  // Magic numbers
  {
    id: 'ERR130',
    pattern: /(?:if|while|for|===?|!==?|[<>]=?)\s*\(?\s*(?:\d{3,}|\d+\.\d+)\s*(?!\s*(?:px|em|rem|%|vh|vw|s|ms))/g,
    title: 'Magic Number',
    description: 'Hardcoded number without context makes code hard to maintain.',
    severity: 'low',
    category: 'error',
    suggestion: 'Extract magic numbers into named constants.'
  },

  // Async in constructor
  {
    id: 'ERR140',
    pattern: /constructor\s*\([^)]*\)\s*\{[^}]*await\s+/g,
    title: 'Await in Constructor',
    description: 'Constructors cannot be async - await will not work as expected.',
    severity: 'high',
    category: 'error',
    suggestion: 'Use a static factory method for async initialization.'
  }
];

export function analyzeErrors(code: string, filename: string): Issue[] {
  const issues: Issue[] = [];
  const lines = code.split('\n');

  for (const patternDef of errorPatterns) {
    patternDef.pattern.lastIndex = 0;
    
    let match;
    while ((match = patternDef.pattern.exec(code)) !== null) {
      const beforeMatch = code.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      const lineContent = lines[lineNumber - 1] || '';

      issues.push({
        id: patternDef.id,
        category: patternDef.category,
        severity: patternDef.severity,
        title: patternDef.title,
        description: patternDef.description,
        line: lineNumber,
        code: lineContent.trim(),
        suggestion: patternDef.suggestion
      });

      if (!patternDef.pattern.global) break;
    }
  }

  return issues;
}
