// Security pattern definitions - vulnerabilities and security issues

import { PatternDefinition } from '../types.js';

export const securityDefinitions: PatternDefinition[] = [
  // Hardcoded secrets
  {
    id: 'CS-SEC001',
    title: 'Hardcoded Secret Detected',
    description: 'Sensitive credentials appear to be hardcoded in the source code.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Move secrets to environment variables or a secure vault.',
    match: {
      type: 'secret_pattern',
      kind: 'generic'
    },
    verification: {
      status: 'needs_verification',
      assumption: 'The matched string appears to be a real secret, not a placeholder or test value',
      commands: [
        'git log -p -S "<matched_value>" -- <filename>',
        'grep -r "<matched_value>" .env* config/'
      ],
      instruction: 'Verify this is a real secret, not a placeholder like "your-api-key-here" or test data',
      confirmIf: 'Value looks like a real credential (high entropy, no placeholder words)',
      falsePositiveIf: 'Value contains words like "example", "test", "placeholder", "your-", "xxx", or is clearly dummy data'
    }
  },
  {
    id: 'CS-SEC002',
    title: 'GitHub Token Detected',
    description: 'A GitHub personal access token was found in the code.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Remove the token immediately and rotate it in GitHub settings.',
    match: {
      type: 'secret_pattern',
      kind: 'github'
    },
    verification: {
      status: 'needs_verification',
      assumption: 'Token is real and may have been committed to git history',
      commands: [
        'git log -p -S "<matched_value>" --all',
        'git ls-files <filename>'
      ],
      instruction: 'Check if token was ever committed. If in history, it must be rotated even if removed now',
      confirmIf: 'Token pattern matches GitHub format (ghp_, gho_, etc.) and file is tracked',
      falsePositiveIf: 'Token is in a test file with obviously fake data or documentation example'
    }
  },
  {
    id: 'CS-SEC003',
    title: 'OpenAI API Key Detected',
    description: 'An OpenAI API key was found in the code.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Remove the key and rotate it in your OpenAI dashboard.',
    match: {
      type: 'secret_pattern',
      kind: 'openai'
    },
    verification: {
      status: 'needs_verification',
      assumption: 'Key is real and may have been committed to git history',
      commands: [
        'git log -p -S "sk-" --all -- <filename>',
        'git ls-files <filename>'
      ],
      instruction: 'Check if key was ever committed. If in history, it must be rotated',
      confirmIf: 'Key matches OpenAI format (sk- prefix, 48+ chars) and file is tracked',
      falsePositiveIf: 'Key is in documentation as example or clearly marked as fake'
    }
  },
  {
    id: 'CS-SEC004',
    title: 'AWS Access Key Detected',
    description: 'An AWS access key ID was found in the code.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Remove and rotate the AWS credentials immediately.',
    match: {
      type: 'secret_pattern',
      kind: 'aws'
    },
    verification: {
      status: 'needs_verification',
      assumption: 'Key is real and may have been committed to git history',
      commands: [
        'git log -p -S "AKIA" --all -- <filename>',
        'git ls-files <filename>'
      ],
      instruction: 'Check if key was ever committed. AWS keys in git history are compromised',
      confirmIf: 'Key matches AWS format (AKIA prefix, 16 chars) and file is tracked',
      falsePositiveIf: 'Key is in documentation or test fixtures with fake data'
    }
  },
  {
    id: 'CS-SEC005',
    title: 'Stripe API Key Detected',
    description: 'A Stripe API key was found in the code.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Remove and rotate the Stripe key immediately in your Stripe dashboard.',
    match: {
      type: 'secret_pattern',
      kind: 'stripe'
    }
  },

  // SQL Injection
  {
    id: 'CS-SEC010',
    title: 'Potential SQL Injection',
    description: 'String interpolation in SQL query may allow injection attacks.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Use parameterized queries or prepared statements instead.',
    match: {
      type: 'raw_regex',
      pattern: '(?:execute|query|raw)\\s*\\(\\s*[\'"`].*?\\$\\{.*?\\}.*?[\'"`]\\s*\\)',
      flags: 'gi'
    }
  },
  {
    id: 'CS-SEC011',
    title: 'SQL Query String Concatenation',
    description: 'Concatenating strings in SQL queries is vulnerable to injection.',
    severity: 'high',
    category: 'security',
    suggestion: 'Use parameterized queries with placeholders.',
    match: {
      type: 'raw_regex',
      pattern: '(?:execute|query)\\s*\\(\\s*[\'"`].*?\\+.*?[\'"`]\\s*\\)',
      flags: 'gi'
    }
  },

  // XSS
  {
    id: 'CS-SEC020',
    title: 'Potential XSS via innerHTML',
    description: 'Setting innerHTML with dynamic content can lead to XSS.',
    severity: 'high',
    category: 'security',
    suggestion: 'Use textContent or sanitize HTML before insertion.',
    match: {
      type: 'raw_regex',
      pattern: 'innerHTML\\s*=\\s*(?![\'"`]<)',
      flags: 'g'
    }
  },
  {
    id: 'CS-SEC021',
    title: 'React dangerouslySetInnerHTML Usage',
    description: 'Using dangerouslySetInnerHTML can expose the app to XSS.',
    severity: 'medium',
    category: 'security',
    suggestion: 'Ensure content is properly sanitized before rendering.',
    match: {
      type: 'function_call',
      names: ['dangerouslySetInnerHTML'],
      methods: false
    }
  },

  // Insecure practices
  {
    id: 'CS-SEC030',
    title: 'eval() Usage Detected',
    description: 'eval() can execute arbitrary code and is a security risk.',
    severity: 'high',
    category: 'security',
    suggestion: 'Avoid eval(). Use safer alternatives like JSON.parse().',
    match: {
      type: 'function_call',
      names: ['eval']
    }
  },
  {
    id: 'CS-SEC031',
    title: 'Dynamic Function Constructor',
    description: 'Creating functions from strings is similar to eval().',
    severity: 'high',
    category: 'security',
    suggestion: 'Avoid dynamic function creation from user input.',
    match: {
      type: 'function_call',
      names: ['Function'],
      constructors: true
    }
  },
  {
    id: 'CS-SEC032',
    title: 'document.write() Usage',
    description: 'document.write() can overwrite the document and enable XSS.',
    severity: 'medium',
    category: 'security',
    suggestion: 'Use DOM manipulation methods instead.',
    match: {
      type: 'raw_regex',
      pattern: 'document\\.write\\s*\\(',
      flags: 'g'
    }
  },

  // Crypto issues
  {
    id: 'CS-SEC040',
    title: 'Weak Hash Algorithm',
    description: 'MD5 and SHA1 are cryptographically broken.',
    severity: 'high',
    category: 'security',
    suggestion: 'Use SHA-256 or bcrypt for password hashing.',
    match: {
      type: 'function_call',
      names: ['md5', 'sha1']
    }
  },
  {
    id: 'CS-SEC041',
    title: 'Insecure Random for Security',
    description: 'Math.random() is not cryptographically secure.',
    severity: 'medium',
    category: 'security',
    suggestion: 'Use crypto.randomBytes() or crypto.getRandomValues().',
    match: {
      type: 'raw_regex',
      pattern: 'Math\\.random\\s*\\(\\)',
      flags: 'g'
    }
  },

  // Network
  {
    id: 'CS-SEC050',
    title: 'Insecure HTTP URL',
    description: 'Using HTTP instead of HTTPS exposes data in transit.',
    severity: 'medium',
    category: 'security',
    suggestion: 'Use HTTPS for all external URLs.',
    match: {
      type: 'url_pattern',
      protocol: 'http',
      excludeLocalhost: true
    }
  },
  {
    id: 'CS-SEC051',
    title: 'SSL Certificate Validation Disabled',
    description: 'Disabling certificate validation enables MITM attacks.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Never disable SSL certificate validation in production.',
    match: {
      type: 'raw_regex',
      pattern: 'rejectUnauthorized\\s*:\\s*false',
      flags: 'g'
    }
  },

  // CORS
  {
    id: 'CS-SEC060',
    title: 'Wildcard CORS Origin',
    description: 'Allowing all origins can expose the API to unauthorized access.',
    severity: 'medium',
    category: 'security',
    suggestion: 'Specify allowed origins explicitly.',
    match: {
      type: 'raw_regex',
      pattern: 'Access-Control-Allow-Origin[\'":]+\\s*\\*',
      flags: 'g'
    }
  }
];
