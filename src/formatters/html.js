'use strict';

/**
 * Escape a string for safe embedding in HTML.
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

function scoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

/**
 * Render an SVG ring gauge for the overall score.
 * @param {number} score
 * @returns {string}
 */
function renderGauge(score) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = scoreColor(score);
  return `
  <svg width="180" height="180" viewBox="0 0 180 180" class="gauge">
    <circle cx="90" cy="90" r="${r}" fill="none" stroke="#1f2937" stroke-width="14" />
    <circle cx="90" cy="90" r="${r}" fill="none" stroke="${color}" stroke-width="14"
      stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
      transform="rotate(-90 90 90)" />
    <text x="90" y="82" text-anchor="middle" font-size="36" font-weight="700" fill="#e5e7eb">${score}</text>
    <text x="90" y="106" text-anchor="middle" font-size="13" fill="#9ca3af">/ 100</text>
  </svg>`;
}

/**
 * Build a self-contained HTML dashboard from audit results.
 * @param {Object[]} audits
 * @param {number} totalPages
 * @param {string} distDir
 * @param {number} score
 * @param {Object} [meta]
 * @param {string} [meta.siteName]
 * @param {string} [meta.generatedAt]
 * @returns {string}
 */
function formatHtml(audits, totalPages, distDir, score, meta = {}) {
  const siteName = meta.siteName || distDir;
  const generatedAt = meta.generatedAt || new Date().toISOString();

  const totalErrors = audits.reduce((s, a) => s + a.errors.length, 0);
  const totalWarnings = audits.reduce((s, a) => s + a.warnings.length, 0);
  const totalPasses = audits.reduce((s, a) => s + a.passes.length, 0);

  const maxIssues = Math.max(1, ...audits.map((a) => a.errors.length + a.warnings.length));

  const auditorRows = audits
    .map((a) => {
      const issues = a.errors.length + a.warnings.length;
      const barWidth = Math.round((issues / maxIssues) * 100);
      return `
      <tr class="auditor-row" data-auditor="${esc(a.name)}">
        <td>${esc(a.name)}</td>
        <td class="num pass">${a.passes.length}</td>
        <td class="num warn">${a.warnings.length}</td>
        <td class="num err">${a.errors.length}</td>
        <td class="bar-cell"><div class="bar" style="width:${barWidth}%"></div></td>
      </tr>`;
    })
    .join('');

  const issueRows = [];
  for (const audit of audits) {
    for (const err of audit.errors) {
      issueRows.push({ auditor: audit.name, severity: 'error', page: err.page, message: err.message });
    }
    for (const warn of audit.warnings) {
      issueRows.push({ auditor: audit.name, severity: 'warning', page: warn.page, message: warn.message });
    }
  }

  const issueRowsHtml = issueRows
    .map(
      (i) => `
      <tr class="issue-row" data-auditor="${esc(i.auditor)}" data-severity="${i.severity}">
        <td><span class="badge ${i.severity}">${i.severity === 'error' ? 'Error' : 'Warning'}</span></td>
        <td>${esc(i.auditor)}</td>
        <td class="mono">${esc(i.page)}</td>
        <td>${esc(i.message)}</td>
      </tr>`
    )
    .join('');

  const auditorOptions = audits.map((a) => `<option value="${esc(a.name)}">${esc(a.name)}</option>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SEO Audit Dashboard -- ${esc(siteName)}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0b0f19;
    color: #e5e7eb;
  }
  header {
    padding: 32px 40px 16px;
    border-bottom: 1px solid #1f2937;
  }
  header h1 { margin: 0 0 4px; font-size: 22px; }
  header .meta { color: #9ca3af; font-size: 13px; }
  main { max-width: 1100px; margin: 0 auto; padding: 32px 24px 80px; }
  .summary {
    display: flex;
    align-items: center;
    gap: 40px;
    background: #111827;
    border: 1px solid #1f2937;
    border-radius: 12px;
    padding: 24px 32px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }
  .gauge { flex-shrink: 0; }
  .stat-grid { display: flex; gap: 32px; flex-wrap: wrap; }
  .stat { min-width: 90px; }
  .stat .num { font-size: 28px; font-weight: 700; }
  .stat .label { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; }
  .stat.pass .num { color: #22c55e; }
  .stat.warn .num { color: #eab308; }
  .stat.err .num { color: #ef4444; }
  h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.04em; color: #9ca3af; margin: 40px 0 12px; }
  table { width: 100%; border-collapse: collapse; background: #111827; border: 1px solid #1f2937; border-radius: 8px; overflow: hidden; }
  th, td { padding: 10px 14px; text-align: left; font-size: 13px; border-bottom: 1px solid #1f2937; }
  th { color: #9ca3af; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.03em; }
  tr:last-child td { border-bottom: none; }
  td.num { text-align: center; font-weight: 600; }
  td.num.pass { color: #22c55e; }
  td.num.warn { color: #eab308; }
  td.num.err { color: #ef4444; }
  .bar-cell { width: 160px; }
  .bar { height: 8px; background: #f97316; border-radius: 4px; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #d1d5db; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .badge.error { background: rgba(239,68,68,0.15); color: #ef4444; }
  .badge.warning { background: rgba(234,179,8,0.15); color: #eab308; }
  .filters { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  select, input[type="search"] {
    background: #111827; border: 1px solid #1f2937; color: #e5e7eb;
    border-radius: 6px; padding: 6px 10px; font-size: 13px;
  }
  input[type="search"] { flex: 1; min-width: 200px; }
  .empty { padding: 24px; text-align: center; color: #6b7280; }
  footer { text-align: center; color: #4b5563; font-size: 12px; padding: 24px; }
</style>
</head>
<body>
<header>
  <h1>SEO Audit Dashboard</h1>
  <div class="meta">${esc(siteName)} &middot; ${totalPages} pages analyzed &middot; generated ${esc(generatedAt)}</div>
</header>
<main>
  <div class="summary">
    ${renderGauge(score)}
    <div class="stat-grid">
      <div class="stat pass"><div class="num">${totalPasses}</div><div class="label">Passes</div></div>
      <div class="stat warn"><div class="num">${totalWarnings}</div><div class="label">Warnings</div></div>
      <div class="stat err"><div class="num">${totalErrors}</div><div class="label">Errors</div></div>
      <div class="stat"><div class="num">${totalPages}</div><div class="label">Pages</div></div>
    </div>
  </div>

  <h2>Auditors</h2>
  <table>
    <thead><tr><th>Auditor</th><th class="num">Pass</th><th class="num">Warn</th><th class="num">Err</th><th>Issues</th></tr></thead>
    <tbody>${auditorRows}</tbody>
  </table>

  <h2>Issues (${issueRows.length})</h2>
  <div class="filters">
    <select id="severityFilter">
      <option value="">All severities</option>
      <option value="error">Errors only</option>
      <option value="warning">Warnings only</option>
    </select>
    <select id="auditorFilter">
      <option value="">All auditors</option>
      ${auditorOptions}
    </select>
    <input type="search" id="searchFilter" placeholder="Filter by page or message..." />
  </div>
  <table id="issuesTable">
    <thead><tr><th>Severity</th><th>Auditor</th><th>Page</th><th>Message</th></tr></thead>
    <tbody>${issueRowsHtml}</tbody>
  </table>
  <div id="noResults" class="empty" style="display:none;">No issues match the current filters.</div>
</main>
<footer>Generated by astro-seo-audit</footer>
<script>
(function () {
  var severitySel = document.getElementById('severityFilter');
  var auditorSel = document.getElementById('auditorFilter');
  var search = document.getElementById('searchFilter');
  var rows = Array.prototype.slice.call(document.querySelectorAll('#issuesTable tbody tr'));
  var noResults = document.getElementById('noResults');

  function applyFilters() {
    var sev = severitySel.value;
    var auditor = auditorSel.value;
    var q = search.value.trim().toLowerCase();
    var visible = 0;
    rows.forEach(function (row) {
      var matchesSev = !sev || row.getAttribute('data-severity') === sev;
      var matchesAuditor = !auditor || row.getAttribute('data-auditor') === auditor;
      var matchesQ = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
      var show = matchesSev && matchesAuditor && matchesQ;
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    noResults.style.display = visible === 0 ? '' : 'none';
  }

  severitySel.addEventListener('change', applyFilters);
  auditorSel.addEventListener('change', applyFilters);
  search.addEventListener('input', applyFilters);
})();
</script>
</body>
</html>
`;
}

module.exports = { formatHtml };
