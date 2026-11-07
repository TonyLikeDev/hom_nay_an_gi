import { useState } from "react";
import { Field } from "../ui.jsx";

const criterionSource =
  "https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en";
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
export default function ReviewFields({ data, setData }) {
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
