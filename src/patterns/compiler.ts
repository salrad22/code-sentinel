// Pattern compiler - transforms definitions into executable patterns

import { PatternDefinition, CompiledPattern } from './types.js';
import { buildPattern } from './builders.js';
import {
  securityDefinitions,
  deceptiveDefinitions,
  placeholderDefinitions,
  errorDefinitions,
} from './definitions/index.js';
import { Category } from '../types.js';

// Cache for compiled patterns
let compiledCache: Map<Category, CompiledPattern[]> | null = null;

// Compile a single pattern definition
export function compileDefinition(definition: PatternDefinition): CompiledPattern {
  const patterns = buildPattern(definition.match);

  return {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    severity: definition.severity,
    category: definition.category,
    suggestion: definition.suggestion,
    patterns,
    verification: definition.verification,
  };
}

// Compile all definitions of a specific category
export function compileCategory(definitions: PatternDefinition[]): CompiledPattern[] {
  return definitions.map(compileDefinition);
}

// Get all compiled patterns, optionally filtered by category
export function getCompiledPatterns(category?: Category): CompiledPattern[] {
  // Build cache if needed
  if (!compiledCache) {
    compiledCache = new Map();
    compiledCache.set('security', compileCategory(securityDefinitions));
    compiledCache.set('deceptive', compileCategory(deceptiveDefinitions));
    compiledCache.set('placeholder', compileCategory(placeholderDefinitions));
    compiledCache.set('error', compileCategory(errorDefinitions));
  }

  if (category) {
    return compiledCache.get(category) || [];
  }

  // Return all patterns
  const all: CompiledPattern[] = [];
  for (const patterns of compiledCache.values()) {
    all.push(...patterns);
  }
  return all;
}

// Clear the cache (useful for testing or hot reload)
export function clearPatternCache(): void {
  compiledCache = null;
}

// Get raw definitions (for inspection/debugging)
export function getDefinitions(category?: Category): PatternDefinition[] {
  const allDefs: Record<Category, PatternDefinition[]> = {
    security: securityDefinitions,
    deceptive: deceptiveDefinitions,
    placeholder: placeholderDefinitions,
    error: errorDefinitions,
    strength: [], // Strengths use a different system
  };

  if (category) {
    return allDefs[category] || [];
  }

  return [
    ...securityDefinitions,
    ...deceptiveDefinitions,
    ...placeholderDefinitions,
    ...errorDefinitions,
  ];
}

// Validate all definitions (for testing)
export function validateDefinitions(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allDefs = getDefinitions();
  const ids = new Set<string>();

  for (const def of allDefs) {
    // Check for duplicate IDs
    if (ids.has(def.id)) {
      errors.push(`Duplicate pattern ID: ${def.id}`);
    }
    ids.add(def.id);

    // Try to compile and check for errors
    try {
      const compiled = compileDefinition(def);
      if (compiled.patterns.length === 0) {
        errors.push(`Pattern ${def.id} compiled to zero regex patterns`);
      }
    } catch (e) {
      errors.push(`Pattern ${def.id} failed to compile: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Stats about patterns
export function getPatternStats(): {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
} {
  const allDefs = getDefinitions();
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const def of allDefs) {
    byCategory[def.category] = (byCategory[def.category] || 0) + 1;
    bySeverity[def.severity] = (bySeverity[def.severity] || 0) + 1;
  }

  return {
    total: allDefs.length,
    byCategory,
    bySeverity,
  };
}
