// Core exports for CodeSentinel

// Types
export * from './types.js';

// Analyzers
export { analyzeSecurityIssues } from './analyzers/security.js';
export { analyzeDeceptivePatterns } from './analyzers/deceptive.js';
export { analyzePlaceholders } from './analyzers/placeholders.js';
export { analyzeErrors } from './analyzers/errors.js';
export { analyzeStrengths } from './analyzers/strengths.js';
export {
  analyzePatterns,
  analyzeDesignPatterns,
  formatDesignAnalysis,
  inferLevelFromQuery,
  type PatternLevel
} from './analyzers/patterns.js';
export {
  analyzeWithPatterns,
  analyzeSecurityWithPatterns,
  analyzeDeceptiveWithPatterns,
  analyzePlaceholdersWithPatterns,
  analyzeErrorsWithPatterns,
  analyzeAllWithPatterns
} from './analyzers/core.js';

// Pattern system
export {
  getDefinitions,
  getPatternStats,
  getCompiledPatterns,
  compileDefinition,
  compileCategory,
  clearPatternCache,
  validateDefinitions
} from './patterns/index.js';
export type {
  PatternDefinition,
  CompiledPattern,
  MatchConfig,
  MatchType
} from './patterns/types.js';

// Report generation
export { generateHtmlReport } from './report.js';
