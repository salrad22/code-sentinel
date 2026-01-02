import { Issue, Pattern, Verification } from '../types.js';

const securityPatterns: Pattern[] = [
  // Hardcoded secrets
  {
    id: 'CS-SEC001',
    pattern: /(?:api[_-]?key|apikey|secret|password|passwd|pwd|token|auth[_-]?token|access[_-]?token|private[_-]?key)\s*[:=]\s*['"`][^'"`]{8,}['"`]/gi,
    title: 'Hardcoded Secret Detected',
    description: 'Sensitive credentials appear to be hardcoded in the source code.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Move secrets to environment variables or a secure vault.',
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
    pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/g,
    title: 'GitHub Token Detected',
    description: 'A GitHub personal access token was found in the code.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Remove the token immediately and rotate it in GitHub settings.',
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
    pattern: /sk-[A-Za-z0-9]{48,}/g,
    title: 'OpenAI API Key Detected',
    description: 'An OpenAI API key was found in the code.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Remove the key and rotate it in your OpenAI dashboard.',
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
    pattern: /AKIA[0-9A-Z]{16}/g,
    title: 'AWS Access Key Detected',
    description: 'An AWS access key ID was found in the code.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Remove and rotate the AWS credentials immediately.',
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

  // SQL Injection
  {
    id: 'CS-SEC010',
    pattern: /(?:execute|query|raw)\s*\(\s*['"`].*?\$\{.*?\}.*?['"`]\s*\)/gi,
    title: 'Potential SQL Injection',
    description: 'String interpolation in SQL query may allow injection attacks.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Use parameterized queries or prepared statements instead.'
  },
  {
    id: 'CS-SEC011',
    pattern: /(?:execute|query)\s*\(\s*['"`].*?\+.*?['"`]\s*\)/gi,
    title: 'SQL Query String Concatenation',
    description: 'Concatenating strings in SQL queries is vulnerable to injection.',
    severity: 'high',
    category: 'security',
    suggestion: 'Use parameterized queries with placeholders.'
  },

  // XSS
  {
    id: 'CS-SEC020',
    pattern: /innerHTML\s*=\s*(?!['"`]<)/g,
    title: 'Potential XSS via innerHTML',
    description: 'Setting innerHTML with dynamic content can lead to XSS.',
    severity: 'high',
    category: 'security',
    suggestion: 'Use textContent or sanitize HTML before insertion.'
  },
  {
    id: 'CS-SEC021',
    pattern: /dangerouslySetInnerHTML/g,
    title: 'React dangerouslySetInnerHTML Usage',
    description: 'Using dangerouslySetInnerHTML can expose the app to XSS.',
    severity: 'medium',
    category: 'security',
    suggestion: 'Ensure content is properly sanitized before rendering.'
  },

  // Insecure practices
  {
    id: 'CS-SEC030',
    pattern: /eval\s*\(/g,
    title: 'eval() Usage Detected',
    description: 'eval() can execute arbitrary code and is a security risk.',
    severity: 'high',
    category: 'security',
    suggestion: 'Avoid eval(). Use safer alternatives like JSON.parse().'
  },
  {
    id: 'CS-SEC031',
    pattern: /new\s+Function\s*\(/g,
    title: 'Dynamic Function Constructor',
    description: 'Creating functions from strings is similar to eval().',
    severity: 'high',
    category: 'security',
    suggestion: 'Avoid dynamic function creation from user input.'
  },
  {
    id: 'CS-SEC032',
    pattern: /document\.write\s*\(/g,
    title: 'document.write() Usage',
    description: 'document.write() can overwrite the document and enable XSS.',
    severity: 'medium',
    category: 'security',
    suggestion: 'Use DOM manipulation methods instead.'
  },

  // Crypto issues
  {
    id: 'CS-SEC040',
    pattern: /(?:md5|sha1)\s*\(/gi,
    title: 'Weak Hash Algorithm',
    description: 'MD5 and SHA1 are cryptographically broken.',
    severity: 'high',
    category: 'security',
    suggestion: 'Use SHA-256 or bcrypt for password hashing.'
  },
  {
    id: 'CS-SEC041',
    pattern: /Math\.random\s*\(\)/g,
    title: 'Insecure Random for Security',
    description: 'Math.random() is not cryptographically secure.',
    severity: 'medium',
    category: 'security',
    suggestion: 'Use crypto.randomBytes() or crypto.getRandomValues().'
  },

  // Network
  {
    id: 'CS-SEC050',
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/g,
    title: 'Insecure HTTP URL',
    description: 'Using HTTP instead of HTTPS exposes data in transit.',
    severity: 'medium',
    category: 'security',
    suggestion: 'Use HTTPS for all external URLs.'
  },
  {
    id: 'CS-SEC051',
    pattern: /rejectUnauthorized\s*:\s*false/g,
    title: 'SSL Certificate Validation Disabled',
    description: 'Disabling certificate validation enables MITM attacks.',
    severity: 'critical',
    category: 'security',
    suggestion: 'Never disable SSL certificate validation in production.'
  },

  // CORS
  {
    id: 'CS-SEC060',
    pattern: /Access-Control-Allow-Origin['":\s]+\*/g,
    title: 'Wildcard CORS Origin',
    description: 'Allowing all origins can expose the API to unauthorized access.',
    severity: 'medium',
    category: 'security',
    suggestion: 'Specify allowed origins explicitly.'
  }
];

export function analyzeSecurityIssues(code: string, filename: string): Issue[] {
  const issues: Issue[] = [];
  const lines = code.split('\n');

  for (const patternDef of securityPatterns) {
    // Reset regex state
    patternDef.pattern.lastIndex = 0;

    let match;
    while ((match = patternDef.pattern.exec(code)) !== null) {
      // Find line number
      const beforeMatch = code.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      const lineContent = lines[lineNumber - 1] || '';
      const matchedValue = match[0];

      // Build verification with actual values substituted
      let verification = patternDef.verification;
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

      // Prevent infinite loops for patterns without global flag
      if (!patternDef.pattern.global) break;
    }
  }

  return issues;
}
