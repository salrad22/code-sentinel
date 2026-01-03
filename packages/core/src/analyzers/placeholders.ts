// Placeholder analyzer - uses data-driven pattern system
// This file now delegates to the core analyzer with compiled patterns

import { Issue } from '../types.js';
import { analyzePlaceholdersWithPatterns } from './core.js';

// Main export - uses the data-driven pattern system
export function analyzePlaceholders(code: string, filename: string): Issue[] {
  return analyzePlaceholdersWithPatterns(code, filename);
}
