import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useCatalog } from "../providers.jsx";
import { readAll } from "../lib/read-all.js";
import { rpc, supabase } from "../lib/supabase.js";
import { CUISINES, normalize } from "../lib/catalog.js";
import { Field, Status } from "../components/ui.jsx";
import { submissionStatus } from "../lib/restaurant-submission.js";
import CatalogEditor from "../components/admin/CatalogEditor.jsx";
import SubmissionReview from "../components/admin/SubmissionReview.jsx";
import { adminTabs as tabs } from "../lib/admin-tabs.js";
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
