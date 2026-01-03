// Pattern builders - transform declarative configs into regex

import {
  MatchConfig,
  EmptyBlockConfig,
  FunctionCallConfig,
  ReturnsOnlyConfig,
  ContainsTextConfig,
  FallbackValueConfig,
  AssignmentPatternConfig,
  ChainedAccessConfig,
  CatchHandlerConfig,
  PromiseCatchConfig,
  CommentMarkerConfig,
  StringLiteralConfig,
  SecretPatternConfig,
  UrlPatternConfig,
  SuppressionCommentConfig,
  TypeCastConfig,
  ComparisonConfig,
  LoopPatternConfig,
  RawRegexConfig,
} from './types.js';

// Utility: escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Utility: convert value shorthand to regex pattern
function valueToPattern(value: string): string {
  const valueMap: Record<string, string> = {
    '[]': '\\[\\s*\\]',
    '{}': '\\{\\s*\\}',
    'null': 'null',
    'undefined': 'undefined',
    'true': 'true',
    'false': 'false',
    '""': '["\']\\s*["\']',
    "''": '["\']\\s*["\']',
    '0': '0',
    '-1': '-1',
  };
  return valueMap[value] || escapeRegex(value);
}

// Builder: Empty blocks (catch, finally, .catch, .then)
export function buildEmptyBlock(config: EmptyBlockConfig): RegExp[] {
  const results: RegExp[] = [];

  for (const construct of config.constructs) {
    if (construct === 'catch') {
      // try-catch style: catch(e) { }
      results.push(/catch\s*\([^)]*\)\s*\{\s*\}/g);
      if (config.allowComments) {
        results.push(/catch\s*\([^)]*\)\s*\{\s*\/\/[^\n]*\s*\}/g);
        results.push(/catch\s*\([^)]*\)\s*\{\s*\/\*[\s\S]*?\*\/\s*\}/g);
      }
    }

    if (construct === 'finally') {
      results.push(/finally\s*\{\s*\}/g);
    }

    if (construct === '.catch') {
      // Promise style: .catch(() => {})
      results.push(/\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g);
      results.push(/\.catch\s*\(\s*\w+\s*=>\s*\{\s*\}\s*\)/g);
      results.push(/\.catch\s*\(\s*function\s*\([^)]*\)\s*\{\s*\}\s*\)/g);
    }

    if (construct === '.then') {
      results.push(/\.then\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g);
      results.push(/\.then\s*\(\s*\w+\s*=>\s*\{\s*\}\s*\)/g);
    }

    if (construct === '.finally') {
      results.push(/\.finally\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g);
    }
  }

  return results;
}

// Builder: Function calls
export function buildFunctionCall(config: FunctionCallConfig): RegExp[] {
  const results: RegExp[] = [];
  const escaped = config.names.map(n => escapeRegex(n));
  const namesPattern = escaped.join('|');

  // Direct call: eval(), Function()
  results.push(new RegExp(`\\b(${namesPattern})\\s*\\(`, 'gi'));

  // Method call: obj.eval() if enabled
  if (config.methods) {
    results.push(new RegExp(`\\.(${namesPattern})\\s*\\(`, 'gi'));
  }

  // Constructor: new Function() if enabled
  if (config.constructors) {
    results.push(new RegExp(`new\\s+(${namesPattern})\\s*\\(`, 'gi'));
  }

  return results;
}

// Builder: Return statements with specific values
export function buildReturnsOnly(config: ReturnsOnlyConfig): RegExp[] {
  const results: RegExp[] = [];
  const valuePatterns = config.values.map(valueToPattern);
  const valuesPattern = valuePatterns.join('|');

  if (config.withComment && config.withComment.length > 0) {
    // return value; // comment with specific words
    const commentWords = config.withComment.join('|');
    results.push(
      new RegExp(`return\\s+(${valuesPattern})\\s*;?\\s*\\/\\/\\s*(?:.*?)(${commentWords})`, 'gi')
    );
  } else {
    // Just return value;
    results.push(new RegExp(`return\\s+(${valuesPattern})\\s*;?`, 'gi'));
  }

  return results;
}

// Builder: Text search in context
export function buildContainsText(config: ContainsTextConfig): RegExp[] {
  const results: RegExp[] = [];
  const flags = config.caseInsensitive !== false ? 'gi' : 'g';
  const termsPattern = config.terms.map(escapeRegex).join('|');

  const context = config.context || 'any';

  if (context === 'single_line_comment' || context === 'comment' || context === 'any') {
    results.push(new RegExp(`\\/\\/.*?(${termsPattern})`, flags));
  }

  if (context === 'block_comment' || context === 'comment' || context === 'any') {
    results.push(new RegExp(`\\/\\*[\\s\\S]*?(${termsPattern})[\\s\\S]*?\\*\\/`, flags));
  }

  if (context === 'string' || context === 'any') {
    results.push(new RegExp(`(['"\`])[^'"\`]*(${termsPattern})[^'"\`]*\\1`, flags));
  }

  return results;
}

// Builder: Fallback values
export function buildFallbackValue(config: FallbackValueConfig): RegExp[] {
  const results: RegExp[] = [];
  const valuePatterns = config.values.map(valueToPattern);
  const valuesPattern = valuePatterns.join('|');

  for (const op of config.operators) {
    const escapedOp = escapeRegex(op);
    results.push(new RegExp(`${escapedOp}\\s*(${valuesPattern})`, 'g'));
  }

  return results;
}

// Builder: Assignment patterns
export function buildAssignmentPattern(config: AssignmentPatternConfig): RegExp[] {
  const results: RegExp[] = [];
  const keysPattern = config.keys.map(escapeRegex).join('|');
  const operators = config.operators || ['=', ':'];

  for (const op of operators) {
    if (config.values && config.values.length > 0) {
      const valuesPattern = config.values.map(escapeRegex).join('|');
      results.push(
        new RegExp(`(?:${keysPattern})\\s*${escapeRegex(op)}\\s*['"\`]([^'"\`]*(?:${valuesPattern})[^'"\`]*)['"\`]`, 'gi')
      );
    } else {
      results.push(
        new RegExp(`(?:${keysPattern})\\s*${escapeRegex(op)}\\s*['"\`][^'"\`]{8,}['"\`]`, 'gi')
      );
    }
  }

  return results;
}

// Builder: Chained access
export function buildChainedAccess(config: ChainedAccessConfig): RegExp[] {
  const op = config.operator === '?.' ? '\\?\\.' : '\\.';
  const pattern = `(?:${op}\\w+){${config.minDepth},}`;
  return [new RegExp(pattern, 'g')];
}

// Builder: Catch handlers
export function buildCatchHandler(config: CatchHandlerConfig): RegExp[] {
  const results: RegExp[] = [];

  switch (config.behavior) {
    case 'empty':
      results.push(/catch\s*\([^)]*\)\s*\{\s*\}/g);
      break;
    case 'comment_only':
      results.push(/catch\s*\([^)]*\)\s*\{\s*\/\/.*?\s*\}/gs);
      results.push(/catch\s*\([^)]*\)\s*\{\s*\/\*[\s\S]*?\*\/\s*\}/g);
      break;
    case 'log_only':
      results.push(/catch\s*\([^)]*\)\s*\{\s*(?:console\.log|print)\s*\([^)]*\)\s*;?\s*\}/g);
      break;
    case 'returns_value':
      results.push(/catch\s*\([^)]*\)\s*\{[^}]*return\s+(?:null|undefined|false|true|''|""|\[\s*\]|\{\s*\})\s*;?\s*\}/g);
      break;
    case 'ignores_error':
      results.push(/catch\s*\(\s*_\s*\)/g);
      break;
  }

  return results;
}

// Builder: Promise catch
export function buildPromiseCatch(config: PromiseCatchConfig): RegExp[] {
  const results: RegExp[] = [];

  switch (config.behavior) {
    case 'empty':
      results.push(/\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g);
      results.push(/\.catch\s*\(\s*\w+\s*=>\s*\{\s*\}\s*\)/g);
      break;
    case 'returns_silent':
      const values = config.silentValues || ['null', 'undefined', 'false', 'true', "''", '""'];
      const valuesPattern = values.map(valueToPattern).join('|');
      results.push(
        new RegExp(`\\.catch\\s*\\(\\s*\\(\\s*\\)\\s*=>\\s*(?:${valuesPattern})\\s*\\)`, 'g')
      );
      break;
    case 'ignores_param':
      results.push(/\.catch\s*\(\s*_\s*=>\s*\{?\s*\}?\s*\)/g);
      break;
  }

  return results;
}

// Builder: Comment markers
export function buildCommentMarker(config: CommentMarkerConfig): RegExp[] {
  const results: RegExp[] = [];
  const markersPattern = config.markers.map(escapeRegex).join('|');
  const style = config.style || 'any';

  if (style === 'single' || style === 'any') {
    results.push(new RegExp(`\\/\\/\\s*(${markersPattern})(?::|\\.|\\s).*$`, 'gim'));
  }

  if (style === 'block' || style === 'any') {
    results.push(new RegExp(`\\/\\*[\\s\\S]*?(${markersPattern})[\\s\\S]*?\\*\\/`, 'gi'));
  }

  return results;
}

// Builder: String literals
export function buildStringLiteral(config: StringLiteralConfig): RegExp[] {
  const flags = config.caseInsensitive ? 'gi' : 'g';
  const patternsJoined = config.patterns.map(escapeRegex).join('|');
  return [new RegExp(`['"\`](?:[^'"\`]*)?(${patternsJoined})(?:[^'"\`]*)?['"\`]`, flags)];
}

// Builder: Secret patterns
export function buildSecretPattern(config: SecretPatternConfig): RegExp[] {
  const results: RegExp[] = [];

  switch (config.kind) {
    case 'generic':
      results.push(
        /(?:api[_-]?key|apikey|secret|password|passwd|pwd|token|auth[_-]?token|access[_-]?token|private[_-]?key)\s*[:=]\s*['"`][^'"`]{8,}['"`]/gi
      );
      break;
    case 'github':
      results.push(/(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/g);
      break;
    case 'openai':
      results.push(/sk-[A-Za-z0-9]{48,}/g);
      break;
    case 'aws':
      results.push(/AKIA[0-9A-Z]{16}/g);
      break;
    case 'stripe':
      results.push(/sk_(?:live|test)_[A-Za-z0-9]{24,}/g);
      results.push(/pk_(?:live|test)_[A-Za-z0-9]{24,}/g);
      break;
    case 'custom':
      if (config.customPattern) {
        results.push(new RegExp(config.customPattern, 'g'));
      }
      break;
  }

  return results;
}

// Builder: URL patterns
export function buildUrlPattern(config: UrlPatternConfig): RegExp[] {
  const results: RegExp[] = [];
  const protocol = config.protocol || 'any';

  if (protocol === 'http' || protocol === 'any') {
    if (config.excludeLocalhost) {
      results.push(/http:\/\/(?!localhost|127\.0\.0\.1)[^\s'"`)]+/g);
    } else {
      results.push(/http:\/\/[^\s'"`)]+/g);
    }
  }

  if (protocol === 'https' || protocol === 'any') {
    results.push(/https:\/\/[^\s'"`)]+/g);
  }

  return results;
}

// Builder: Suppression comments
export function buildSuppressionComment(config: SuppressionCommentConfig): RegExp[] {
  const toolsPattern = config.tools.map(escapeRegex).join('|');
  return [new RegExp(`\\/\\/\\s*(?:@)?(${toolsPattern})`, 'g')];
}

// Builder: Type casts
export function buildTypeCast(config: TypeCastConfig): RegExp[] {
  const targetsPattern = config.targets.map(escapeRegex).join('|');
  return [new RegExp(`as\\s+(${targetsPattern})(?!\\w)`, 'g')];
}

// Builder: Comparison
export function buildComparison(config: ComparisonConfig): RegExp[] {
  const results: RegExp[] = [];

  for (const op of config.operators) {
    if (op === '==') {
      results.push(/[^!=]==[^=]/g);
    } else if (op === '!=') {
      results.push(/!=[^=]/g);
    } else if (op === '===') {
      results.push(/===/g);
    } else if (op === '!==') {
      results.push(/!==/g);
    }
  }

  return results;
}

// Builder: Loop patterns
export function buildLoopPattern(config: LoopPatternConfig): RegExp[] {
  const results: RegExp[] = [];

  switch (config.kind) {
    case 'for_in':
      results.push(/for\s*\(\s*(?:var|let|const)\s+\w+\s+in\s+/g);
      break;
    case 'while_true':
      results.push(/while\s*\(\s*true\s*\)/g);
      break;
    case 'infinite':
      results.push(/while\s*\(\s*true\s*\)/g);
      results.push(/for\s*\(\s*;\s*;\s*\)/g);
      break;
  }

  return results;
}

// Builder: Raw regex (escape hatch)
export function buildRawRegex(config: RawRegexConfig): RegExp[] {
  return [new RegExp(config.pattern, config.flags || 'g')];
}

// Main dispatcher: convert any MatchConfig to RegExp[]
export function buildPattern(config: MatchConfig): RegExp[] {
  switch (config.type) {
    case 'empty_block':
      return buildEmptyBlock(config);
    case 'function_call':
      return buildFunctionCall(config);
    case 'returns_only':
      return buildReturnsOnly(config);
    case 'contains_text':
      return buildContainsText(config);
    case 'fallback_value':
      return buildFallbackValue(config);
    case 'assignment_pattern':
      return buildAssignmentPattern(config);
    case 'chained_access':
      return buildChainedAccess(config);
    case 'catch_handler':
      return buildCatchHandler(config);
    case 'promise_catch':
      return buildPromiseCatch(config);
    case 'comment_marker':
      return buildCommentMarker(config);
    case 'string_literal':
      return buildStringLiteral(config);
    case 'secret_pattern':
      return buildSecretPattern(config);
    case 'url_pattern':
      return buildUrlPattern(config);
    case 'suppression_comment':
      return buildSuppressionComment(config);
    case 'type_cast':
      return buildTypeCast(config);
    case 'comparison':
      return buildComparison(config);
    case 'loop_pattern':
      return buildLoopPattern(config);
    case 'raw_regex':
      return buildRawRegex(config);
    default:
      console.warn(`Unknown match type: ${(config as MatchConfig).type}`);
      return [];
  }
}
