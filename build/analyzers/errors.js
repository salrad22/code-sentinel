// Error pattern analyzer - uses data-driven pattern system
// This file now delegates to the core analyzer with compiled patterns
import { analyzeErrorsWithPatterns } from './core.js';
// Main export - uses the data-driven pattern system
export function analyzeErrors(code, filename) {
    return analyzeErrorsWithPatterns(code, filename);
}
