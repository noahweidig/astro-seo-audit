#!/usr/bin/env node

'use strict';

const path = require('path');
const { runAudit } = require('../src/index.js');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`
  astro-seo-audit - SEO audit tool for Astro projects

  Usage:
    astro-seo [dist-dir] [options]

  Arguments:
    dist-dir          Path to the Astro build output directory (default: ./dist)

  Options:
    --format <type>   Output format: "terminal", "json", or "html" (default: terminal)
    --output <file>   Write results to a file instead of stdout
    --site-name <name> Label used in the HTML dashboard header
    --help, -h        Show this help message
    --version, -v     Show version number

  Examples:
    astro-seo ./dist
    astro-seo ./dist --format json
    astro-seo ./dist --format json --output report.json
    astro-seo ./dist --format html --output dashboard.html --site-name "My Site"
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const pkg = require('../package.json');
  console.log(pkg.version);
  process.exit(0);
}

function parseArgs(args) {
  const options = {
    distDir: './dist',
    format: 'terminal',
    output: null,
    siteName: null,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--format' && args[i + 1]) {
      options.format = args[i + 1];
      i += 2;
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[i + 1];
      i += 2;
    } else if (arg === '--site-name' && args[i + 1]) {
      options.siteName = args[i + 1];
      i += 2;
    } else if (!arg.startsWith('--')) {
      options.distDir = arg;
      i++;
    } else {
      i++;
    }
  }

  options.distDir = path.resolve(options.distDir);
  if (options.output) {
    options.output = path.resolve(options.output);
  }

  return options;
}

const options = parseArgs(args);

runAudit(options).catch((err) => {
  console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
  process.exit(1);
});
