import { Link, useSearchParams } from "react-router";
import { useCatalog } from "../providers.jsx";
import {
  linksForRestaurant,
  mapsUrl,
  money,
  photo,
  restaurantPhoto,
} from "../lib/catalog.js";
import {
  External,
  Image,
  RestaurantCard,
  RestaurantOrder,
  SaveButton,
  Status,
} from "../components/ui.jsx";

export default function RestaurantPage() {
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
