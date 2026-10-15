#!/usr/bin/env node
/*
 * Standalone host for the proHUB suite. Zero dependencies.
 *
 *   node deploy/server.mjs            serve on http://localhost:8080
 *   PORT=3000 node deploy/server.mjs
 *
 * Why a server at all, when the apps are single files?
 *   - localStorage is per-origin and simply works on a real origin, so projects persist
 *     without the sandbox warning the Wix embed produces.
 *   - window.print() works properly, downloads work, and canvas is not tainted for
 *     same-origin images.
 *   - /img proxies third-party images so the staging desk can import a link from a
 *     website. CORS headers on THIS server cannot grant that - only the image host can,
 *     and most do not - so the fetch happens here instead and the bytes come back
 *     same-origin.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(process.cwd());
const PORT = Number(process.env.PORT || 8080);
const MAX_IMAGE = 8 * 1024 * 1024;          // 8 MB cap on proxied images
const IMAGE_TIMEOUT = 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.pdf': 'application/pdf', '.fountain': 'text/plain; charset=utf-8',
};

// assemble once at boot: the hosted prehub should carry the modules, not the bare shell
let ASSEMBLED = null;
try {
  execFileSync('python3', ['build/build.py'], { cwd: ROOT, stdio: 'ignore' });
  const p = path.join(ROOT, 'build', 'out', 'prehub.html');
  if (fs.existsSync(p)) { ASSEMBLED = p; console.log('serving the assembled prehub (with modules)'); }
} catch (e) { /* no python, or no parts - fall back to the committed file */ }
if (!ASSEMBLED) console.log('serving the committed prehub.html');

function send(res, code, type, body) {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-cache' });
  res.end(body);
}

// a guarded image proxy: images only, size capped, no redirects into private addresses
async function proxyImage(res, target) {
  let url;
  try { url = new URL(target); } catch (e) { return send(res, 400, 'text/plain', 'bad url'); }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return send(res, 400, 'text/plain', 'http(s) only');
  const host = url.hostname;
  if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[?::1)/.test(host)) return send(res, 403, 'text/plain', 'private address');
  try {
    const ctl = AbortController ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), IMAGE_TIMEOUT) : null;
    const r = await fetch(url, { redirect: 'follow', signal: ctl ? ctl.signal : undefined });
    if (timer) clearTimeout(timer);
    const type = r.headers.get('content-type') || '';
    if (!/^image\//i.test(type)) return send(res, 415, 'text/plain', 'not an image (' + type + ')');
    const len = Number(r.headers.get('content-length') || 0);
    if (len && len > MAX_IMAGE) return send(res, 413, 'text/plain', 'image too large');
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_IMAGE) return send(res, 413, 'text/plain', 'image too large');
    res.writeHead(200, { 'content-type': type, 'access-control-allow-origin': '*', 'cache-control': 'no-store' });
    res.end(buf);
  } catch (e) {
    send(res, 502, 'text/plain', 'could not fetch the image: ' + e.message);
  }
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/health') return send(res, 200, 'application/json', JSON.stringify({ ok: true, assembled: !!ASSEMBLED }));
  if (u.pathname === '/img') return proxyImage(res, u.searchParams.get('url') || '');

  let rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
  if (rel === '' || rel === '/') rel = 'index.html';
  if (rel === 'prehub.html' && ASSEMBLED) return send(res, 200, MIME['.html'], fs.readFileSync(ASSEMBLED));
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return send(res, 404, 'text/plain', 'not found');
  }
  const type = MIME[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('proHUB suite on http://localhost:' + PORT));
