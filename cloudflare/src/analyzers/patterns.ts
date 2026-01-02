import { Severity } from '../types.js';

// Pattern levels for clarification
export type PatternLevel = 'architectural' | 'design' | 'code' | 'all';

export interface DetectedPattern {
  id: string;
  name: string;
  level: PatternLevel;
  confidence: 'high' | 'medium' | 'low';
  description: string;
  locations: Array<{
    line: number;
    code: string;
  }>;
}

export interface PatternInconsistency {
  id: string;
  title: string;
  level: PatternLevel;
  severity: Severity;
  description: string;
  variants: Array<{
    approach: string;
    locations: Array<{ line: number; code: string }>;
    count: number;
  }>;
  recommendation: string;
}

export interface PatternSuggestion {
  id: string;
  title: string;
  level: PatternLevel;
  priority: 'high' | 'medium' | 'low';
  currentApproach: {
    name: string;
    description: string;
    example: string;
    line?: number;
  };
  suggestedApproach: {
    name: string;
    description: string;
    why: string;
    benefits: string[];
    tradeoffs: string[];
    example: string;
  };
  action: {
    type: 'refactor' | 'add' | 'replace' | 'consider';
    description: string;
    steps: string[];
    codeChange?: {
      before: string;
      after: string;
      file?: string;
      line?: number;
    };
  };
}

export interface PatternAnalysisResult {
  level: PatternLevel;
  summary: {
    patternsDetected: number;
    inconsistencies: number;
    suggestions: number;
    overallConsistency: 'high' | 'medium' | 'low';
  };
  detectedPatterns: DetectedPattern[];
  inconsistencies: PatternInconsistency[];
  suggestions: PatternSuggestion[];
  actionItems: ActionItem[];
}

export interface ActionItem {
  id: string;
  priority: 1 | 2 | 3;
  type: 'fix_inconsistency' | 'implement_pattern' | 'refactor';
  title: string;
  reason: string;
  effort: 'low' | 'medium' | 'high';
  steps: Array<{
    order: number;
    instruction: string;
    code?: {
      action: 'insert' | 'replace' | 'delete';
      target: string;
      content: string;
    };
  }>;
  acceptPrompt: string;
}

interface PatternMatcher {
  id: string;
  name: string;
  level: PatternLevel;
  patterns: RegExp[];
  antiPatterns?: RegExp[];
  description: string;
}

const patternMatchers: PatternMatcher[] = [
  // Architectural patterns
  {
    id: 'CS-ARCH001',
    name: 'Repository Pattern',
    level: 'architectural',
    patterns: [
      /class\s+\w*Repository/g,
      /interface\s+I?\w*Repository/g,
      /(?:find|get|save|delete|update)(?:All|By|One)\s*\(/g
    ],
    description: 'Data access abstraction layer separating business logic from data persistence'
  },
  {
    id: 'CS-ARCH002',
    name: 'Service Layer',
    level: 'architectural',
    patterns: [
      /class\s+\w*Service/g,
      /(?:export\s+)?(?:const|function)\s+\w*Service/g
    ],
    description: 'Business logic encapsulation in dedicated service classes/modules'
  },
  {
    id: 'CS-ARCH003',
    name: 'Controller/Handler Pattern',
    level: 'architectural',
    patterns: [
      /class\s+\w*Controller/g,
      /(?:export\s+)?(?:const|function)\s+\w*(?:Controller|Handler)/g,
      /@(?:Controller|Get|Post|Put|Delete)\s*\(/g
    ],
    description: 'HTTP request handling separated from business logic'
  },
  {
    id: 'CS-ARCH004',
    name: 'Middleware Pattern',
    level: 'architectural',
    patterns: [
      /(?:app|router)\.use\s*\(/g,
      /export\s+(?:const|function)\s+\w*Middleware/g,
      /\(req,\s*res,\s*next\)/g
    ],
    description: 'Request/response pipeline with composable handlers'
  },

  // Design patterns
  {
    id: 'CS-DES001',
    name: 'Factory Pattern',
    level: 'design',
    patterns: [
      /(?:create|make|build)\w*\s*\([^)]*\)\s*(?::\s*\w+)?\s*(?:=>)?\s*\{?/g,
      /class\s+\w*Factory/g,
      /function\s+create\w+/g
    ],
    description: 'Object creation encapsulated in factory functions/classes'
  },
  {
    id: 'CS-DES002',
    name: 'Singleton Pattern',
    level: 'design',
    patterns: [
      /static\s+(?:get)?[Ii]nstance/g,
      /let\s+instance\s*[=:]/g,
      /export\s+default\s+new\s+\w+\(\)/g
    ],
    description: 'Single instance shared across the application'
  },
  {
    id: 'CS-DES003',
    name: 'Observer/Event Pattern',
    level: 'design',
    patterns: [
      /\.on\s*\(\s*['"`]\w+['"`]/g,
      /\.emit\s*\(\s*['"`]\w+['"`]/g,
      /addEventListener\s*\(/g,
      /(?:subscribe|unsubscribe)\s*\(/g,
      /new\s+(?:Event)?Emitter/g
    ],
    description: 'Pub/sub mechanism for loose coupling between components'
  },
  {
    id: 'CS-DES004',
    name: 'Strategy Pattern',
    level: 'design',
    patterns: [
      /interface\s+\w*Strategy/g,
      /type\s+\w*Strategy\s*=/g,
      /strategies\s*(?::\s*(?:Record|Map|{))?\s*[=:]/g
    ],
    description: 'Interchangeable algorithms selected at runtime'
  },
  {
    id: 'CS-DES005',
    name: 'Builder Pattern',
    level: 'design',
    patterns: [
      /class\s+\w*Builder/g,
      /\.set\w+\([^)]+\)\s*\.\s*set\w+/g,
      /return\s+this\s*;?\s*}\s*\w+\s*\(/g
    ],
    description: 'Step-by-step object construction with fluent interface'
  },
  {
    id: 'CS-DES006',
    name: 'Dependency Injection',
    level: 'design',
    patterns: [
      /constructor\s*\(\s*(?:private|public|readonly)\s+\w+\s*:/g,
      /@(?:Inject|Injectable|Service)\s*\(/g,
      /\.register\s*\(\s*['"`]\w+['"`]/g
    ],
    description: 'Dependencies provided externally rather than created internally'
  },

  // Code-level patterns
  {
    id: 'CS-CODE001',
    name: 'Async/Await',
    level: 'code',
    patterns: [
      /async\s+(?:function|\w+\s*=|(?:\w+\s*)?=>)/g,
      /await\s+/g
    ],
    description: 'Modern asynchronous code handling'
  },
  {
    id: 'CS-CODE002',
    name: 'Promise Chains',
    level: 'code',
    patterns: [
      /\.then\s*\(\s*(?:\w+\s*=>|\([^)]*\)\s*=>|function)/g,
      /\.catch\s*\(\s*(?:\w+\s*=>|\([^)]*\)\s*=>|function)/g
    ],
    description: 'Promise-based asynchronous handling with chaining'
  },
  {
    id: 'CS-CODE003',
    name: 'Callback Pattern',
    level: 'code',
    patterns: [
      /function\s*\([^)]*,\s*(?:callback|cb|done|next)\s*\)/g,
      /\(\s*(?:err|error)\s*,\s*(?:result|data|response)\s*\)/g
    ],
    description: 'Traditional callback-based async handling'
  },
  {
    id: 'CS-CODE004',
    name: 'Result/Either Pattern',
    level: 'code',
    patterns: [
      /(?:Result|Either|Ok|Err|Success|Failure)<\w+/g,
      /return\s+\{\s*(?:success|ok|error|data)\s*:/g,
      /\.isOk\(\)|\.isErr\(\)|\.unwrap\(\)/g
    ],
    description: 'Explicit success/failure return types instead of exceptions'
  },
  {
    id: 'CS-CODE005',
    name: 'Guard Clauses',
    level: 'code',
    patterns: [
      /if\s*\([^)]+\)\s*(?:return|throw)\s*[^{]/g,
      /if\s*\(\s*!\w+\s*\)\s*(?:return|throw)/g
    ],
    description: 'Early returns for edge cases before main logic'
  },
  {
    id: 'CS-CODE006',
    name: 'Null Object Pattern',
    level: 'code',
    patterns: [
      /(?:Null|Empty|Default|Noop)\w+\s*(?:implements|extends|=)/g,
      /\?\?\s*\{\s*\w+\s*:\s*\(\)\s*=>/g
    ],
    description: 'Default objects instead of null checks'
  }
];

interface InconsistencyDetector {
  id: string;
  title: string;
  level: PatternLevel;
  variants: Array<{
    name: string;
    pattern: RegExp;
  }>;
  recommendation: string;
}

const inconsistencyDetectors: InconsistencyDetector[] = [
  {
    id: 'CS-INC001',
    title: 'Mixed Async Styles',
    level: 'code',
    variants: [
      { name: 'async/await', pattern: /async\s+\w|await\s+/g },
      { name: 'Promise chains', pattern: /\.then\s*\(/g },
      { name: 'Callbacks', pattern: /,\s*(?:callback|cb)\s*\)|,\s*\(err,/g }
    ],
    recommendation: 'Standardize on async/await for consistency and readability. Convert Promise chains with await and refactor callbacks to return Promises.'
  },
  {
    id: 'CS-INC002',
    title: 'Mixed Error Handling',
    level: 'code',
    variants: [
      { name: 'try/catch', pattern: /try\s*\{[\s\S]*?catch/g },
      { name: '.catch()', pattern: /\.catch\s*\(/g },
      { name: 'Error callbacks', pattern: /\(\s*err(?:or)?\s*(?:,|\))/g },
      { name: 'Result types', pattern: /(?:Result|Either|Ok|Err)</g }
    ],
    recommendation: 'Choose one primary error handling strategy. Result types are explicit, try/catch is familiar. Avoid mixing.'
  },
  {
    id: 'CS-INC003',
    title: 'Mixed Export Styles',
    level: 'code',
    variants: [
      { name: 'Named exports', pattern: /export\s+(?:const|function|class|interface|type)\s+\w+/g },
      { name: 'Default exports', pattern: /export\s+default/g },
      { name: 'module.exports', pattern: /module\.exports\s*=/g }
    ],
    recommendation: 'Prefer named exports for better tree-shaking and IDE support. Reserve default exports for main entry points only.'
  },
  {
    id: 'CS-INC004',
    title: 'Mixed Null Handling',
    level: 'code',
    variants: [
      { name: 'Optional chaining (?.)', pattern: /\?\./g },
      { name: 'Nullish coalescing (??)', pattern: /\?\?/g },
      { name: 'Logical OR (||)', pattern: /\|\|\s*(?:null|undefined|''|""|\[\]|\{\})/g },
      { name: 'Explicit checks', pattern: /(?:!==?|===?)\s*(?:null|undefined)/g }
    ],
    recommendation: 'Use ?. and ?? consistently. They handle null/undefined specifically, while || treats all falsy values the same.'
  },
  {
    id: 'CS-INC005',
    title: 'Mixed Function Styles',
    level: 'code',
    variants: [
      { name: 'Arrow functions', pattern: /(?:const|let)\s+\w+\s*=\s*(?:\([^)]*\)|[^=])\s*=>/g },
      { name: 'Function declarations', pattern: /function\s+\w+\s*\(/g },
      { name: 'Method shorthand', pattern: /\w+\s*\([^)]*\)\s*\{/g }
    ],
    recommendation: 'Use arrow functions for callbacks and short functions. Use declarations for hoisting needs and named stack traces.'
  }
];

interface SuggestionRule {
  id: string;
  title: string;
  level: PatternLevel;
  detect: RegExp;
  notPresent?: RegExp;
  condition: 'present' | 'absent' | 'excessive';
  threshold?: number;
  suggestion: Omit<PatternSuggestion['suggestedApproach'], 'name'> & { name: string };
  action: PatternSuggestion['action'];
}

const suggestionRules: SuggestionRule[] = [
  {
    id: 'CS-SUG001',
    title: 'Consider Result Pattern for Error Handling',
    level: 'code',
    detect: /return\s+null\s*;|return\s+undefined\s*;/g,
    notPresent: /Result<|Either<|Ok\(|Err\(/g,
    condition: 'present',
    threshold: 2,
    suggestion: {
      name: 'Result/Either Pattern',
      description: 'Explicit success/failure return types that force callers to handle both cases',
      why: 'Returning null/undefined on errors makes it impossible to distinguish "not found" from "operation failed"',
      benefits: [
        'Callers must handle error cases explicitly',
        'Type system catches unhandled errors',
        'Clear distinction between "no data" and "error"',
        'Self-documenting function signatures'
      ],
      tradeoffs: [
        'More verbose return type handling',
        'Requires consistent adoption across codebase',
        'Learning curve for team'
      ],
      example: `// Before
function getUser(id: string): User | null {
  if (error) return null;
  return user;
}

// After
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function getUser(id: string): Result<User, 'not_found' | 'db_error'> {
  if (notFound) return { ok: false, error: 'not_found' };
  if (dbError) return { ok: false, error: 'db_error' };
  return { ok: true, value: user };
}`
    },
    action: {
      type: 'consider',
      description: 'Introduce Result type for functions that can fail',
      steps: [
        'Define a Result<T, E> type in a shared types file',
        'Update function return types to use Result',
        'Replace return null with { ok: false, error: reason }',
        'Update callers to check result.ok before accessing value'
      ],
      codeChange: {
        before: 'return null;',
        after: "return { ok: false, error: 'operation_failed' };"
      }
    }
  },
  {
    id: 'CS-SUG002',
    title: 'Extract Factory for Complex Object Creation',
    level: 'design',
    detect: /new\s+\w+\(\s*\{[\s\S]{100,}?\}\s*\)/g,
    condition: 'present',
    threshold: 2,
    suggestion: {
      name: 'Factory Pattern',
      description: 'Encapsulate complex object creation in dedicated factory functions',
      why: 'Large inline object construction is hard to test and reuse',
      benefits: [
        'Centralized object creation logic',
        'Easier to test with mock factories',
        'Reusable default configurations',
        'Clear creation intent in code'
      ],
      tradeoffs: [
        'Additional indirection',
        'More files/functions to maintain'
      ],
      example: `// Before
const user = new User({
  name: data.name,
  email: data.email,
  role: data.role || 'user',
  createdAt: new Date(),
  // ... many more fields
});

// After
function createUser(data: CreateUserInput): User {
  return new User({
    ...defaultUserConfig,
    ...data,
    createdAt: new Date(),
  });
}

const user = createUser(data);`
    },
    action: {
      type: 'refactor',
      description: 'Extract factory function for complex object creation',
      steps: [
        'Identify the class being instantiated',
        'Create a createXxx function that encapsulates the construction',
        'Move default values and transformations into the factory',
        'Replace new Xxx({...}) calls with createXxx(...)'
      ]
    }
  },
  {
    id: 'CS-SUG003',
    title: 'Add Repository Layer for Data Access',
    level: 'architectural',
    detect: /(?:prisma|db|knex|sequelize|mongoose)\.\w+\.\w+/g,
    notPresent: /Repository/g,
    condition: 'present',
    threshold: 3,
    suggestion: {
      name: 'Repository Pattern',
      description: 'Abstract data access behind repository interfaces',
      why: 'Direct ORM/database calls scattered in business logic make testing hard and create tight coupling',
      benefits: [
        'Business logic independent of data layer',
        'Easy to mock for testing',
        'Can swap databases without changing business code',
        'Centralizes query logic'
      ],
      tradeoffs: [
        'Additional abstraction layer',
        'More boilerplate code',
        'Can be overkill for simple CRUD apps'
      ],
      example: `// Before (in service)
async function getActiveUsers() {
  return prisma.user.findMany({ where: { active: true } });
}

// After
// userRepository.ts
interface UserRepository {
  findActive(): Promise<User[]>;
}

class PrismaUserRepository implements UserRepository {
  async findActive() {
    return prisma.user.findMany({ where: { active: true } });
  }
}

// userService.ts
class UserService {
  constructor(private userRepo: UserRepository) {}

  async getActiveUsers() {
    return this.userRepo.findActive();
  }
}`
    },
    action: {
      type: 'refactor',
      description: 'Create repository interfaces and implementations',
      steps: [
        'Identify all direct database calls in services/controllers',
        'Group related queries by entity (User, Order, etc.)',
        'Create a Repository interface for each entity',
        'Implement the interface with your ORM',
        'Inject repositories into services via constructor'
      ]
    }
  },
  {
    id: 'CS-SUG004',
    title: 'Use Guard Clauses for Cleaner Logic',
    level: 'code',
    detect: /if\s*\([^)]+\)\s*\{[\s\S]{50,}?\}\s*else\s*\{[\s\S]{10,}?\}/g,
    condition: 'present',
    threshold: 2,
    suggestion: {
      name: 'Guard Clauses',
      description: 'Early returns for edge cases to reduce nesting and clarify happy path',
      why: 'Deeply nested if-else blocks are hard to follow and maintain',
      benefits: [
        'Reduced cognitive load',
        'Clear separation of edge cases and main logic',
        'Easier to add new conditions',
        'More linear code flow'
      ],
      tradeoffs: [
        'Multiple return points (some style guides discourage)',
        'May not work well with resource cleanup needs'
      ],
      example: `// Before
function processOrder(order) {
  if (order) {
    if (order.items.length > 0) {
      if (order.payment) {
        // actual logic here
        return result;
      } else {
        throw new Error('No payment');
      }
    } else {
      throw new Error('Empty order');
    }
  } else {
    throw new Error('No order');
  }
}

// After
function processOrder(order) {
  if (!order) throw new Error('No order');
  if (order.items.length === 0) throw new Error('Empty order');
  if (!order.payment) throw new Error('No payment');

  // actual logic here - no nesting
  return result;
}`
    },
    action: {
      type: 'refactor',
      description: 'Flatten nested conditionals with early returns',
      steps: [
        'Identify the deepest nested condition (usually the happy path)',
        'Invert outer conditions and return/throw early',
        'Move main logic to the end, unnested',
        'Remove else blocks that are no longer needed'
      ]
    }
  },
  {
    id: 'CS-SUG005',
    title: 'Consider Strategy Pattern for Conditional Logic',
    level: 'design',
    detect: /switch\s*\([^)]+\)\s*\{(?:[^}]*case\s+['"`]?\w+['"`]?\s*:){4,}/g,
    condition: 'present',
    suggestion: {
      name: 'Strategy Pattern',
      description: 'Replace complex switch/if-else with strategy objects',
      why: 'Large switch statements violate Open/Closed principle - adding new cases requires modifying existing code',
      benefits: [
        'Add new behaviors without changing existing code',
        'Each strategy is independently testable',
        'Strategies can be swapped at runtime',
        'Cleaner separation of concerns'
      ],
      tradeoffs: [
        'More files/classes',
        'Overhead for simple cases',
        'Need to manage strategy registration'
      ],
      example: `// Before
function calculatePrice(type, amount) {
  switch (type) {
    case 'standard': return amount;
    case 'premium': return amount * 0.9;
    case 'vip': return amount * 0.8;
    case 'enterprise': return amount * 0.7;
    // adding new type = modify this function
  }
}

// After
const pricingStrategies = {
  standard: (amount) => amount,
  premium: (amount) => amount * 0.9,
  vip: (amount) => amount * 0.8,
  enterprise: (amount) => amount * 0.7,
};

function calculatePrice(type, amount) {
  const strategy = pricingStrategies[type];
  if (!strategy) throw new Error('Unknown type');
  return strategy(amount);
}

// Adding new type = just add to strategies object`
    },
    action: {
      type: 'refactor',
      description: 'Extract switch cases into strategy object',
      steps: [
        'Create a strategies object/map',
        'Move each case logic into a strategy function',
        'Replace switch with strategy lookup and execution',
        'Add error handling for unknown strategies'
      ]
    }
  }
];

function detectPatterns(code: string): DetectedPattern[] {
  const detected: DetectedPattern[] = [];
  const lines = code.split('\n');

  for (const matcher of patternMatchers) {
    const locations: DetectedPattern['locations'] = [];

    for (const pattern of matcher.patterns) {
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(code)) !== null) {
        const beforeMatch = code.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;

        locations.push({
          line: lineNumber,
          code: lines[lineNumber - 1]?.trim() || ''
        });

        if (!pattern.global) break;
      }
    }

    if (locations.length > 0) {
      const uniqueLocations = locations.filter(
        (loc, idx, arr) => arr.findIndex(l => l.line === loc.line) === idx
      );

      detected.push({
        id: matcher.id,
        name: matcher.name,
        level: matcher.level,
        confidence: uniqueLocations.length >= 3 ? 'high' : uniqueLocations.length >= 2 ? 'medium' : 'low',
        description: matcher.description,
        locations: uniqueLocations.slice(0, 5)
      });
    }
  }

  return detected;
}

function detectInconsistencies(code: string): PatternInconsistency[] {
  const inconsistencies: PatternInconsistency[] = [];
  const lines = code.split('\n');

  for (const detector of inconsistencyDetectors) {
    const variants: PatternInconsistency['variants'] = [];

    for (const variant of detector.variants) {
      variant.pattern.lastIndex = 0;
      const matches: Array<{ line: number; code: string }> = [];
      let match;

      while ((match = variant.pattern.exec(code)) !== null) {
        const beforeMatch = code.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        matches.push({
          line: lineNumber,
          code: lines[lineNumber - 1]?.trim() || ''
        });
        if (!variant.pattern.global) break;
      }

      if (matches.length > 0) {
        variants.push({
          approach: variant.name,
          locations: matches.slice(0, 3),
          count: matches.length
        });
      }
    }

    if (variants.length >= 2) {
      inconsistencies.push({
        id: detector.id,
        title: detector.title,
        level: detector.level,
        severity: variants.length >= 3 ? 'medium' : 'low',
        description: `Found ${variants.length} different approaches being used`,
        variants,
        recommendation: detector.recommendation
      });
    }
  }

  return inconsistencies;
}

function generateSuggestions(code: string, detected: DetectedPattern[]): PatternSuggestion[] {
  const suggestions: PatternSuggestion[] = [];
  const lines = code.split('\n');

  for (const rule of suggestionRules) {
    rule.detect.lastIndex = 0;
    const matches = code.match(rule.detect) || [];

    let shouldSuggest = false;

    if (rule.condition === 'present' && matches.length >= (rule.threshold || 1)) {
      if (rule.notPresent) {
        rule.notPresent.lastIndex = 0;
        shouldSuggest = !rule.notPresent.test(code);
      } else {
        shouldSuggest = true;
      }
    }

    if (shouldSuggest) {
      rule.detect.lastIndex = 0;
      const firstMatch = rule.detect.exec(code);
      const lineNumber = firstMatch
        ? code.substring(0, firstMatch.index).split('\n').length
        : undefined;

      suggestions.push({
        id: rule.id,
        title: rule.title,
        level: rule.level,
        priority: matches.length >= 5 ? 'high' : matches.length >= 3 ? 'medium' : 'low',
        currentApproach: {
          name: 'Current Implementation',
          description: `Found ${matches.length} instance(s) of this pattern`,
          example: firstMatch ? firstMatch[0] : '',
          line: lineNumber
        },
        suggestedApproach: rule.suggestion,
        action: rule.action
      });
    }
  }

  return suggestions;
}

function generateActionItems(
  inconsistencies: PatternInconsistency[],
  suggestions: PatternSuggestion[]
): ActionItem[] {
  const items: ActionItem[] = [];

  for (const inc of inconsistencies) {
    const dominant = inc.variants.reduce((a, b) => a.count > b.count ? a : b);

    items.push({
      id: `ACT-${inc.id}`,
      priority: inc.severity === 'high' ? 1 : inc.severity === 'medium' ? 2 : 3,
      type: 'fix_inconsistency',
      title: `Standardize: ${inc.title}`,
      reason: inc.description,
      effort: inc.variants.reduce((sum, v) => sum + v.count, 0) > 10 ? 'high' : 'medium',
      steps: [
        {
          order: 1,
          instruction: `Adopt "${dominant.approach}" as the standard (most commonly used: ${dominant.count} instances)`
        },
        ...inc.variants
          .filter(v => v.approach !== dominant.approach)
          .map((v, i) => ({
            order: i + 2,
            instruction: `Convert ${v.count} instance(s) of "${v.approach}" to "${dominant.approach}"`
          }))
      ],
      acceptPrompt: `Shall I refactor to use "${dominant.approach}" consistently?`
    });
  }

  for (const sug of suggestions) {
    items.push({
      id: `ACT-${sug.id}`,
      priority: sug.priority === 'high' ? 1 : sug.priority === 'medium' ? 2 : 3,
      type: sug.action.type === 'refactor' ? 'refactor' : 'implement_pattern',
      title: sug.title,
      reason: sug.suggestedApproach.why,
      effort: sug.action.steps.length > 4 ? 'high' : sug.action.steps.length > 2 ? 'medium' : 'low',
      steps: sug.action.steps.map((step, i) => ({
        order: i + 1,
        instruction: step,
        code: i === 0 && sug.action.codeChange ? {
          action: 'replace' as const,
          target: sug.action.codeChange.before,
          content: sug.action.codeChange.after
        } : undefined
      })),
      acceptPrompt: `Would you like me to implement the ${sug.suggestedApproach.name}?`
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
}

export function analyzePatterns(
  code: string,
  filename: string,
  level: PatternLevel = 'all'
): PatternAnalysisResult {
  let detected = detectPatterns(code);
  let inconsistencies = detectInconsistencies(code);

  if (level !== 'all') {
    detected = detected.filter(p => p.level === level);
    inconsistencies = inconsistencies.filter(i => i.level === level);
  }

  const suggestions = generateSuggestions(code, detected)
    .filter(s => level === 'all' || s.level === level);

  const actionItems = generateActionItems(inconsistencies, suggestions);

  const totalVariants = inconsistencies.reduce((sum, i) => sum + i.variants.length, 0);
  const overallConsistency: 'high' | 'medium' | 'low' =
    inconsistencies.length === 0 ? 'high' :
    inconsistencies.length <= 2 && totalVariants <= 6 ? 'medium' : 'low';

  return {
    level,
    summary: {
      patternsDetected: detected.length,
      inconsistencies: inconsistencies.length,
      suggestions: suggestions.length,
      overallConsistency
    },
    detectedPatterns: detected,
    inconsistencies,
    suggestions,
    actionItems
  };
}

export function inferLevelFromQuery(query: string): PatternLevel | null {
  const lower = query.toLowerCase();

  if (/architect|structure|layer|module|organization/.test(lower)) {
    return 'architectural';
  }
  if (/design pattern|factory|singleton|observer|strategy|builder|injection/.test(lower)) {
    return 'design';
  }
  if (/code style|async|error handling|naming|function|variable/.test(lower)) {
    return 'code';
  }
  if (/all|everything|full|complete/.test(lower)) {
    return 'all';
  }

  return null;
}

// Design pattern specific analysis
export interface DesignPatternResult {
  patterns: Array<{
    id: string;
    name: string;
    confidence: 'high' | 'medium' | 'low';
    description: string;
    locations: Array<{ line: number; code: string }>;
    relatedPatterns?: string[];
  }>;
  suggestions: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    currentApproach: string;
    suggestedPattern: string;
    why: string;
    benefits: string[];
    tradeoffs: string[];
    example: string;
  }>;
  actionItems: Array<{
    id: string;
    priority: 1 | 2 | 3;
    type: 'implement_pattern' | 'refactor' | 'consider';
    title: string;
    reason: string;
    effort: 'low' | 'medium' | 'high';
    steps: Array<{ order: number; instruction: string }>;
    acceptPrompt: string;
  }>;
  summary: {
    patternsDetected: number;
    suggestionsCount: number;
    dominantPatterns: string[];
    missingPatterns: string[];
  };
}

export function analyzeDesignPatterns(code: string, filename: string): DesignPatternResult {
  const detected = detectPatterns(code).filter(p => p.level === 'design');
  const suggestions = generateSuggestions(code, detected).filter(s => s.level === 'design');

  const actionItems: DesignPatternResult['actionItems'] = suggestions.map(sug => ({
    id: `ACT-${sug.id}`,
    priority: sug.priority === 'high' ? 1 : sug.priority === 'medium' ? 2 : 3,
    type: sug.action.type === 'refactor' ? 'refactor' as const :
          sug.action.type === 'consider' ? 'consider' as const : 'implement_pattern' as const,
    title: sug.title,
    reason: sug.suggestedApproach.why,
    effort: sug.action.steps.length > 4 ? 'high' as const :
            sug.action.steps.length > 2 ? 'medium' as const : 'low' as const,
    steps: sug.action.steps.map((step, i) => ({
      order: i + 1,
      instruction: step
    })),
    acceptPrompt: `Would you like me to implement the ${sug.suggestedApproach.name}?`
  }));

  const designPatternNames = patternMatchers
    .filter(p => p.level === 'design')
    .map(p => p.name);

  const detectedNames = detected.map(d => d.name);
  const missingPatterns = designPatternNames.filter(name => !detectedNames.includes(name));

  const dominantPatterns = detected
    .filter(p => p.confidence === 'high' || p.locations.length >= 3)
    .map(p => p.name);

  return {
    patterns: detected.map(p => ({
      id: p.id,
      name: p.name,
      confidence: p.confidence,
      description: p.description,
      locations: p.locations,
      relatedPatterns: getRelatedPatterns(p.name)
    })),
    suggestions: suggestions.map(s => ({
      id: s.id,
      title: s.title,
      priority: s.priority,
      currentApproach: s.currentApproach.name,
      suggestedPattern: s.suggestedApproach.name,
      why: s.suggestedApproach.why,
      benefits: s.suggestedApproach.benefits,
      tradeoffs: s.suggestedApproach.tradeoffs,
      example: s.suggestedApproach.example
    })),
    actionItems,
    summary: {
      patternsDetected: detected.length,
      suggestionsCount: suggestions.length,
      dominantPatterns,
      missingPatterns
    }
  };
}

function getRelatedPatterns(patternName: string): string[] {
  const relationships: Record<string, string[]> = {
    'Factory Pattern': ['Builder Pattern', 'Singleton Pattern'],
    'Singleton Pattern': ['Factory Pattern', 'Dependency Injection'],
    'Observer/Event Pattern': ['Strategy Pattern'],
    'Strategy Pattern': ['Factory Pattern', 'Dependency Injection'],
    'Builder Pattern': ['Factory Pattern'],
    'Dependency Injection': ['Factory Pattern', 'Strategy Pattern']
  };
  return relationships[patternName] || [];
}

export function formatDesignAnalysis(result: DesignPatternResult): string {
  return JSON.stringify(result, null, 2);
}
