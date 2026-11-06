import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const fail = message => { throw new Error(message); };
const ensure = (condition, message) => { if (!condition) fail(message); };
const unique = (rows, key, label) => {
  const ids = rows.map(row => row[key]);
  ensure(ids.every(id => typeof id === 'string' && /^[a-z0-9-]{1,100}$/.test(id)), `${label}: invalid ID`);
  ensure(new Set(ids).size === ids.length, `${label}: duplicate ID`);
  return new Set(ids);
};
export async function loadSeed() {
  const json = async name => JSON.parse(await readFile(new URL(`data/${name}.json`, root), 'utf8'));
  const [food, restaurants, associations, nutritionResearch, recipeScript] = await Promise.all([
    json('food'), json('restaurants'), json('dish-restaurants'), json('nutrition-research'),
    readFile(new URL('public/js/recipes.js', root), 'utf8'),
  ]);
  // Only execute this repository's authored recipe constant, not uploaded input.
  const recipes = JSON.parse(JSON.stringify(vm.runInNewContext(recipeScript + '; RECIPES;', {}, { timeout: 1000 })));
  const seed = { food, restaurants, associations, recipes, nutritionResearch };
  validateSeed(seed);
  return seed;
}
export function validateSeed({ food, restaurants, associations, recipes }) {
  ensure(food && Array.isArray(food.DISHES) && food.MEALS && food.CUISINES, 'Missing food catalog');
  ensure(Array.isArray(restaurants?.restaurants) && Array.isArray(associations?.links), 'Missing venues/links');
  const dishIds = unique(food.DISHES, 'id', 'dishes');
  const restaurantIds = unique(restaurants.restaurants, 'id', 'restaurants');
  const meals = new Set(Object.keys(food.MEALS));
  const mealLabels = new Set(Object.values(food.MEALS).map(meal => meal.label));
  for (const [id, cuisine] of Object.entries(food.CUISINES)) ensure(dishIds.has(cuisine.cover), `Unknown cuisine cover: ${id}`);
  const edges = new Set();
  for (const link of associations.links) {
    ensure(dishIds.has(link.dishId) && restaurantIds.has(link.restaurantId), 'Orphan dish-restaurant link');
    ensure(['dish', 'related'].includes(link.type) && typeof link.offering === 'string' && link.offering.trim(), 'Invalid association');
    const key = `${link.dishId}/${link.restaurantId}`;
    ensure(!edges.has(key), `Duplicate link: ${key}`); edges.add(key);
  }
  for (const dish of food.DISHES) {
    ensure(dish.name && typeof dish.desc === 'string' && Object.hasOwn(food.CUISINES, dish.cuisine), `Invalid dish: ${dish.id}`);
    ensure(Array.isArray(dish.meals) && dish.meals.length && dish.meals.every(meal => meals.has(meal)) && new Set(dish.meals).size === dish.meals.length, `Invalid meals: ${dish.id}`);
    const count = associations.links.filter(link => link.dishId === dish.id && link.type === 'dish').length;
    ensure(dish.linkedRestaurantCount === count, `Stale linked count: ${dish.id}`);
    for (const id of dish.source?.restaurantIds || []) ensure(associations.links.some(link => link.dishId === dish.id && link.restaurantId === id && link.type === 'dish'), `Missing source association: ${dish.id}`);
    if (dish.vegetarianReview) ensure(['reviewed','source-declared'].includes(dish.vegetarianReview.status), `Invalid vegetarian evidence: ${dish.id}`);
    const reviewKeys = new Set();
    for (const review of dish.nutritionReviews || []) {
      ensure(!reviewKeys.has(review.key) && ['low-sugar','low-carb','low-energy'].includes(review.key), `Invalid review key: ${dish.id}`); reviewKeys.add(review.key);
      ensure(review.status === 'verified' && review.basis && review.source && dish.nutritionProfile, `Incomplete nutrition evidence: ${dish.id}`);
    }
  }
  for (const restaurant of restaurants.restaurants) {
    ensure(restaurant.name && restaurant.address && restaurant.photo && restaurant.source, `Incomplete venue: ${restaurant.id}`);
    ensure(restaurant.suggestedMeals?.length && restaurant.suggestedMeals.every(label => mealLabels.has(label) || label === 'Cả ngày'), `Unknown venue meal: ${restaurant.id}`);
  }
  for (const [id, recipe] of Object.entries(recipes)) {
    ensure(dishIds.has(id), `Orphan recipe: ${id}`);
    ensure(Number.isInteger(recipe.servings) && recipe.servings >= 1 && recipe.servings <= 12, `Invalid servings: ${id}`);
    ensure(recipe.source?.label && recipe.source.url?.startsWith('https://'), `Missing recipe source: ${id}`);
    ensure(recipe.steps?.length && recipe.ingredients?.length, `Empty recipe: ${id}`);
    for (const ingredient of recipe.ingredients) {
      ensure(ingredient.name, `Unnamed ingredient: ${id}`);
      if (ingredient.text) { ensure(ingredient.amount == null, `Ambiguous quantity: ${id}`); continue; }
      const values = Array.isArray(ingredient.amount) ? ingredient.amount : [ingredient.amount];
      ensure(values.length >= 1 && values.length <= 2 && values.every(n => Number.isFinite(n) && n > 0) && ingredient.unit && (values.length === 1 || values[1] >= values[0]), `Invalid quantity: ${id}`);
    }
    ensure(recipe.steps.every(step => step.length === 2 && step.every(text => typeof text === 'string' && text.trim())), `Invalid step: ${id}`);
  }
  return true;
}
export const seedHash = seed => createHash('sha256').update(JSON.stringify(seed)).digest('hex');
export function seedCounts(seed) {
  return { dishes: seed.food.DISHES.length, restaurants: seed.restaurants.restaurants.length,
    cuisines: Object.keys(seed.food.CUISINES).length, meals: Object.keys(seed.food.MEALS).length,
    links: seed.associations.links.length, directLinks: seed.associations.links.filter(link => link.type === 'dish').length,
    relatedLinks: seed.associations.links.filter(link => link.type === 'related').length,
    recipes: Object.keys(seed.recipes).length,
    ingredients: Object.values(seed.recipes).reduce((n,r) => n+r.ingredients.length,0),
    steps: Object.values(seed.recipes).reduce((n,r) => n+r.steps.length,0),
    vegetarianReviews: seed.food.DISHES.filter(d=>d.vegetarianReview).length,
    nutritionReviews: seed.food.DISHES.reduce((n,d)=>n+(d.nutritionReviews?.length||0),0),
    nutritionProfiles: seed.food.DISHES.filter(d=>d.nutritionProfile).length };
}
