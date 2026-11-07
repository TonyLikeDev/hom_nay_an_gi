import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import {
  AuthProvider,
  CatalogProvider,
  FavoritesProvider,
} from "./providers.jsx";
import "./styles.css";

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="page wrap">
        <h1>Trang chưa tải được</h1>
        <p>
          Bạn vui lòng tải lại trang để thử lại. Những thay đổi chưa được xác
          nhận lưu cần kiểm tra trong hồ sơ.
        </p>
        <button className="btn" type="button" onClick={() => location.reload()}>
          Tải lại trang
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CatalogProvider>
            <FavoritesProvider>
              <App />
            </FavoritesProvider>
          </CatalogProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
