import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../providers.jsx";
import { rpc, supabase } from "../lib/supabase.js";
import { readAll } from "../lib/read-all.js";
import { CUISINES } from "../lib/catalog.js";
import { Field, MealsInput, Status } from "../components/ui.jsx";

export const submissionStatus = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Cần bổ sung",
};
const newDish = () => ({
  id: crypto.randomUUID(),
  name: "",
  desc: "",
  cuisine: "viet",
  meals: ["trua"],
  price: "",
  imageUrl: "",
});
export const emptyRestaurant = (email) => ({
  name: "",
  address: "",
  area: "Đà Nẵng",
  category: "Món chính",
  phone: "",
  hours: "",
  website: "",
  imageUrl: "",
  grabFoodUrl: "",
  shopeeFoodUrl: "",
  priceLabel: "",
  priceTier: "",
  contactName: "",
  contactEmail: email || "",
  sourceUrl: "",
  meals: ["trua"],
  consent: false,
});
export function RestaurantFields({ data, setData, owner = false }) {
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
function OwnerEditor({ record, email, onSaved, onClose }) {
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
export default function PartnerPage() {
  const auth = useAuth(),
    [records, setRecords] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [editing, setEditing] = useState(undefined);
  const sequence = useRef(0);
  async function reload() {
    if (!auth.user) return;
    const current = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const data = await readAll(() =>
        supabase
          .from("restaurant_submissions")
          .select("*")
          .eq("owner_id", auth.user.id)
          .order("id"),
      );
      data.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      if (current === sequence.current) setRecords(data);
    } catch {
      if (current === sequence.current)
        setError("Chưa tải được hồ sơ. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }
  useEffect(() => {
    if (auth.user) reload();
    else {
      setRecords([]);
      setEditing(undefined);
    }
    return () => {
      sequence.current++;
    };
  }, [auth.user?.id]);
  if (auth.loading)
    return (
      <main id="main" className="page wrap">
        <Status title="Đang kiểm tra đăng nhập…" />
      </main>
    );
  if (!auth.user)
    return (
      <main id="main" className="page wrap partner-intro">
        <h1>
          Đưa quán của bạn
          <br />
          vào bữa ăn tiếp theo.
        </h1>
        <p className="about-lead">
          Cung cấp thông tin chi nhánh và thực đơn thật. Khi hồ sơ được duyệt,
          các món của quán có thể xuất hiện trong gợi ý ngẫu nhiên và trang tìm
          quán.
        </p>
        <div className="result__actions">
          <Link className="btn btn--primary btn--lg" to="/register">
            Đăng ký chủ quán
          </Link>
          <Link className="btn btn--lg" to="/login">
            Tôi đã có tài khoản
          </Link>
        </div>
        <ol className="partner-steps">
          <li>
            <h2>Tạo tài khoản</h2>
            <p>Đăng ký bằng email và xác nhận tài khoản của bạn.</p>
          </li>
          <li>
            <h2>Gửi quán và thực đơn</h2>
            <p>
              Địa chỉ đúng chi nhánh, món đang bán, giá, nguồn đối chiếu và ảnh
              bạn có quyền sử dụng.
            </p>
          </li>
          <li>
            <h2>Được kiểm tra và giới thiệu</h2>
            <p>
              Nhóm đối chiếu dữ liệu trước khi đưa quán vào danh mục. Bạn có thể
              sửa hồ sơ và gửi duyệt lại.
            </p>
          </li>
        </ol>
        <p className="section-note">
          Thông tin liên hệ riêng không xuất hiện công khai. Link GrabFood và
          ShopeeFood mở nền tảng bên ngoài; website chưa nhận đơn hoặc tổ chức
          vận chuyển.
        </p>
      </main>
    );
  return (
    <main id="main" className="page wrap">
      <div className="page-heading">
        <div>
          <h1>Quán của bạn</h1>
          <p className="section-note">
            {auth.user.email} · Dữ liệu rõ nguồn, thực đơn đúng chi nhánh.
          </p>
        </div>
        <button
          className="btn btn--primary"
          type="button"
          disabled={loading || editing !== undefined}
          onClick={() => setEditing(null)}
        >
          Thêm quán
        </button>
      </div>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      {error && (
        <Status title="Chưa tải được hồ sơ" retry={reload}>
          {error}
        </Status>
      )}
      {loading ? (
        <Status title="Đang tải hồ sơ…" />
      ) : (
        <div className="owner-records">
          {records.map((record) => (
            <article className="owner-record" key={record.id}>
              <div className="page-heading">
                <div>
                  <p className={"submission-status status-" + record.status}>
                    {submissionStatus[record.status]}
                  </p>
                  <h2>{record.data.name}</h2>
                  <p>
                    {record.data.address} · {record.menu.length} món
                  </p>
                </div>
                <button
                  className="btn"
                  type="button"
                  disabled={editing !== undefined}
                  onClick={() => {
                    setEditing(record);
                    setMessage("");
                  }}
                >
                  Xem và chỉnh sửa
                </button>
              </div>
              {record.review_note && (
                <p className="review-note">
                  Ghi chú của nhóm: {record.review_note}
                </p>
              )}
              {record.status === "approved" && (
                <Link
                  className="dish__recipe-link"
                  to={"/restaurant?id=r-" + record.id}
                >
                  Xem trang quán công khai →
                </Link>
              )}
            </article>
          ))}
          {!records.length && !error && (
            <Status title="Bạn chưa có hồ sơ quán">
              Bấm “Thêm quán” để gửi chi nhánh và thực đơn đầu tiên.
            </Status>
          )}
        </div>
      )}
      {editing !== undefined && (
        <OwnerEditor
          key={editing?.id || "new"}
          record={editing}
          email={auth.user.email}
          onClose={() => setEditing(undefined)}
          onSaved={(record) => {
            setRecords((list) => [
              record,
              ...list.filter((r) => r.id !== record.id),
            ]);
            setEditing(undefined);
            setMessage(
              record.status === "pending"
                ? "Đã gửi hồ sơ. Nhóm sẽ kiểm tra trước khi công bố."
                : "Đã lưu bản nháp. Hồ sơ này chưa được gửi duyệt.",
            );
          }}
        />
      )}
    </main>
  );
}
