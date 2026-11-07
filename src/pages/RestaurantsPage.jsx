import { useSearchParams } from "react-router";
import { useCatalog } from "../providers.jsx";
import { MEALS, normalize } from "../lib/catalog.js";
import { Field, RestaurantCard, Status } from "../components/ui.jsx";

export default function RestaurantsPage() {
  const { catalog } = useCatalog(),
    [params, setParams] = useSearchParams();
  const q = params.get("q") || "",
    category = params.get("category") || "",
    meal = params.get("meal") || "",
    price = params.get("priceTier") || "",
    dishId = params.get("dish") || "",
    nutrition = params.get("nutrition") || "all";
  const facets = (key) =>
    [...new Set(catalog.restaurants.map((r) => r[key]).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, "vi"),
    );
  const filtered = catalog.restaurants.filter(
    (r) =>
      (!q ||
        normalize(r.name + " " + r.address + " " + r.area).includes(
          normalize(q),
        )) &&
      (!category || r.category === category) &&
      (!price || r.priceTier === price) &&
      (!meal ||
        r.suggestedMeals?.some(
          (m) => m === meal || m === "Cả ngày" || MEALS[m]?.label === meal,
        )) &&
      (!dishId ||
        catalog.links.some(
          (l) => l.dishId === dishId && l.restaurantId === r.id,
        )) &&
      nutrition === "all",
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 12)),
    page = Math.min(
      pages,
      Math.max(1, Math.trunc(Number(params.get("page"))) || 1),
    );
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete("page");
    setParams(next, { replace: true });
  };
  const setPage = (value) => {
    const next = new URLSearchParams(params);
    next.set("page", value);
    setParams(next);
  };
  return (
    <main id="main" className="page wrap">
      <h1>Quán ăn tại Đà Nẵng</h1>
      <p className="section-note">
        Địa điểm và thực đơn tham khảo. Thông tin do quán cung cấp được ghi rõ
        trên từng trang.
      </p>
      {dishId && (
        <p className="active-filter">
          Quán liên quan đến{" "}
          {catalog.dishes.find((d) => d.id === dishId)?.name || "món đã chọn"}{" "}
          <button
            className="text-button"
            type="button"
            onClick={() => update("dish", "")}
          >
            Bỏ điều kiện món
          </button>
        </p>
      )}
      <form className="filter-bar" onSubmit={(e) => e.preventDefault()}>
        <Field
          label="Tìm quán hoặc địa chỉ"
          type="search"
          value={q}
          maxLength="150"
          onChange={(e) => update("q", e.target.value)}
        />
        <Field
          label="Nhóm món"
          as="select"
          value={category}
          options={[
            ["", "Mọi nhóm món"],
            ...facets("category").map((v) => [v, v]),
          ]}
          onChange={(e) => update("category", e.target.value)}
        />
        <Field
          label="Bữa ăn"
          as="select"
          value={meal}
          options={[
            ["", "Mọi bữa ăn"],
            ...Object.values(MEALS).map((m) => [m.label, m.label]),
          ]}
          onChange={(e) => update("meal", e.target.value)}
        />
        <Field
          label="Mức giá"
          as="select"
          value={price}
          options={[
            ["", "Mọi mức giá"],
            ...facets("priceTier").map((v) => [v, v]),
          ]}
          onChange={(e) => update("priceTier", e.target.value)}
        />
        <button type="button" className="btn" onClick={() => setParams({})}>
          Bỏ lọc
        </button>
      </form>
      {nutrition !== "all" && (
        <p>
          Chưa có thực đơn dinh dưỡng được xác nhận từ các quán.{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => update("nutrition", "all")}
          >
            Bỏ lọc ăn kiêng
          </button>
        </p>
      )}
      <p className="section-note" role="status">
        {filtered.length} / {catalog.restaurants.length} địa điểm
      </p>
      {filtered.length ? (
        <>
          <ul className="restaurant-grid">
            {filtered.slice((page - 1) * 12, page * 12).map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                match={
                  dishId
                    ? catalog.links.find(
                        (l) => l.dishId === dishId && l.restaurantId === r.id,
                      )
                    : null
                }
              />
            ))}
          </ul>
          <nav className="pagination" aria-label="Trang quán ăn">
            <button
              className="btn"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Trang trước
            </button>
            <span>
              Trang {page} / {pages}
            </span>
            <button
              className="btn"
              type="button"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
            >
              Trang sau
            </button>
          </nav>
        </>
      ) : (
        <Status title="Chưa có quán phù hợp" retry={() => setParams({})}>
          Bạn thử từ khóa khác hoặc bỏ bớt bộ lọc.
        </Status>
      )}
    </main>
  );
}
