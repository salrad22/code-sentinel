// Types for CodeSentinel MCP Server

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Category = 'security' | 'error' | 'deceptive' | 'placeholder' | 'strength';
export type VerificationStatus = 'confirmed' | 'needs_verification';

// Verification requirements for findings that need external checks
export interface Verification {
  status: VerificationStatus;
  commands?: string[];           // Commands to run before confirming
  assumption?: string;           // What assumption is being made
  instruction?: string;          // How to interpret results
  confirmIf?: string;            // Condition that confirms the issue
  falsePositiveIf?: string;      // Condition that indicates false positive
}

export interface Issue {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  line?: number;
  column?: number;
  code?: string;
  suggestion?: string;
  verification?: Verification;   // Added: verification requirements
}

export interface Strength {
  id: string;
  title: string;
  description: string;
  examples?: string[];
}

export interface AnalysisResult {
  filename: string;
  language: string;
  timestamp: string;
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    strengths: number;
  };
  issues: Issue[];
  strengths: Strength[];
}

export interface Pattern {
  id: string;
  pattern: RegExp;
  title: string;
  description: string;
  severity: Severity;
  category: Category;
  suggestion?: string;
  verification?: Verification;   // Added: verification requirements for this pattern
}
