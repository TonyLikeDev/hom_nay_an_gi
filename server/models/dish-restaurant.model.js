import { getFood } from './food.model.js';
import { getRestaurantData, getDishRestaurantLinks } from './restaurant.model.js';

export async function findRestaurantsForDish(id) {
  const { DISHES } = await getFood();
  const dish = DISHES.find(item => item.id === id);
  if (!dish) return null;
  const [{ restaurants }, { links }] = await Promise.all([getRestaurantData(), getDishRestaurantLinks()]);
  const items = links.filter(link => link.dishId === id).flatMap(link => {
    const restaurant = restaurants.find(record => record.id === link.restaurantId);
    return restaurant ? [{ ...restaurant, dishMatch: link }] : [];
  });
  return { dish: { id: dish.id, name: dish.name }, area: 'Đà Nẵng',
    matches: items.filter(item => item.dishMatch.type === 'dish'),
    related: items.filter(item => item.dishMatch.type === 'related') };
}
