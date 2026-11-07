import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useCatalog } from "../providers.jsx";
import { photo } from "../lib/catalog.js";
import {
  CuisineLabel,
  External,
  Image,
  Nutrition,
  SaveButton,
  Status,
} from "../components/ui.jsx";

export default function RecipePage() {
  const { catalog } = useCatalog(),
    [params] = useSearchParams(),
    id = params.get("dish"),
    dish = catalog.dishes.find((d) => d.id === id),
    recipe = catalog.recipes[id];
  const [servings, setServings] = useState(recipe?.servings || 2),
    [ingredients, setIngredients] = useState([]),
    [steps, setSteps] = useState([]);
  if (!dish)
    return (
      <main id="main" className="page wrap">
        <Status title="Không tìm thấy món ăn">
          <Link to="/dishes">Khám phá món khác</Link>
        </Status>
      </main>
    );
  if (!recipe)
    return (
      <main id="main" className="page wrap">
        <h1>{dish.name}</h1>
        <Status title="Công thức đang được cập nhật">
          <Link to={"/result?dish=" + dish.id}>Quay lại món vừa chọn</Link>
        </Status>
      </main>
    );
  const amount = (i) =>
    i.text ||
    `${(Array.isArray(i.amount) ? i.amount : [i.amount]).map((n) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format((n * servings) / recipe.servings)).join("–")} ${i.unit}`;
  const toggle = (set, index) =>
    set((list) =>
      list.includes(index) ? list.filter((i) => i !== index) : [...list, index],
    );
  return (
    <main id="main" className="page wrap">
      <Link className="dish__recipe-link" to={"/result?dish=" + dish.id}>
        ← Quay lại món vừa chọn
      </Link>
      <section className="result">
        <div className="result__photo">
          <Image
            src={photo(dish, 1000, 750)}
            alt={dish.name}
            width="1000"
            height="750"
          />
        </div>
        <div>
          <p className="result__meta">
            <CuisineLabel id={dish.cuisine} />
          </p>
          <h1>Cách nấu {dish.name}</h1>
          <p className="result__desc">{dish.desc}</p>
          <SaveButton kind="dishes" id={dish.id} name={dish.name} text />
          <Nutrition dish={dish} />
          <dl className="recipe-facts">
            {[
              ["Khẩu phần", servings + " người"],
              ["Chuẩn bị", recipe.prep],
              ["Chế biến", recipe.cook],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {recipe.soak && <p className="section-note">{recipe.soak}</p>}
        </div>
      </section>
      <div className="recipe-columns">
        <section>
          <h2>Nguyên liệu</h2>
          <div className="serving-controls">
            <button
              className="btn"
              type="button"
              aria-label="Giảm khẩu phần"
              disabled={servings <= 1}
              onClick={() => setServings((n) => n - 1)}
            >
              −
            </button>
            <span role="status">{servings} người</span>
            <button
              className="btn"
              type="button"
              aria-label="Tăng khẩu phần"
              disabled={servings >= 12}
              onClick={() => setServings((n) => n + 1)}
            >
              +
            </button>
          </div>
          <p className="section-note">
            Định lượng lẻ làm tròn đến hai chữ số thập phân; gia vị nêm lại theo
            khẩu vị.
          </p>
          <ul className="recipe-checklist">
            {recipe.ingredients.map((i, index) => (
              <li key={index}>
                <label>
                  <input
                    type="checkbox"
                    checked={ingredients.includes(index)}
                    onChange={() => toggle(setIngredients, index)}
                  />
                  <span>
                    <strong>{amount(i)}</strong> {i.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p role="status">
            Đã chuẩn bị {ingredients.length}/{recipe.ingredients.length} nguyên
            liệu.
          </p>
          <button
            className="text-button"
            type="button"
            disabled={!ingredients.length}
            onClick={() => setIngredients([])}
          >
            Bỏ đánh dấu nguyên liệu
          </button>
        </section>
        <section>
          <h2>Cách làm</h2>
          <ol className="recipe-steps">
            {recipe.steps.map(([title, text], index) => (
              <li
                key={index}
                className={steps.includes(index) ? "is-complete" : ""}
              >
                <h3>
                  <label>
                    <input
                      type="checkbox"
                      checked={steps.includes(index)}
                      onChange={() => toggle(setSteps, index)}
                    />
                    {title}
                  </label>
                </h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <progress
            value={steps.length}
            max={recipe.steps.length}
            aria-label="Tiến độ nấu"
          />
          <p role="status">
            {steps.length === recipe.steps.length
              ? "Hoàn thành, chúc bạn ngon miệng!"
              : `Đã hoàn thành ${steps.length}/${recipe.steps.length} bước.`}
          </p>
          <button
            className="text-button"
            type="button"
            disabled={!steps.length}
            onClick={() => setSteps([])}
          >
            Bỏ đánh dấu các bước
          </button>
          <p className="recipe-tip">{recipe.tip}</p>
          <External href={recipe.source.url}>{recipe.source.label} ↗</External>
          <p className="section-note">
            Công thức tham khảo, không đại diện cho công thức riêng của quán.
          </p>
        </section>
      </div>
    </main>
  );
}
