import { useCatalog } from "../providers.jsx";
import {
  dietLabels,
  filterDishes,
  parseFilters,
  queryFor,
} from "../lib/catalog.js";
import { Field, Icon } from "./ui.jsx";

export default function SpinOptions({ params, setParams }) {
  const { catalog } = useCatalog(),
    filters = parseFilters(params),
    count = filterDishes(catalog, filters).length;
  const update = (change) => {
    const next = queryFor({ ...filters, ...change });
    setParams(next, { replace: true });
  };
  return (
    <details className="spin-options" open={undefined}>
      <summary className="spin-options__trigger">
        Tùy chọn{" "}
        {Number(filters.recipe) +
          Number(filters.linked) +
          Number(filters.diet !== "all") || ""}
      </summary>
      <div className="spin-options__panel">
        <Field
          label="Chế độ ăn"
          as="select"
          value={filters.diet}
          options={Object.entries(dietLabels)}
          onChange={(e) => update({ diet: e.target.value })}
        />
        <div className="spin-options__quick">
          <button
            type="button"
            className="catalog-toggle"
            aria-pressed={filters.recipe}
            onClick={() => update({ recipe: !filters.recipe })}
          >
            <Icon name="book" />
            Có công thức
          </button>
          <button
            type="button"
            className="catalog-toggle"
            aria-pressed={filters.linked}
            onClick={() => update({ linked: !filters.linked })}
          >
            <Icon name="shop" />
            Có quán
          </button>
        </div>
        <p className="spin-options__help">
          Chọn cả hai điều kiện sẽ yêu cầu món có cả công thức và quán. Nhãn ăn
          uống chỉ áp dụng cho phiên bản có nguồn.
        </p>
      </div>
      <p className="spin-options__status" role="status">
        {count} món phù hợp
      </p>
    </details>
  );
}
