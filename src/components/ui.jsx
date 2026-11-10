import { Link, NavLink, useLocation } from "react-router";
import { useEffect, useState } from "react";
import {
  CUISINES,
  MEALS,
  deliverySearch,
  mapsUrl,
  money,
  nutritionTags,
  photo,
  placeholder,
  restaurantPhoto,
  safeHttps,
  vegetarian,
} from "../lib/catalog.js";
import { useAuth, useCatalog, useFavorites } from "../providers.jsx";

export function Icon({ name, ...props }) {
  const paths = {
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    leaf: (
      <>
        <path d="M20 4C8 2 3 9 7 15s13 1 13-11Z" />
        <path d="M4 21 15 10" />
      </>
    ),
    shop: (
      <path d="M4 10v11h16V10M3 10l2-7h14l2 7M3 10q3 4 6 0 3 4 6 0 3 4 6 0M9 21v-7h6v7" />
    ),
    book: (
      <path d="M12 5v16M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z" />
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </>
    ),
    arrow: <path d="M7 17 17 7M7 7h10v10" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
      </>
    ),
  };
  return (
    <svg
      className="action-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.sun}
    </svg>
  );
}
export function CuisineLabel({ id }) {
  const cuisine = CUISINES[id];
  if (!cuisine) return null;
  return (
    <>
      {cuisine.icon === "globe" ? (
        <Icon name="globe" />
      ) : (
        <img
          className="country-flag"
          src={"/images/flags/" + id + ".svg"}
          width="24"
          height="16"
          alt=""
        />
      )}{" "}
      {cuisine.name}
    </>
  );
}
export function Image({ src, alt = "", ...props }) {
  return (
    <img
      src={src || placeholder}
      alt={alt}
      onError={(event) => {
        if (!event.currentTarget.src.endsWith("/placeholder.svg"))
          event.currentTarget.src = placeholder;
      }}
      {...props}
    />
  );
}
export function External({ href, children, ...props }) {
  const safe = safeHttps(href);
  return safe ? (
    <a href={safe} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ) : null;
}
export function SaveButton({ kind, id, name, text = false }) {
  const { state, toggle } = useFavorites(),
    saved = state[kind].includes(id);
  return (
    <button
      className={"favorite-button" + (text ? " favorite-button--text" : "")}
      type="button"
      aria-pressed={saved}
      aria-label={(saved ? "Bỏ lưu " : "Lưu yêu thích ") + name}
      onClick={() => toggle(kind, id, name)}
    >
      <Icon name="heart" />
      {text && <span>{saved ? "Đã lưu" : "Yêu thích"}</span>}
    </button>
  );
}
export function Status({ title, children, retry }) {
  return (
    <section className="empty" role="status">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {retry && (
        <button className="btn" type="button" onClick={retry}>
          Thử lại
        </button>
      )}
    </section>
  );
}
export function CatalogBoundary({ children }) {
  const { loading, error, reload, catalog } = useCatalog();
  if (loading)
    return (
      <main id="main" className="page wrap">
        <Status title="Đang tải món và quán…" />
      </main>
    );
  if (error || !catalog)
    return (
      <main id="main" className="page wrap">
        <Status title="Chưa tải được danh mục" retry={reload}>
          {error}
        </Status>
      </main>
    );
  return children;
}
export function Field({ label, help, as = "input", options, ...props }) {
  return (
    <label className="form-field">
      <span>
        {label}
        {props.required ? " *" : ""}
      </span>
      {as === "select" ? (
        <select {...props}>
          {options.map(([value, name]) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea rows="4" {...props} />
      ) : (
        <input {...props} />
      )}{" "}
      {help && <small>{help}</small>}
    </label>
  );
}
export function MealsInput({ value, onChange, legend = "Bữa phục vụ" }) {
  return (
    <fieldset className="meal-choices">
      <legend>{legend} *</legend>
      {Object.entries(MEALS).map(([key, meal]) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={value.includes(key)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...value, key]
                  : value.filter((m) => m !== key),
              )
            }
          />
          {meal.label}
        </label>
      ))}
    </fieldset>
  );
}
export function Nutrition({ dish }) {
  const tags = nutritionTags(dish),
    review = dish.vegetarianReview,
    profile = dish.nutritionProfile;
  if (!vegetarian(dish) && !tags.length) return null;
  return (
    <details className="nutrition-details">
      <summary>
        {vegetarian(dish) && (
          <span className="vegetarian-badge">
            <Icon name="leaf" />
            Ăn chay
          </span>
        )}
        {tags.map((tag) => (
          <span
            key={tag.key}
            className="nutrition-badge"
            data-nutrition={tag.key}
          >
            {tag.key === "low-sugar" ? "Ít đường" : "Ít năng lượng"}*
          </span>
        ))}
        <span className="sr-only"> — xem phạm vi và nguồn</span>
      </summary>
      <div className="nutrition-explanation">
        {review && (
          <>
            <p>
              {review.status === "reviewed"
                ? "Đã rà soát nguyên liệu của phiên bản tham khảo."
                : "Theo thông tin nguồn, chưa xác minh độc lập nguyên liệu tại quán."}
            </p>
            <p>{review.scope}</p>
            {review.ingredients && (
              <p>Nguyên liệu: {review.ingredients.join(", ")}.</p>
            )}
            <External href={review.source}>Nguồn thành phần ↗</External>
          </>
        )}
        {profile && (
          <>
            <p>{profile.scope}</p>
            <p>
              {profile.serving}: {profile.values?.energyKcal} kcal ·{" "}
              {profile.values?.sugarsG} g đường ·{" "}
              {profile.values?.carbohydrateG} g carbohydrate.
            </p>
            <p>{profile.dataNote}</p>
            <p>Ngày đối chiếu: {profile.checkedAt}</p>
            <External href={profile.source}>{profile.sourceLabel} ↗</External>
          </>
        )}
        {tags.map((r) => (
          <p key={r.key}>{r.basis}</p>
        ))}
        <p>
          Nhãn chỉ áp dụng cho phiên bản được mô tả; vui lòng kiểm tra nguyên
          liệu khi gọi tại quán.
        </p>
      </div>
    </details>
  );
}
export function DishCard({ dish }) {
  const { catalog } = useCatalog();
  return (
    <li>
      <article className="dish" data-cuisine={dish.cuisine}>
        <Link className="dish__photo" to={"/result?dish=" + dish.id}>
          <Image
            src={photo(dish, 560, 420)}
            alt={dish.name}
            width="560"
            height="420"
            loading="lazy"
          />
        </Link>
        <SaveButton kind="dishes" id={dish.id} name={dish.name} />
        <div className="dish__heading">
          <Link className="dish__name" to={"/result?dish=" + dish.id}>
            {dish.name}
          </Link>
        </div>
        <Nutrition dish={dish} />
        <span className="dish__meta">
          <CuisineLabel id={dish.cuisine} />
        </span>
        <span className="dish__meals">
          {dish.meals.map((m) => (
            <span className="meal-tag" key={m}>
              {MEALS[m]?.label}
            </span>
          ))}
        </span>
        {dish.linkedRestaurantCount > 0 && (
          <span className="dish__linked">
            {dish.linkedRestaurantCount} địa điểm liên quan →
          </span>
        )}
        {catalog.recipes[dish.id] && (
          <Link className="dish__recipe-link" to={"/recipe?dish=" + dish.id}>
            Xem công thức →
          </Link>
        )}
      </article>
    </li>
  );
}
export function RestaurantOrder({ restaurant }) {
  // Imported names carry a dish in brackets, e.g. "Phở Thìn Đà Nẵng (Phở bò tái lăn)".
  const name = restaurant.name.replace(/\s*\([^)]*\)/g, "").trim() || restaurant.name;
  const platforms = [
    [
      "GrabFood",
      safeHttps(restaurant.grabFoodUrl, ["food.grab.com"]),
      deliverySearch.grab(name),
    ],
    [
      "ShopeeFood",
      safeHttps(restaurant.shopeeFoodUrl, [
        "shopeefood.vn",
        "www.shopeefood.vn",
      ]),
      deliverySearch.shopee(name),
    ],
  ];
  return (
    <details className="restaurant-order">
      <summary
        className="btn btn--primary"
        aria-label={"Đặt hàng tại " + restaurant.name}
      >
        Đặt hàng <Icon name="arrow" />
      </summary>
      <div className="restaurant-order__options">
        {platforms.map(([name, direct, fallback]) => (
          <External key={name} className="btn" href={direct || fallback}>
            {direct ? "Đặt qua " : "Tìm trên "}
            {name} ↗
          </External>
        ))}
        <p className="section-note">
          {platforms.some(([, direct]) => !direct)
            ? `“Tìm trên” mở kết quả tìm ${name} trên nền tảng; đối chiếu địa chỉ ${restaurant.address} trước khi đặt.`
            : "Kiểm tra đúng chi nhánh, món, giá và phí giao hàng trước khi đặt trên nền tảng."}
        </p>
      </div>
    </details>
  );
}
export function RestaurantCard({ restaurant: r, match, heading = "h2" }) {
  const Heading = heading;
  return (
    <li>
      <article className="restaurant-card">
        <figure className="restaurant-photo">
          <Image
            src={restaurantPhoto(r)}
            alt={
              r.photo?.kind === "illustration" ? "Ảnh minh họa ẩm thực" : r.name
            }
            width="600"
            height="400"
            loading="lazy"
          />
          <figcaption className="restaurant-photo__label">
            {r.photo?.kind === "official-page"
              ? "Ảnh từ website quán"
              : ["owner-provided", "admin-provided"].includes(r.photo?.kind)
                ? "Ảnh được cung cấp"
                : "Ảnh minh họa"}
          </figcaption>
        </figure>
        <div className="restaurant-card__content">
          <p className="restaurant-card__category">
            {r.category}
            {r.partner ? " · Giới thiệu đối tác" : ""}
          </p>
          <Heading>
            <Link
              className="restaurant-card__title"
              to={"/restaurant?id=" + r.id}
            >
              {r.name}
            </Link>
          </Heading>
          {match && (
            <p className="restaurant-match">
              {match.offering}
              {match.priceVnd != null
                ? " · " + money(match.priceVnd) + " / phần"
                : ""}
            </p>
          )}
          <p className="restaurant-card__address">{r.address}</p>
          <p className="restaurant-card__price">
            {r.priceLabel || "Chưa có khoảng giá"}
          </p>
          <p className="restaurant-card__price-note">
            Giá tham khảo, cần kiểm tra lại
          </p>
          <div className="dish__meals">
            {(r.suggestedMeals || []).map((meal) => (
              <span className="meal-tag" key={meal}>
                {MEALS[meal]?.label || meal}
              </span>
            ))}
          </div>
          <RestaurantOrder restaurant={r} />
          <div className="restaurant-card__actions">
            <External href={mapsUrl(r)}>Tìm trên Maps ↗</External>
            <Link to={"/restaurant?id=" + r.id}>Xem quán →</Link>
          </div>
        </div>
        <div className="restaurant-card__save">
          <SaveButton kind="restaurants" id={r.id} name={r.name} />
        </div>
      </article>
    </li>
  );
}
function ThemePicker() {
  const [mode, setMode] = useState(() => {
    try {
      return ["light", "dark"].includes(localStorage.getItem("hnag:theme"))
        ? localStorage.getItem("hnag:theme")
        : "system";
    } catch {
      return "system";
    }
  });
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        mode === "system" ? (media.matches ? "dark" : "light") : mode;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);
  useEffect(() => {
    const sync = (e) => {
      if (e.key === "hnag:theme" || e.key === null)
        setMode(["light", "dark"].includes(e.newValue) ? e.newValue : "system");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return (
    <label className="theme-select">
      <span className="sr-only">Chế độ giao diện</span>
      <select
        value={mode}
        onChange={(e) => {
          setMode(e.target.value);
          try {
            localStorage.setItem("hnag:theme", e.target.value);
          } catch {
            /* Theme switching works without storage. */
          }
        }}
      >
        <option value="system">Hệ thống</option>
        <option value="light">Sáng</option>
        <option value="dark">Tối</option>
      </select>
    </label>
  );
}
export function Layout({ children }) {
  const { user, admin, signOut } = useAuth(),
    { demo } = useCatalog(),
    location = useLocation();
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    setOpen(false);
    setError("");
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const links = [
    ["/cuisines", "Ẩm thực"],
    ["/dishes", "Tất cả món ăn"],
    ["/restaurants", "Quán ăn"],
    ["/favorites", "Yêu thích"],
    ["/about", "Giới thiệu"],
    ["/partner", "Dành cho quán"],
  ];
  return (
    <>
      <a className="skip" href="#main">
        Bỏ qua đến nội dung chính
      </a>
      <header className={"site-header wrap" + (open ? " is-open" : "")}>
        <Link className="logo" to="/">
          Hôm nay ăn gì?
        </Link>
        <div className="header-controls">
          <ThemePicker />
          <button
            className="btn nav-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen(!open)}
          >
            Menu
          </button>
        </div>
        <nav
          className="nav"
          id="main-nav"
          aria-label="Menu chính"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <ul>
            {links.map(([to, label]) => (
              <li key={to}>
                <NavLink to={to}>{label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {demo && (
        <p className="demo-notice wrap">
          Bản xem thử với danh mục tham khảo. Đăng nhập và gửi hồ sơ chưa được
          mở.
        </p>
      )}
      {children}
      <footer className="site-footer">
        <div className="wrap">
          <div className="site-footer__main">
            <div className="site-footer__intro">
              <Link className="logo" to="/">
                Hôm nay ăn gì?
              </Link>
              <p>Một chút gợi ý, thêm vị cho mỗi ngày.</p>
            </div>
            <nav
              className="site-footer__nav"
              aria-label="Điều hướng cuối trang"
            >
              <Link to="/partner">Đăng ký hợp tác</Link>
              <Link to="/about">Nguồn dữ liệu</Link>
              {admin && <Link to="/admin">Quản trị</Link>}
              {user ? (
                <button
                  className="text-button"
                  type="button"
                  disabled={signingOut}
                  onClick={async () => {
                    setSigningOut(true);
                    try {
                      await signOut();
                    } catch {
                      setError("Chưa đăng xuất được. Vui lòng thử lại.");
                    } finally {
                      setSigningOut(false);
                    }
                  }}
                >
                  {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
                </button>
              ) : (
                <Link to="/login">Đăng nhập</Link>
              )}
            </nav>
          </div>
          {error && <p role="alert">{error}</p>}
          <div className="site-footer__bottom">
            <p>© 2026 Hôm nay ăn gì? · Nhóm 3</p>
            <p>Đồ án Advanced Web Design</p>
          </div>
        </div>
      </footer>
    </>
  );
}
