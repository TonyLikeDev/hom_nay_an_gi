import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useCatalog } from "../providers.jsx";
import {
  MEALS,
  filterDishes,
  mapsUrl,
  parseFilters,
  photo,
  pickDish,
} from "../lib/catalog.js";
import { animatePick } from "../lib/animate-pick.js";
import {
  CuisineLabel,
  External,
  Icon,
  Image,
  Nutrition,
  RestaurantCard,
  SaveButton,
  Status,
} from "../components/ui.jsx";
import DeliveryDialog from "../components/DeliveryDialog.jsx";

export default function ResultPage() {
  const { catalog } = useCatalog(),
    [params, setParams] = useSearchParams(),
    explicit = params.get("dish"),
    cuisine = params.get("cuisine");
  const filters = parseFilters(params),
    pool = filterDishes(catalog, { ...filters, cuisine });
  const last = () => {
    try {
      return sessionStorage.getItem("hnag:last-dish");
    } catch {
      return null;
    }
  };
  const [id, setId] = useState(() => explicit || pickDish(pool, last())?.id),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(null),
    [delivery, setDelivery] = useState(null),
    cancelPick = useRef(() => {});
  const dish = catalog.dishes.find((d) => d.id === id);
  useEffect(() => {
    if (explicit) setId(explicit);
  }, [explicit]);
  useEffect(() => () => cancelPick.current(), []);
  useEffect(() => {
    setBusy(false);
    setPreview(null);
    if (
      !explicit &&
      !filters.invalid &&
      (!cuisine || catalog.cuisines[cuisine])
    )
      spin(dish);
    return () => cancelPick.current();
  }, [explicit, cuisine, filters.diet, filters.recipe, filters.linked]);
  useEffect(() => {
    if (!dish) return;
    document.title = dish.name + " | Hôm nay ăn gì?";
    try {
      sessionStorage.setItem("hnag:last-dish", dish.id);
    } catch {}
  }, [dish]);
  function spin(next = pickDish(pool, last())) {
    if (!next || !pool.length) return;
    cancelPick.current();
    const finish = () => {
      setId(next.id);
      setPreview(null);
      setBusy(false);
      const query = new URLSearchParams(params);
      query.set("dish", next.id);
      setParams(query, { replace: true });
    };
    setBusy(true);
    setPreview(dish || next);
    cancelPick.current = animatePick(pool, next, {
      onPreview: setPreview,
      onFinish: finish,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }
  if (!explicit && filters.invalid)
    return (
      <main id="main" className="page wrap">
        <Status title="Tùy chọn chưa hợp lệ">
          <Link to="/">Chọn lại tùy chọn</Link>
        </Status>
      </main>
    );
  if (cuisine && !catalog.cuisines[cuisine])
    return (
      <main id="main" className="page wrap">
        <Status title="Chưa có nền ẩm thực này">
          <Link to="/cuisines">Chọn lại ẩm thực</Link>
        </Status>
      </main>
    );
  if (!dish)
    return (
      <main id="main" className="page wrap">
        <Status
          title={
            explicit ? "Món này chưa có trong danh mục" : "Chưa có món phù hợp"
          }
        >
          <Link to="/">Chọn lại tùy chọn</Link>
        </Status>
      </main>
    );
  const shown = preview || dish,
    associations = catalog.links.filter((l) => l.dishId === dish.id),
    exact = associations.filter((l) => l.type === "dish"),
    related = exact.length ? exact : associations;
  return (
    <main id="main" className="page wrap">
      <section
        className={"result" + (busy ? " is-spinning" : " is-settled")}
        aria-busy={busy}
        data-cuisine={dish.cuisine}
      >
        <div className="result__photo">
          <Image
            src={photo(shown, 1200, 900)}
            alt={shown.name}
            width="1200"
            height="900"
          />
        </div>
        <div>
          <p className="result__meta">
            <CuisineLabel id={shown.cuisine} />
          </p>
          <h1>
            <span key={shown.id} className="result__pick-name">
              {shown.name}
            </span>
          </h1>
          <p className="result__desc">{busy ? "Đang chọn món…" : dish.desc}</p>
          {!busy && (
            <>
              <SaveButton kind="dishes" id={dish.id} name={dish.name} text />
              <Nutrition dish={dish} />
              <p>{dish.meals.map((m) => MEALS[m]?.label).join(" · ")}</p>
            </>
          )}
          <div className="result__actions">
            {!busy && (
              <External className="btn btn--primary" href={mapsUrl(dish)}>
                Tìm quán gần đây ↗
              </External>
            )}
            <button
              className="btn"
              type="button"
              disabled={busy || !pool.length}
              onClick={() => spin()}
            >
              {busy ? "Đang chọn món…" : "Chọn món khác"}
            </button>
          </div>
          {!busy && (
            <div className="result__next">
              <h2>Đặt món qua nền tảng</h2>
              <div className="delivery-options__links">
                {[
                  ["grab", "grabfood-green.png", "GrabFood"],
                  ["shopee", "shopeefood.png", "ShopeeFood"],
                ].map(([key, img, label]) => (
                  <button
                    className="btn delivery-link"
                    type="button"
                    key={key}
                    disabled={busy}
                    onClick={() => setDelivery(key)}
                  >
                    <span className="delivery-link__brand">
                      <img
                        src={"/images/brands/" + img}
                        width="100"
                        height="30"
                        alt={label}
                      />
                    </span>
                    <Icon name="arrow" />
                  </button>
                ))}
              </div>
              <p className="delivery-options__note">
                Bạn chọn địa chỉ, xác nhận món và thanh toán trên nền tảng.
              </p>
              {catalog.recipes[dish.id] ? (
                <Link
                  className="dish__recipe-link"
                  to={"/recipe?dish=" + dish.id}
                >
                  Xem công thức nấu →
                </Link>
              ) : (
                <p className="delivery-options__note">
                  Chưa có công thức tham khảo cho món này.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
      <p className="sr-only" role="status">
        {busy ? "Đang chọn món" : `Hôm nay ăn: ${dish.name}`}
      </p>
      {!busy && (
        <section className="result-restaurants">
          <h2>Thưởng thức {dish.name} ở đâu?</h2>
          <p className="section-note">
            {exact.length
              ? "Thông tin thực đơn tham khảo; giá và tình trạng bán cần kiểm tra lại."
              : related.length
                ? "Các quán cùng nhóm dưới đây chưa xác nhận bán đúng món này."
                : "Chưa có thông tin quán bán món này trong danh mục."}
          </p>
          <ul className="restaurant-grid">
            {related.slice(0, 3).map((l) => {
              const restaurant = catalog.restaurants.find(
                (r) => r.id === l.restaurantId,
              );
              return (
                <RestaurantCard
                  key={l.restaurantId}
                  restaurant={restaurant}
                  match={l}
                  heading="h3"
                />
              );
            })}
          </ul>
          <Link
            className="dish__recipe-link"
            to={
              related.length ? "/restaurants?dish=" + dish.id : "/restaurants"
            }
          >
            Khám phá các quán →
          </Link>
        </section>
      )}
      {delivery && (
        <DeliveryDialog
          dish={dish}
          platform={delivery}
          onClose={() => setDelivery(null)}
        />
      )}
    </main>
  );
}
