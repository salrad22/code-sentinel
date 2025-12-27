// Types for CodeSentinel MCP Server

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Category = 'security' | 'error' | 'deceptive' | 'placeholder' | 'strength';

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
}
