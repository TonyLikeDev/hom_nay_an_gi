import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const recipes = vm.runInNewContext(readFileSync(new URL('../public/js/recipes.js', import.meta.url), 'utf8') + '; RECIPES;');
const food = JSON.parse(readFileSync(new URL('../data/food.json', import.meta.url), 'utf8'));
test('fourteen recipes map to existing dishes and have scalable ingredients, steps and attributed sources', () => {
  assert.equal(Object.keys(recipes).length, 14);
  for (const [id, recipe] of Object.entries(recipes)) {
    assert.ok(food.DISHES.some(dish => dish.id === id), id);
    assert.ok(Number.isInteger(recipe.servings) && recipe.servings > 0 && recipe.servings <= 12);
    assert.ok(recipe.ingredients.length >= 5 && recipe.steps.length >= 4);
    for (const ingredient of recipe.ingredients) {
      assert.ok(ingredient.name);
      if (!ingredient.text) {
        assert.ok(ingredient.unit);
        for (const amount of Array.isArray(ingredient.amount) ? ingredient.amount : [ingredient.amount]) assert.ok(Number.isFinite(amount) && amount > 0, id);
      }
    }
    assert.ok(recipe.source.label && recipe.source.url.startsWith('https://'));
  }
});
