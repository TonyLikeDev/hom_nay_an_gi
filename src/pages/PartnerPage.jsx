import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../providers.jsx";
import { supabase } from "../lib/supabase.js";
import { readAll } from "../lib/read-all.js";
import { Status } from "../components/ui.jsx";
import OwnerEditor from "../components/partner/OwnerEditor.jsx";
import { submissionStatus } from "../lib/restaurant-submission.js";

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
