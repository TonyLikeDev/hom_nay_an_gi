import { useState } from "react";
import { rpc } from "../../lib/supabase.js";
import { CUISINES, MEALS, money } from "../../lib/catalog.js";
import { External, Field } from "../ui.jsx";

export default function SubmissionReview({ record, onSaved, onClose }) {
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
