import { CUISINES, MEALS } from "./constants.js";
export { CUISINES, MEALS };
export const normalize = (value) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
export const money = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " ₫";
export const vegetarian = (dish) =>
  ["reviewed", "source-declared"].includes(dish.vegetarianReview?.status);
export const nutritionTags = (dish) =>
  (dish.nutritionReviews || []).filter(
    (r) => r.status === "verified" && r.source && r.basis,
  );
export const dietLabels = {
  all: "Không giới hạn",
  vegetarian: "Món chay",
  "low-sugar": "Ít đường",
  "low-energy": "Ít năng lượng",
  "low-carb": "Ít tinh bột · chưa có món xác minh",
};
export const placeholder = "/images/restaurants/placeholder.svg";
export function safeHttps(value, hosts) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!hosts || hosts.includes(url.hostname))
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function photo(dish, width = 640, height = 480) {
  if (!dish) return placeholder;
  if (dish.imageUrl?.startsWith("/images/") && !dish.imageUrl.includes(".."))
    return dish.imageUrl;
  if (safeHttps(dish.imageUrl)) return safeHttps(dish.imageUrl);
  return dish.photo && typeof dish.photo === "string"
    ? `https://images.unsplash.com/${encodeURIComponent(dish.photo)}?auto=format&fit=crop&w=${width}&h=${height}&q=70${dish.crop || ""}`
    : placeholder;
}
export const restaurantPhoto = (r) =>
  r.photo?.local?.startsWith("/images/") && !r.photo.local.includes("..")
    ? r.photo.local
    : safeHttps(r.photo?.url) || placeholder;
export const mapsUrl = (record) =>
  "https://www.google.com/maps/search/?" +
  new URLSearchParams({
    api: "1",
    query: [record.name, record.address, record.area || "gần đây"]
      .filter(Boolean)
      .join(", "),
  });
export function assembleCatalog(raw) {
  const restaurants = raw.restaurants || [];
  const venues = new Set(restaurants.map((r) => r.id));
  const ids = new Set((raw.dishes || []).map((d) => d.id));
  const links = (raw.links || []).filter(
    (l) => venues.has(l.restaurantId) && ids.has(l.dishId),
  );
  const dishes = (raw.dishes || []).map((d) => ({
    ...d,
    linkedRestaurantCount: links.filter(
      (l) => l.dishId === d.id && l.type === "dish",
    ).length,
  }));
  const cuisines = Object.fromEntries(
    Object.entries(CUISINES).flatMap(([key, value]) => {
      const cover =
        dishes.find((d) => d.id === value.cover) ||
        dishes.find((d) => d.cuisine === key);
      return cover ? [[key, { ...value, cover: cover.id }]] : [];
    }),
  );
  return { dishes, restaurants, links, recipes: raw.recipes || {}, cuisines };
}
export function parseFilters(params) {
  const diet = params.get("diet") || "all";
  return {
    diet: Object.hasOwn(dietLabels, diet) ? diet : "all",
    recipe: params.get("recipe") === "1",
    linked: params.get("linked") === "1",
    invalid:
      !Object.hasOwn(dietLabels, diet) ||
      ["recipe", "linked"].some(
        (key) => params.has(key) && !["0", "1"].includes(params.get(key)),
      ),
  };
}
export function filterDishes(catalog, filters = {}) {
  return catalog.dishes.filter(
    (d) =>
      (!filters.cuisine ||
        filters.cuisine === "all" ||
        d.cuisine === filters.cuisine) &&
      (!filters.meal ||
        filters.meal === "all" ||
        d.meals.includes(filters.meal)) &&
      (!filters.query ||
        normalize(d.name).includes(normalize(filters.query))) &&
      (!filters.diet ||
        filters.diet === "all" ||
        (filters.diet === "vegetarian"
          ? vegetarian(d)
          : nutritionTags(d).some((r) => r.key === filters.diet))) &&
      (!filters.recipe || Object.hasOwn(catalog.recipes, d.id)) &&
      (!filters.linked || d.linkedRestaurantCount > 0),
  );
}
export function getMeal(date = new Date()) {
  const hour = date.getHours();
  return hour >= 5 && hour < 11
    ? "sang"
    : hour >= 11 && hour < 13
      ? "trua"
      : hour >= 13 && hour < 18
        ? "chieu"
        : hour >= 18 && hour < 22
          ? "toi"
          : "khuya";
}
export function pickDish(pool, last, meal = getMeal(), random = Math.random) {
  if (!pool.length) return null;
  const fit = pool.filter((d) => d.meals.includes(meal));
  const choices = [
    fit.filter((d) => d.id !== last),
    pool.filter((d) => d.id !== last),
    pool,
  ].find((list) => list.length);
  return choices[Math.floor(random() * choices.length)];
}
export const queryFor = (filters) => {
  const query = new URLSearchParams();
  if (filters.diet && filters.diet !== "all") query.set("diet", filters.diet);
  if (filters.recipe) query.set("recipe", "1");
  if (filters.linked) query.set("linked", "1");
  return query;
};
export const linksForRestaurant = (catalog, id) =>
  catalog.links
    .filter((l) => l.restaurantId === id)
    .flatMap((l) => {
      const dish = catalog.dishes.find((d) => d.id === l.dishId);
      return dish ? [{ ...l, dish }] : [];
    });
export function parseIngredients(text) {
  return text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.split("|").map((x) => x.trim());
      if (cells.length === 2 && cells.every(Boolean))
        return { name: cells[0], text: cells[1] };
      if (cells.length !== 3 || !cells.every(Boolean))
        throw Error("Nguyên liệu: Tên | Số lượng | Đơn vị, hoặc Tên | Một ít.");
      const amount = cells[1]
        .split(/\s*[–-]\s*/)
        .map((n) => Number(n.replace(",", ".")));
      if (
        amount.length > 2 ||
        amount.some((n) => !Number.isFinite(n) || n <= 0) ||
        (amount.length === 2 && amount[0] > amount[1])
      )
        throw Error("Định lượng phải là số dương hoặc khoảng tăng dần.");
      return {
        name: cells[0],
        amount: amount.length === 1 ? amount[0] : amount,
        unit: cells[2],
      };
    });
}
export const ingredientLines = (items) =>
  (items || [])
    .map((i) =>
      i.text !== undefined
        ? `${i.name} | ${i.text}`
        : `${i.name} | ${Array.isArray(i.amount) ? i.amount.join("–") : i.amount} | ${i.unit}`,
    )
    .join("\n");
export function parseSteps(text) {
  return text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) => {
      const at = line.indexOf("|");
      if (at < 1 || !line.slice(at + 1).trim())
        throw Error("Mỗi bước cần Tiêu đề | Hướng dẫn.");
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    });
}
