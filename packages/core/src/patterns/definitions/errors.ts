// Error pattern definitions - code smells and potential bugs

import { PatternDefinition } from '../types.js';

export const errorDefinitions: PatternDefinition[] = [
  // Comparison issues
  {
    id: 'CS-ERR030',
    title: 'Loose Equality (==)',
    description: 'Loose equality can cause unexpected type coercion.',
    severity: 'low',
    category: 'error',
    suggestion: 'Use strict equality (===) instead.',
    match: {
      type: 'comparison',
      operators: ['==']
    }
  },
  {
    id: 'CS-ERR031',
    title: 'Loose Inequality (!=)',
    description: 'Loose inequality can cause unexpected type coercion.',
    severity: 'low',
    category: 'error',
    suggestion: 'Use strict inequality (!==) instead.',
    match: {
      type: 'comparison',
      operators: ['!=']
    }
  },
  {
    id: 'CS-ERR032',
    title: 'Assignment in Condition',
    description: 'Assignment inside if condition - likely meant to use ==.',
    severity: 'high',
    category: 'error',
    suggestion: 'Use === for comparison. If assignment is intentional, wrap in extra parens.',
    match: {
      type: 'raw_regex',
      pattern: 'if\\s*\\(\\s*\\w+\\s*=\\s*[^=]',
      flags: 'g'
    }
  },

  // Loop issues
  {
    id: 'CS-ERR050',
    title: 'for...in on Array',
    description: 'for...in iterates over keys, not values - often wrong for arrays.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Use for...of, forEach(), or traditional for loop for arrays.',
    match: {
      type: 'loop_pattern',
      kind: 'for_in'
    }
  },
  {
    id: 'CS-ERR051',
    title: 'Infinite Loop Pattern',
    description: 'while(true) requires explicit break - easy to create infinite loop.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Ensure there is always a reachable break condition.',
    match: {
      type: 'loop_pattern',
      kind: 'while_true'
    }
  },

  // Variable issues
  {
    id: 'CS-ERR020',
    title: 'Variable Redeclaration with var',
    description: 'Same variable declared twice with var - potential bug.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Use let/const and avoid redeclaring variables.',
    match: {
      type: 'raw_regex',
      pattern: 'var\\s+(\\w+)[\\s\\S]*?var\\s+\\1\\s*=',
      flags: 'g'
    }
  },

  // Floating point comparison
  {
    id: 'CS-ERR060',
    title: 'Floating Point Comparison',
    description: 'Direct comparison of floats (especially money) can fail due to precision.',
    severity: 'high',
    category: 'error',
    suggestion: 'Use epsilon comparison or integer cents for money.',
    match: {
      type: 'raw_regex',
      pattern: '(?:\\d+\\.\\d+|\\w+)\\s*===?\\s*(?:\\d+\\.\\d+|\\w+).*?(?:price|amount|total|sum|money|currency|rate)',
      flags: 'gi'
    }
  },

  // Array mutation issues
  {
    id: 'CS-ERR070',
    title: 'Array Mutation During Iteration',
    description: 'Modifying array while iterating can cause skipped elements.',
    severity: 'high',
    category: 'error',
    suggestion: 'Create a new array or iterate backwards when mutating.',
    match: {
      type: 'raw_regex',
      pattern: '\\.forEach\\s*\\([^)]*\\)\\s*\\{[^}]*(?:\\.push|\\.pop|\\.shift|\\.splice)',
      flags: 'g'
    }
  },

  // parseInt without radix
  {
    id: 'CS-ERR080',
    title: 'parseInt Without Radix',
    description: 'parseInt without radix can give unexpected results.',
    severity: 'low',
    category: 'error',
    suggestion: 'Always specify radix: parseInt(x, 10).',
    match: {
      type: 'raw_regex',
      pattern: 'parseInt\\s*\\(\\s*[^,)]+\\s*\\)(?!\\s*,)',
      flags: 'g'
    }
  },

  // Unreachable code
  {
    id: 'CS-ERR090',
    title: 'Potentially Unreachable Code',
    description: 'Code after return statement will never execute.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Remove unreachable code or fix control flow.',
    match: {
      type: 'raw_regex',
      pattern: 'return\\s+[^;]+;\\s*\\n\\s*(?![\\s}]|case\\s|default:)',
      flags: 'g'
    }
  },

  // Dangerous delete
  {
    id: 'CS-ERR100',
    title: 'delete Operator on Array',
    description: 'delete leaves holes in arrays - length unchanged.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Use splice() to remove array elements.',
    match: {
      type: 'raw_regex',
      pattern: 'delete\\s+\\w+\\[\\w+\\]',
      flags: 'g'
    }
  },

  // This binding issues
  {
    id: 'CS-ERR110',
    title: 'Potential "this" Binding Issue',
    description: 'Using "this" in setTimeout callback may not refer to expected context.',
    severity: 'medium',
    category: 'error',
    suggestion: 'Use arrow function or .bind(this).',
    match: {
      type: 'raw_regex',
      pattern: 'setTimeout\\s*\\(\\s*(?:this\\.\\w+|function\\s*\\([^)]*\\)\\s*\\{[^}]*this\\.)',
      flags: 'g'
    }
  },

  // Constructor without new
  {
    id: 'CS-ERR120',
    title: 'Constructor Without "new"',
    description: 'Calling constructor without new may not work as expected.',
    severity: 'low',
    category: 'error',
    suggestion: 'Use "new" keyword with constructors.',
    match: {
      type: 'raw_regex',
      pattern: '(?:^|[^.])\\b(?:Date|Array|Object|Map|Set|Promise)\\s*\\(\\s*\\)',
      flags: 'g'
    }
  },

  // Magic numbers
  {
    id: 'CS-ERR130',
    title: 'Magic Number',
    description: 'Hardcoded number without context makes code hard to maintain.',
    severity: 'low',
    category: 'error',
    suggestion: 'Extract magic numbers into named constants.',
    match: {
      type: 'raw_regex',
      pattern: '(?:if|while|for|===?|!==?|[<>]=?)\\s*\\(?\\s*(?:\\d{3,}|\\d+\\.\\d+)\\s*(?!\\s*(?:px|em|rem|%|vh|vw|s|ms))',
      flags: 'g'
    }
  },

  // Async in constructor
  {
    id: 'CS-ERR140',
    title: 'Await in Constructor',
    description: 'Constructors cannot be async - await will not work as expected.',
    severity: 'high',
    category: 'error',
    suggestion: 'Use a static factory method for async initialization.',
    match: {
      type: 'raw_regex',
      pattern: 'constructor\\s*\\([^)]*\\)\\s*\\{[^}]*await\\s+',
      flags: 'g'
    }
  }
];
