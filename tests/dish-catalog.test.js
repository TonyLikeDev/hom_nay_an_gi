import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { getFood } from '../server/models/food.model.js';
import { findRestaurantsForDish } from '../server/models/dish-restaurant.model.js';
import { getDishRestaurantLinks, getRestaurantData } from '../server/models/restaurant.model.js';

test('expanded catalog is synchronized, unique and fully usable by existing filters and image rendering', async () => {
  const food = await getFood();
  const staticFood = JSON.parse(vm.runInNewContext(readFileSync(new URL('../public/js/data.js', import.meta.url), 'utf8') + '\nJSON.stringify(FOOD)'));
  assert.deepEqual(staticFood, food);
  assert.equal(food.DISHES.length, 105);
  assert.equal(new Set(food.DISHES.map(d => d.id)).size, 105);
  assert.equal(new Set(food.DISHES.map(d => d.name.toLowerCase())).size, 105);
  assert.equal(food.DISHES.filter(d => d.source?.type === 'restaurant-catalog').length, 75);
  assert.equal(food.DISHES.filter(d => d.vegetarianReview?.status === 'reviewed').length, 2);
  for (const dish of food.DISHES) {
    assert.ok(food.CUISINES[dish.cuisine], dish.id);
    assert.ok(dish.meals.length && dish.meals.every(key => food.MEALS[key]), dish.id);
    assert.ok(dish.photo || dish.imageUrl, dish.id);
    if (dish.imageUrl?.startsWith('/')) assert.ok(existsSync(new URL(`../public${dish.imageUrl}`, import.meta.url)), dish.id);
    if (dish.source?.type === 'restaurant-catalog') {
      assert.ok(dish.imageSource?.url.startsWith('https://'), dish.id);
      assert.ok(!dish.vegetarianReview || dish.vegetarianReview.status === 'source-declared', dish.id);
    }
  }
  assert.equal(food.DISHES.filter(d => d.vegetarianReview?.status === 'source-declared').length, 9);
  for (const cuisine of Object.values(food.CUISINES)) assert.ok(food.DISHES.some(d => d.id === cuisine.cover));
});

test('every new dish links only to existing named venues with consistent counts and no duplicate edges', async () => {
  const food = await getFood();
  const { links } = await getDishRestaurantLinks();
  const { restaurants } = await getRestaurantData();
  assert.equal(new Set(links.map(link => `${link.dishId}:${link.restaurantId}`)).size, links.length);
  for (const link of links) {
    assert.ok(food.DISHES.some(d => d.id === link.dishId));
    assert.ok(restaurants.some(r => r.id === link.restaurantId));
  }
  for (const dish of food.DISHES) {
    const result = await findRestaurantsForDish(dish.id);
    assert.equal(result.matches.length, dish.linkedRestaurantCount, dish.id);
    if (dish.source?.type === 'restaurant-catalog') {
      assert.ok(result.matches.length > 0, dish.id);
      assert.deepEqual(result.matches.map(r => r.id), dish.source.restaurantIds);
    }
  }
  assert.equal((await findRestaurantsForDish('mi-quang')).matches.length, 4);
  assert.equal((await findRestaurantsForDish('ca-phe-cot-dua')).matches[0].id, 'dn-037');
  assert.equal((await findRestaurantsForDish('pizza-margherita')).matches.length, 0);
  assert.equal((await findRestaurantsForDish('pizza-pho-mai')).matches.length, 1);
});
