import { Issue, Pattern, Verification } from '../types.js';

const placeholderPatterns: Pattern[] = [
  // TODO/FIXME comments
  {
    id: 'CS-PH001',
    pattern: /\/\/\s*TODO(?::|\.|\s).*$/gim,
    title: 'TODO Comment Found',
    description: 'Incomplete work marker found in code.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Complete or remove the TODO before shipping.'
  },
  {
    id: 'CS-PH002',
    pattern: /\/\/\s*FIXME(?::|\.|\s).*$/gim,
    title: 'FIXME Comment Found',
    description: 'Known issue marker found - this should be fixed.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Fix the issue or create a ticket to track it.'
  },
  {
    id: 'CS-PH003',
    pattern: /\/\/\s*HACK(?::|\.|\s).*$/gim,
    title: 'HACK Comment Found',
    description: 'Workaround marker found - technical debt.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Document why the hack exists and plan to remove it.'
  },
  {
    id: 'CS-PH004',
    pattern: /\/\/\s*XXX(?::|\.|\s).*$/gim,
    title: 'XXX Comment Found',
    description: 'Attention marker found - requires review.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Address the flagged issue or remove the marker.'
  },

  // Lorem ipsum and dummy text
  {
    id: 'CS-PH010',
    pattern: /lorem\s+ipsum/gi,
    title: 'Lorem Ipsum Placeholder Text',
    description: 'Placeholder text found - replace with real content.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Replace with actual content before release.'
  },
  {
    id: 'CS-PH011',
    pattern: /['"`](?:foo|bar|baz|qux|test|dummy|sample|example|placeholder)['"`]/gi,
    title: 'Common Placeholder Value',
    description: 'Generic placeholder value detected.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Replace with meaningful values.'
  },

  // Test/dummy data
  {
    id: 'CS-PH020',
    pattern: /['"`]test@(?:test|example|dummy|sample)\.[a-z]+['"`]/gi,
    title: 'Test Email Address',
    description: 'Placeholder email found - may not be intended for production.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Remove or replace with proper configuration.'
  },
  {
    id: 'CS-PH021',
    pattern: /['"`](?:123|1234|12345|123456|password|admin|root|test)['"`]/gi,
    title: 'Common Test Password/Value',
    description: 'Potentially insecure placeholder password or test value.',
    severity: 'high',
    category: 'placeholder',
    suggestion: 'Remove test credentials before deployment.'
  },
  {
    id: 'CS-PH022',
    pattern: /(?:localhost|127\.0\.0\.1):\d{4,5}/g,
    title: 'Localhost URL in Code',
    description: 'Hardcoded localhost URL may not work in production.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Use environment variables for URLs.'
  },
  {
    id: 'CS-PH023',
    pattern: /['"`](?:xxx|yyy|zzz|aaa|bbb|ccc)['"`]/gi,
    title: 'Placeholder String Pattern',
    description: 'Obvious placeholder pattern detected.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Replace with actual values.'
  },

  // Fake/test phone numbers
  {
    id: 'CS-PH030',
    pattern: /['"`](?:\+1)?[\s-]?555[\s-]?\d{3}[\s-]?\d{4}['"`]/g,
    title: 'Test Phone Number (555)',
    description: 'The 555 prefix is reserved for fictional use.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Use proper phone number handling or config.'
  },
  {
    id: 'CS-PH031',
    pattern: /['"`](?:000[-\s]?00[-\s]?0000|111[-\s]?11[-\s]?1111|123[-\s]?45[-\s]?6789)['"`]/g,
    title: 'Obviously Fake ID Number',
    description: 'Placeholder ID number pattern detected.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Remove test data before production.'
  },

  // Incomplete implementations
  {
    id: 'CS-PH040',
    pattern: /throw\s+new\s+Error\s*\(\s*['"`](?:not\s+implemented|todo|implement\s+me|coming\s+soon)['"`]\s*\)/gi,
    title: 'Not Implemented Error',
    description: 'Function explicitly marked as not implemented.',
    severity: 'high',
    category: 'placeholder',
    suggestion: 'Implement the function or remove the dead code.'
  },
  {
    id: 'CS-PH041',
    pattern: /(?:return|=)\s*['"`](?:TBD|TBA|N\/A|pending|placeholder)['"`]/gi,
    title: 'TBD/Placeholder Return Value',
    description: 'Code returns a placeholder instead of real value.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Implement actual logic or handle the case properly.'
  },

  // Debug/test code
  {
    id: 'CS-PH050',
    pattern: /console\.log\s*\(\s*['"`](?:debug|test|here|working|checkpoint|\d+)['"`]\s*\)/gi,
    title: 'Debug Console.log',
    description: 'Debug logging statement left in code.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Remove debug statements or use a proper logger.'
  },
  {
    id: 'CS-PH051',
    pattern: /debugger\s*;/g,
    title: 'Debugger Statement',
    description: 'Debugger statement will pause execution in browser.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Remove debugger statements before committing.'
  },
  {
    id: 'CS-PH052',
    pattern: /alert\s*\(\s*['"`](?:test|debug|here|working)['"`]\s*\)/gi,
    title: 'Debug Alert',
    description: 'Debug alert left in code.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Remove debug alerts.'
  },

  // Commented out code blocks
  {
    id: 'CS-PH060',
    pattern: /\/\/\s*(?:const|let|var|function|class|if|for|while|return)\s+\w+/g,
    title: 'Commented Out Code',
    description: 'Code appears to be commented out rather than deleted.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Remove dead code - use version control to recover if needed.'
  },

  // Hardcoded test IDs
  {
    id: 'CS-PH070',
    pattern: /['"`](?:test-id|test_id|testid|fake-id|temp-id)['"`]/gi,
    title: 'Test ID in Code',
    description: 'Hardcoded test ID found.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Use proper ID generation or configuration.'
  }
];

export function analyzePlaceholders(code: string, filename: string): Issue[] {
  const issues: Issue[] = [];
  const lines = code.split('\n');

  for (const patternDef of placeholderPatterns) {
    patternDef.pattern.lastIndex = 0;

    let match;
    while ((match = patternDef.pattern.exec(code)) !== null) {
      const beforeMatch = code.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      const lineContent = lines[lineNumber - 1] || '';

      // Build verification with actual values substituted
      let verification = patternDef.verification;
      if (verification) {
        verification = {
          ...verification,
          commands: verification.commands?.map(cmd =>
            cmd.replace(/<filename>/g, filename)
          )
        };
      }

      issues.push({
        id: patternDef.id,
        category: patternDef.category,
        severity: patternDef.severity,
        title: patternDef.title,
        description: patternDef.description,
        line: lineNumber,
        code: lineContent.trim(),
        suggestion: patternDef.suggestion,
        verification
      });

      if (!patternDef.pattern.global) break;
    }
  }

  return issues;
}
