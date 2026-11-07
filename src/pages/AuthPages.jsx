import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../providers.jsx";
import { supabase } from "../lib/supabase.js";
import { Field, Status } from "../components/ui.jsx";

export function AuthPage({ mode = "login" }) {
  const auth = useAuth(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [awaitingEmail, setAwaitingEmail] = useState(false);
  const registration = mode === "register",
    forgot = mode === "forgot",
    reset = mode === "reset";
  const title = registration
    ? "Đăng ký tài khoản chủ quán"
    : forgot
      ? "Quên mật khẩu"
      : reset
        ? "Đặt mật khẩu mới"
        : "Đăng nhập";
  const next = params.get("next") === "admin" ? "/admin" : "/partner";
  if (auth.loading)
    return (
      <main id="main" className="page wrap">
        <Status title="Đang kiểm tra đăng nhập…" />
      </main>
    );
  if (!auth.available)
    return (
      <main id="main" className="page wrap">
        <h1>{title}</h1>
        <Status title="Đăng nhập chưa được mở trên bản xem thử">
          Bạn vẫn có thể khám phá món và quán trong danh mục.{" "}
          <Link to="/">Về trang chủ</Link>
        </Status>
      </main>
    );
  if (auth.user && !forgot && !reset)
    return (
      <Navigate
        to={auth.admin && next === "/admin" ? "/admin" : "/partner"}
        replace
      />
    );
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setMessage("");
    if ((registration || reset) && password !== confirm) {
      setError("Hai mật khẩu chưa khớp.");
      return;
    }
    setBusy(true);
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: location.origin + "/reset-password" },
        );
        if (error) throw error;
        setMessage(
          "Nếu email này có tài khoản, bạn sẽ nhận được đường dẫn đặt lại mật khẩu.",
        );
      } else if (reset) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword("");
        setConfirm("");
        auth.setRecovery(false);
        setMessage("Đã cập nhật mật khẩu. Bạn có thể quay lại quản lý quán.");
      } else if (registration) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: location.origin + "/partner" },
        });
        if (error) throw error;
        setPassword("");
        setConfirm("");
        if (data.session) navigate("/partner", { replace: true });
        else {
          setAwaitingEmail(true);
          setMessage(
            "Kiểm tra email để xác nhận tài khoản. Sau khi xác nhận, bạn có thể đăng nhập và thêm quán.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setPassword("");
        navigate(next, { replace: true });
      }
    } catch (e) {
      setError(
        e.status === 429
          ? "Bạn đã thử nhiều lần. Hãy chờ một chút rồi thử lại."
          : mode === "login"
            ? "Chưa đăng nhập được. Kiểm tra email, mật khẩu và xác nhận email của bạn."
            : e.message || "Chưa thực hiện được. Bạn vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main id="main" className="page wrap auth-page">
      <section className="auth-intro">
        <h1>
          Chăm chút từng món.
          <br />
          Kết nối từng quán.
        </h1>
        <p>
          Giới thiệu quán và thực đơn của bạn đến những người đang tìm một bữa
          ăn mới.
        </p>
        <p>
          Hồ sơ được quản trị viên kiểm tra trước khi xuất hiện trong gợi ý.
        </p>
        <Link to="/partner">Tìm hiểu hợp tác →</Link>
      </section>
      <section className="auth-form" aria-labelledby="auth-title">
        <h2 id="auth-title">{title}</h2>
        {reset && !auth.user ? (
          <>
            <p>Mở đường dẫn đặt lại mật khẩu trong email để tiếp tục.</p>
            <Link to="/forgot-password">Gửi lại đường dẫn</Link>
          </>
        ) : (
          <form onSubmit={submit} aria-busy={busy}>
            <fieldset disabled={busy}>
              {!reset && (
                <Field
                  label="Email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength="254"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
              {!forgot && (
                <>
                  <Field
                    label={reset ? "Mật khẩu mới" : "Mật khẩu"}
                    type={show ? "text" : "password"}
                    autoComplete={
                      registration || reset
                        ? "new-password"
                        : "current-password"
                    }
                    minLength={registration || reset ? 12 : 1}
                    maxLength="128"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    help={
                      registration || reset
                        ? "Dùng từ 12 đến 128 ký tự."
                        : undefined
                    }
                  />
                  <button
                    className="text-button"
                    type="button"
                    aria-pressed={show}
                    onClick={() => setShow(!show)}
                  >
                    {show ? "Ẩn" : "Hiện"} mật khẩu
                  </button>
                  {(registration || reset) && (
                    <Field
                      label="Nhập lại mật khẩu"
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      minLength="12"
                      maxLength="128"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  )}
                </>
              )}
              <button className="btn btn--primary" type="submit">
                {busy
                  ? "Đang xử lý…"
                  : registration
                    ? "Tạo tài khoản"
                    : forgot
                      ? "Gửi đường dẫn"
                      : reset
                        ? "Cập nhật mật khẩu"
                        : "Đăng nhập"}
              </button>
            </fieldset>
          </form>
        )}
        {(error || auth.error) && (
          <p role="alert" className="form-error">
            {error || auth.error}
          </p>
        )}
        {message && (
          <p role="status" className="form-message">
            {message}
          </p>
        )}
        {awaitingEmail && (
          <button
            className="text-button"
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const { error } = await supabase.auth.resend({
                  type: "signup",
                  email: email.trim(),
                  options: { emailRedirectTo: location.origin + "/partner" },
                });
                if (error) throw error;
                setMessage(
                  "Nếu tài khoản đang chờ xác nhận, email đã được gửi lại.",
                );
              } catch {
                setError(
                  "Chưa gửi lại được email. Hãy chờ một chút rồi thử lại.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Gửi lại email xác nhận
          </button>
        )}
        <div className="auth-links">
          {registration ? (
            <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
          ) : (
            <Link to="/register">Chưa có tài khoản? Đăng ký chủ quán</Link>
          )}
          {!forgot && !reset && (
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          )}
          {reset && auth.user && (
            <Link to="/partner">Quay lại quản lý quán →</Link>
          )}
        </div>
      </section>
    </main>
  );
}
