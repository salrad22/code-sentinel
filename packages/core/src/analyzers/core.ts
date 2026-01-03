// Core analyzer - uses compiled patterns from the data-driven system

import { Issue, Category } from '../types.js';
import { getCompiledPatterns, CompiledPattern } from '../patterns/index.js';

// Analyze code using compiled patterns
export function analyzeWithPatterns(
  code: string,
  filename: string,
  category: Category
): Issue[] {
  const issues: Issue[] = [];
  const lines = code.split('\n');
  const compiledPatterns = getCompiledPatterns(category);

  for (const pattern of compiledPatterns) {
    for (const regex of pattern.patterns) {
      // Reset regex state for global patterns
      regex.lastIndex = 0;

      let match;
      while ((match = regex.exec(code)) !== null) {
        // Calculate line number
        const beforeMatch = code.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const lineContent = lines[lineNumber - 1] || '';
        const matchedValue = match[0];

        // Build verification with actual values substituted
        let verification = pattern.verification;
        if (verification) {
          verification = {
            ...verification,
            commands: verification.commands?.map(cmd =>
              cmd
                .replace(/<matched_value>/g, matchedValue.substring(0, 20) + '...')
                .replace(/<filename>/g, filename)
            )
          };
        }

        issues.push({
          id: pattern.id,
          category: pattern.category,
          severity: pattern.severity,
          title: pattern.title,
          description: pattern.description,
          line: lineNumber,
          code: lineContent.trim(),
          suggestion: pattern.suggestion,
          verification
        });

        // Prevent infinite loops for patterns without global flag
        if (!regex.global) break;
      }
    }
  }

  return issues;
}

// Convenience functions for each category
export function analyzeSecurityWithPatterns(code: string, filename: string): Issue[] {
  return analyzeWithPatterns(code, filename, 'security');
}

export function analyzeDeceptiveWithPatterns(code: string, filename: string): Issue[] {
  return analyzeWithPatterns(code, filename, 'deceptive');
}

export function analyzePlaceholdersWithPatterns(code: string, filename: string): Issue[] {
  return analyzeWithPatterns(code, filename, 'placeholder');
}

export function analyzeErrorsWithPatterns(code: string, filename: string): Issue[] {
  return analyzeWithPatterns(code, filename, 'error');
}

// Analyze all categories at once
export function analyzeAllWithPatterns(code: string, filename: string): Issue[] {
  return [
    ...analyzeSecurityWithPatterns(code, filename),
    ...analyzeDeceptiveWithPatterns(code, filename),
    ...analyzePlaceholdersWithPatterns(code, filename),
    ...analyzeErrorsWithPatterns(code, filename),
  ];
}
