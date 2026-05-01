# Example SEO Audit Report

This is an example of the JSON output produced by `astro-seo-audit`.

## Command

```bash
astro-seo ./dist --format json --output report.json
```

## Sample JSON Output

```json
{
  "distDir": "./dist",
  "totalPages": 45,
  "score": 87,
  "audits": [
    {
      "name": "Meta Tags",
      "passes": 42,
      "warnings": 3,
      "errors": 0,
      "details": {
        "passes": [
          { "page": "/index.html", "message": "Title present and within limit" },
          { "page": "/index.html", "message": "Meta description present and within limit" },
          { "page": "/index.html", "message": "Canonical URL set" },
          { "page": "/index.html", "message": "OG tags present" },
          { "page": "/index.html", "message": "Twitter card meta tag present" }
        ],
        "warnings": [
          { "page": "/blog/long-title-post/index.html", "message": "Title too long (73 chars, max 60)" },
          { "page": "/about/index.html, /about-us/index.html", "message": "Duplicate title: \"About Us | My Site\"" },
          { "page": "/contact/index.html", "message": "Missing twitter:card meta tag" }
        ],
        "errors": []
      }
    },
    {
      "name": "Schema Markup",
      "passes": 38,
      "warnings": 7,
      "errors": 0,
      "details": {
        "passes": [
          { "page": "/index.html", "message": "JSON-LD is valid JSON" },
          { "page": "/index.html", "message": "Homepage has Organization/WebSite schema" }
        ],
        "warnings": [
          { "page": "/blog/my-post/index.html", "message": "Blog post missing BlogPosting or Article schema" },
          { "page": "/services/web-dev/index.html", "message": "Service page missing Service schema" }
        ],
        "errors": []
      }
    },
    {
      "name": "Hreflang",
      "passes": 40,
      "warnings": 5,
      "errors": 0,
      "details": {
        "passes": [
          { "page": "/es/index.html", "message": "Self-referencing hreflang present" },
          { "page": "/es/index.html", "message": "x-default hreflang set" }
        ],
        "warnings": [
          { "page": "/fr/about/index.html", "message": "Missing hreflang reference for locale \"de\"" }
        ],
        "errors": []
      }
    },
    {
      "name": "Sitemap",
      "passes": 45,
      "warnings": 0,
      "errors": 0,
      "details": {
        "passes": [
          { "page": "sitemap", "message": "sitemap.xml found" },
          { "page": "/", "message": "Page included in sitemap" }
        ],
        "warnings": [],
        "errors": []
      }
    },
    {
      "name": "Images",
      "passes": 33,
      "warnings": 12,
      "errors": 0,
      "details": {
        "passes": [
          { "page": "/index.html", "message": "All images have alt text" }
        ],
        "warnings": [
          { "page": "/blog/photo-post/index.html", "message": "Image missing width/height attributes: <img src=\"/images/hero.jpg\">" },
          { "page": "/gallery/index.html", "message": "8 images without lazy loading" }
        ],
        "errors": []
      }
    },
    {
      "name": "Headings",
      "passes": 44,
      "warnings": 1,
      "errors": 0,
      "details": {
        "passes": [
          { "page": "/index.html", "message": "Exactly one <h1> present" },
          { "page": "/index.html", "message": "Heading hierarchy is correct" }
        ],
        "warnings": [
          { "page": "/faq/index.html", "message": "Heading hierarchy skipped: <h2> followed by <h4>" }
        ],
        "errors": []
      }
    },
    {
      "name": "Performance",
      "passes": 45,
      "warnings": 0,
      "errors": 0,
      "details": {
        "passes": [
          { "page": "/index.html", "message": "No render-blocking scripts in <head>" },
          { "page": "/index.html", "message": "HTML size OK (23.4KB)" }
        ],
        "warnings": [],
        "errors": []
      }
    }
  ]
}
```

## Terminal Output

```
  Astro SEO Audit -- ./dist

  Pages analyzed: 45

  Auditor              Status
  ------------------------------------------------------------
  Meta Tags            * 42 pass  ! 3 warnings
  Schema Markup        * 38 pass  ! 7 warnings
  Hreflang             * 40 pass  ! 5 warnings
  Sitemap              * All pass
  Images               ! 12 warnings
  Headings             * 44 pass  ! 1 warnings
  Performance          * All pass

  Overall Score: 87/100
```
