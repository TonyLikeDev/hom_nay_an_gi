import { findRestaurants, findRestaurantById } from '../models/restaurant.model.js';

const send = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};
export async function listRestaurants(req, res, url) {
  const { searchParams: p } = url;
  const page = Number(p.get('page') ?? 1);
  const pageSize = Number(p.get('pageSize') ?? 12);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 48 || (p.get('q') || '').length > 150) {
    return send(res, 400, { message: 'Bộ lọc hoặc số trang không hợp lệ.' });
  }
  send(res, 200, await findRestaurants({ q: p.get('q') || '', category: p.get('category') || '', meal: p.get('meal') || '', priceTier: p.get('priceTier') || '', nutrition: p.get('nutrition') || '', dishId: p.get('dish') || '', page, pageSize }));
}
export async function showRestaurant(req, res, id) {
  const restaurant = await findRestaurantById(id);
  send(res, restaurant ? 200 : 404, restaurant ?? { message: 'Không tìm thấy địa điểm.' });
}
