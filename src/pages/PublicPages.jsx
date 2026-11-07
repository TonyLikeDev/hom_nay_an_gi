import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useCatalog, useFavorites } from "../providers.jsx";
import {
  CUISINES,
  MEALS,
  dietLabels,
  filterDishes,
  getMeal,
  linksForRestaurant,
  mapsUrl,
  money,
  normalize,
  parseFilters,
  photo,
  pickDish,
  queryFor,
  restaurantPhoto,
  safeHttps,
} from "../lib/catalog.js";
import { REGIONS } from "../lib/regions.js";
import { animatePick } from "../lib/animate-pick.js";
import {
  CuisineLabel,
  DishCard,
  External,
  Field,
  Icon,
  Image,
  Nutrition,
  RestaurantCard,
  RestaurantOrder,
  SaveButton,
  Status,
} from "../components/ui.jsx";

function SpinOptions({ params, setParams }) {
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
export function HomePage() {
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
export function CuisinesPage() {
  const { catalog } = useCatalog(),
    [params, setParams] = useSearchParams(),
    navigate = useNavigate(),
    dialog = useRef(null),
    opener = useRef(null);
  const [spinning, setSpinning] = useState(false),
    [preview, setPreview] = useState(null),
    cancelPick = useRef(() => {});
  const pool = filterDishes(catalog, parseFilters(params));
  const position = Math.max(
    0,
    pool.findIndex((d) => d.id === preview?.id),
  );
  const reelDishes = pool.length
    ? [-1, 0, 1].map(
        (offset) => pool[(position + offset + pool.length) % pool.length],
      )
    : [];
  useEffect(() => () => cancelPick.current(), []);
  const start = () => {
    if (spinning || !pool.length) return;
    let last;
    try {
      last = sessionStorage.getItem("hnag:last-dish");
    } catch {}
    const dish = pickDish(pool, last);
    cancelPick.current();
    setSpinning(true);
    setPreview(dish);
    cancelPick.current = animatePick(pool, dish, {
      onPreview: setPreview,
      onFinish: () => {
        const query = queryFor(parseFilters(params));
        query.set("dish", dish.id);
        query.set("from", "slot");
        navigate("/result?" + query);
      },
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  };
  return (
    <main id="main" className="page wrap">
      <h1>Chọn nền ẩm thực</h1>
      <div className="cuisine-grid">
        {Object.entries(catalog.cuisines).map(([id, c]) => {
          const dish = catalog.dishes.find((d) => d.id === c.cover);
          return (
            <Link
              className="cuisine"
              data-cuisine={id}
              key={id}
              to={"/result?cuisine=" + id}
            >
              <span className="cuisine__photo">
                <Image
                  src={photo(dish)}
                  alt={dish.name}
                  width="640"
                  height="480"
                  loading="lazy"
                />
              </span>
              <span className="cuisine__text">
                <span className="cuisine__name">
                  <CuisineLabel id={id} />
                </span>
                <span className="cuisine__desc">{c.desc}</span>
              </span>
            </Link>
          );
        })}
        <button
          className="surprise"
          type="button"
          ref={opener}
          onClick={() => {
            setPreview(pool[0] || null);
            dialog.current.showModal();
          }}
          aria-haspopup="dialog"
        >
          <span className="surprise__name">Bất ngờ đi!</span>
          <span className="surprise__desc">
            Để máy chọn giúp bạn cả nền ẩm thực lẫn món ăn.
          </span>
        </button>
      </div>
      <dialog
        className={"slot" + (spinning ? " is-spinning" : "")}
        ref={dialog}
        aria-busy={spinning}
        onCancel={(e) => {
          if (spinning) e.preventDefault();
        }}
        onClose={() => opener.current?.focus()}
        aria-labelledby="slot-title"
      >
        <div className="slot__body">
          <button
            className="btn slot__close"
            type="button"
            disabled={spinning}
            onClick={() => dialog.current.close()}
          >
            Đóng
          </button>
          <h2 id="slot-title">Bất ngờ đi!</h2>
          <p className="slot__status" role="status">
            {spinning ? "Đang chọn món…" : `${pool.length} món phù hợp`}
          </p>
          <div className="slot__reels" aria-hidden="true">
            {[
              preview ? CUISINES[preview.cuisine]?.name : "Ẩm thực",
              preview?.name || "Chưa có món phù hợp",
            ].map((name, i) => (
              <div key={i}>
                <div className="slot__window">
                  <ul className="slot__strip" key={preview?.id}>
                    {reelDishes.length ? (
                      reelDishes.map((d, index) => (
                        <li key={index}>
                          {i ? d.name : CUISINES[d.cuisine]?.name}
                        </li>
                      ))
                    ) : (
                      <li>{name}</li>
                    )}
                  </ul>
                </div>
                <span className="slot__label">{i ? "Món ăn" : "Ẩm thực"}</span>
              </div>
            ))}
          </div>
          <button
            className="btn btn--primary slot__spin"
            type="button"
            disabled={spinning || !pool.length}
            onClick={start}
          >
            Quay
          </button>
          <fieldset disabled={spinning}>
            <SpinOptions params={params} setParams={setParams} />
          </fieldset>
        </div>
      </dialog>
    </main>
  );
}
export function DishesPage() {
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
function DeliveryDialog({ dish, platform, onClose }) {
  const dialog = useRef(null),
    [region, setRegion] = useState(() => {
      try {
        return localStorage.getItem("hnag:legacy-delivery-region") || "";
      } catch {
        return "";
      }
    }),
    [message, setMessage] = useState("");
  const platforms = {
    grab: { name: "GrabFood", url: "https://food.grab.com/vn/vi/" },
    shopee: { name: "ShopeeFood", url: "https://shopeefood.vn/" },
  };
  const target = platforms[platform],
    valid = REGIONS.includes(region);
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog
      className="delivery-dialog"
      ref={dialog}
      onClose={onClose}
      aria-labelledby="delivery-title"
    >
      <div className="delivery-dialog__body">
        <button
          className="btn"
          type="button"
          onClick={() => dialog.current.close()}
        >
          Đóng
        </button>
        <h2 id="delivery-title">
          Tìm {dish.name} qua {target.name}
        </h2>
        <p>
          Chọn khu vực tham khảo, rồi đặt địa chỉ giao hàng và tìm món trên nền
          tảng.
        </p>
        <Field
          label="Tỉnh/thành theo danh sách 63 đơn vị cũ"
          as="select"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          options={[["", "Chọn khu vực"], ...REGIONS.map((r) => [r, r])]}
        />
        <p>
          Khu vực này được lưu trên thiết bị; website không gửi địa chỉ hoặc đặt
          vị trí giao hàng cho {target.name}.
        </p>
        {valid && (
          <div className="result__actions">
            <External
              className="btn btn--primary"
              href={target.url}
              onClick={() => {
                try {
                  localStorage.setItem("hnag:legacy-delivery-region", region);
                } catch {}
              }}
            >
              Mở {target.name} ↗
            </External>
            <button
              className="btn"
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(dish.name);
                  setMessage("Đã sao chép tên món.");
                } catch {
                  setMessage("Bạn có thể sao chép tên món trong ô bên dưới.");
                }
              }}
            >
              Sao chép tên món
            </button>
          </div>
        )}
        <Field label="Tên món để tìm" readOnly value={dish.name} />
        <p role="status">{message}</p>
      </div>
    </dialog>
  );
}
export function ResultPage() {
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
            src={photo(dish, 1200, 900)}
            alt={dish.name}
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
export function RestaurantsPage() {
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
export function RestaurantPage() {
  const { catalog } = useCatalog(),
    [params] = useSearchParams(),
    restaurant = catalog.restaurants.find((r) => r.id === params.get("id"));
  if (!restaurant)
    return (
      <main id="main" className="page wrap">
        <Status title="Chưa tìm thấy địa điểm">
          <Link to="/restaurants">Quay lại danh sách quán</Link>
        </Status>
      </main>
    );
  const links = linksForRestaurant(catalog, restaurant.id),
    related = catalog.restaurants
      .filter(
        (r) => r.id !== restaurant.id && r.category === restaurant.category,
      )
      .slice(0, 3);
  return (
    <main id="main" className="page wrap">
      <Link className="dish__recipe-link" to="/restaurants">
        ← Tất cả quán ăn
      </Link>
      <section className="venue-hero">
        <div>
          <p className="section-note">
            {restaurant.category}
            {restaurant.partner ? " · Giới thiệu đối tác" : ""}
          </p>
          <h1>{restaurant.name}</h1>
          <p className="venue-address">
            {restaurant.address} · {restaurant.area}
          </p>
          <SaveButton
            kind="restaurants"
            id={restaurant.id}
            name={restaurant.name}
            text
          />
          <div className="result__actions">
            <External className="btn btn--primary" href={mapsUrl(restaurant)}>
              Tìm trên Maps ↗
            </External>
            <External className="btn" href={restaurant.website}>
              Website quán ↗
            </External>
          </div>
          <RestaurantOrder restaurant={restaurant} />
        </div>
        <figure className="restaurant-photo">
          <Image
            src={restaurantPhoto(restaurant)}
            alt={
              restaurant.photo?.kind === "illustration"
                ? "Ảnh minh họa ẩm thực"
                : restaurant.name
            }
            width="800"
            height="600"
          />
          <figcaption className="restaurant-photo__label">
            {restaurant.photo?.kind === "illustration"
              ? "Ảnh minh họa"
              : "Ảnh được cung cấp"}
            <External href={restaurant.photo?.sourceUrl}>
              {" "}
              · Nguồn ảnh ↗
            </External>
          </figcaption>
        </figure>
      </section>
      <div className="venue-columns">
        <section>
          <h2>Món liên quan tại quán</h2>
          <p className="section-note">
            {restaurant.partner
              ? "Thực đơn do quán cung cấp, đã được quản trị viên duyệt."
              : "Liên kết theo danh mục tham khảo, chưa phải thực đơn đầy đủ."}{" "}
            Giá và tình trạng bán có thể thay đổi.
          </p>
          {links.length ? (
            <ul className="venue-dishes">
              {links.map((l) => (
                <li className="venue-dish" key={l.dish.id}>
                  <Image
                    src={photo(l.dish, 400, 300)}
                    alt=""
                    width="120"
                    height="100"
                    loading="lazy"
                  />
                  <div>
                    <h3>
                      <Link to={"/result?dish=" + l.dish.id}>
                        {l.offering || l.dish.name}
                      </Link>
                    </h3>
                    <p>
                      {l.type === "related"
                        ? "Món cùng nhóm; chưa xác nhận bán đúng món này."
                        : l.priceVnd != null
                          ? money(l.priceVnd) + " / phần"
                          : "Chưa có giá riêng được xác nhận."}
                    </p>
                    <External href={l.sourceUrl}>Nguồn thực đơn ↗</External>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>Chưa có thông tin món cụ thể của địa điểm này.</p>
          )}
        </section>
        <aside className="venue-visit">
          <h2>Trước khi ghé quán</h2>
          <dl>
            <dt>Khoảng giá tham khảo</dt>
            <dd>{restaurant.priceLabel || "Chưa có thông tin"}</dd>
            <dt>Giờ mở cửa</dt>
            <dd>{restaurant.hours || "Chưa được xác nhận"}</dd>
            <dt>Liên hệ</dt>
            <dd>{restaurant.phone || "Chưa có số điện thoại"}</dd>
          </dl>
          <p>
            Thông tin nguồn:{" "}
            {restaurant.verification === "owner-supplied"
              ? "Do quán cung cấp, đã qua duyệt"
              : "Danh mục nhập, chưa xác minh độc lập"}
            .
          </p>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="venue-related">
          <h2>Các quán cùng nhóm</h2>
          <ul className="restaurant-grid">
            {related.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} heading="h3" />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
export function RecipePage() {
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
export function FavoritesPage() {
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
export function AboutPage() {
  const { catalog } = useCatalog();
  const mood = Object.values(catalog.cuisines)
    .map((c) => catalog.dishes.find((d) => d.id === c.cover))
    .filter(Boolean)
    .slice(0, 6);
  return (
    <main id="main" className="page wrap about-page">
      <h1>
        Một chút gợi ý,
        <br />
        thêm vị cho mỗi ngày.
      </h1>
      <p className="about-lead">
        Hôm nay ăn gì? giúp bạn chọn món hợp bữa, tìm địa điểm ăn uống và thử
        một công thức mới. Đồ án Advanced Web Design, Nhóm 3.
      </p>
      <div className="mood" id="mood">
        {mood.map((d) => (
          <Image
            key={d.id}
            src={photo(d, 640, 560)}
            alt={d.name}
            width="640"
            height="560"
            loading="lazy"
          />
        ))}
      </div>
      <section>
        <h2>Từ món ăn đến quán của bạn</h2>
        <p>
          Danh mục gồm thông tin tham khảo và thực đơn được chủ quán gửi. Hồ sơ
          hợp tác được kiểm tra trước khi xuất hiện công khai. Mục được quán
          cung cấp có nhãn riêng, không phải xác nhận còn món hoặc đang mở cửa.
        </p>
        <Link className="btn btn--primary" to="/partner">
          Đăng ký hợp tác
        </Link>
      </section>
      <section id="sources">
        <h2>Nguồn dữ liệu và hình ảnh</h2>
        <p>
          105 mục địa điểm ban đầu được nhập từ bảng dữ liệu của nhóm tại Đà
          Nẵng. Có mục là chuỗi, chợ hoặc khu vực; chưa phải 105 chi nhánh được
          xác minh. Giá, địa chỉ và thực đơn cần kiểm tra lại trước khi ghé.
        </p>
        <p>
          Ảnh minh họa được ghi rõ. Ảnh từ website chính thức không xác minh các
          thông tin khác của quán; quyền sử dụng ảnh phải được đối chiếu trước
          khi phát hành.
        </p>
        <details>
          <summary>Nguồn ảnh cho {catalog.dishes.length} món</summary>
          <ul>
            {catalog.dishes.map((d) => (
              <li key={d.id}>
                {d.name}:{" "}
                {d.imageUrl && safeHttps(d.imageSource?.url) ? (
                  <External href={d.imageSource.url}>
                    {d.imageSource.label || "Nguồn ảnh"}
                  </External>
                ) : d.by ? (
                  <External href={"https://unsplash.com/@" + d.by}>
                    @{d.by}
                  </External>
                ) : safeHttps(d.imageSource?.url) ? (
                  <External href={d.imageSource.url}>
                    {d.imageSource.label || "Nguồn ảnh"}
                  </External>
                ) : (
                  "Chưa có nguồn ảnh phù hợp"
                )}
              </li>
            ))}
          </ul>
        </details>
      </section>
      <section id="nutrition-sources">
        <h2>Công thức và nhãn ăn uống</h2>
        <p>
          Công thức là bản biên tập tham khảo, không phải công thức riêng của
          quán. Nhãn ăn chay áp dụng cho phiên bản được mô tả hoặc khai báo từ
          nguồn; nhãn dinh dưỡng không tự áp dụng cho suất ăn tại quán.
        </p>
        {catalog.dishes
          .filter((d) => d.nutritionProfile || d.vegetarianReview)
          .map((d) => (
            <section id={"nutrition-" + d.id} key={d.id}>
              <h3>{d.name}</h3>
              <Nutrition dish={d} />
            </section>
          ))}
      </section>
    </main>
  );
}
