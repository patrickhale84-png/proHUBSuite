// Boots each suite file inside an iframe carrying Wix's exact embed permissions.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const FILES = ['prohub.html', 'prehub.html', 'posthub.html', 'filmhub.html'];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.md': 'text/markdown' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

// six scenes, day and night, a few departments - enough to prove the pipeline
function fixture() {
  const line = 'Ingrid moves through the space and the cleaver catches the searchlight as ash falls across the room.';
  const out = ['FADE IN:'];
  for (let i = 0; i < 6; i++) {
    out.push((i % 2 ? 'EXT' : 'INT') + '. ' + (i % 2 ? 'WOODS' : 'INTERROGATION ROOM') + ' - ' + (i % 3 === 0 ? 'NIGHT' : 'DAY'));
    out.push(line, line);
    out.push('INGRID', '(whispering)', 'Lotus, stay with me.');
    out.push('');
  }
  out.push('FADE OUT.');
  return out.join('\n');
}
function payload(text) {
  const lines = text.split('\n').filter(Boolean).map(t => ({ type: /^(INT\.|EXT\.)/.test(t) ? 'SCENE_HEADING' : (/^[A-Z (\'a-z]/.test(t) && t === t.toUpperCase() && t.length < 40 ? 'CHARACTER' : 'ACTION'), text: t }));
  return JSON.stringify({ origin: 'preHUB', target: 'proHUB', projectName: 'CI FIXTURE', lines, ts: new Date().toISOString() });
}

const results = [];
function record(file, name, ok, detail) {
  results.push({ file, name, ok, detail });
  console.log((ok ? 'PASS  ' : 'FAIL  ') + file.padEnd(14) + name + (detail ? '  -> ' + detail : ''));
}

const wixSandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock';
const harness = (src, sandbox) =>
  '<!DOCTYPE html><html><body style="margin:0;background:#0b0f19">' +
  '<iframe src="/' + src + '" sandbox="' + sandbox + '" style="width:1400px;height:1000px;border:0;display:block"></iframe>' +
  '</body></html>';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1040 } });
const app = ctx.newPage();
app.use?.route?.('**/*', r => r.continue());
await app.route('**/harness', route => {
  const u = new URL(route.request().url());
  route.fulfill({ status: 200, contentType: 'text/html', body: harness(u.searchParams.get('f'), u.searchParams.get('s')) });
});
await server.listen(0);
const base = 'http://127.0.0.1:' + server.address().port;

for (const file of FILES) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    record(file, 'present in repo', false, 'file not committed yet');
    continue;
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });

  // --- inside a Wix-shaped embed
  await page.goto(base + '/harness?f=' + file + '&s=' + encodeURIComponent(wixSandbox));
  await page.waitForTimeout(1200);
  const fr = page.frames().find(f => f.url().includes(file));
  if (!fr) { record(file, 'boots inside a sandboxed embed', false, 'no frame'); await page.close(); continue; }

  const isPro = await fr.evaluate('typeof window.proHUB !== "undefined"');
  if (isPro) {
    await fr.evaluate(t => localStorage.setItem('prehub_master_v1', JSON.parse(JSON.stringify({}) ) || ''), '');
  }
  await fr.evaluate((p) => { try { localStorage.clear(); localStorage.setItem('prehub_master_v1', p); } catch (e) {} }, payload(fixture()));

  if (file === 'prohub.html') {
    await page.goto(base + '/harness?f=' + file + '&s=' + encodeURIComponent(wixSandbox));
    await page.waitForTimeout(1900);
    const f2 = page.frames().find(f => f.url().includes(file));
    const offered = !!f2.query_selector('dialog[open]');
    record(file, 'preHUB hand-off offered', offered, offered ? 'dialog shown' : 'no dialog');
    if (offered) { await f2.click('dialog[open] .btn.pri'); await page.waitForTimeout(1200); }
    const scenes = await f2.evaluate('proHUB.state.scenes.length');
    record(file, 'script broken into scenes', scenes >= 6, scenes + ' scenes');
    const tiles = await f2.eval_on_selector_all('.tile', 'e => e.length');
    const modules = await f2.eval_on_selector_all('.tile[data-mod]', 'e => e.length');
    record(file, 'nine module tiles render', modules >= 9, modules + ' module tiles / ' + tiles + ' total');
    let hubs = 0;
    for (const m of ['script', 'board', 'dood', 'sheet', 'budget', 'boards', 'checkin', 'locations', 'gear']) {
      await f2.click('.tile[data-mod="' + m + '"]'); await page.waitForTimeout(400);
      const built = await f2.evaluate('(function(){var h=document.querySelector(".hub.open .hubbody");return h?h.innerHTML.length:0})()');
      if (built > 200) hubs++;
      await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    }
    record(file, 'all nine desks open', hubs === 9, hubs + '/9 built content');
    const st = await f2.evaluate('(function(){try{localStorage.setItem("__t","1");localStorage.removeItem("__t");return "ok"}catch(e){return "BLOCKED"}})()');
    record(file, 'storage survives the embed', st === 'ok', st);
    await page.reload(); await page.waitForTimeout(1500);
    const f3 = page.frames().find(f => f.url().includes(file));
    const kept = await f3.evaluate('proHUB.reload() + " scenes=" + proHUB.state.scenes.length');
    record(file, 'survives a reload', /scenes=[1-9]/.test(kept), kept);

    // --- the pessimistic sandbox: storage refused, app must still work
    const hard = await ctx.newPage();
    const hardErr = [];
    hard.on('pageerror', e => hardErr.push(String(e).slice(0, 160)));
    await hard.goto(base + '/harness?f=' + file + '&s=' + encodeURIComponent('allow-scripts'));
    await hard.waitForTimeout(1500);
    const hf = hard.frames().find(f => f.url().includes(file));
    const blocked = await hf.evaluate('(function(){try{localStorage.setItem("x","1");return "allowed"}catch(e){return "BLOCKED"}})()');
    const warned = await hf.is_visible('#storageWarn');
    const alive = await hf.eval_on_selector_all('.tile', 'e => e.length');
    record(file, 'degrades when storage is refused', (blocked === 'BLOCKED' ? warned : true) && alive > 0, 'storage ' + blocked + ', warning ' + warned + ', ' + alive + ' tiles');
    record(file, 'no app errors in the hard sandbox', hardErr.length === 0, hardErr.join(' | ') || 'clean');
    await hard.close();
  } else {
    const body = await fr.evaluate('document.body.innerHTML.length');
    record(file, 'boots inside a sandboxed embed', body > 500, body + ' chars rendered');
  }
  record(file, 'no console errors', errors.length === 0, errors.join(' | ') || 'clean');
  await page.close();
}
await browser.close();
server.close();

const failed = results.filter(r => !r.ok);
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
if (failed.length) { console.log('failures:'); failed.forEach(f => console.log('  ' + f.file + ' :: ' + f.name + ' -> ' + f.detail)); process.exit(1); }
