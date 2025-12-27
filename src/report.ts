import { AnalysisResult, Issue, Strength, Severity } from './types.js';

const severityColors: Record<Severity, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#2563eb',
  info: '#6b7280'
};

const severityBg: Record<Severity, string> = {
  critical: '#fef2f2',
  high: '#fff7ed',
  medium: '#fefce8',
  low: '#eff6ff',
  info: '#f9fafb'
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderIssue(issue: Issue): string {
  return `
    <div class="issue" style="background: ${severityBg[issue.severity]}; border-left: 4px solid ${severityColors[issue.severity]}; padding: 16px; margin: 12px 0; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="badge" style="background: ${severityColors[issue.severity]}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
          ${issue.severity}
        </span>
        <span style="color: #6b7280; font-size: 12px;">${issue.id}${issue.line ? ` • Line ${issue.line}` : ''}</span>
      </div>
      <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${escapeHtml(issue.title)}</h4>
      <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">${escapeHtml(issue.description)}</p>
      ${issue.code ? `
        <pre style="background: #1f2937; color: #e5e7eb; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 13px; margin: 8px 0;"><code>${escapeHtml(issue.code)}</code></pre>
      ` : ''}
      ${issue.suggestion ? `
        <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 12px; border-radius: 6px; margin-top: 8px;">
          <strong style="color: #166534; font-size: 12px;">💡 Suggestion:</strong>
          <p style="margin: 4px 0 0 0; color: #166534; font-size: 13px;">${escapeHtml(issue.suggestion)}</p>
        </div>
      ` : ''}
    </div>
  `;
}

function renderStrength(strength: Strength): string {
  return `
    <div class="strength" style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 12px 0; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="badge" style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">
          ✓ GOOD PRACTICE
        </span>
        <span style="color: #6b7280; font-size: 12px;">${strength.id}</span>
      </div>
      <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 16px;">${escapeHtml(strength.title)}</h4>
      <p style="margin: 0; color: #15803d; font-size: 14px;">${escapeHtml(strength.description)}</p>
      ${strength.examples && strength.examples.length > 0 ? `
        <div style="margin-top: 8px;">
          <span style="color: #166534; font-size: 12px; font-weight: 600;">Found ${strength.examples.length}+ instances</span>
        </div>
      ` : ''}
    </div>
  `;
}

function renderSummaryCard(label: string, count: number, color: string, bgColor: string): string {
  return `
    <div style="background: ${bgColor}; border: 2px solid ${color}; border-radius: 12px; padding: 20px; text-align: center; min-width: 120px;">
      <div style="font-size: 32px; font-weight: 700; color: ${color};">${count}</div>
      <div style="font-size: 14px; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>
    </div>
  `;
}

export function generateHtmlReport(result: AnalysisResult): string {
  const { summary, issues, strengths, filename, language, timestamp } = result;
  
  // Group issues by category
  const securityIssues = issues.filter(i => i.category === 'security');
  const errorIssues = issues.filter(i => i.category === 'error');
  const deceptiveIssues = issues.filter(i => i.category === 'deceptive');
  const placeholderIssues = issues.filter(i => i.category === 'placeholder');

  // Calculate score (0-100)
  const maxPenalty = 100;
  const penalty = 
    summary.critical * 25 + 
    summary.high * 15 + 
    summary.medium * 5 + 
    summary.low * 1;
  const score = Math.max(0, Math.min(100, maxPenalty - penalty + (summary.strengths * 2)));
  
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#ca8a04' : score >= 40 ? '#ea580c' : '#dc2626';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeSentinel Report - ${escapeHtml(filename)}</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
      color: white;
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 24px;
    }
    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
    }
    .section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .section h2 {
      margin: 0 0 16px 0;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .count-badge {
      background: #e5e7eb;
      color: #4b5563;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 14px;
    }
    @media (max-width: 600px) {
      .summary-grid { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
        <div>
          <h1 style="margin: 0 0 8px 0; font-size: 28px;">🛡️ CodeSentinel Report</h1>
          <p style="margin: 0; opacity: 0.9; font-size: 14px;">
            <strong>${escapeHtml(filename)}</strong> • ${language} • ${timestamp}
          </p>
        </div>
        <div class="score-circle" style="color: ${scoreColor}">
          ${score}
        </div>
      </div>
    </header>

    <div class="section">
      <h2>📊 Summary</h2>
      <div class="summary-grid" style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;">
        ${renderSummaryCard('Critical', summary.critical, severityColors.critical, severityBg.critical)}
        ${renderSummaryCard('High', summary.high, severityColors.high, severityBg.high)}
        ${renderSummaryCard('Medium', summary.medium, severityColors.medium, severityBg.medium)}
        ${renderSummaryCard('Low', summary.low, severityColors.low, severityBg.low)}
        ${renderSummaryCard('Strengths', summary.strengths, '#22c55e', '#f0fdf4')}
      </div>
    </div>

    ${securityIssues.length > 0 ? `
    <div class="section">
      <h2>🔒 Security Issues <span class="count-badge">${securityIssues.length}</span></h2>
      ${securityIssues.map(renderIssue).join('')}
    </div>
    ` : ''}

    ${deceptiveIssues.length > 0 ? `
    <div class="section">
      <h2>🎭 Deceptive Patterns <span class="count-badge">${deceptiveIssues.length}</span></h2>
      <p style="color: #6b7280; margin-top: 0;">Code that hides errors or creates false confidence</p>
      ${deceptiveIssues.map(renderIssue).join('')}
    </div>
    ` : ''}

    ${errorIssues.length > 0 ? `
    <div class="section">
      <h2>⚠️ Errors & Code Smells <span class="count-badge">${errorIssues.length}</span></h2>
      ${errorIssues.map(renderIssue).join('')}
    </div>
    ` : ''}

    ${placeholderIssues.length > 0 ? `
    <div class="section">
      <h2>📝 Placeholders & Incomplete Code <span class="count-badge">${placeholderIssues.length}</span></h2>
      ${placeholderIssues.map(renderIssue).join('')}
    </div>
    ` : ''}

    ${strengths.length > 0 ? `
    <div class="section">
      <h2>💪 Code Strengths <span class="count-badge">${strengths.length}</span></h2>
      ${strengths.map(renderStrength).join('')}
    </div>
    ` : ''}

    ${summary.totalIssues === 0 && strengths.length > 0 ? `
    <div class="section" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e;">
      <h2 style="color: #166534; border: none;">🎉 Excellent Code Quality!</h2>
      <p style="color: #15803d; margin: 0;">No issues detected. This code demonstrates good practices.</p>
    </div>
    ` : ''}

    <footer style="text-align: center; padding: 20px; color: #6b7280; font-size: 13px;">
      Generated by CodeSentinel MCP Server • ${new Date().toISOString()}
    </footer>
  </div>
</body>
</html>
  `.trim();
}
