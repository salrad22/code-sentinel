// Deceptive pattern definitions - code that hides errors or creates false confidence

import { PatternDefinition } from '../types.js';

export const deceptiveDefinitions: PatternDefinition[] = [
  // Empty catch blocks
  {
    id: 'CS-DEC001',
    title: 'Empty Catch Block',
    description: 'Silently swallowing errors makes debugging impossible.',
    severity: 'high',
    category: 'deceptive',
    suggestion: 'At minimum, log the error. Better: handle it appropriately or rethrow.',
    match: {
      type: 'catch_handler',
      behavior: 'empty'
    }
  },
  {
    id: 'CS-DEC002',
    title: 'Catch Block with Only Comments',
    description: 'A catch block with only comments still swallows errors.',
    severity: 'high',
    category: 'deceptive',
    suggestion: 'Add actual error handling, not just comments.',
    match: {
      type: 'catch_handler',
      behavior: 'comment_only'
    }
  },
  {
    id: 'CS-DEC003',
    title: 'Catch with Only Console.log',
    description: 'Logging alone does not handle the error - execution continues as if nothing happened.',
    severity: 'medium',
    category: 'deceptive',
    suggestion: 'Decide: should execution continue? Add recovery logic or rethrow.',
    match: {
      type: 'catch_handler',
      behavior: 'log_only'
    }
  },

  // Silent promise rejections
  {
    id: 'CS-DEC010',
    title: 'Empty Promise Catch',
    description: 'Silently ignoring promise rejections hides async errors.',
    severity: 'high',
    category: 'deceptive',
    suggestion: 'Handle the rejection or let it propagate for proper error handling.',
    match: {
      type: 'promise_catch',
      behavior: 'empty'
    }
  },
  {
    id: 'CS-DEC011',
    title: 'Promise Catch Returns Silent Value',
    description: "Returning a value from catch masks the error - callers won't know something failed.",
    severity: 'high',
    category: 'deceptive',
    suggestion: 'Return a distinguishable error state or rethrow.',
    match: {
      type: 'promise_catch',
      behavior: 'returns_silent',
      silentValues: ['null', 'undefined', 'false', 'true', "''", '""']
    }
  },
  {
    id: 'CS-DEC012',
    title: 'Catch with Ignored Error Parameter',
    description: 'Using _ for error parameter signals intentional ignore - but is it really safe to ignore?',
    severity: 'medium',
    category: 'deceptive',
    suggestion: 'Document why ignoring this error is safe, or handle it.',
    match: {
      type: 'promise_catch',
      behavior: 'ignores_param'
    }
  },

  // Fallback values that mask failures
  {
    id: 'CS-DEC020',
    title: 'Empty Array Fallback',
    description: 'Falling back to [] can mask failed data fetching - code continues as if data was empty.',
    severity: 'medium',
    category: 'deceptive',
    suggestion: 'Distinguish between "no data" and "failed to fetch". Consider throwing or returning null.',
    match: {
      type: 'fallback_value',
      operators: ['||'],
      values: ['[]']
    }
  },
  {
    id: 'CS-DEC021',
    title: 'Empty Object Fallback',
    description: 'Falling back to {} can hide parsing or fetching failures.',
    severity: 'medium',
    category: 'deceptive',
    suggestion: 'Handle the undefined/null case explicitly rather than masking it.',
    match: {
      type: 'fallback_value',
      operators: ['||'],
      values: ['{}']
    }
  },
  {
    id: 'CS-DEC022',
    title: 'Nullish Coalescing to Empty Value',
    description: 'Defaulting to empty values with ?? can mask null responses that indicate errors.',
    severity: 'low',
    category: 'deceptive',
    suggestion: 'Verify that null/undefined truly means "use default" vs "something went wrong".',
    match: {
      type: 'fallback_value',
      operators: ['??'],
      values: ['[]', '{}', "''", '""']
    }
  },

  // Optional chaining abuse
  {
    id: 'CS-DEC030',
    title: 'Excessive Optional Chaining',
    description: 'Deep optional chaining (4+ levels) often masks structural problems or missing validation.',
    severity: 'medium',
    category: 'deceptive',
    suggestion: 'Validate data shape upfront rather than optional-chaining through uncertain structures.',
    match: {
      type: 'chained_access',
      minDepth: 4,
      operator: '?.'
    }
  },

  // Error-hiding returns
  {
    id: 'CS-DEC040',
    title: 'Silent Error Return',
    description: 'Returning null/false on error with a comment - callers may not check for this.',
    severity: 'high',
    category: 'deceptive',
    suggestion: 'Throw an error or return a Result/Either type that forces handling.',
    match: {
      type: 'returns_only',
      values: ['null', 'undefined', 'false'],
      withComment: ['error', 'fail', 'todo', 'fixme']
    }
  },
  {
    id: 'CS-DEC041',
    title: 'Silent Return on Error',
    description: 'Returning silently when an error is detected - no logging, no propagation.',
    severity: 'high',
    category: 'deceptive',
    suggestion: 'Log the error or throw it. Silent returns make debugging a nightmare.',
    match: {
      type: 'raw_regex',
      pattern: 'if\\s*\\([^)]*error[^)]*\\)\\s*\\{\\s*return\\s*;?\\s*\\}',
      flags: 'gi'
    }
  },

  // Timeout-based "fixes"
  {
    id: 'CS-DEC050',
    title: 'Timeout as Error Workaround',
    description: 'Using setTimeout to "fix" timing issues often masks race conditions.',
    severity: 'medium',
    category: 'deceptive',
    suggestion: 'Fix the underlying race condition. Use proper async coordination.',
    match: {
      type: 'raw_regex',
      pattern: 'setTimeout\\s*\\([^,]+,\\s*\\d+\\s*\\)\\s*;?\\s*\\/\\/.*?(?:fix|hack|workaround|retry)',
      flags: 'gi'
    }
  },

  // Suppressed warnings/errors
  {
    id: 'CS-DEC060',
    title: 'Linter/Type Check Suppression',
    description: 'Suppressing type errors or linter warnings may hide real issues.',
    severity: 'low',
    category: 'deceptive',
    suggestion: 'Fix the underlying issue. If suppression is needed, document why.',
    match: {
      type: 'suppression_comment',
      tools: ['ts-ignore', 'ts-expect-error', 'eslint-disable', 'noqa']
    }
  },
  {
    id: 'CS-DEC061',
    title: 'TypeScript "as any" Cast',
    description: "Casting to any defeats TypeScript's type safety.",
    severity: 'medium',
    category: 'deceptive',
    suggestion: 'Use proper type definitions or unknown with type guards.',
    match: {
      type: 'type_cast',
      targets: ['any']
    }
  },

  // Fake success responses
  {
    id: 'CS-DEC070',
    title: 'Fake Success Response',
    description: 'Returning success without actually doing the work.',
    severity: 'critical',
    category: 'deceptive',
    suggestion: 'Implement the actual functionality or return an honest error.',
    match: {
      type: 'raw_regex',
      pattern: 'return\\s*\\{\\s*(?:success|ok|status)\\s*:\\s*true[^}]*\\}\\s*;?\\s*\\/\\/.*?(?:todo|fixme|hack)',
      flags: 'gi'
    }
  },

  // Console.error without throwing
  {
    id: 'CS-DEC080',
    title: 'console.error Without Throw',
    description: 'Logging an error but continuing execution - the error may not be handled.',
    severity: 'low',
    category: 'deceptive',
    suggestion: 'Consider if execution should continue. If not, throw after logging.',
    match: {
      type: 'raw_regex',
      pattern: 'console\\.error\\s*\\([^)]+\\)\\s*;?\\s*(?!\\s*throw)',
      flags: 'g'
    }
  }
];
