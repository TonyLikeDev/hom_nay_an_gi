import { createContext, useContext, useEffect, useRef, useState } from "react";
import { assembleCatalog } from "./lib/catalog.js";
import { readCatalog, rpc, supabase } from "./lib/supabase.js";

export const CatalogContext = createContext(null);
export const useCatalog = () => useContext(CatalogContext);
export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  async function reload() {
    const current = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const data = await readCatalog();
      if (current === sequence.current) setCatalog(assembleCatalog(data));
    } catch {
      if (current === sequence.current) {
        setCatalog(null);
        setError(
          "Chưa tải được danh mục. Bạn kiểm tra kết nối rồi thử lại nhé.",
        );
      }
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
  return (
    <CatalogContext.Provider
      value={{ catalog, loading, error, reload, demo: __DEMO__ }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null),
    [loading, setLoading] = useState(Boolean(supabase));
  const [admin, setAdmin] = useState(false),
    [checkingRole, setCheckingRole] = useState(false),
    [error, setError] = useState("");
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") {
        setRecovery(false);
        setAdmin(false);
      }
    });
    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (error && active) {
          setError("Chưa kiểm tra được đăng nhập. Hãy tải lại trang.");
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("Chưa kiểm tra được đăng nhập. Hãy tải lại trang.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    setAdmin(false);
    if (!session?.user) {
      setCheckingRole(false);
      return;
    }
    setCheckingRole(true);
    rpc("is_admin")
      .then((value) => {
        if (active) setAdmin(value === true);
      })
      .catch(() => {
        if (active)
          setError("Chưa kiểm tra được quyền tài khoản. Hãy tải lại trang.");
      })
      .finally(() => {
        if (active) setCheckingRole(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setAdmin(false);
  }
  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user,
        loading: loading || checkingRole,
        admin,
        error,
        recovery,
        setRecovery,
        signOut,
        available: Boolean(supabase),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const FavoritesContext = createContext(null);
export const useFavorites = () => useContext(FavoritesContext);
const favoriteKey = "hnag:favorites:v1";
function readFavorites() {
  try {
    const raw = JSON.parse(localStorage.getItem(favoriteKey) || "{}");
    const ids = (kind) =>
      Array.isArray(raw?.[kind])
        ? [
            ...new Set(
              raw[kind].filter(
                (id) => typeof id === "string" && /^[a-z0-9-]{1,100}$/.test(id),
              ),
            ),
          ]
        : [];
    return { dishes: ids("dishes"), restaurants: ids("restaurants") };
  } catch {
    return { dishes: [], restaurants: [] };
  }
}
export function FavoritesProvider({ children }) {
  const [state, setState] = useState(readFavorites),
    [message, setMessage] = useState("");
  useEffect(() => {
    const update = (e) => {
      if (e.key === favoriteKey || e.key === null) setState(readFavorites());
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  function toggle(kind, id, name) {
    const next = readFavorites(),
      saved = next[kind].includes(id);
    next[kind] = saved
      ? next[kind].filter((value) => value !== id)
      : [...next[kind], id];
    try {
      localStorage.setItem(favoriteKey, JSON.stringify(next));
      setState(next);
      setMessage((saved ? "Đã bỏ lưu " : "Đã lưu ") + name);
    } catch {
      setMessage(
        "Không lưu được trên trình duyệt này. Hãy cho phép lưu trữ rồi thử lại.",
      );
    }
  }
  return (
    <FavoritesContext.Provider value={{ state, toggle }}>
      {children}
      <p className="favorite-feedback" role="status">
        {message}
      </p>
    </FavoritesContext.Provider>
  );
}
