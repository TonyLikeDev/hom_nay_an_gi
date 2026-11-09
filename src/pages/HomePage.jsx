import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useCatalog } from "../providers.jsx";
import {
  MEALS,
  filterDishes,
  getMeal,
  parseFilters,
  photo,
  queryFor,
} from "../lib/catalog.js";
import { Image, Status } from "../components/ui.jsx";
import SpinOptions from "../components/SpinOptions.jsx";

const landingImages = [
  "/images/restaurants/photo-1569718212165-3a8278d5f624.jpg",
  "/images/restaurants/photo-1568901346375-23c9450c58cd.jpg",
  "/images/restaurants/photo-1565299624946-b28f40a0ae38.jpg",
  "/images/restaurants/photo-1534422298391-e4f8c172dddb.jpg",
  "/images/restaurants/photo-1546069901-ba9599a7e63c.jpg",
  "/images/restaurants/photo-1555507036-ab1f4038808a.jpg",
];

export default function HomePage() {
  const { catalog, error, reload } = useCatalog(),
    [params, setParams] = useSearchParams(),
    filters = parseFilters(params),
    meal = getMeal(),
    navigate = useNavigate();
  const pool = catalog ? filterDishes(catalog, filters) : [];
  const cuisineQuery = queryFor(filters).toString();
  const images = useMemo(() => {
    if (!catalog?.dishes.length) return landingImages;
    const fit = catalog.dishes.filter((d) => d.meals.includes(meal));
    return (fit.length ? fit : catalog.dishes)
      .slice()
      .sort(() => Math.random() - 0.5)
      .map((dish) => photo(dish, 480, 600));
  }, [catalog, meal]);
  return (
    <main id="main" className="hero wrap">
      <div>
        <h1>{MEALS[meal].greet}</h1>
        <p className="hero__sub">{MEALS[meal].sub}</p>
        <div className="hero__cta">
          <button
            className="btn btn--primary btn--lg"
            type="button"
            disabled={Boolean(error || (catalog && !pool.length))}
            onClick={() => {
              const query = queryFor(filters);
              query.set("mode", "any");
              navigate("/result?" + query);
            }}
          >
            Bất ngờ đi
          </button>
          <Link
            className="btn btn--lg"
            to={cuisineQuery ? "/cuisines?" + cuisineQuery : "/cuisines"}
          >
            Theo ẩm thực
          </Link>
        </div>
        <SpinOptions params={params} setParams={setParams} />
        {error && (
          <Status title="Chưa tải được danh mục" retry={reload}>
            {error}
          </Status>
        )}
        <p className="home-partner-link">
          Bạn có quán ăn?{" "}
          <Link to="/partner">Giới thiệu thực đơn của quán →</Link>
        </p>
      </div>
      <div className="hero__reels" aria-hidden="true">
        {[0, 1, 2].map((reel) => (
          <div className="reel" key={reel} style={{ "--i": reel }}>
            {Array.from({ length: 5 }, (_, row) => {
              const src = images[(reel * 5 + row) % images.length];
              return (
                <Image
                  key={row}
                  src={src}
                  alt=""
                  width="480"
                  height="600"
                  loading={reel === 2 ? "lazy" : "eager"}
                />
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}
