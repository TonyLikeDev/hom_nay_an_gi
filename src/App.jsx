import { lazy, Suspense } from "react";
import { useEffect } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import { useAuth, useCatalog } from "./providers.jsx";
import { CatalogBoundary, Layout, Status } from "./components/ui.jsx";
const {
  AboutPage,
  CuisinesPage,
  DishesPage,
  FavoritesPage,
  HomePage,
  RecipePage,
  RestaurantPage,
  RestaurantsPage,
  ResultPage,
} = Object.fromEntries(
  [
    "AboutPage",
    "CuisinesPage",
    "DishesPage",
    "FavoritesPage",
    "HomePage",
    "RecipePage",
    "RestaurantPage",
    "RestaurantsPage",
    "ResultPage",
  ].map((name) => [
    name,
    lazy(() =>
      import("./pages/PublicPages.jsx").then((module) => ({
        default: module[name],
      })),
    ),
  ]),
);
import { AuthCallback, RequireAdmin } from "./components/AuthGuards.jsx";
const AuthPage = lazy(() =>
  import("./pages/AuthPages.jsx").then((module) => ({
    default: module.AuthPage,
  })),
);
const PartnerPage = lazy(() => import("./pages/PartnerPage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));
function LegacyRedirect({ to, admin = false }) {
  const location = useLocation(),
    query = new URLSearchParams(location.search);
  if (admin) query.set("next", "admin");
  return (
    <Navigate
      replace
      to={to + (query.size ? "?" + query : "") + location.hash}
    />
  );
}
function RecoveryRedirect() {
  const { recovery } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  useEffect(() => {
    if (recovery && location.pathname !== "/reset-password")
      navigate("/reset-password", { replace: true });
  }, [recovery, location.pathname, navigate]);
  return null;
}
function RouteFocus() {
  const location = useLocation(),
    { loading, catalog } = useCatalog();
  useEffect(() => {
    if (loading) return;
    const main = document.getElementById("main");
    main?.setAttribute("tabindex", "-1");
    main?.focus({ preventScroll: true });
    if (location.hash) {
      try {
        document
          .getElementById(decodeURIComponent(location.hash.slice(1)))
          ?.scrollIntoView();
      } catch {
        /* Malformed anchors do not prevent navigation. */
      }
    }
  }, [location.pathname, location.hash, loading]);
  useEffect(() => {
    const heading = document.querySelector("#main h1")?.textContent;
    document.title =
      location.pathname === "/"
        ? "Hôm nay ăn gì? Chọn món giúp bạn"
        : (heading || "Hôm nay ăn gì?") + " | Hôm nay ăn gì?";
    const id = new URLSearchParams(location.search).get("dish");
    const dish = catalog?.dishes.find((d) => d.id === id);
    if (["/result", "/recipe"].includes(location.pathname) && dish)
      document.body.dataset.cuisine = dish.cuisine;
    else document.body.removeAttribute("data-cuisine");
  }, [location.pathname, location.hash, location.search, loading, catalog]);
  return null;
}
export default function App() {
  return (
    <Layout>
      <RecoveryRedirect />
      <Suspense
        fallback={
          <main id="main" className="page wrap">
            <Status title="Đang mở trang…" />
          </main>
        }
      >
        <RouteFocus />
        <Routes>
          <Route
            element={
              <CatalogBoundary>
                <Outlet />
              </CatalogBoundary>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="cuisines" element={<CuisinesPage />} />
            <Route path="dishes" element={<DishesPage />} />
            <Route path="result" element={<ResultPage />} />
            <Route path="restaurants" element={<RestaurantsPage />} />
            <Route path="restaurant" element={<RestaurantPage />} />
            <Route path="recipe" element={<RecipePage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route path="login" element={<AuthPage key="login" />} />
          <Route
            path="register"
            element={<AuthPage key="register" mode="register" />}
          />
          <Route
            path="forgot-password"
            element={<AuthPage key="forgot" mode="forgot" />}
          />
          <Route
            path="reset-password"
            element={<AuthPage key="reset" mode="reset" />}
          />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="partner" element={<PartnerPage />} />
          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
          {[
            ["index.html", "/"],
            ["cuisines.html", "/cuisines"],
            ["dishes.html", "/dishes"],
            ["result.html", "/result"],
            ["restaurants.html", "/restaurants"],
            ["restaurant.html", "/restaurant"],
            ["recipe.html", "/recipe"],
            ["favorites.html", "/favorites"],
            ["about.html", "/about"],
            ["admin.html", "/admin"],
            ["admin-login.html", "/login"],
          ].map(([path, to]) => (
            <Route
              key={path}
              path={path}
              element={
                <LegacyRedirect to={to} admin={path === "admin-login.html"} />
              }
            />
          ))}
          <Route
            path="*"
            element={
              <main id="main" className="page wrap">
                <Status title="Không tìm thấy trang">
                  <a href="/">Về trang chủ</a>
                </Status>
              </main>
            }
          />
        </Routes>
      </Suspense>
    </Layout>
  );
}
