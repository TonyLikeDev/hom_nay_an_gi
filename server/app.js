import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { handleDishes } from './routes/dish.routes.js';
import { handleRestaurants } from './routes/restaurant.routes.js';
import { getFood } from './models/food.model.js';
import { getRecipes } from './models/recipe.model.js';
import { closeDatabase } from './config/database.js';
import { handleAuth } from './routes/auth.routes.js';
import { handleAdmin } from './routes/admin.routes.js';
import { requireAdmin } from './middleware/auth.js';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

export async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (await handleAuth(req, res, url)) return;
    if (await handleAdmin(req, res, url)) return;
    if (await handleDishes(req, res, url)) return;
    if (await handleRestaurants(req, res, url)) return;
    if (url.pathname.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ message: 'API không tồn tại.' }));
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filename = path.resolve(publicDir, '.' + relative);
    const within = path.relative(publicDir, filename);
    if (within.startsWith('..') || path.isAbsolute(within)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    const fileKey = value => process.platform==='win32'?value.toLowerCase():value;
    const isFood = fileKey(filename)===fileKey(path.join(publicDir,'js','data.js'));
    const isRecipe = fileKey(filename)===fileKey(path.join(publicDir,'js','recipes.js'));
    // Resolve aliases before serving: encoded paths must not expose the static seed snapshots.
    if (isFood || isRecipe) {
      const data = await (isFood ? getFood() : getRecipes());
      res.writeHead(200, { 'Content-Type': mime['.js'], 'Cache-Control':'no-store' });
      // Escape HTML delimiters without changing the synchronous frontend contract.
      const serialized = JSON.stringify(data).replace(/</g, '\\u003c');
      return res.end(req.method === 'HEAD' ? undefined : `const ${isFood ? 'FOOD' : 'RECIPES'} = ${serialized};`);
    }
    if (fileKey(filename) === fileKey(path.join(publicDir, 'admin.html'))) {
      if (!await requireAdmin(req, res, { page: true })) return;
      res.setHeader?.('Cache-Control', 'no-store');
    }
    const body = await readFile(filename);
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const missing = ['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code);
    const invalid = error instanceof URIError;
    if (urlIsDatabaseRequest(req.url) && !missing && !invalid) {
      console.error('Database request failed:', /^[A-Z0-9_]+$/.test(error.code || '') ? error.code : 'DATABASE_ERROR');
      if (req.url.startsWith('/api/')) {
        res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Retry-After': '5' });
        return res.end(JSON.stringify({ message: 'Chưa kết nối được dữ liệu. Bạn vui lòng thử lại sau.' }));
      }
      res.writeHead(503, { 'Content-Type': req.url.split('?')[0].endsWith('.js') ? mime['.js'] : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '5' });
      return res.end('/* Chưa kết nối được dữ liệu. Vui lòng thử lại sau. */');
    }
    if (!missing && !invalid) console.error('Request failed.');
    res.writeHead(missing ? 404 : invalid ? 400 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(missing ? 'Không tìm thấy trang.' : invalid ? 'Đường dẫn không hợp lệ.' : 'Lỗi máy chủ.');
  }
}

export const server = http.createServer(handleRequest);

function urlIsDatabaseRequest(rawUrl) {
  const pathname = rawUrl.split('?')[0];
  return pathname.startsWith('/api/') || ['/js/data.js', '/js/recipes.js', '/admin.html'].includes(pathname);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  server.listen(port, host, () => console.log(`Website: http://${host}:${port}`));
  const shutdown = () => server.close(() => closeDatabase().finally(() => { process.exitCode = 0; }));
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
