import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useCatalog } from "../providers.jsx";
import { readAll } from "../lib/read-all.js";
import { rpc, supabase } from "../lib/supabase.js";
import {
  CUISINES,
  MEALS,
  ingredientLines,
  money,
  normalize,
  parseIngredients,
  parseSteps,
} from "../lib/catalog.js";
import { External, Field, MealsInput, Status } from "../components/ui.jsx";
import {
  RestaurantFields,
  emptyRestaurant,
  submissionStatus,
} from "./PartnerPage.jsx";

const tabs = {
  submissions: "Hồ sơ hợp tác",
  dishes: "Món ăn",
  restaurants: "Quán ăn",
  links: "Món tại quán",
  recipes: "Công thức",
  reviews: "Căn cứ nhãn",
  accounts: "Tài khoản",
};
const criterionSource =
  "https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en";
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
function ReviewFields({ data, setData }) {
  const r = data.vegetarianReview || {},
    p = data.nutritionProfile || {},
    keys = (data.nutritionReviews || []).map((r) => r.key);
  const [values, setValues] = useState({
    vegetarian: r.status || "none",
    scope: r.scope || "",
    ingredients: (r.ingredients || []).join("\n"),
    source: r.source || "",
    reviewedAt: r.reviewedAt || today(),
    nutrition:
      keys.includes("low-sugar") && keys.includes("low-energy")
        ? "both"
        : keys[0] || "none",
    nutritionScope: p.scope || "",
    sourceLabel: p.sourceLabel || "",
    nutritionSource: p.source || "",
    serving: p.serving || "",
    quantity: p.servingQuantity || "",
    form: p.foodForm || "solid",
    energy: p.values?.energyKcal ?? "",
    sugar: p.values?.sugarsG ?? "",
    carb: p.values?.carbohydrateG ?? "",
    dataNote: p.dataNote || "",
    checkedAt: p.checkedAt || today(),
  });
  const change = (key, value) => {
    const v = { ...values, [key]: value };
    setValues(v);
    const next = { ...data };
    if (v.vegetarian === "none") delete next.vegetarianReview;
    else
      next.vegetarianReview = {
        status: v.vegetarian,
        scope: v.scope,
        ingredients: v.ingredients
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
        source: v.source,
        reviewedAt: v.reviewedAt,
      };
    delete next.nutritionProfile;
    delete next.nutritionReviews;
    if (v.nutrition !== "none") {
      const profile = {
        dishId: data.id,
        scopeType: "reference-variant",
        scope: v.nutritionScope,
        sourceLabel: v.sourceLabel,
        source: v.nutritionSource,
        serving: v.serving,
        foodForm: v.form,
        servingUnit: v.form === "solid" ? "g" : "ml",
        servingQuantity: v.quantity === "" ? null : Number(v.quantity),
        values: {
          energyKcal: v.energy === "" ? null : Number(v.energy),
          sugarsG: v.sugar === "" ? null : Number(v.sugar),
          carbohydrateG: v.carb === "" ? null : Number(v.carb),
        },
        dataNote: v.dataNote,
        checkedAt: v.checkedAt,
      };
      next.nutritionProfile = profile;
      next.nutritionReviews = (
        v.nutrition === "both" ? ["low-sugar", "low-energy"] : [v.nutrition]
      ).map((key) => ({
        key,
        status: "verified",
        scopeType: "reference-variant",
        scope: profile.scope,
        source: profile.source,
        criterionSource,
        checkedAt: profile.checkedAt,
        basis: `${((100 * (key === "low-sugar" ? profile.values.sugarsG : profile.values.energyKcal)) / profile.servingQuantity).toFixed(3)} ${key === "low-sugar" ? "g đường" : "kcal"}/100 ${profile.servingUnit}; chỉ áp dụng cho phiên bản và khẩu phần nguồn.`,
      }));
    }
    setData(next);
  };
  const field = (key, label, props = {}) => (
    <Field
      label={label}
      value={values[key]}
      onChange={(e) => change(key, e.target.value)}
      key={key}
      {...props}
    />
  );
  return (
    <>
      <h3>Ăn chay</h3>
      {field("vegetarian", "Mức xác minh", {
        as: "select",
        options: [
          ["none", "Không gán / thu hồi"],
          ["source-declared", "Theo thông tin nguồn"],
          ["reviewed", "Đã rà soát nguyên liệu"],
        ],
      })}
      {values.vegetarian !== "none" && (
        <div className="form-grid">
          {field("scope", "Phiên bản và điều kiện áp dụng", {
            as: "textarea",
            required: true,
            maxLength: 5000,
          })}
          {field("ingredients", "Nguyên liệu đã đối chiếu, mỗi dòng một mục", {
            as: "textarea",
            required: true,
            maxLength: 15000,
          })}
          {field("source", "Nguồn thành phần (HTTPS)", {
            type: "url",
            required: true,
            maxLength: 2000,
          })}
          {field("reviewedAt", "Ngày rà soát", {
            type: "date",
            required: true,
            max: today(),
          })}
        </div>
      )}
      <h3>Dinh dưỡng tham khảo</h3>
      {field("nutrition", "Nhãn cần đối chiếu", {
        as: "select",
        options: [
          ["none", "Không gán / thu hồi"],
          ["low-sugar", "Ít đường"],
          ["low-energy", "Ít năng lượng"],
          ["both", "Ít đường và ít năng lượng"],
        ],
      })}
      {values.nutrition !== "none" && (
        <div className="form-grid">
          {field("nutritionScope", "Phiên bản và điều kiện áp dụng", {
            as: "textarea",
            required: true,
            maxLength: 5000,
          })}
          {field("form", "Dạng thực phẩm", {
            as: "select",
            options: [
              ["solid", "Thức ăn rắn — g"],
              ["liquid", "Đồ uống — ml"],
            ],
          })}
          {field("serving", "Mô tả khẩu phần nguồn", {
            required: true,
            maxLength: 500,
          })}
          {field("quantity", "Khối lượng / thể tích cả khẩu phần", {
            type: "number",
            min: "0.0001",
            step: "any",
            required: true,
          })}
          {field("energy", "Năng lượng cả khẩu phần (kcal)", {
            type: "number",
            min: "0",
            step: "any",
            required: true,
          })}
          {field("sugar", "Đường cả khẩu phần (g)", {
            type: "number",
            min: "0",
            step: "any",
            required: true,
          })}
          {field("carb", "Carbohydrate cả khẩu phần (g)", {
            type: "number",
            min: "0",
            step: "any",
            required: true,
          })}
          {field("sourceLabel", "Tên nguồn số liệu", {
            required: true,
            maxLength: 500,
          })}
          {field("nutritionSource", "Nguồn số liệu (HTTPS)", {
            type: "url",
            required: true,
            maxLength: 2000,
          })}
          {field("dataNote", "Giới hạn của số liệu và điều kiện áp dụng", {
            as: "textarea",
            required: true,
            maxLength: 5000,
          })}
          {field("checkedAt", "Ngày đối chiếu", {
            type: "date",
            required: true,
            max: today(),
          })}
        </div>
      )}
      <label className="consent">
        <input type="checkbox" required />
        <span>
          Tôi đã đối chiếu đúng nguồn, phiên bản, nguyên liệu và số liệu trước
          khi công bố hoặc thu hồi nhãn.
        </span>
      </label>
    </>
  );
}
function CatalogEditor({ kind, row, model, onSaved, onClose }) {
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
function SubmissionReview({ record, onSaved, onClose }) {
  const [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    const approve = event.nativeEvent.submitter?.value === "approve";
    if (!approve && !note.trim()) {
      setError("Ghi lý do để chủ quán biết cần bổ sung gì.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await rpc("review_submission", {
        p_id: record.id,
        p_revision: record.revision,
        p_approve: approve,
        p_note: note.trim(),
      });
      onSaved(
        approve
          ? "Đã duyệt quán và thực đơn."
          : "Đã gửi yêu cầu bổ sung cho chủ quán.",
      );
    } catch (e) {
      setError(
        e.code === "40001"
          ? "Hồ sơ đã thay đổi. Hãy tải lại và đối chiếu phiên bản mới."
          : e.message ||
              "Chưa xác nhận được kết quả duyệt. Hãy tải lại danh sách để kiểm tra.",
      );
    } finally {
      setBusy(false);
    }
  };
  const d = record.data;
  return (
    <section className="owner-editor">
      <h2>Duyệt {d.name}</h2>
      <dl className="review-facts">
        {[
          ["Địa chỉ", d.address],
          ["Khu vực", d.area],
          ["Đại diện", d.contactName],
          ["Email riêng", d.contactEmail],
          ["Điện thoại quán", d.phone],
          ["Giờ mở cửa", d.hours],
          ["Khoảng giá", d.priceLabel],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "Chưa có"}</dd>
          </div>
        ))}
      </dl>
      <div className="result__actions">
        <External href={d.sourceUrl}>Đối chiếu thực đơn ↗</External>
        <External href={d.website}>Trang chính thức ↗</External>
        <External href={d.imageUrl}>Ảnh quán ↗</External>
        <External href={d.grabFoodUrl}>GrabFood ↗</External>
        <External href={d.shopeeFoodUrl}>ShopeeFood ↗</External>
      </div>
      <ul className="review-menu">
        {record.menu.map((item) => (
          <li key={item.id}>
            <strong>
              {item.name} · {money(item.price)}
            </strong>
            <p>{item.desc}</p>
            <p>
              {CUISINES[item.cuisine]?.name} ·{" "}
              {item.meals.map((m) => MEALS[m]?.label).join(", ")}
            </p>
            <External href={item.imageUrl}>Ảnh món ↗</External>
          </li>
        ))}
      </ul>
      <form onSubmit={save} aria-busy={busy}>
        <fieldset disabled={busy}>
          <Field
            label="Ghi chú cho chủ quán"
            as="textarea"
            maxLength="2000"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            help="Bắt buộc ghi lý do khi yêu cầu bổ sung."
          />
          <label className="consent">
            <input type="checkbox" required />
            <span>
              Tôi đã đối chiếu đúng đại diện, chi nhánh, nguồn thực đơn, ảnh và
              quyền sử dụng dữ liệu.
            </span>
          </label>
          <div className="editor-actions">
            <button className="btn btn--primary" type="submit" value="approve">
              Duyệt và công bố
            </button>
            <button className="btn" type="submit" value="reject">
              Yêu cầu bổ sung
            </button>
            <button className="text-button" type="button" onClick={onClose}>
              Đóng
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
export default function AdminPage() {
  const { reload: reloadPublic } = useCatalog(),
    [params, setParams] = useSearchParams(),
    tab = Object.hasOwn(tabs, params.get("tab"))
      ? params.get("tab")
      : "submissions";
  const [model, setModel] = useState({
      dishes: [],
      restaurants: [],
      links: [],
      recipes: [],
      submissions: [],
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [editing, setEditing] = useState(null),
    [accounts, setAccounts] = useState({ items: [], total: 0 }),
    [accountPage, setAccountPage] = useState(1);
  const sequence = useRef(0);
  async function reload() {
    const current = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const entries = await Promise.all(
        [
          "dishes",
          "restaurants",
          "restaurant_dishes",
          "recipes",
          "restaurant_submissions",
        ].map(async (table) => {
          const data = await readAll(() =>
            supabase
              .from(table)
              .select("*")
              .order(table === "recipes" ? "dish_id" : "id"),
          );
          return [
            table === "restaurant_dishes"
              ? "links"
              : table === "restaurant_submissions"
                ? "submissions"
                : table,
            data,
          ];
        }),
      );
      if (current === sequence.current) setModel(Object.fromEntries(entries));
    } catch {
      if (current === sequence.current)
        setError(
          "Chưa tải được dữ liệu quản trị. Kiểm tra kết nối và quyền tài khoản rồi thử lại.",
        );
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }
  useEffect(() => {
    reload();
    return () => {
      sequence.current++;
    };
  }, []);
  useEffect(() => {
    if (tab !== "accounts") return;
    let active = true;
    rpc("list_accounts", { p_page: accountPage })
      .then((data) => {
        if (active) setAccounts(data);
      })
      .catch(() => {
        if (active) setError("Chưa tải được danh sách tài khoản.");
      });
    return () => {
      active = false;
    };
  }, [tab, accountPage]);
  const afterSave = async (text = "Đã lưu thay đổi.") => {
    setEditing(null);
    setMessage(text);
    await Promise.all([reload(), reloadPublic()]);
  };
  const nameOf = (id) => model.dishes.find((d) => d.id === id)?.data.name || id;
  const venueOf = (id) =>
    model.restaurants.find((r) => r.id === id)?.data.name || id;
  const records = (
    tab === "reviews"
      ? model.dishes
      : tab === "submissions"
        ? model.submissions.filter((r) => r.status === "pending")
        : model[tab] || []
  ).filter(
    (r) =>
      !query ||
      normalize(
        [
          r.data?.name,
          r.data?.offering,
          r.data?.address,
          r.dish_id && nameOf(r.dish_id),
          r.restaurant_id && venueOf(r.restaurant_id),
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(normalize(query)),
  );
  const pages = Math.max(1, Math.ceil(records.length / 12)),
    currentPage = Math.min(page, pages);
  return (
    <main id="main" className="page wrap admin-react">
      <div className="page-heading">
        <div>
          <h1>Quản trị danh mục</h1>
          <p className="section-note">
            Kiểm tra nguồn dữ liệu trước khi công bố. Vai trò và mọi yêu cầu ghi
            đều được kiểm tra tại database.
          </p>
        </div>
        {!["submissions", "reviews", "accounts"].includes(tab) && (
          <button
            className="btn btn--primary"
            type="button"
            disabled={loading || Boolean(editing)}
            onClick={() => setEditing({ kind: tab, row: null })}
          >
            Thêm mới
          </button>
        )}
      </div>
      <nav className="admin-tabs" aria-label="Danh mục quản trị">
        {Object.entries(tabs).map(([key, label]) => (
          <button
            className="btn"
            type="button"
            key={key}
            aria-pressed={tab === key}
            disabled={Boolean(editing)}
            onClick={() => {
              setParams({ tab: key });
              setQuery("");
              setPage(1);
              setError("");
            }}
          >
            {label}
            {key === "submissions"
              ? " (" +
                model.submissions.filter((s) => s.status === "pending").length +
                ")"
              : ""}
          </button>
        ))}
      </nav>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      {error && (
        <Status title="Chưa tải được dữ liệu" retry={reload}>
          {error}
        </Status>
      )}
      {loading ? (
        <Status title="Đang tải dữ liệu quản trị…" />
      ) : tab === "accounts" ? (
        <>
          <p>
            {accounts.total} tài khoản · Trang {accountPage}
          </p>
          <ul className="account-list">
            {accounts.items.map((u) => (
              <li key={u.id}>
                {u.email} · {u.is_admin ? "Quản trị viên" : "Chủ quán"}
              </li>
            ))}
          </ul>
          <div className="pagination">
            <button
              className="btn"
              type="button"
              disabled={accountPage <= 1}
              onClick={() => setAccountPage((p) => p - 1)}
            >
              Trang trước
            </button>
            <button
              className="btn"
              type="button"
              disabled={accountPage * 20 >= accounts.total}
              onClick={() => setAccountPage((p) => p + 1)}
            >
              Trang sau
            </button>
          </div>
        </>
      ) : (
        <>
          <Field
            label="Tìm trong danh sách"
            type="search"
            maxLength="150"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <p className="section-note" role="status">
            {records.length} mục · {tabs[tab]}
          </p>
          {records.length ? (
            <div
              className="admin-table-scroll"
              tabIndex="0"
              role="region"
              aria-label={tabs[tab]}
            >
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Tên / món</th>
                    <th scope="col">Thông tin</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {records
                    .slice((currentPage - 1) * 12, currentPage * 12)
                    .map((row) => (
                      <tr key={row.id || row.dish_id}>
                        <td>
                          {tab === "links"
                            ? nameOf(row.dish_id)
                            : tab === "recipes"
                              ? nameOf(row.dish_id)
                              : row.data.name}
                        </td>
                        <td>
                          {tab === "links"
                            ? venueOf(row.restaurant_id)
                            : tab === "recipes"
                              ? row.data.ingredients.length + " nguyên liệu"
                              : tab === "submissions"
                                ? row.menu.length + " món · " + row.data.address
                                : tab === "reviews"
                                  ? [
                                      row.data.vegetarianReview
                                        ? "Ăn chay"
                                        : "",
                                      ...(row.data.nutritionReviews || []).map(
                                        (r) => r.key,
                                      ),
                                    ]
                                      .filter(Boolean)
                                      .join(", ") || "Chưa có nhãn"
                                  : row.data.address ||
                                    CUISINES[row.data.cuisine]?.name}
                        </td>
                        <td>
                          {tab === "submissions"
                            ? submissionStatus[row.status]
                            : row.is_visible
                              ? "Đang hiện"
                              : "Đang ẩn"}
                        </td>
                        <td>
                          <button
                            className="btn"
                            type="button"
                            disabled={Boolean(editing)}
                            onClick={() => setEditing({ kind: tab, row })}
                          >
                            {tab === "submissions"
                              ? "Đối chiếu hồ sơ"
                              : "Chỉnh sửa"}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Status
              title={
                tab === "submissions"
                  ? "Chưa có hồ sơ chờ duyệt"
                  : "Chưa có mục phù hợp"
              }
            />
          )}
          <nav className="pagination" aria-label="Trang danh mục">
            <button
              className="btn"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Trang trước
            </button>
            <span>
              {currentPage} / {pages}
            </span>
            <button
              className="btn"
              type="button"
              disabled={currentPage >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </button>
          </nav>
        </>
      )}
      {editing &&
        (editing.kind === "submissions" ? (
          <SubmissionReview
            key={editing.row.id}
            record={editing.row}
            onClose={() => setEditing(null)}
            onSaved={afterSave}
          />
        ) : (
          <CatalogEditor
            key={
              editing.kind +
              "/" +
              (editing.row?.id || editing.row?.dish_id || "new")
            }
            kind={editing.kind}
            row={editing.row}
            model={model}
            onClose={() => setEditing(null)}
            onSaved={() => afterSave()}
          />
        ))}
    </main>
  );
}
