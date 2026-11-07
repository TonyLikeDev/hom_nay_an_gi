import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getRestaurantData, findRestaurants, findRestaurantById } from '../server/models/restaurant.model.js';
import { server } from '../server/app.js';
import { findRestaurantsForDish } from '../server/models/dish-restaurant.model.js';

function request(url, method = 'GET') {
  return new Promise(resolve => server.emit('request', { url, method }, {
    writeHead(status, headers) { this.status = status; this.headers = headers; },
    end(body) { resolve({ status: this.status, body: body?.toString(), headers: this.headers }); },
  }));
}

test('import preserves all 105 numbered records with provenance and valid image assets', async () => {
  const { restaurants } = await getRestaurantData();
  assert.equal(restaurants.length, 105);
  assert.equal(new Set(restaurants.map(r => r.id)).size, 105);
  assert.deepEqual(restaurants.map(r => r.sourceNumber), Array.from({ length: 105 }, (_, i) => i + 1));
  assert.equal(restaurants.filter(r => r.photo.kind === 'official-page').length, 3);
  for (const r of restaurants) {
    assert.equal(r.source.row, r.sourceNumber + 1);
    assert.ok(r.name && r.address && r.priceLabel && r.originalCategory);
    assert.equal(r.verification, 'spreadsheet');
    if (r.photo.local) assert.ok(existsSync(fileURLToPath(new URL(`../public${r.photo.local}`, import.meta.url))));
  }
});
test('search and filter combine, pagination neither loses nor duplicates records', async () => {
  const ids = [];
  for (let page = 1; page <= 9; page++) ids.push(...(await findRestaurants({ page })).items.map(r => r.id));
  assert.equal(ids.length, 105);
  assert.equal(new Set(ids).size, 105);
  const results = await findRestaurants({ q: 'mi quang', category: 'Món chính', meal: 'Trưa' });
  assert.ok(results.total > 0);
  assert.ok(results.items.every(r => r.category === 'Món chính' && (r.suggestedMeals.includes('Trưa') || r.suggestedMeals.includes('Cả ngày'))));
  assert.equal((await findRestaurants({ q: 'doesnotexist123' })).total, 0);
  assert.equal((await findRestaurants({ page: 999 })).page, 9);
  assert.equal((await findRestaurantById('dn-013')).sourceNumber, 13);
});
test('MVC API and static routes enforce method, parameters, detail and private boundaries', async () => {
  const list = await request('/api/restaurants');
  assert.equal(list.status, 200);
  assert.equal(JSON.parse(list.body).items.length, 12);
  assert.equal((await request('/api/restaurants/dn-105')).status, 200);
  assert.equal((await request('/api/restaurants/missing')).status, 404);
  assert.equal((await request('/api/restaurants', 'POST')).status, 405);
  for (const query of ['page=0', 'page=NaN', 'pageSize=49', 'pageSize=0', 'page=1.5']) assert.equal((await request(`/api/restaurants?${query}`)).status, 400);
  assert.equal((await request('/restaurants.html')).status, 200);
  assert.equal((await request('/images/restaurants/dn-013.jpg')).status, 200);
  assert.equal((await request('/data/restaurants.json')).status, 404);
  assert.equal((await request('/server/models/restaurant.model.js')).status, 404);
});

test('dish associations distinguish named dishes from related variants and avoid false matches', async () => {
  const banhXeo = await findRestaurantsForDish('banh-xeo');
  assert.equal(banhXeo.matches.length, 3);
  assert.ok(banhXeo.matches.every(r => r.dishMatch.type === 'dish'));
  assert.equal((await findRestaurantsForDish('banh-mi')).matches.length, 4);
  assert.equal((await findRestaurantsForDish('pho-bo')).matches[0].id, 'dn-053');
  const pizza = await findRestaurantsForDish('pizza-margherita');
  assert.equal(pizza.matches.length, 0);
  assert.equal(pizza.related.length, 2);
  for (const id of ['bun-cha', 'sushi', 'xoi-xoai', 'bruschetta']) {
    const result = await findRestaurantsForDish(id);
    assert.equal(result.matches.length + result.related.length, 0);
  }
  assert.equal(await findRestaurantsForDish('missing'), null);
  assert.equal((await findRestaurants({ dishId: 'banh-xeo' })).total, 3);
  const response = await request('/api/dishes/banh-xeo/restaurants');
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(response.body).matches.length, 3);
  assert.equal((await request('/api/dishes/missing/restaurants')).status, 404);
  assert.equal((await request('/api/dishes/banh-xeo/restaurants', 'POST')).status, 405);
});
