import { useRef, useState } from "react";
import { rpc } from "../../lib/supabase.js";
import { CUISINES } from "../../lib/catalog.js";
import { Field, MealsInput } from "../ui.jsx";
import RestaurantFields from "../RestaurantFields.jsx";
import { emptyRestaurant } from "../../lib/restaurant-submission.js";

const newDish = () => ({
  id: crypto.randomUUID(),
  name: "",
  desc: "",
  cuisine: "viet",
  meals: ["trua"],
  price: "",
  imageUrl: "",
});
export default function OwnerEditor({ record, email, onSaved, onClose }) {
  const [id] = useState(record?.id || crypto.randomUUID()),
    [data, setData] = useState(record?.data || emptyRestaurant(email)),
    [menu, setMenu] = useState(record?.menu || [newDish()]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    request = useRef({});
  const updateDish = (id, key, value) =>
    setMenu((items) =>
      items.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const submit = event.nativeEvent.submitter?.value === "submit";
    if (!data.meals.length || menu.some((item) => !item.meals.length)) {
      setError("Chọn ít nhất một bữa phục vụ cho quán và từng món.");
      return;
    }
    const cooked = menu.map((item) => ({ ...item, price: Number(item.price) }));
    if (
      menu.some(
        (item) =>
          item.price === "" ||
          !Number.isSafeInteger(Number(item.price)) ||
          Number(item.price) < 0,
      )
    ) {
      setError("Mỗi món cần giá nguyên VND không âm.");
      return;
    }
    const payload = JSON.stringify({ data, menu: cooked, submit });
    if (request.current.payload !== payload)
      request.current = { payload, id: crypto.randomUUID() };
    setBusy(true);
    try {
      const result = await rpc("save_submission", {
        p_id: id,
        p_revision: record?.revision || 0,
        p_request_id: request.current.id,
        p_data: data,
        p_menu: cooked,
        p_submit: submit,
      });
      onSaved(result);
    } catch (e) {
      setError(
        e.code === "40001"
          ? "Hồ sơ đã được cập nhật. Nội dung đang nhập vẫn được giữ; tải lại danh sách trước khi sửa tiếp."
          : e.code === "42501"
            ? "Phiên đăng nhập không còn quyền sửa hồ sơ này."
            : e.message ||
              "Chưa xác nhận được kết quả lưu. Bạn có thể thử lại với nội dung này.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="owner-editor" aria-labelledby="owner-editor-title">
      <h2 id="owner-editor-title">
        {record ? "Cập nhật hồ sơ quán" : "Thêm quán của bạn"}
      </h2>
      <p className="section-note">
        Thông tin mới chỉ xuất hiện công khai sau khi được duyệt. Nếu quán đã
        được duyệt, phiên bản công khai hiện tại được giữ trong lúc chờ duyệt
        lại.
      </p>
      <form onSubmit={save} aria-busy={busy}>
        <fieldset disabled={busy}>
          <div className="form-grid">
            <RestaurantFields data={data} setData={setData} owner />
          </div>
          <h3>Thực đơn ({menu.length}/50 món)</h3>
          <p className="section-note">
            Nhập đúng món và giá đang bán. Nhãn ăn chay hoặc dinh dưỡng cần được
            nhóm kiểm tra riêng.
          </p>
          {menu.map((item, index) => (
            <fieldset className="menu-item-editor" key={item.id}>
              <legend>Món {index + 1}</legend>
              <div className="form-grid">
                <Field
                  label="Tên món"
                  value={item.name}
                  maxLength="255"
                  required
                  onChange={(e) => updateDish(item.id, "name", e.target.value)}
                />
                <Field
                  label="Giá một phần (VND)"
                  type="number"
                  min="0"
                  max="999999999999"
                  step="1"
                  required
                  value={item.price}
                  onChange={(e) => updateDish(item.id, "price", e.target.value)}
                />
                <Field
                  label="Ẩm thực"
                  as="select"
                  value={item.cuisine}
                  options={Object.entries(CUISINES).map(([key, c]) => [
                    key,
                    c.name,
                  ])}
                  onChange={(e) =>
                    updateDish(item.id, "cuisine", e.target.value)
                  }
                />
                <Field
                  label="Ảnh món (HTTPS, nếu có)"
                  type="url"
                  maxLength="2000"
                  value={item.imageUrl || ""}
                  onChange={(e) =>
                    updateDish(item.id, "imageUrl", e.target.value)
                  }
                />
                <Field
                  label="Mô tả món / phần ăn"
                  as="textarea"
                  maxLength="5000"
                  value={item.desc}
                  onChange={(e) => updateDish(item.id, "desc", e.target.value)}
                />
                <MealsInput
                  value={item.meals}
                  onChange={(meals) => updateDish(item.id, "meals", meals)}
                />
              </div>
              <button
                className="text-button"
                type="button"
                disabled={menu.length === 1}
                onClick={() =>
                  setMenu((items) => items.filter((d) => d.id !== item.id))
                }
              >
                Bỏ món này
              </button>
            </fieldset>
          ))}
          <button
            className="btn"
            type="button"
            disabled={menu.length >= 50}
            onClick={() => setMenu((items) => [...items, newDish()])}
          >
            Thêm món
          </button>
          <label className="consent">
            <input
              type="checkbox"
              required
              checked={data.consent === true}
              onChange={(e) =>
                setData((previous) => ({
                  ...previous,
                  consent: e.target.checked,
                }))
              }
            />
            <span>
              Tôi có quyền đại diện quán, cung cấp thông tin và cho phép website
              giới thiệu thực đơn, sử dụng ảnh đã gửi. Tôi sẽ cập nhật khi dữ
              liệu thay đổi.
            </span>
          </label>
          <div className="editor-actions">
            <button className="btn btn--primary" type="submit" value="submit">
              {busy ? "Đang lưu…" : "Gửi duyệt hợp tác"}
            </button>
            <button className="btn" type="submit" value="draft">
              Lưu bản nháp
            </button>
            <button className="text-button" type="button" onClick={onClose}>
              Đóng form
            </button>
          </div>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
