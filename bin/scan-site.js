#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execSync } = require('child_process');
const { runAudit } = require('../src/index.js');

function printHelp() {
  console.log(`
  scan-site - build an Astro/static site and run astro-seo-audit against it

  Usage:
    astro-seo-scan-site <repo-url-or-local-path> [options]

  Options:
    --branch <name>     Git branch/ref to check out when cloning a URL (default: repo default)
    --build-cmd <cmd>   Build command to run (default: "npm run build")
    --install-cmd <cmd> Install command to run before building (default: "npm ci", falls back to "npm install")
    --dist-dir <dir>    Build output directory relative to the site root (default: "dist")
    --out <file>        Path to write the HTML dashboard (default: "./seo-dashboard.html")
    --site-name <name>  Label used in the dashboard header (default: the repo URL or path)
    --skip-build        Assume the site is already built; skip install/build steps
    --help, -h          Show this help message

  Examples:
    astro-seo-scan-site https://github.com/noahweidig/noahweidig.github.io.git
    astro-seo-scan-site ../noahweidig.github.io --skip-build --dist-dir dist
`);
}

function parseArgs(args) {
  const options = {
    source: null,
    branch: null,
    buildCmd: null,
    installCmd: null,
    distDir: 'dist',
    out: './seo-dashboard.html',
    siteName: null,
    skipBuild: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--branch' && args[i + 1]) {
      options.branch = args[i + 1];
      i += 2;
    } else if (arg === '--build-cmd' && args[i + 1]) {
      options.buildCmd = args[i + 1];
      i += 2;
    } else if (arg === '--install-cmd' && args[i + 1]) {
      options.installCmd = args[i + 1];
      i += 2;
    } else if (arg === '--dist-dir' && args[i + 1]) {
      options.distDir = args[i + 1];
      i += 2;
    } else if (arg === '--out' && args[i + 1]) {
      options.out = args[i + 1];
      i += 2;
    } else if (arg === '--site-name' && args[i + 1]) {
      options.siteName = args[i + 1];
      i += 2;
    } else if (arg === '--skip-build') {
      options.skipBuild = true;
      i += 1;
    } else if (!arg.startsWith('--')) {
      options.source = arg;
      i += 1;
    } else {
      i += 1;
    }
  }

  return options;
}

function isRemoteUrl(source) {
  return /^(https?:\/\/|git@)/.test(source);
}

function run(cmd, args, cwd) {
  console.log(`  $ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}

function runShell(cmdString, cwd) {
  console.log(`  $ ${cmdString}`);
  execSync(cmdString, { cwd, stdio: 'inherit' });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const options = parseArgs(args);

  if (!options.source) {
    console.error('\x1b[31mError: missing <repo-url-or-local-path> argument\x1b[0m');
    printHelp();
    process.exit(1);
  }

  let siteRoot;
  let cleanup = null;

  if (isRemoteUrl(options.source)) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-seo-scan-'));
    siteRoot = tmpDir;
    cleanup = () => fs.rmSync(tmpDir, { recursive: true, force: true });

    console.log(`Cloning ${options.source}${options.branch ? ` (${options.branch})` : ''}...`);
    const cloneArgs = ['clone', '--depth', '1'];
    if (options.branch) cloneArgs.push('--branch', options.branch);
    cloneArgs.push(options.source, tmpDir);
    run('git', cloneArgs, process.cwd());
  } else {
    siteRoot = path.resolve(options.source);
    if (!fs.existsSync(siteRoot)) {
      console.error(`\x1b[31mError: path not found: ${siteRoot}\x1b[0m`);
      process.exit(1);
    }
  }

  const siteName = options.siteName || options.source;

  try {
    if (!options.skipBuild) {
      const hasLockfile = fs.existsSync(path.join(siteRoot, 'package-lock.json'));
      const installCmd = options.installCmd || (hasLockfile ? 'npm ci' : 'npm install');
      console.log(`Installing dependencies in ${siteRoot}...`);
      runShell(installCmd, siteRoot);

      const buildCmd = options.buildCmd || 'npm run build';
      console.log(`Building site...`);
      runShell(buildCmd, siteRoot);
    }

    const distDir = path.resolve(siteRoot, options.distDir);
    const outFile = path.resolve(process.cwd(), options.out);

    console.log(`Auditing ${distDir}...`);
    const score = await runAudit({
      distDir,
      format: 'html',
      output: outFile,
      siteName,
    });

    console.log(`\nDashboard written to ${outFile}`);
    console.log(`Overall score: ${score}/100`);
  } finally {
    if (cleanup) cleanup();
  }
}

main().catch((err) => {
  console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
  process.exit(1);
});
