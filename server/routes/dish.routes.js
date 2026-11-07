import { listDishes, showDish, listDishRestaurants } from '../controllers/dish.controller.js';

export async function handleDishes(req, res, url) {
  if (url.pathname !== '/api/dishes' && !url.pathname.startsWith('/api/dishes/')) return false;
  if (req.method !== 'GET') {
    res.writeHead(405, { Allow: 'GET', 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: 'Phương thức không được hỗ trợ.' }));
    return true;
  }
  if (url.pathname === '/api/dishes') {
    await listDishes(req, res, url);
  } else {
    const id = decodeURIComponent(url.pathname.slice('/api/dishes/'.length));
    if (id.endsWith('/restaurants')) await listDishRestaurants(req, res, id.slice(0, -'/restaurants'.length));
    else await showDish(req, res, id);
  }
  return true;
}
