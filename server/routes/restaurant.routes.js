import { listRestaurants, showRestaurant } from '../controllers/restaurant.controller.js';

export async function handleRestaurants(req, res, url) {
  if (url.pathname !== '/api/restaurants' && !url.pathname.startsWith('/api/restaurants/')) return false;
  if (req.method !== 'GET') {
    res.writeHead(405, { Allow: 'GET', 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: 'Chỉ hỗ trợ đọc danh sách địa điểm.' }));
    return true;
  }
  if (url.pathname === '/api/restaurants') await listRestaurants(req, res, url);
  else await showRestaurant(req, res, decodeURIComponent(url.pathname.slice('/api/restaurants/'.length)));
  return true;
}
