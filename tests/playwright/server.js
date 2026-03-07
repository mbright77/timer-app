/**
 * Minimal static server that serves the Blazor published output at /timer-app/
 * and redirects / → /timer-app/ for convenience.
 * SPA fallback: any path under /timer-app/ that isn't a file returns index.html.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5555;
const BASE_PATH = '/timer-app';
// Two levels up from tests/playwright → repo root, then into publish/wwwroot
const WWWROOT = path.resolve(__dirname, '../../publish/wwwroot');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.gz': 'application/gzip',
  '.br': 'application/x-br',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  // Redirect root to base path
  if (urlPath === '/' || urlPath === '') {
    res.writeHead(302, { Location: BASE_PATH + '/' });
    res.end();
    return;
  }

  // Only handle /timer-app/ paths
  if (!urlPath.startsWith(BASE_PATH)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Strip the base path prefix to get file path
  let filePath = urlPath.slice(BASE_PATH.length) || '/';
  if (filePath === '') filePath = '/';

  let fullPath = path.join(WWWROOT, filePath);

  // Try to serve the file directly
  const tryServe = (fp, fallbackToIndex) => {
    fs.stat(fp, (err, stat) => {
      if (!err && stat.isFile()) {
        const ext = path.extname(fp).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        fs.createReadStream(fp).pipe(res);
      } else if (fallbackToIndex) {
        // SPA fallback
        const indexPath = path.join(WWWROOT, 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not found: ' + fp);
      }
    });
  };

  // If path ends with /, serve index.html
  if (filePath.endsWith('/') || filePath === '') {
    tryServe(path.join(WWWROOT, 'index.html'), false);
  } else {
    tryServe(fullPath, true);
  }
});

server.listen(PORT, () => {
  console.log(`Serving ${WWWROOT} at http://localhost:${PORT}${BASE_PATH}/`);
});
