import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  assembleCatalog,
  filterDishes,
  getMeal,
  ingredientLines,
  linksForRestaurant,
  parseFilters,
  parseIngredients,
  parseSteps,
  photo,
  pickDish,
  placeholder,
  queryFor,
  safeHttps,
} from "../src/lib/catalog.js";
const json = async (name) =>
  JSON.parse(
    await readFile(
      new URL("../data/" + name + ".json", import.meta.url),
      "utf8",
    ),
  );
const [food, venues, associations, recipes] = await Promise.all(
  ["food", "restaurants", "dish-restaurants", "recipes"].map(json),
);
const raw = {
  dishes: food.DISHES,
  restaurants: venues.restaurants,
  links: associations.links,
  recipes,
};
const catalog = assembleCatalog(raw);
test("catalog preserves source counts, recipes and only counts current direct links", () => {
  assert.equal(catalog.dishes.length, 105);
  assert.equal(catalog.restaurants.length, 105);
  assert.equal(Object.keys(catalog.recipes).length, 14);
  assert.equal(filterDishes(catalog, { linked: true }).length, 78);
  assert.equal(filterDishes(catalog, { recipe: true }).length, 14);
  const changed = assembleCatalog({
    ...raw,
    links: raw.links.filter(
      (l) => l.dishId !== "mi-quang" || l.restaurantId !== "dn-001",
    ),
  });
  assert.ok(
    !linksForRestaurant(changed, "dn-001").some(
      (l) => l.dish.id === "mi-quang",
    ),
  );
  assert.equal(
    changed.dishes.find((d) => d.id === "mi-quang").linkedRestaurantCount,
    catalog.dishes.find((d) => d.id === "mi-quang").linkedRestaurantCount - 1,
  );
  const hidden = assembleCatalog({
    ...raw,
    dishes: raw.dishes.filter((d) => d.id !== "pho-bo"),
  });
  assert.ok(hidden.dishes.some((d) => d.id === hidden.cuisines.viet.cover));
  assert.deepEqual(assembleCatalog({}).cuisines, {});
});
test("filters combine, keep URL conditions, and exclude dishes without required data", () => {
  const filters = parseFilters(
    new URLSearchParams("diet=vegetarian&recipe=1&linked=1"),
  );
  assert.equal(
    queryFor(filters).toString(),
    "diet=vegetarian&recipe=1&linked=1",
  );
  assert.ok(
    filterDishes(catalog, filters).every(
      (d) => d.linkedRestaurantCount > 0 && catalog.recipes[d.id],
    ),
  );
  assert.ok(
    filterDishes(catalog, { query: "mi quang" }).some(
      (d) => d.id === "mi-quang",
    ),
  );
  assert.equal(filterDishes(catalog, { diet: "low-carb" }).length, 0);
});
test("meal boundaries and selection handle single-item and empty pools without repeating unnecessarily", () => {
  const at = (h) => new Date(2026, 10, 7, h);
  assert.deepEqual(
    [4, 5, 10, 11, 12, 13, 17, 18, 21, 22].map((h) => getMeal(at(h))),
    [
      "khuya",
      "sang",
      "sang",
      "trua",
      "trua",
      "chieu",
      "chieu",
      "toi",
      "toi",
      "khuya",
    ],
  );
  const dishes = [
    { id: "a", meals: ["trua"] },
    { id: "b", meals: ["trua"] },
  ];
  assert.equal(pickDish(dishes, "a", "trua", () => 0).id, "b");
  assert.equal(pickDish([dishes[0]], "a").id, "a");
  assert.equal(pickDish([], null), null);
});
test("recipe editor round trips numeric, range and text quantities", () => {
  for (const recipe of Object.values(recipes)) {
    assert.deepEqual(
      parseIngredients(ingredientLines(recipe.ingredients)),
      recipe.ingredients,
    );
    assert.deepEqual(
      parseSteps(recipe.steps.map((s) => s.join(" | ")).join("\n")),
      recipe.steps,
    );
  }
  assert.throws(() => parseIngredients("Rice | 150–100 | g"));
  assert.throws(() => parseIngredients("Rice | 0 | g"));
  assert.throws(() => parseSteps("Missing separator"));
});
test("external links reject script URLs, credentials and misleading delivery domains", () => {
  assert.equal(safeHttps("javascript:alert(1)"), "");
  assert.equal(safeHttps("https://user:pass@example.com"), "");
  assert.equal(
    safeHttps("https://food.grab.com.evil.example", ["food.grab.com"]),
    "",
  );
  assert.equal(
    safeHttps("https://food.grab.com/vn/vi/", ["food.grab.com"]),
    "https://food.grab.com/vn/vi/",
  );
  assert.equal(photo(undefined), placeholder);
  assert.equal(photo({ imageUrl: "/images/../../secrets" }), placeholder);
});

test("database list pagination retains every row and reports errors without claiming a partial success", async () => {
  const { readAll } = await import("../src/lib/read-all.js");
  const rows = Array.from({ length: 1205 }, (_, id) => ({ id })),
    ranges = [];
  const actual = await readAll(() => ({
    range: async (start, end) => {
      ranges.push([start, end]);
      return { data: rows.slice(start, end + 1), error: null };
    },
  }));
  assert.deepEqual(actual, rows);
  assert.deepEqual(ranges, [
    [0, 499],
    [500, 999],
    [1000, 1499],
  ]);
  await assert.rejects(
    readAll(() => ({
      range: async () => ({ data: null, error: new Error("Offline") }),
    })),
    /Offline/,
  );
});
