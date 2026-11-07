import { Link } from "react-router";
import { useCatalog } from "../providers.jsx";
import { photo, safeHttps } from "../lib/catalog.js";
import { External, Image, Nutrition } from "../components/ui.jsx";

export default function AboutPage() {
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
