import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToReadableStream } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { createServer } from "vite";
import { assembleCatalog } from "../src/lib/catalog.js";
const read = async (name) =>
  JSON.parse(
    await readFile(
      new URL("../data/" + name + ".json", import.meta.url),
      "utf8",
    ),
  );

test(
  "React routes render the migrated catalog, auth screens, empty states and escaped user content",
  { timeout: 30000 },
  async () => {
    const vite = await createServer({
      mode: "test",
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: "custom",
    });
    try {
      const { default: App } = await vite.ssrLoadModule("/src/App.jsx");
      const { CatalogContext, AuthContext, FavoritesContext } =
        await vite.ssrLoadModule("/src/providers.jsx");
      const [food, venues, links, recipes] = await Promise.all(
        ["food", "restaurants", "dish-restaurants", "recipes"].map(read),
      );
      const base = assembleCatalog({
        dishes: food.DISHES,
        restaurants: venues.restaurants,
        links: links.links,
        recipes,
      });
      const auth = {
        loading: false,
        user: null,
        admin: false,
        available: true,
        error: "",
        recovery: false,
      };
      const render = async (route, catalog = base, override = {}) => {
        const stream = await renderToReadableStream(
          React.createElement(
            MemoryRouter,
            { initialEntries: [route] },
            React.createElement(
              AuthContext.Provider,
              { value: { ...auth, ...override } },
              React.createElement(
                CatalogContext.Provider,
                {
                  value: {
                    catalog,
                    loading: false,
                    error: "",
                    reload() {},
                    demo: false,
                  },
                },
                React.createElement(
                  FavoritesContext.Provider,
                  {
                    value: {
                      state: { dishes: [], restaurants: [] },
                      toggle() {},
                    },
                  },
                  React.createElement(App),
                ),
              ),
            ),
          ),
        );
        await stream.allReady;
        return new Response(stream).text();
      };
      for (const [route, text] of [
        ["/", "Bất ngờ đi"],
        ["/dishes", "Tất cả món ăn"],
        ["/cuisines", "Chọn nền ẩm thực"],
        ["/restaurants", "Quán ăn tại Đà Nẵng"],
        ["/result?dish=pho-bo", "Phở bò"],
        ["/recipe?dish=pho-bo", "Nguyên liệu"],
        ["/restaurant?id=dn-001", "Mì Quảng"],
        ["/favorites", "Yêu thích"],
        ["/about", "Nguồn dữ liệu"],
        ["/partner", "Đăng ký chủ quán"],
        ["/register", "Đăng ký tài khoản chủ quán"],
        ["/login", "Mật khẩu"],
        ["/forgot-password", "Gửi đường dẫn"],
      ])
        assert.ok((await render(route)).includes(text), route);
      for (const dish of base.dishes) {
        const html = await render("/recipe?dish=" + dish.id);
        assert.ok(
          html.replaceAll("<!-- -->", "").includes("Cách nấu " + dish.name),
          dish.id,
        );
        assert.ok(html.includes("Nguyên liệu"), dish.id);
        assert.ok(html.includes("Cách làm"), dish.id);
        assert.ok(!html.includes("Công thức đang được cập nhật"), dish.id);
      }
      assert.ok(
        (await render("/result?dish=missing")).includes(
          "Món này chưa có trong danh mục",
        ),
      );
      assert.ok(
        (await render("/result?diet=unknown")).includes("Tùy chọn chưa hợp lệ"),
      );
      assert.ok(
        (await render("/admin", base, { user: { id: "test" } })).includes(
          "Tài khoản chưa có quyền quản trị",
        ),
      );
      assert.ok(
        (
          await render("/partner", base, {
            user: { id: "test", email: "owner@example.com" },
          })
        ).includes("Quán của bạn"),
      );
      assert.ok(
        (
          await render("/reset-password", base, { user: { id: "test" } })
        ).includes("Cập nhật mật khẩu"),
      );
      const ordering = structuredClone(base);
      const restaurant = ordering.restaurants.find((r) => r.id === "dn-053");
      assert.ok(restaurant);
      restaurant.grabFoodUrl =
        "https://food.grab.com/vn/vi/restaurant/test-branch";
      restaurant.shopeeFoodUrl = "https://shopeefood.vn/da-nang/test-branch";
      for (const route of ["/result?dish=pho-bo", "/restaurant?id=dn-053"]) {
        const html = await render(route, ordering);
        assert.ok(html.includes('aria-label="Đặt hàng tại '), route);
        assert.ok(
          html.includes('href="' + restaurant.grabFoodUrl + '"'),
          route,
        );
        assert.ok(
          html.includes('href="' + restaurant.shopeeFoodUrl + '"'),
          route,
        );
        assert.ok(html.includes("Đặt qua "), route);
        assert.ok(html.includes('rel="noopener noreferrer"'), route);
      }
      restaurant.grabFoodUrl = "https://food.grab.com.attacker.example/test";
      restaurant.shopeeFoodUrl = "javascript:alert(1)";
      const fallback = await render("/result?dish=pho-bo", ordering);
      assert.ok(fallback.includes('href="https://food.grab.com/vn/vi/"'));
      assert.ok(fallback.includes('href="https://shopeefood.vn/"'));
      assert.ok(fallback.includes("đối chiếu địa chỉ"));
      assert.ok(!fallback.includes("attacker.example"));
      assert.ok(!fallback.includes("javascript:"));
      assert.ok(!fallback.includes("Đặt qua "));
      const changed = structuredClone(base);
      changed.dishes = changed.dishes.filter((d) => d.id !== "pho-bo");
      changed.dishes.push({
        id: "d-no-photo",
        name: "New dish",
        cuisine: "viet",
        meals: ["trua"],
      });
      assert.ok(
        (await render("/about", changed)).includes("Chưa có nguồn ảnh phù hợp"),
      );
      changed.restaurants[0].name = 'Quán" onload="window.bad=1';
      const html = await render("/restaurants", changed);
      assert.ok(html.includes("Quán&quot; onload=&quot;window.bad=1"));
      assert.ok(!html.includes('alt="Quán" onload="window.bad=1'));
      assert.ok(!html.includes("dangerouslySetInnerHTML"));
    } finally {
      await vite.close();
    }
  },
);
