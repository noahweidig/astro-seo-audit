'use strict';

const fs = require('fs');
const { formatHtml } = require('./formatters/html.js');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Calculate overall score from audit results.
 * @param {Object[]} audits - Array of audit result objects.
 * @param {number} totalPages - Total pages analyzed.
 * @returns {number} Score from 0 to 100.
 */
function calculateScore(audits, totalPages) {
  if (totalPages === 0) return 0;

  let totalChecks = 0;
  let passedChecks = 0;
  let errorPenalty = 0;

  for (const audit of audits) {
    const checks = audit.passes.length + audit.warnings.length + audit.errors.length;
    totalChecks += checks;
    passedChecks += audit.passes.length;
    errorPenalty += audit.errors.length * 2; // Errors count double
  }

  if (totalChecks === 0) return 100;

  const baseScore = (passedChecks / totalChecks) * 100;
  const penaltyFactor = Math.max(0, 1 - errorPenalty / totalChecks);
  const score = Math.round(baseScore * penaltyFactor);

  return Math.max(0, Math.min(100, score));
}

/**
 * Format results for terminal output with colors.
 * @param {Object[]} audits - Array of audit result objects.
 * @param {number} totalPages - Total pages analyzed.
 * @param {string} distDir - The dist directory path.
 * @returns {string} Formatted terminal output.
 */
function formatTerminal(audits, totalPages, distDir) {
  const lines = [];
  const score = calculateScore(audits, totalPages);

  lines.push('');
  lines.push(`${colors.bold}${colors.cyan}  Astro SEO Audit${colors.reset} ${colors.dim}-- ${distDir}${colors.reset}`);
  lines.push('');
  lines.push(`${colors.bold}  Pages analyzed: ${totalPages}${colors.reset}`);
  lines.push('');

  // Summary table
  lines.push(`${colors.bold}  ${'Auditor'.padEnd(20)} ${'Status'.padEnd(40)}${colors.reset}`);
  lines.push(`  ${''.padEnd(60, '-')}`);

  for (const audit of audits) {
    const passCount = audit.passes.length;
    const warnCount = audit.warnings.length;
    const errCount = audit.errors.length;

    let status = '';
    if (errCount > 0) {
      status += `${colors.red}X ${errCount} errors${colors.reset}  `;
    }
    if (warnCount > 0) {
      status += `${colors.yellow}! ${warnCount} warnings${colors.reset}  `;
    }
    if (errCount === 0 && warnCount === 0) {
      status = `${colors.green}* All pass${colors.reset}`;
    } else if (passCount > 0) {
      status = `${colors.green}* ${passCount} pass${colors.reset}  ${status}`;
    }

    lines.push(`  ${audit.name.padEnd(20)} ${status}`);
  }

  lines.push('');

  // Score
  let scoreColor = colors.green;
  if (score < 50) scoreColor = colors.red;
  else if (score < 80) scoreColor = colors.yellow;

  lines.push(`${colors.bold}  Overall Score: ${scoreColor}${score}/100${colors.reset}`);
  lines.push('');

  // Detailed errors and warnings
  const hasIssues = audits.some((a) => a.errors.length > 0 || a.warnings.length > 0);
  if (hasIssues) {
    lines.push(`${colors.bold}  Details:${colors.reset}`);
    lines.push('');

    for (const audit of audits) {
      if (audit.errors.length === 0 && audit.warnings.length === 0) continue;

      lines.push(`  ${colors.bold}${colors.cyan}${audit.name}${colors.reset}`);

      for (const err of audit.errors) {
        lines.push(`    ${colors.red}X${colors.reset} ${colors.dim}${err.page}${colors.reset}`);
        lines.push(`      ${err.message}`);
      }

      for (const warn of audit.warnings) {
        lines.push(`    ${colors.yellow}!${colors.reset} ${colors.dim}${warn.page}${colors.reset}`);
        lines.push(`      ${warn.message}`);
      }

      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format results as JSON.
 * @param {Object[]} audits - Array of audit result objects.
 * @param {number} totalPages - Total pages analyzed.
 * @param {string} distDir - The dist directory path.
 * @returns {string} JSON string.
 */
function formatJson(audits, totalPages, distDir) {
  const score = calculateScore(audits, totalPages);
  const report = {
    distDir,
    totalPages,
    score,
    audits: audits.map((audit) => ({
      name: audit.name,
      passes: audit.passes.length,
      warnings: audit.warnings.length,
      errors: audit.errors.length,
      details: {
        passes: audit.passes,
        warnings: audit.warnings,
        errors: audit.errors,
      },
    })),
  };
  return JSON.stringify(report, null, 2);
}

/**
 * Output the report.
 * @param {Object[]} audits - Array of audit result objects.
 * @param {number} totalPages - Total pages analyzed.
 * @param {string} distDir - The dist directory path.
 * @param {Object} options - Format and output options.
 */
function report(audits, totalPages, distDir, options = {}) {
  const { format = 'terminal', output = null, siteName = null } = options;

  let content;
  if (format === 'json') {
    content = formatJson(audits, totalPages, distDir);
  } else if (format === 'html') {
    const score = calculateScore(audits, totalPages);
    content = formatHtml(audits, totalPages, distDir, score, { siteName });
  } else {
    content = formatTerminal(audits, totalPages, distDir);
  }

  if (output) {
    fs.writeFileSync(output, content, 'utf-8');
    console.log(`${colors.green}Report written to ${output}${colors.reset}`);
  } else if (format === 'html') {
    console.log(`${colors.yellow}--output is required for --format html; printing HTML to stdout${colors.reset}`);
    console.log(content);
  } else {
    console.log(content);
  }

  // Return score for programmatic use
  return calculateScore(audits, totalPages);
}

module.exports = { report, formatTerminal, formatJson, formatHtml, calculateScore };
