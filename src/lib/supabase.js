import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = !__DEMO__ && url && key ? createClient(url, key) : null;
export async function rpc(name, args) {
  if (!supabase)
    throw Error("Tính năng hợp tác chưa được mở trên phiên bản xem thử.");
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}
// shortcut: load the small catalog once; use filtered, paginated RPCs beyond a few thousand entries.
export async function readCatalog() {
  if (__DEMO__) {
    const [food, restaurants, links, recipes] = await Promise.all([
      import("../../data/food.json"),
      import("../../data/restaurants.json"),
      import("../../data/dish-restaurants.json"),
      import("../../data/recipes.json"),
    ]);
    return {
      dishes: food.default.DISHES,
      restaurants: restaurants.default.restaurants,
      links: links.default.links,
      recipes: recipes.default,
    };
  }
  return rpc("get_catalog");
}
