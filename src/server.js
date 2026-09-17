import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeTransaction } from './analyze.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const indexHtml = fs.readFileSync(path.join(here, '..', 'web', 'index.html'));
const port = Number(process.env.PORT || 8787);

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' });
  res.end(body);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', chunk => { size += chunk.length; if (size > 512 * 1024) { reject(new Error('BODY_TOO_LARGE')); req.destroy(); } else chunks.push(chunk); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('INVALID_JSON')); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/') return send(res, 200, indexHtml, 'text/html; charset=utf-8');
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, JSON.stringify({ ok: true, mode: 'read-only', signing: false, broadcasting: false }));
    if (req.method === 'POST' && url.pathname === '/api/analyze') {
      const body = await readJson(req);
      const result = await analyzeTransaction({
        base64Transaction: body.base64Transaction,
        policy: body.policy ?? {},
        simulate: Boolean(body.simulate),
        rpcUrl: body.rpcUrl
      });
      return send(res, 200, JSON.stringify(result, null, 2));
    }
    return send(res, 404, JSON.stringify({ error: 'NOT_FOUND' }));
  } catch (error) {
    return send(res, 400, JSON.stringify({ error: String(error?.message ?? error) }));
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Safety Gate demo: http://127.0.0.1:${port}`));
