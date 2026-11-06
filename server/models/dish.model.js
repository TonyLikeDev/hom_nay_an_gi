import { getFood } from './food.model.js';

export async function findDishes({ cuisine, meal } = {}) {
  const { DISHES } = await getFood();
  return DISHES.filter(dish =>
    (!cuisine || dish.cuisine === cuisine) &&
    (!meal || dish.meals.includes(meal))
  );
}

export async function findDishById(id) {
  const { DISHES } = await getFood();
  return DISHES.find(dish => dish.id === id);
}
