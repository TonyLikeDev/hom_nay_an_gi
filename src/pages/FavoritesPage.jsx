import { useState } from "react";
import { Link } from "react-router";
import { useCatalog, useFavorites } from "../providers.jsx";
import { DishCard, RestaurantCard, SaveButton } from "../components/ui.jsx";

export default function FavoritesPage() {
  const { catalog } = useCatalog(),
    { state } = useFavorites(),
    [tab, setTab] = useState("all");
  return (
    <main id="main" className="page wrap">
      <h1>Yêu thích</h1>
      <p className="section-note">
        Lưu trên trình duyệt này, chưa đồng bộ giữa các thiết bị.
      </p>
      <div className="favorites-tabs" role="group" aria-label="Loại yêu thích">
        {[
          ["all", "Tất cả"],
          ["dishes", "Món ăn"],
          ["restaurants", "Quán ăn"],
        ].map(([id, label]) => (
          <button
            type="button"
            className="btn"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            key={id}
          >
            {label}
          </button>
        ))}
      </div>
      {tab !== "restaurants" && (
        <section>
          <h2>Món đã lưu ({state.dishes.length})</h2>
          <ul className="dish-grid">
            {state.dishes.map((id) => {
              const dish = catalog.dishes.find((d) => d.id === id);
              return dish ? (
                <DishCard key={id} dish={dish} />
              ) : (
                <li className="favorite-unavailable" key={id}>
                  <p>Món hiện chưa có trong danh mục công khai.</p>
                  <SaveButton kind="dishes" id={id} name="món đã lưu" text />
                </li>
              );
            })}
          </ul>
          {!state.dishes.length && (
            <p>
              Bạn chưa lưu món nào. <Link to="/dishes">Khám phá món ăn →</Link>
            </p>
          )}
        </section>
      )}
      {tab !== "dishes" && (
        <section className="venue-related">
          <h2>Quán đã lưu ({state.restaurants.length})</h2>
          <ul className="restaurant-grid">
            {state.restaurants.map((id) => {
              const r = catalog.restaurants.find((v) => v.id === id);
              return r ? (
                <RestaurantCard key={id} restaurant={r} />
              ) : (
                <li className="favorite-unavailable" key={id}>
                  <p>Quán hiện chưa có trong danh mục công khai.</p>
                  <SaveButton
                    kind="restaurants"
                    id={id}
                    name="quán đã lưu"
                    text
                  />
                </li>
              );
            })}
          </ul>
          {!state.restaurants.length && (
            <p>
              Bạn chưa lưu quán nào.{" "}
              <Link to="/restaurants">Khám phá địa điểm →</Link>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
