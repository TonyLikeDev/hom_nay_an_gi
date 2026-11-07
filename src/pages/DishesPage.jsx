import { useState } from "react";
import { useCatalog } from "../providers.jsx";
import { MEALS, dietLabels, filterDishes } from "../lib/catalog.js";
import { DishCard, Field, Status } from "../components/ui.jsx";

export default function DishesPage() {
  const { catalog } = useCatalog(),
    [query, setQuery] = useState(""),
    [filters, setFilters] = useState({
      cuisine: "all",
      meal: "all",
      diet: "all",
      recipe: false,
      linked: false,
    });
  const dishes = filterDishes(catalog, { ...filters, query });
  const update = (key, value) =>
    setFilters((previous) => ({ ...previous, [key]: value }));
  const reset = () => {
    setQuery("");
    setFilters({
      cuisine: "all",
      meal: "all",
      diet: "all",
      recipe: false,
      linked: false,
    });
  };
  return (
    <main id="main" className="page wrap">
      <h1>
        Tất cả món ăn <span className="page-count">({dishes.length})</span>
      </h1>
      <form className="filter-bar" onSubmit={(e) => e.preventDefault()}>
        <Field
          label="Tìm món"
          type="search"
          value={query}
          maxLength="150"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bạn đang thèm món gì?"
        />
        <Field
          label="Ẩm thực"
          as="select"
          value={filters.cuisine}
          onChange={(e) => update("cuisine", e.target.value)}
          options={[
            ["all", "Mọi ẩm thực"],
            ...Object.entries(catalog.cuisines).map(([key, c]) => [
              key,
              c.name,
            ]),
          ]}
        />
        <Field
          label="Bữa ăn"
          as="select"
          value={filters.meal}
          onChange={(e) => update("meal", e.target.value)}
          options={[
            ["all", "Mọi bữa ăn"],
            ...Object.entries(MEALS).map(([key, m]) => [key, m.label]),
          ]}
        />
        <Field
          label="Chế độ ăn"
          as="select"
          value={filters.diet}
          onChange={(e) => update("diet", e.target.value)}
          options={Object.entries(dietLabels)}
        />
        <div className="filter-toggles">
          {[
            ["recipe", "Có công thức"],
            ["linked", "Có quán"],
          ].map(([key, label]) => (
            <button
              className="catalog-toggle"
              type="button"
              aria-pressed={filters[key]}
              key={key}
              onClick={() => update(key, !filters[key])}
            >
              {label}
            </button>
          ))}
          <button className="text-button" type="button" onClick={reset}>
            Bỏ lọc
          </button>
        </div>
      </form>
      {dishes.length ? (
        <ul className="dish-grid">
          {dishes.map((d) => (
            <DishCard key={d.id} dish={d} />
          ))}
        </ul>
      ) : (
        <Status title="Chưa có món phù hợp" retry={reset}>
          Bạn thử đổi từ khóa hoặc bỏ bớt điều kiện nhé.
        </Status>
      )}
    </main>
  );
}
