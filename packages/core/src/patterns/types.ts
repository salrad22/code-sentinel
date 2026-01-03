// Types for data-driven pattern system

import { Severity, Category, Verification } from '../types.js';

// Match configuration types - what kind of pattern to detect
export type MatchType =
  | 'empty_block'
  | 'function_call'
  | 'returns_only'
  | 'contains_text'
  | 'fallback_value'
  | 'assignment_pattern'
  | 'chained_access'
  | 'catch_handler'
  | 'promise_catch'
  | 'comment_marker'
  | 'string_literal'
  | 'secret_pattern'
  | 'url_pattern'
  | 'suppression_comment'
  | 'type_cast'
  | 'comparison'
  | 'loop_pattern'
  | 'raw_regex';

// Base match config
interface BaseMatchConfig {
  type: MatchType;
}

// Empty block: catch(e) {}, finally {}, etc.
export interface EmptyBlockConfig extends BaseMatchConfig {
  type: 'empty_block';
  constructs: string[];  // 'catch', '.catch', 'finally', '.then', '.finally'
  allowComments?: boolean;  // Allow blocks with only comments
}

// Function/method calls: eval(), Function(), document.write()
export interface FunctionCallConfig extends BaseMatchConfig {
  type: 'function_call';
  names: string[];
  methods?: boolean;  // Also match obj.name()
  constructors?: boolean;  // Also match new Name()
}

// Return statements with specific values: return [], return null
export interface ReturnsOnlyConfig extends BaseMatchConfig {
  type: 'returns_only';
  values: string[];  // '[]', '{}', 'null', 'undefined', 'true', 'false', '""', "''", '0'
  withComment?: string[];  // Optional: only match if followed by comment containing these words
}

// Text search in specific contexts
export interface ContainsTextConfig extends BaseMatchConfig {
  type: 'contains_text';
  terms: string[];
  context?: 'comment' | 'string' | 'any' | 'single_line_comment' | 'block_comment';
  caseInsensitive?: boolean;
}

// Fallback patterns: || [], ?? {}, etc.
export interface FallbackValueConfig extends BaseMatchConfig {
  type: 'fallback_value';
  operators: ('||' | '??' | '&&')[];
  values: string[];  // '[]', '{}', '""', "''", 'null', etc.
}

// Assignment patterns: key = value
export interface AssignmentPatternConfig extends BaseMatchConfig {
  type: 'assignment_pattern';
  keys: string[];  // Variable/property name patterns
  values?: string[];  // Optional value patterns
  operators?: ('=' | ':')[];
}

// Chained optional access: a?.b?.c?.d
export interface ChainedAccessConfig extends BaseMatchConfig {
  type: 'chained_access';
  minDepth: number;  // Minimum chain depth to flag
  operator: '?.' | '.';
}

// Catch handlers with specific behavior
export interface CatchHandlerConfig extends BaseMatchConfig {
  type: 'catch_handler';
  behavior: 'empty' | 'comment_only' | 'log_only' | 'returns_value' | 'ignores_error';
}

// Promise catch patterns
export interface PromiseCatchConfig extends BaseMatchConfig {
  type: 'promise_catch';
  behavior: 'empty' | 'returns_silent' | 'ignores_param';
  silentValues?: string[];  // For 'returns_silent'
}

// Comment markers: TODO, FIXME, HACK, etc.
export interface CommentMarkerConfig extends BaseMatchConfig {
  type: 'comment_marker';
  markers: string[];
  style?: 'single' | 'block' | 'any';
}

// String literals containing patterns
export interface StringLiteralConfig extends BaseMatchConfig {
  type: 'string_literal';
  patterns: string[];  // Values to match inside strings
  caseInsensitive?: boolean;
}

// Secret/credential patterns
export interface SecretPatternConfig extends BaseMatchConfig {
  type: 'secret_pattern';
  kind: 'generic' | 'github' | 'openai' | 'aws' | 'stripe' | 'custom';
  customPattern?: string;  // For 'custom' kind
}

// URL patterns
export interface UrlPatternConfig extends BaseMatchConfig {
  type: 'url_pattern';
  protocol?: 'http' | 'https' | 'any';
  excludeLocalhost?: boolean;
}

// Suppression comments: @ts-ignore, eslint-disable
export interface SuppressionCommentConfig extends BaseMatchConfig {
  type: 'suppression_comment';
  tools: string[];  // 'ts-ignore', 'ts-expect-error', 'eslint-disable', 'noqa'
}

// Type casts
export interface TypeCastConfig extends BaseMatchConfig {
  type: 'type_cast';
  targets: string[];  // 'any', 'unknown', etc.
}

// Comparison patterns
export interface ComparisonConfig extends BaseMatchConfig {
  type: 'comparison';
  operators: ('==' | '!=' | '===' | '!==')[];
  strict?: boolean;  // Only match loose (== !=) or strict (=== !==)
}

// Loop patterns
export interface LoopPatternConfig extends BaseMatchConfig {
  type: 'loop_pattern';
  kind: 'for_in' | 'while_true' | 'infinite';
}

// Escape hatch: raw regex for complex patterns
export interface RawRegexConfig extends BaseMatchConfig {
  type: 'raw_regex';
  pattern: string;  // Regex as string
  flags?: string;
}

// Union of all match configs
export type MatchConfig =
  | EmptyBlockConfig
  | FunctionCallConfig
  | ReturnsOnlyConfig
  | ContainsTextConfig
  | FallbackValueConfig
  | AssignmentPatternConfig
  | ChainedAccessConfig
  | CatchHandlerConfig
  | PromiseCatchConfig
  | CommentMarkerConfig
  | StringLiteralConfig
  | SecretPatternConfig
  | UrlPatternConfig
  | SuppressionCommentConfig
  | TypeCastConfig
  | ComparisonConfig
  | LoopPatternConfig
  | RawRegexConfig;

// Pattern definition - the data structure
export interface PatternDefinition {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: Category;
  suggestion?: string;
  match: MatchConfig;
  verification?: Verification;
}

// Compiled pattern - ready to use
export interface CompiledPattern {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: Category;
  suggestion?: string;
  patterns: RegExp[];  // Multiple regex per definition
  verification?: Verification;
}

// Builder function signature
export type PatternBuilder<T extends MatchConfig> = (config: T) => RegExp[];
