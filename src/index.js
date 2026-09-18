'use strict';

const fs = require('fs');
const { findHtmlFiles, readFile } = require('./utils.js');
const { auditMetaTags } = require('./auditors/meta-tags.js');
const { auditSchema } = require('./auditors/schema.js');
const { auditHreflang } = require('./auditors/hreflang.js');
const { auditSitemap } = require('./auditors/sitemap.js');
const { auditImages } = require('./auditors/images.js');
const { auditHeadings } = require('./auditors/headings.js');
const { auditPerformance } = require('./auditors/performance.js');
const { report } = require('./reporter.js');

/**
 * Run the full SEO audit on an Astro build output directory.
 * @param {Object} options
 * @param {string} options.distDir - Path to the build output directory.
 * @param {string} [options.format='terminal'] - Output format ('terminal' or 'json').
 * @param {string|null} [options.output=null] - File path to write report to.
 * @returns {Promise<number>} Overall score (0-100).
 */
async function runAudit(options) {
  const { distDir, format = 'terminal', output = null, siteName = null } = options;

  // Validate dist directory exists
  if (!fs.existsSync(distDir)) {
    throw new Error(`Directory not found: ${distDir}`);
  }

  if (!fs.statSync(distDir).isDirectory()) {
    throw new Error(`Not a directory: ${distDir}`);
  }

  // Find all HTML files
  const htmlFiles = findHtmlFiles(distDir);

  if (htmlFiles.length === 0) {
    throw new Error(`No HTML files found in ${distDir}`);
  }

  // Load all pages
  const pages = htmlFiles.map((filePath) => ({
    filePath,
    html: readFile(filePath),
  }));

  // Run all auditors
  const audits = [
    auditMetaTags(pages, distDir),
    auditSchema(pages, distDir),
    auditHreflang(pages, distDir),
    auditSitemap(pages, distDir),
    auditImages(pages, distDir),
    auditHeadings(pages, distDir),
    auditPerformance(pages, distDir),
  ];

  // Generate report
  const score = report(audits, pages.length, distDir, { format, output, siteName });

  return score;
}

module.exports = { runAudit };
