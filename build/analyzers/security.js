// Security analyzer - uses data-driven pattern system
// This file now delegates to the core analyzer with compiled patterns
import { analyzeSecurityWithPatterns } from './core.js';
// Main export - uses the data-driven pattern system
export function analyzeSecurityIssues(code, filename) {
    return analyzeSecurityWithPatterns(code, filename);
}
