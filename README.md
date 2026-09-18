# astro-seo-audit

A zero-dependency CLI tool that audits SEO of Astro projects by analyzing the built output. Works with any static site generator that outputs HTML files, but designed with Astro in mind.

## What it does

`astro-seo-audit` scans your build output directory and checks for common SEO issues across seven categories:

- **Meta Tags** -- title, description, canonical URL, Open Graph, and Twitter Card tags
- **Schema Markup** -- JSON-LD structured data validation (Organization, BreadcrumbList, BlogPosting, FAQPage, Service)
- **Hreflang** -- internationalization tag correctness, bidirectional references, x-default
- **Sitemap** -- sitemap.xml completeness, orphan pages, missing pages
- **Images** -- alt text, width/height attributes, lazy loading, OG image
- **Headings** -- single h1, heading hierarchy, empty headings
- **Performance** -- render-blocking scripts, font optimization, inline style size, HTML size

## Installation

```bash
npm install -g astro-seo-audit
```

Or use directly with npx:

```bash
npx astro-seo-audit ./dist
```

## Usage

### Basic audit

```bash
astro-seo ./dist
```

### JSON output

```bash
astro-seo ./dist --format json
```

### Save report to file

```bash
astro-seo ./dist --format json --output report.json
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `[dist-dir]` | Path to the build output directory | `./dist` |
| `--format` | Output format: `terminal` or `json` | `terminal` |
| `--output` | Write report to a file | stdout |
| `--help`, `-h` | Show help | |
| `--version`, `-v` | Show version | |

## Auditor details

### Meta Tags

| Check | Severity |
|-------|----------|
| Title exists and under 60 characters | Error |
| Meta description exists and under 155 characters | Error |
| Canonical URL set | Error |
| OG tags (title, description, image, url) | Error/Warning |
| Twitter card tags | Warning |
| Duplicate titles across pages | Warning |
| Duplicate descriptions across pages | Warning |

### Schema Markup

| Check | Severity |
|-------|----------|
| JSON-LD found and valid JSON | Warning/Error |
| Organization schema on homepage | Warning |
| BreadcrumbList schema | Warning |
| BlogPosting on blog posts | Warning |
| FAQPage on FAQ sections | Warning |
| Service schema on service pages | Warning |

### Hreflang

| Check | Severity |
|-------|----------|
| Hreflang tags present on i18n pages | Error |
| Self-referencing hreflang | Error |
| x-default set | Warning |
| Bidirectional references (A to B and B to A) | Warning |
| Missing locale variants | Warning |

### Sitemap

| Check | Severity |
|-------|----------|
| sitemap.xml or sitemap-index.xml exists | Error |
| All HTML pages included in sitemap | Warning |
| Pages in sitemap but not built (orphans) | Warning |

### Images

| Check | Severity |
|-------|----------|
| All images have alt text | Error |
| All images have width/height or explicit sizing | Warning |
| Large images without lazy loading | Warning |
| Missing OG image | Warning |

### Headings

| Check | Severity |
|-------|----------|
| Exactly one h1 per page | Error |
| Heading hierarchy (no h3 before h2) | Warning |
| Very long h1 (over 70 chars) | Warning |
| Empty headings | Warning |

### Performance

| Check | Severity |
|-------|----------|
| No render-blocking scripts in head | Error |
| Fonts have display=swap or preload | Warning |
| Inline styles over 10KB | Warning |
| Total HTML size over 100KB | Warning |

## Example output

```
  Astro SEO Audit -- ./dist

  Pages analyzed: 45

  Auditor              Status
  ------------------------------------------------------------
  Meta Tags            * 42 pass  X 3 errors
  Schema Markup        * 38 pass  ! 7 warnings
  Hreflang             * 40 pass  X 5 errors
  Sitemap              * All pass
  Images               ! 12 warnings
  Headings             * 44 pass  ! 1 warnings
  Performance          * All pass

  Overall Score: 87/100

  Details:

  Meta Tags
    X /about/index.html
      Missing meta description
    X /contact/index.html
      Missing canonical URL
  ...
```

## Scanning an external site

```bash
astro-seo-scan-site https://github.com/noahweidig/noahweidig.github.io.git --out dashboard.html
```

Clones (or uses a local path to) an Astro/static site, builds it, and runs the audit against its `dist/` output, writing an interactive HTML dashboard. See `astro-seo-scan-site --help` for options.

## GitHub Pages dashboard

`.github/workflows/seo-dashboard.yml` runs weekly (and on manual dispatch), scans `noahweidig.github.io`, and publishes the dashboard to this repo's GitHub Pages. Enable Pages once under **Settings -> Pages -> Source: GitHub Actions**.

## Programmatic usage

```js
const { runAudit } = require('astro-seo-audit');

const score = await runAudit({
  distDir: './dist',
  format: 'json',
  output: 'report.json',
});

console.log(`Score: ${score}/100`);
```

## Requirements

- Node.js >= 18
- Zero external dependencies

## License

MIT

---

Built by [Soamee](https://soamee.com)
