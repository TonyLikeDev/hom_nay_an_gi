import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { findRestaurants } from '../server/models/restaurant.model.js';

const source = await readFile(new URL('../public/js/nutrition.js', import.meta.url), 'utf8');
const nutrition = vm.runInNewContext(source + '; Nutrition;');
test('nutrition badges require explicit reviewed category, source and basis', () => {
  for (const record of [{}, { vegetarianReview: { status: 'reviewed' } },
    { nutritionReviews: [{ key: 'low-sugar', status: 'verified' }] },
    { nutritionReviews: [{ key: 'low-sugar', status: 'pending', source: 'menu', basis: 'per serving' }] }]) {
    assert.equal(nutrition.matches(record, 'low-sugar'), false);
    assert.equal(nutrition.badges(record), '');
  }
  const record = { nutritionReviews: [{ key: 'low-sugar', status: 'verified', source: 'reviewed recipe', basis: 'documented per-serving criterion' }] };
  assert.equal(nutrition.matches(record, 'low-sugar'), true);
  assert.equal(nutrition.matches(record, 'low-carb'), false);
  assert.match(nutrition.badges(record), /Ít đường/);
});
test('restaurant nutrition filter preserves pagination totals and does not classify unreviewed venues', async () => {
  assert.equal((await findRestaurants()).total, 105);
  for (const nutrition of ['low-sugar', 'low-carb', 'low-energy']) {
    const result = await findRestaurants({ nutrition });
    assert.equal(result.total, 0);
    assert.equal(result.totalRecords, 105);
    assert.equal(result.items.length, 0);
  }
});

test('published labels stay scoped to source-matched variants and satisfy per-100-unit thresholds', async () => {
  const food = JSON.parse(await readFile(new URL('../data/food.json', import.meta.url), 'utf8'));
  const research = JSON.parse(await readFile(new URL('../data/nutrition-research.json', import.meta.url), 'utf8'));
  assert.deepEqual(food.DISHES.filter(d => nutrition.matches(d, 'low-sugar')).map(d => d.id).sort(), ['bo-bit-tet', 'ca-phe-dac-san', 'risotto-nam']);
  assert.deepEqual(food.DISHES.filter(d => nutrition.matches(d, 'low-energy')).map(d => d.id), ['ca-phe-dac-san']);
  assert.equal(food.DISHES.filter(d => nutrition.matches(d, 'low-carb')).length, 0);
  for (const dish of food.DISHES.filter(d => d.nutritionProfile)) {
    const profile = dish.nutritionProfile;
    assert.equal(profile.scopeType, 'reference-variant');
    assert.ok(profile.scope && profile.source.startsWith('https://') && profile.dataNote);
    assert.match(nutrition.badges(dish), /\*/);
    assert.ok(nutrition.scope(dish).includes(profile.scope));
    for (const review of dish.nutritionReviews) {
      assert.equal(review.scopeType, 'reference-variant');
      const policy = research.policy[review.key];
      const liquid = profile.foodForm === 'liquid';
      const value = (review.key === 'low-sugar' ? profile.values.sugarsG : profile.values.energyKcal) * 100 / profile.servingQuantity;
      const limit = review.key === 'low-sugar' ? (liquid ? policy.liquidMaxGPer100ml : policy.solidMaxGPer100g) : (liquid ? policy.liquidMaxKcalPer100ml : policy.solidMaxKcalPer100g);
      assert.ok(value <= limit, dish.id);
    }
  }
  assert.equal(nutrition.tags(food.DISHES.find(d => d.id === 'bruschetta')).length, 0);
  assert.equal(nutrition.tags(food.DISHES.find(d => d.id === 'xoi-xoai')).length, 0);
});

test('follow-up research does not silently label mismatched recipes or specific restaurant offerings', async () => {
  const food = JSON.parse(await readFile(new URL('../data/food.json', import.meta.url), 'utf8'));
  const research = JSON.parse(await readFile(new URL('../data/nutrition-research.json', import.meta.url), 'utf8'));
  for (const id of new Set(research.followUpReview.decisions.filter(d => d.status === 'not-assigned').map(d => d.dishId))) {
    const dish = food.DISHES.find(d => d.id === id);
    assert.ok(dish, id);
    assert.equal(nutrition.tags(dish).length, 0, id);
  }
  const risotto = food.DISHES.find(d => d.id === 'risotto-nam');
  assert.equal(nutrition.matches(risotto, 'low-sugar'), true);
  assert.equal(nutrition.matches(risotto, 'low-carb'), false);
  assert.equal(nutrition.matches(risotto, 'low-energy'), false);
  assert.equal(risotto.nutritionProfile.servingQuantity, 306);
  assert.equal(risotto.nutritionProfile.values.sugarsG, 5.8);
});
