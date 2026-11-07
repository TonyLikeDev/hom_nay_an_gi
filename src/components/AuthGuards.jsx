import { Link, Navigate } from "react-router";
import { useAuth } from "../providers.jsx";
import { Status } from "./ui.jsx";

export function AuthCallback() {
  const { loading, user, recovery } = useAuth();
  if (loading)
    return (
      <main id="main" className="page wrap">
        <Status title="Đang xác nhận tài khoản…" />
      </main>
    );
  return user ? (
    <Navigate to={recovery ? "/reset-password" : "/partner"} replace />
  ) : (
    <Navigate to="/login" replace />
  );
}
export function RequireAdmin({ children }) {
  const { user, admin, loading } = useAuth();
  if (loading)
    return (
      <main id="main" className="page wrap">
        <Status title="Đang kiểm tra quyền quản trị…" />
      </main>
    );
  if (!user) return <Navigate to="/login?next=admin" replace />;
  if (!admin)
    return (
      <main id="main" className="page wrap">
        <Status title="Tài khoản chưa có quyền quản trị">
          <Link to="/partner">Quản lý quán của bạn →</Link>
        </Status>
      </main>
    );
  return children;
}
