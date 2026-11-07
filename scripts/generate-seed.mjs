import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const root = new URL("../", import.meta.url);
const read = async (name) =>
  JSON.parse(await readFile(new URL("data/" + name + ".json", root), "utf8"));
const [food, venues, associations, recipes] = await Promise.all(
  ["food", "restaurants", "dish-restaurants", "recipes"].map(read),
);
const unique = (values) =>
  assert.equal(new Set(values).size, values.length, "Duplicate seed IDs");
unique(food.DISHES.map((d) => d.id));
unique(venues.restaurants.map((r) => r.id));
unique(associations.links.map((l) => l.dishId + "/" + l.restaurantId));
for (const l of associations.links) {
  assert.ok(
    food.DISHES.some((d) => d.id === l.dishId),
    "Unknown dish",
  );
  assert.ok(
    venues.restaurants.some((r) => r.id === l.restaurantId),
    "Unknown restaurant",
  );
}
for (const id of Object.keys(recipes))
  assert.ok(food.DISHES.some((d) => d.id === id));
const literal = (value) =>
  "'" + JSON.stringify(value).replaceAll("'", "''") + "'::jsonb";
const rows = (table, records, columns, select) =>
  `insert into public.${table} (${columns})\nselect ${select} from jsonb_array_elements(${literal(records)}) item\non conflict do nothing;\n`;
const sql =
  "-- Committed reference catalog, not verified partner menus. Never overwrites existing rows.\nbegin;\n" +
  rows("restaurants", venues.restaurants, "id,data", "item->>'id',item") +
  rows(
    "dishes",
    food.DISHES,
    "id,data",
    "item->>'id',item-'linkedRestaurantCount'",
  ) +
  rows(
    "recipes",
    Object.entries(recipes).map(([id, data]) => ({ id, data })),
    "dish_id,data",
    "item->>'id',item->'data'",
  ) +
  rows(
    "restaurant_dishes",
    associations.links,
    "id,dish_id,restaurant_id,data",
    "(item->>'dishId')||'/'||(item->>'restaurantId'),item->>'dishId',item->>'restaurantId',item-'dishId'-'restaurantId'",
  ) +
  `do $$ declare r record; begin
    for r in select data from public.dishes loop perform private.assert_dish(r.data); end loop;
    for r in select data from public.restaurants loop perform private.assert_restaurant(r.data); end loop;
    for r in select data from public.recipes loop perform private.assert_recipe(r.data); end loop;
  end $$;
commit;
`;
await writeFile(new URL("supabase/seed.sql", root), sql);
console.log(
  `Seed prepared: ${food.DISHES.length} dishes, ${venues.restaurants.length} restaurant entries, ${associations.links.length} links, ${Object.keys(recipes).length} recipes.`,
);
