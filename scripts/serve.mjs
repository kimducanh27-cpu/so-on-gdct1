import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = process.env.BASE_PATH || '/so-on-gdct1';
const PORT = Number(process.env.PORT || 8123);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

function sendFile(req, res, file, status = 200) {
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end('Not found');
      return;
    }
    res.writeHead(status, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  if (pathname === PREFIX) {
    res.writeHead(302, { Location: PREFIX + '/' });
    res.end();
    return;
  }
  if (!pathname.startsWith(PREFIX + '/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Outside test base');
    return;
  }

  let rel = pathname.slice(PREFIX.length + 1);
  if (rel === '') rel = 'index.html';
  let file = path.resolve(ROOT, rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(file, (statErr, stat) => {
    if (!statErr && stat.isDirectory()) {
      file = path.join(file, 'index.html');
    }
    fs.readFile(file, (readErr) => {
      if (readErr) {
        fs.readFile(path.join(ROOT, '404.html'), (nfErr, nfData) => {
          if (nfErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end('Not found');
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(req.method === 'HEAD' ? undefined : nfData);
          }
        });
        return;
      }
      sendFile(req, res, file);
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}${PREFIX}/`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
