import { Field, MealsInput } from "./ui.jsx";

export default function RestaurantFields({ data, setData, owner = false }) {
  const field = (key, label, extra = {}) => (
    <Field
      key={key}
      label={label}
      value={data[key] || ""}
      onChange={(e) =>
        setData((previous) => ({ ...previous, [key]: e.target.value }))
      }
      {...extra}
    />
  );
  return (
    <>
      {field("name", "Tên quán / chi nhánh", {
        required: true,
        maxLength: 255,
      })}
      {field("address", "Địa chỉ chính xác", {
        required: true,
        maxLength: 500,
      })}
      {field("area", "Khu vực / tỉnh thành", {
        required: true,
        maxLength: 120,
      })}
      {field("category", "Nhóm món", { required: true, maxLength: 120 })}
      {field("phone", "Số điện thoại của quán", {
        type: "tel",
        required: owner,
        maxLength: 40,
      })}
      {field("hours", "Giờ mở cửa", { maxLength: 500 })}
      {field("priceLabel", "Khoảng giá tham khảo", {
        maxLength: 255,
        placeholder: "Ví dụ: 30.000–60.000 ₫ / người",
      })}
      {field("priceTier", "Mức giá để lọc", {
        maxLength: 120,
        placeholder: "Ví dụ: Bình dân",
      })}
      {field("website", "Website / trang chính thức", {
        type: "url",
        maxLength: 2000,
      })}
      {field("imageUrl", "Link ảnh được phép sử dụng (HTTPS)", {
        type: "url",
        maxLength: 2000,
      })}
      {field("grabFoodUrl", "Link GrabFood đúng chi nhánh", {
        type: "url",
        maxLength: 2000,
      })}
      {field("shopeeFoodUrl", "Link ShopeeFood đúng chi nhánh", {
        type: "url",
        maxLength: 2000,
      })}
      {owner && (
        <>
          <MealsInput
            value={data.meals || []}
            onChange={(meals) =>
              setData((previous) => ({ ...previous, meals }))
            }
          />
          <h3>Thông tin để xác minh</h3>
          {field("contactName", "Tên người đại diện", {
            required: true,
            maxLength: 120,
          })}
          {field("contactEmail", "Email liên hệ riêng", {
            type: "email",
            required: true,
            maxLength: 254,
            help: "Chỉ bạn và quản trị viên xem được.",
          })}
          {field("sourceUrl", "Link thực đơn / nguồn đối chiếu (HTTPS)", {
            type: "url",
            required: true,
            maxLength: 2000,
            help: "Trang chính thức có thực đơn để nhóm kiểm tra dữ liệu.",
          })}
        </>
      )}
    </>
  );
}
