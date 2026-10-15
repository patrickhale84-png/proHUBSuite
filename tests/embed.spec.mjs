// Boots each suite file inside an iframe carrying Wix's exact embed permissions,
// then writes build/out/report.json so the verdict is readable over the API.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const OUTDIR = path.join(ROOT, 'build', 'out');
const REPORT = path.join(OUTDIR, 'report.json');

// the assembled prehub is what we verify; the root prehub is the previous release
const TARGETS = [
  { label: 'prohub.html', file: 'prohub.html', api: 'proHUB' },
  { label: 'prehub (assembled)', file: 'build/out/prehub.html', api: 'preHUB' },
  { label: 'posthub.html', file: 'posthub.html', api: 'postHUB' },
  { label: 'filmhub.html', file: 'filmhub.html', api: null },
];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.md': 'text/markdown' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const results = [];
const missing = [];
function record(file, check, ok, detail) {
  results.push({ file, check, ok: !!ok, detail: String(detail || '') });
  console.log((ok ? 'PASS  ' : 'FAIL  ') + file.padEnd(24) + check + (detail ? '  -> ' + detail : ''));
}

const SB = 'allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock';
const harness = (src, sandbox) =>
  '<!DOCTYPE html><html><body style="margin:0;background:#0b0f19">' +
  '<iframe src="/' + src + '" sandbox="' + sandbox + '" style="width:1400px;height:1000px;border:0;display:block"></iframe></body></html>';

await server.listen(0);
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1040 } });

for (const t of TARGETS) {
  const abs = path.join(ROOT, t.file);
  if (!fs.existsSync(abs)) { missing.push(t.file); record(t.label, 'present in repo', false, 'not committed yet'); continue; }

  let page;
  try {
  page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  // Playwright globs match the WHOLE url, so '**/harness' never matched '/harness?f=...' -
  // the harness page was never fulfilled, the request fell through to a 404, and there was
  // no iframe on the page at all. A regex matches the query string too.
  await page.route(/\/harness(\?|$)/, route => {
    const u = new URL(route.request().url());
    route.fulfill({ status: 200, contentType: 'text/html', body: harness(u.searchParams.get('f'), u.searchParams.get('s')) });
  });

  const statuses = [];
  page.on('response', res => { if (res.url().includes(t.file)) statuses.push(res.status() + ' ' + res.url().split('/').pop()); });
  await page.goto(base + '/harness?f=' + encodeURIComponent(t.file) + '&s=' + encodeURIComponent(SB));
  // Wait for the condition, never for a stopwatch: CI runners are slower than a laptop and a
  // fixed delay probes the frame while a 139 KB script is still parsing - that is exactly what
  // "exposes proHUB -> undefined" and "no frame" were reporting.
  try { await page.waitForSelector('iframe', { timeout: 20000 }); } catch (e) {}
  // the parent harness URL also contains 'f=<file>' (and percent-encodes the slashes), so
  // matching on the file name alone can select the HARNESS frame instead of the app.
  // Always exclude the main frame and match on the real path.
  const wanted = t.file;
  try { const body = await page.content();
    if (!/iframe/i.test(body)) record(t.label, 'harness page rendered', false, 'no iframe in the harness document');
  } catch (e) {}
  let fr = null;
  for (let i = 0; i < 40 && !fr; i++) {
    await page.waitForTimeout(500);
    fr = page.frames().find(f => f !== page.mainFrame() && f.url().includes(wanted)) || null;
  }
  if (fr && t.api) {
    try { await fr.waitForFunction('typeof window.' + t.api + ' === "object"', { timeout: 20000 }); } catch (e) {}
  }
  if (!fr) record(t.label, 'frames seen', false, page.frames().map(f => f.url()).join(' , ').slice(0, 160));
  if (fr && statuses.length) record(t.label, 'target served', statuses.some(s => s.startsWith('200')), statuses.join(' / ').slice(0, 100));
  record(t.label, 'boots inside a Wix-shaped embed', !!fr, fr ? 'frame attached' : 'no frame');
  if (!fr) { await page.close(); continue; }

  const api = t.api ? await fr.evaluate('typeof window.' + t.api) : 'n/a';
  if (t.api) record(t.label, 'exposes ' + t.api, api === 'object', api);

  if (t.api === 'proHUB') {
    const scenes = await fr.evaluate('window.proHUB.state.scenes.length');
    const tiles = await fr.$$eval('.tile', els => els.length);
    const modules = await fr.$$eval('.tile[data-mod]', els => els.length);
    record(t.label, 'nine module tiles render', modules >= 9, modules + ' module tiles / ' + tiles + ' total');
    record(t.label, 'script state readable', scenes >= 0, scenes + ' scenes');
    const st = await fr.evaluate('(function(){try{localStorage.setItem("__t","1");localStorage.removeItem("__t");return "ok"}catch(e){return "BLOCKED"}})()');
    record(t.label, 'storage available in the embed', st === 'ok', st);
    let hubs = 0;
    for (const m of ['script', 'board', 'dood', 'sheet', 'budget', 'boards', 'checkin', 'locations', 'gear']) {
      await fr.click('.tile[data-mod="' + m + '"]'); await page.waitForTimeout(360);
      const built = await fr.evaluate('(function(){var h=document.querySelector(".hub.open .hubbody");return h?h.innerHTML.length:0})()');
      if (built > 200) hubs++;
      await page.keyboard.press('Escape'); await page.waitForTimeout(140);
    }
    record(t.label, 'all nine desks open', hubs === 9, hubs + '/9 built content');
  }

  if (t.api === 'preHUB') {
    const tiles = await fr.$$eval('.tile', els => els.length);
    record(t.label, 'nine tiles render', tiles >= 9, tiles + ' tiles');
    await fr.click('.tile[data-id="stage"]'); await page.waitForTimeout(700);
    const canvas = await fr.evaluate('!!document.getElementById("stagecv")');
    record(t.label, 'staging canvas opens', canvas, canvas ? 'stagecv present' : 'missing');
    const lights = await fr.$$eval('[data-lt]', els => els.length);
    const poses = await fr.$$eval('[data-ps]', els => els.length);
    const angles = await fr.$$eval('[data-ang]', els => els.length);
    const frames = await fr.$$eval('[data-fr]', els => els.length);
    record(t.label, 'lighting rigs in the panel', lights === 5, lights + ' rigs');
    record(t.label, 'poses in the panel', poses === 6, poses + ' poses');
    record(t.label, 'camera angles and framing', angles === 3 && frames === 3, angles + ' angles / ' + frames + ' framings');
  }

  record(t.label, 'no page or console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'clean');
  } catch (e) {
    // a throw must never kill the run: record it and carry on, so the report always lands
    record(t.label, 'target completed', false, 'threw: ' + String(e && e.message ? e.message : e).slice(0, 140));
  }
  if (page) { try { await page.close(); } catch (e) {} }
}

await browser.close();
server.close();

const hardFails = results.filter(r => !r.ok && !/present in repo/.test(r.check));
const report = {
  generated: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || process.env.GITHUB_HEAD_SHA || '',
  run: process.env.GITHUB_RUN_ID || '',
  summary: { total: results.length, passed: results.filter(r => r.ok).length, failed: hardFails.length, missing: missing.length },
  missing,
  verdict: hardFails.length === 0 ? 'PASS' : 'FAIL',
  results,
};
fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log('\nreport written to build/out/report.json');
console.log(report.summary.passed + '/' + report.summary.total + ' checks passed' + (missing.length ? ' | missing: ' + missing.join(', ') : ''));
console.log('verdict: ' + report.verdict);

// also surface the verdict where a human will actually see it: the run Summary panel
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const md = [];
  md.push('## Embed compatibility');
  md.push('');
  md.push('**Verdict: ' + report.verdict + '** - ' + report.summary.passed + '/' + report.summary.total + ' checks passed' + (missing.length ? ' | missing: ' + missing.join(', ') : ''));
  md.push('');
  md.push('| Result | File | Check | Detail |');
  md.push('| --- | --- | --- | --- |');
  for (const r of results) {
    md.push('| ' + (r.ok ? 'PASS' : 'FAIL') + ' | ' + r.file + ' | ' + r.check + ' | ' + String(r.detail).replace(/\|/g, '/') + ' |');
  }
  try { fs.appendFileSync(summaryPath, md.join('\n') + '\n'); } catch (e) { console.log('summary write failed: ' + e.message); }
}

process.exit(hardFails.length === 0 ? 0 : 1);
