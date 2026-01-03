// Main entry point for the data-driven pattern system

// Re-export types
export type {
  MatchType,
  MatchConfig,
  PatternDefinition,
  CompiledPattern,
  EmptyBlockConfig,
  FunctionCallConfig,
  ReturnsOnlyConfig,
  ContainsTextConfig,
  FallbackValueConfig,
  CatchHandlerConfig,
  PromiseCatchConfig,
  CommentMarkerConfig,
  StringLiteralConfig,
  SecretPatternConfig,
  RawRegexConfig,
} from './types.js';

// Re-export builders
export { buildPattern } from './builders.js';

// Re-export compiler functions
export {
  compileDefinition,
  compileCategory,
  getCompiledPatterns,
  clearPatternCache,
  getDefinitions,
  validateDefinitions,
  getPatternStats,
} from './compiler.js';

// Re-export definitions for direct access
export {
  securityDefinitions,
  deceptiveDefinitions,
  placeholderDefinitions,
  errorDefinitions,
} from './definitions/index.js';
