// Deceptive pattern analyzer - uses data-driven pattern system
// This file now delegates to the core analyzer with compiled patterns
import { analyzeDeceptiveWithPatterns } from './core.js';
// Main export - uses the data-driven pattern system
export function analyzeDeceptivePatterns(code, filename) {
    return analyzeDeceptiveWithPatterns(code, filename);
}
