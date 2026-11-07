import { useEffect, useRef, useState } from "react";
import { rpc } from "../../lib/supabase.js";
import {
  CUISINES,
  MEALS,
  ingredientLines,
  parseIngredients,
  parseSteps,
} from "../../lib/catalog.js";
import { Field, MealsInput } from "../ui.jsx";
import RestaurantFields from "../RestaurantFields.jsx";
import { emptyRestaurant } from "../../lib/restaurant-submission.js";
import ReviewFields from "./ReviewFields.jsx";
import { adminTabs as tabs } from "../../lib/admin-tabs.js";

export default function CatalogEditor({ kind, row, model, onSaved, onClose }) {
  const [id] = useState(
    row?.id ||
      row?.dish_id ||
      (kind === "dishes" ? "d-" : kind === "restaurants" ? "r-" : "") +
        crypto.randomUUID(),
  );
  const [data, setData] = useState(() =>
    structuredClone(
      row?.data ||
        (kind === "dishes"
          ? {
              name: "",
              cuisine: "viet",
              meals: ["trua"],
              desc: "",
              imageUrl: "",
            }
          : kind === "restaurants"
            ? emptyRestaurant()
            : kind === "recipes"
              ? {
                  servings: 2,
                  prep: "",
                  cook: "",
                  tip: "",
                  source: { label: "", url: "" },
                  ingredients: [],
                  steps: [],
                }
              : {
                  type: "related",
                  offering: "",
                  priceVnd: null,
                  sourceUrl: "",
                  evidence: "",
                }),
    ),
  );
  const [visible, setVisible] = useState(row?.is_visible ?? true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [dishId, setDishId] = useState(
      row?.dish_id || model.dishes[0]?.id || "",
    ),
    [restaurantId, setRestaurantId] = useState(
      row?.restaurant_id || model.restaurants[0]?.id || "",
    );
  const [ingredients, setIngredients] = useState(
      ingredientLines(data.ingredients),
    ),
    [steps, setSteps] = useState(
      (data.steps || []).map((s) => s.join(" | ")).join("\n"),
    );
  const request = useRef({}),
    heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const field = (key, label, props = {}) => (
    <Field
      label={label}
      value={data[key] ?? ""}
      key={key}
      onChange={(e) =>
        setData((previous) => ({ ...previous, [key]: e.target.value }))
      }
      {...props}
    />
  );
  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    try {
      let value = structuredClone(data),
        target = row?.id || row?.dish_id || id;
      const table = kind === "reviews" ? "dishes" : kind;
      if (kind === "recipes") {
        target = row?.dish_id || dishId;
        value.servings = Number(value.servings);
        value.ingredients = parseIngredients(ingredients);
        value.steps = parseSteps(steps);
      }
      if (kind === "links") {
        target = row?.id || dishId + "/" + restaurantId;
        value.priceVnd =
          value.priceVnd === ""
            ? null
            : value.priceVnd === null
              ? null
              : Number(value.priceVnd);
      }
      if (kind === "dishes" && !value.meals.length)
        throw Error("Chọn ít nhất một bữa ăn.");
      if (kind === "dishes" && value.imageUrl)
        value.imageSource = {
          label: "Ảnh do quản trị viên cung cấp",
          url: value.imageUrl,
        };
      if (kind === "restaurants") {
        if (value.imageUrl)
          value.photo = {
            kind: "admin-provided",
            url: value.imageUrl,
            sourceUrl: value.imageUrl,
            sourceLabel: "Ảnh do quản trị viên cung cấp",
          };
        else if (!value.photo || value.photo.kind === "admin-provided")
          value.photo = {
            kind: "illustration",
            sourceLabel: "Chưa có ảnh phù hợp",
          };
        if (value.meals)
          value.suggestedMeals = value.meals.map((m) => MEALS[m].label);
        value.originalCategory ??= value.category;
        value.verification ??= "admin-entered";
        delete value.contactName;
        delete value.contactEmail;
        delete value.consent;
      }
      const payload = JSON.stringify({ value, visible, target });
      if (request.current.payload !== payload)
        request.current = { payload, id: crypto.randomUUID() };
      setBusy(true);
      await rpc("save_catalog", {
        p_kind: table,
        p_id: target,
        p_revision: row?.revision || 0,
        p_request_id: request.current.id,
        p_data: value,
        p_visible: visible,
      });
      onSaved();
    } catch (e) {
      setError(
        e.code === "40001"
          ? "Mục đã thay đổi ở nơi khác. Nội dung form vẫn được giữ; hãy tải lại danh sách trước khi sửa tiếp."
          : e.message || "Chưa lưu được. Bạn vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="owner-editor" aria-labelledby="catalog-editor-title">
      <h2 ref={heading} tabIndex="-1" id="catalog-editor-title">
        {row ? "Chỉnh sửa" : "Thêm"} {tabs[kind]?.toLocaleLowerCase("vi")}
      </h2>
      <form onSubmit={save} aria-busy={busy}>
        <fieldset disabled={busy}>
          {kind !== "reviews" && (
            <Field
              label="Trạng thái công bố"
              as="select"
              value={String(visible)}
              options={[
                ["true", "Hiện trên website"],
                ["false", "Ẩn — giữ dữ liệu để khôi phục"],
              ]}
              onChange={(e) => setVisible(e.target.value === "true")}
            />
          )}
          {kind === "dishes" && (
            <>
              <div className="form-grid">
                {field("name", "Tên món", {
                  required: true,
                  maxLength: 255,
                  autoFocus: true,
                })}
                {field("cuisine", "Ẩm thực", {
                  as: "select",
                  options: Object.entries(CUISINES).map(([key, c]) => [
                    key,
                    c.name,
                  ]),
                })}
                {field("desc", "Mô tả", { as: "textarea", maxLength: 5000 })}
                {field("imageUrl", "Ảnh thay thế (HTTPS)", {
                  type: "url",
                  maxLength: 2000,
                })}
              </div>
              <MealsInput
                value={data.meals || []}
                onChange={(meals) =>
                  setData((previous) => ({ ...previous, meals }))
                }
              />
            </>
          )}
          {kind === "restaurants" && (
            <>
              <div className="form-grid">
                <RestaurantFields data={data} setData={setData} />
              </div>
              <MealsInput
                value={
                  data.meals ||
                  Object.keys(MEALS).filter(
                    (key) =>
                      data.suggestedMeals?.includes(MEALS[key].label) ||
                      data.suggestedMeals?.includes(key) ||
                      data.suggestedMeals?.includes("Cả ngày"),
                  )
                }
                onChange={(meals) =>
                  setData((previous) => ({ ...previous, meals }))
                }
              />
            </>
          )}
          {["recipes", "links"].includes(kind) && (
            <Field
              label="Món ăn"
              as="select"
              disabled={Boolean(row)}
              required
              value={dishId}
              options={model.dishes.map((d) => [
                d.id,
                d.data.name + (d.is_visible ? "" : " · Đang ẩn"),
              ])}
              onChange={(e) => setDishId(e.target.value)}
            />
          )}
          {kind === "links" && (
            <>
              <Field
                label="Quán ăn"
                as="select"
                disabled={Boolean(row)}
                required
                value={restaurantId}
                options={model.restaurants.map((r) => [
                  r.id,
                  r.data.name + (r.is_visible ? "" : " · Đang ẩn"),
                ])}
                onChange={(e) => setRestaurantId(e.target.value)}
              />
              <div className="form-grid">
                {field("type", "Mức liên kết", {
                  as: "select",
                  options: [
                    ["related", "Cùng nhóm — chưa xác nhận đúng món"],
                    ["dish", "Đã đối chiếu bán đúng món"],
                  ],
                })}
                {field("offering", "Phiên bản món trong thực đơn", {
                  required: true,
                  maxLength: 500,
                })}
                {field("priceVnd", "Giá một phần (VND); chưa biết để trống", {
                  type: "number",
                  min: "0",
                  step: "1",
                  max: "999999999999",
                })}
                {field("sourceUrl", "Nguồn thực đơn (HTTPS)", {
                  type: "url",
                  required: visible,
                  maxLength: 2000,
                })}
                {field("evidence", "Căn cứ và ngày đối chiếu", {
                  as: "textarea",
                  maxLength: 3000,
                })}
              </div>
            </>
          )}
          {kind === "recipes" && (
            <>
              <div className="form-grid">
                {field("servings", "Khẩu phần gốc (người)", {
                  type: "number",
                  min: "1",
                  max: "12",
                  step: "1",
                  required: true,
                })}
                {field("prep", "Thời gian chuẩn bị", {
                  required: true,
                  maxLength: 255,
                })}
                {field("cook", "Thời gian nấu", {
                  required: true,
                  maxLength: 255,
                })}
                {field("soak", "Ngâm / ủ (nếu có)", {
                  as: "textarea",
                  maxLength: 3000,
                })}
                <Field
                  label="Nguyên liệu"
                  as="textarea"
                  required
                  value={ingredients}
                  maxLength="40000"
                  help="Mỗi dòng: Tên | Số lượng | Đơn vị. Hoặc: Tên | Một ít."
                  onChange={(e) => setIngredients(e.target.value)}
                />
                <Field
                  label="Các bước"
                  as="textarea"
                  required
                  value={steps}
                  maxLength="60000"
                  help="Mỗi dòng: Tiêu đề | Hướng dẫn."
                  onChange={(e) => setSteps(e.target.value)}
                />
                {field("tip", "Lưu ý chế biến", {
                  as: "textarea",
                  maxLength: 5000,
                })}
                <Field
                  label="Tên nguồn công thức"
                  required
                  maxLength="500"
                  value={data.source?.label || ""}
                  onChange={(e) =>
                    setData((previous) => ({
                      ...previous,
                      source: { ...previous.source, label: e.target.value },
                    }))
                  }
                />
                <Field
                  label="Nguồn công thức (HTTPS)"
                  type="url"
                  required
                  maxLength="2000"
                  value={data.source?.url || ""}
                  onChange={(e) =>
                    setData((previous) => ({
                      ...previous,
                      source: { ...previous.source, url: e.target.value },
                    }))
                  }
                />
              </div>
              <p className="section-note">
                Khi sửa công thức, nhãn ăn chay đã rà soát của phiên bản cũ sẽ
                được thu hồi để kiểm tra lại.
              </p>
            </>
          )}
          {kind === "reviews" && <ReviewFields data={data} setData={setData} />}
          <div className="editor-actions">
            <button className="btn btn--primary" type="submit">
              {busy ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
            <button className="btn" type="button" onClick={onClose}>
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
