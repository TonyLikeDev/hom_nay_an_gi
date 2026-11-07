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
import { Image } from "../components/ui.jsx";
import SpinOptions from "../components/SpinOptions.jsx";

export default function HomePage() {
  const { catalog } = useCatalog(),
    [params, setParams] = useSearchParams(),
    filters = parseFilters(params),
    meal = getMeal(),
    navigate = useNavigate();
  const pool = filterDishes(catalog, filters);
  const images = useMemo(() => {
    const fit = catalog.dishes.filter((d) => d.meals.includes(meal));
    return (fit.length ? fit : catalog.dishes)
      .slice()
      .sort(() => Math.random() - 0.5);
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
            disabled={!pool.length}
            onClick={() => {
              const query = queryFor(filters);
              query.set("mode", "any");
              navigate("/result?" + query);
            }}
          >
            Bất ngờ đi
          </button>
          <Link className="btn btn--lg" to="/cuisines">
            Theo ẩm thực
          </Link>
        </div>
        <SpinOptions params={params} setParams={setParams} />
        <p className="home-partner-link">
          Bạn có quán ăn?{" "}
          <Link to="/partner">Giới thiệu thực đơn của quán →</Link>
        </p>
      </div>
      <div className="hero__reels" aria-hidden="true">
        {images.length ? (
          [0, 1, 2].map((reel) => (
            <div className="reel" key={reel} style={{ "--i": reel }}>
              {Array.from({ length: 5 }, (_, row) => {
                const dish = images[(reel * 5 + row) % images.length];
                return (
                  <Image
                    key={row}
                    src={photo(dish, 480, 600)}
                    alt=""
                    width="480"
                    height="600"
                    loading={reel === 2 ? "lazy" : "eager"}
                  />
                );
              })}
            </div>
          ))
        ) : (
          <p>Danh mục đang được cập nhật.</p>
        )}
      </div>
    </main>
  );
}
