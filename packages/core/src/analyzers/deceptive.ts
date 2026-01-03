// Deceptive pattern analyzer - uses data-driven pattern system
// This file now delegates to the core analyzer with compiled patterns

import { Issue } from '../types.js';
import { analyzeDeceptiveWithPatterns } from './core.js';

// Main export - uses the data-driven pattern system
export function analyzeDeceptivePatterns(code: string, filename: string): Issue[] {
  return analyzeDeceptiveWithPatterns(code, filename);
}
