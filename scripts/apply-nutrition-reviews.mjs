// Apply only curated, scoped nutrition evidence; never infer labels from names.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const file = path => new URL(path, root);
const food = JSON.parse(fs.readFileSync(file('data/food.json'), 'utf8'));
const research = JSON.parse(fs.readFileSync(file('data/nutrition-research.json'), 'utf8'));
for (const profile of research.profiles) {
  const dish = food.DISHES.find(d => d.id === profile.dishId);
  assert.ok(dish, profile.dishId);
  assert.ok(profile.servingQuantity > 0);
  for (const review of profile.reviews) {
    const policy = research.policy[review.key];
    assert.ok(policy && policy.enabled !== false, review.key);
    const sugar = profile.values.sugarsG * 100 / profile.servingQuantity;
    const energy = profile.values.energyKcal * 100 / profile.servingQuantity;
    if (review.key === 'low-sugar') assert.ok(sugar <= (profile.foodForm === 'liquid' ? policy.liquidMaxGPer100ml : policy.solidMaxGPer100g));
    if (review.key === 'low-energy') assert.ok(energy <= (profile.foodForm === 'liquid' ? policy.liquidMaxKcalPer100ml : policy.solidMaxKcalPer100g));
  }
  dish.nutritionProfile = { ...profile, reviews: undefined, checkedAt: research.checkedAt, scopeType: 'reference-variant' };
  dish.nutritionReviews = profile.reviews.map(review => ({ ...review, status: 'verified', scopeType: 'reference-variant', scope: profile.scope, source: profile.source, criterionSource: research.policy[review.key].source, checkedAt: research.checkedAt }));
}
fs.writeFileSync(file('data/food.json'), JSON.stringify(food, null, 2) + '\n');
fs.writeFileSync(file('public/js/data.js'), '/* Generated from data/food.json. */\nconst FOOD = ' + JSON.stringify(food, null, 2) + ';\n');
console.log('Applied scoped nutrition profiles:', research.profiles.length);
