// Placeholder pattern definitions - incomplete code and dummy data

import { PatternDefinition } from '../types.js';

export const placeholderDefinitions: PatternDefinition[] = [
  // TODO/FIXME comments
  {
    id: 'CS-PH001',
    title: 'TODO Comment Found',
    description: 'Incomplete work marker found in code.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Complete or remove the TODO before shipping.',
    match: {
      type: 'comment_marker',
      markers: ['TODO'],
      style: 'any'
    }
  },
  {
    id: 'CS-PH002',
    title: 'FIXME Comment Found',
    description: 'Known issue marker found - this should be fixed.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Fix the issue or create a ticket to track it.',
    match: {
      type: 'comment_marker',
      markers: ['FIXME'],
      style: 'any'
    }
  },
  {
    id: 'CS-PH003',
    title: 'HACK Comment Found',
    description: 'Workaround marker found - technical debt.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Document why the hack exists and plan to remove it.',
    match: {
      type: 'comment_marker',
      markers: ['HACK'],
      style: 'any'
    }
  },
  {
    id: 'CS-PH004',
    title: 'XXX Comment Found',
    description: 'Attention marker found - requires review.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Address the flagged issue or remove the marker.',
    match: {
      type: 'comment_marker',
      markers: ['XXX'],
      style: 'any'
    }
  },

  // Lorem ipsum and dummy text
  {
    id: 'CS-PH010',
    title: 'Lorem Ipsum Placeholder Text',
    description: 'Placeholder text found - replace with real content.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Replace with actual content before release.',
    match: {
      type: 'contains_text',
      terms: ['lorem ipsum'],
      context: 'any',
      caseInsensitive: true
    }
  },
  {
    id: 'CS-PH011',
    title: 'Common Placeholder Value',
    description: 'Generic placeholder value detected.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Replace with meaningful values.',
    match: {
      type: 'string_literal',
      patterns: ['foo', 'bar', 'baz', 'qux', 'test', 'dummy', 'sample', 'example', 'placeholder'],
      caseInsensitive: true
    }
  },

  // Test/dummy data
  {
    id: 'CS-PH020',
    title: 'Test Email Address',
    description: 'Placeholder email found - may not be intended for production.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Remove or replace with proper configuration.',
    match: {
      type: 'raw_regex',
      pattern: '[\'"`]test@(?:test|example|dummy|sample)\\.[a-z]+[\'"`]',
      flags: 'gi'
    }
  },
  {
    id: 'CS-PH021',
    title: 'Common Test Password/Value',
    description: 'Potentially insecure placeholder password or test value.',
    severity: 'high',
    category: 'placeholder',
    suggestion: 'Remove test credentials before deployment.',
    match: {
      type: 'string_literal',
      patterns: ['123', '1234', '12345', '123456', 'password', 'admin', 'root', 'test'],
      caseInsensitive: true
    }
  },
  {
    id: 'CS-PH022',
    title: 'Localhost URL in Code',
    description: 'Hardcoded localhost URL may not work in production.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Use environment variables for URLs.',
    match: {
      type: 'raw_regex',
      pattern: '(?:localhost|127\\.0\\.0\\.1):\\d{4,5}',
      flags: 'g'
    }
  },
  {
    id: 'CS-PH023',
    title: 'Placeholder String Pattern',
    description: 'Obvious placeholder pattern detected.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Replace with actual values.',
    match: {
      type: 'string_literal',
      patterns: ['xxx', 'yyy', 'zzz', 'aaa', 'bbb', 'ccc'],
      caseInsensitive: true
    }
  },

  // Fake/test phone numbers
  {
    id: 'CS-PH030',
    title: 'Test Phone Number (555)',
    description: 'The 555 prefix is reserved for fictional use.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Use proper phone number handling or config.',
    match: {
      type: 'raw_regex',
      pattern: '[\'"`](?:\\+1)?[\\s-]?555[\\s-]?\\d{3}[\\s-]?\\d{4}[\'"`]',
      flags: 'g'
    }
  },
  {
    id: 'CS-PH031',
    title: 'Obviously Fake ID Number',
    description: 'Placeholder ID number pattern detected.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Remove test data before production.',
    match: {
      type: 'raw_regex',
      pattern: '[\'"`](?:000[-\\s]?00[-\\s]?0000|111[-\\s]?11[-\\s]?1111|123[-\\s]?45[-\\s]?6789)[\'"`]',
      flags: 'g'
    }
  },

  // Incomplete implementations
  {
    id: 'CS-PH040',
    title: 'Not Implemented Error',
    description: 'Function explicitly marked as not implemented.',
    severity: 'high',
    category: 'placeholder',
    suggestion: 'Implement the function or remove the dead code.',
    match: {
      type: 'contains_text',
      terms: ['not implemented', 'implement me', 'coming soon'],
      context: 'string',
      caseInsensitive: true
    }
  },
  {
    id: 'CS-PH041',
    title: 'TBD/Placeholder Return Value',
    description: 'Code returns a placeholder instead of real value.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Implement actual logic or handle the case properly.',
    match: {
      type: 'raw_regex',
      pattern: '(?:return|=)\\s*[\'"`](?:TBD|TBA|N\\/A|pending|placeholder)[\'"`]',
      flags: 'gi'
    }
  },

  // Debug/test code
  {
    id: 'CS-PH050',
    title: 'Debug Console.log',
    description: 'Debug logging statement left in code.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Remove debug statements or use a proper logger.',
    match: {
      type: 'raw_regex',
      pattern: 'console\\.log\\s*\\(\\s*[\'"`](?:debug|test|here|working|checkpoint|\\d+)[\'"`]\\s*\\)',
      flags: 'gi'
    }
  },
  {
    id: 'CS-PH051',
    title: 'Debugger Statement',
    description: 'Debugger statement will pause execution in browser.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Remove debugger statements before committing.',
    match: {
      type: 'raw_regex',
      pattern: 'debugger\\s*;',
      flags: 'g'
    }
  },
  {
    id: 'CS-PH052',
    title: 'Debug Alert',
    description: 'Debug alert left in code.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Remove debug alerts.',
    match: {
      type: 'raw_regex',
      pattern: 'alert\\s*\\(\\s*[\'"`](?:test|debug|here|working)[\'"`]\\s*\\)',
      flags: 'gi'
    }
  },

  // Commented out code blocks
  {
    id: 'CS-PH060',
    title: 'Commented Out Code',
    description: 'Code appears to be commented out rather than deleted.',
    severity: 'low',
    category: 'placeholder',
    suggestion: 'Remove dead code - use version control to recover if needed.',
    match: {
      type: 'raw_regex',
      pattern: '\\/\\/\\s*(?:const|let|var|function|class|if|for|while|return)\\s+\\w+',
      flags: 'g'
    }
  },

  // Hardcoded test IDs
  {
    id: 'CS-PH070',
    title: 'Test ID in Code',
    description: 'Hardcoded test ID found.',
    severity: 'medium',
    category: 'placeholder',
    suggestion: 'Use proper ID generation or configuration.',
    match: {
      type: 'string_literal',
      patterns: ['test-id', 'test_id', 'testid', 'fake-id', 'temp-id'],
      caseInsensitive: true
    }
  }
];
