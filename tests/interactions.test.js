import test, { before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import { assembleCatalog } from "../src/lib/catalog.js";
import { setup, actor, owner, admin } from "./helpers/database.js";

const e = React.createElement;
let dom,
  vite,
  createRoot,
  createMemoryRouter,
  RouterProvider,
  contexts,
  catalog;
const components = {};
const mounts = [];
const previousGlobals = new Map();
let pendingRPC = Promise.resolve();
let handleRPC = () => {
  throw Error("Unexpected database call");
};

before(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  for (const key of [
    "window",
    "document",
    "navigator",
    "HTMLElement",
    "Event",
    "MouseEvent",
    "location",
    "localStorage",
    "sessionStorage",
  ]) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value: dom.window[key],
      configurable: true,
      writable: true,
    });
  }
  previousGlobals.set(
    "IS_REACT_ACT_ENVIRONMENT",
    Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT"),
  );
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  previousGlobals.set(
    "matchMedia",
    Object.getOwnPropertyDescriptor(globalThis, "matchMedia"),
  );
  globalThis.matchMedia = () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  });
  dom.window.scrollTo = () => {};
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new dom.window.Event("close"));
  };
  ({ createRoot } = await import("react-dom/client"));
  ({ createMemoryRouter, RouterProvider } = await import("react-router"));
  globalThis.__HNAG_TEST_RPC__ = (name, args) => {
    pendingRPC = handleRPC(name, args);
    return pendingRPC;
  };
  const clientPath = fileURLToPath(
    new URL("../src/lib/supabase.js", import.meta.url),
  );
  vite = await createServer({
    mode: "test",
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    appType: "custom",
    plugins: [
      {
        name: "isolated-test-database",
        enforce: "pre",
        load(id) {
          if (id === clientPath)
            return `
          export const supabase = null;
          export const rpc = (name, args) => globalThis.__HNAG_TEST_RPC__(name, args);
          export const readCatalog = () => { throw Error("Use the test catalog context"); };
        `;
        },
      },
    ],
  });
  contexts = await vite.ssrLoadModule("/src/providers.jsx");
  for (const [name, path] of Object.entries({
    App: "App.jsx",
    HomePage: "pages/HomePage.jsx",
    CuisinesPage: "pages/CuisinesPage.jsx",
    ResultPage: "pages/ResultPage.jsx",
    RecipePage: "pages/RecipePage.jsx",
    OwnerEditor: "components/partner/OwnerEditor.jsx",
    SubmissionReview: "components/admin/SubmissionReview.jsx",
  }))
    components[name] = (await vite.ssrLoadModule("/src/" + path)).default;
  const [food, venues, links, recipes] = await Promise.all(
    ["food", "restaurants", "dish-restaurants", "recipes"].map(async (name) =>
      JSON.parse(
        await readFile(
          new URL("../data/" + name + ".json", import.meta.url),
          "utf8",
        ),
      ),
    ),
  );
  catalog = assembleCatalog({
    dishes: food.DISHES,
    restaurants: venues.restaurants,
    links: links.links,
    recipes,
  });
});

async function mount(element, catalogState = { catalog }) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mounts.push({ root, container });
  const render = async (child, nextCatalogState = catalogState) =>
    act(async () => {
      root.render(
        e(
          contexts.AuthContext.Provider,
          {
            value: {
              user: null,
              admin: false,
              loading: false,
              error: "",
              recovery: false,
              available: true,
            },
          },
          e(
            contexts.CatalogContext.Provider,
            { value: nextCatalogState },
            e(
              contexts.FavoritesContext.Provider,
              {
                value: { state: { dishes: [], restaurants: [] }, toggle() {} },
              },
              child,
            ),
          ),
        ),
      );
    });
  await render(element);
  return { container, render };
}

async function mountRoutes(route, entries = [route]) {
  const router = createMemoryRouter(
    [
      { path: "/", element: e(components.HomePage) },
      { path: "/cuisines", element: e(components.CuisinesPage) },
      { path: "/result", element: e(components.ResultPage) },
      { path: "/recipe", element: e(components.RecipePage) },
    ],
    { initialEntries: entries, initialIndex: entries.length - 1 },
  );
  const view = await mount(e(RouterProvider, { router }));
  mounts.at(-1).router = router;
  return { ...view, router };
}

async function click(element) {
  assert.ok(element, "Expected a clickable control");
  await act(async () => {
    element.click();
    await pendingRPC.catch(() => {});
  });
}

function field(container, name) {
  const label = [...container.querySelectorAll(".form-field")].find(
    (label) =>
      label.firstElementChild.textContent.replace(/\s*\*$/, "") === name,
  );
  assert.ok(label, "Missing field: " + name);
  return label.querySelector("input,select,textarea");
}

async function fill(container, name, value) {
  const input = field(container, name);
  const set = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    "value",
  ).set;
  await act(async () => {
    set.call(input, value);
    input.dispatchEvent(
      new dom.window.Event(input.tagName === "SELECT" ? "change" : "input", {
        bubbles: true,
      }),
    );
  });
}

afterEach(async () => {
  for (const { root, container, router } of mounts.splice(0)) {
    await act(async () => root.unmount());
    router?.dispose();
    container.remove();
  }
  pendingRPC = Promise.resolve();
  handleRPC = () => {
    throw Error("Unexpected database call");
  };
});

after(async () => {
  await vite?.close();
  dom?.window.close();
  delete globalThis.__HNAG_TEST_RPC__;
  for (const [key, descriptor] of previousGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
});

test("landing page is visible before the catalog arrives and keeps retry and empty states honest", async () => {
  const router = createMemoryRouter(
    [{ path: "*", element: e(components.App) }],
    { initialEntries: ["/"] },
  );
  const element = e(RouterProvider, { router });
  const view = await mount(element, {
    catalog: null,
    loading: true,
    error: "",
  });
  mounts.at(-1).router = router;
  const { container } = view;
  assert.ok(container.querySelector(".hero h1"));
  assert.equal(container.querySelector(".hero__cta button").disabled, false);
  assert.equal(container.querySelector(".spin-options__status"), null);
  assert.ok(!container.textContent.includes("Đang tải món và quán"));
  assert.ok(!container.textContent.includes("Đang mở trang"));
  const images = [...container.querySelectorAll(".hero__reels img")];
  assert.equal(images.length, 15);
  for (const src of new Set(images.map((img) => img.getAttribute("src")))) {
    assert.ok(src.startsWith("/images/"));
    assert.ok(
      (await readFile(new URL("../public" + src, import.meta.url))).length > 0,
    );
  }
  let retries = 0;
  await view.render(element, {
    catalog: null,
    loading: false,
    error: "Catalog connection failed",
    reload: () => {
      retries++;
    },
  });
  assert.ok(container.querySelector(".hero h1"));
  assert.ok(container.textContent.includes("Catalog connection failed"));
  assert.equal(container.querySelector(".hero__cta button").disabled, true);
  await click(
    [...container.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Thử lại",
    ),
  );
  assert.equal(retries, 1);
  await view.render(element, { catalog, loading: false, error: "" });
  assert.equal(container.querySelector(".hero__cta button").disabled, false);
  assert.ok(
    container
      .querySelector(".spin-options__status")
      .textContent.includes("105"),
  );
  assert.ok(!container.textContent.includes("Catalog connection failed"));
  await view.render(element, {
    catalog: assembleCatalog({}),
    loading: false,
    error: "",
  });
  assert.equal(container.querySelector(".hero__cta button").disabled, true);
  assert.ok(
    container.querySelector(".spin-options__status").textContent.includes("0"),
  );
});

test("diet and restaurant filters survive clicking through cuisine selection", async () => {
  const { container, router } = await mountRoutes("/");
  await fill(container, "Chế độ ăn", "vegetarian");
  await click(
    [...container.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Có quán",
    ),
  );
  await click(
    [...container.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Có công thức",
    ),
  );
  await click(
    [...container.querySelectorAll("a")].find(
      (link) => link.textContent.trim() === "Theo ẩm thực",
    ),
  );
  let params = new URLSearchParams(router.state.location.search);
  assert.equal(router.state.location.pathname, "/cuisines");
  assert.equal(params.get("diet"), "vegetarian");
  assert.equal(params.get("linked"), "1");
  assert.equal(params.get("recipe"), "1");
  await click(container.querySelector('a[data-cuisine="viet"]'));
  params = new URLSearchParams(router.state.location.search);
  assert.equal(params.get("diet"), "vegetarian");
  assert.equal(params.get("linked"), "1");
  assert.equal(params.get("recipe"), "1");
  const selected = catalog.dishes.find(
    (dish) => dish.id === params.get("dish"),
  );
  assert.ok(selected, "The picker should select a real dish");
  assert.equal(selected.cuisine, "viet");
  assert.ok(
    ["reviewed", "source-declared"].includes(selected.vegetarianReview?.status),
  );
  assert.ok(selected.linkedRestaurantCount > 0);
});

test("a recipe history jump resets servings, ingredient checks and completed steps", async () => {
  const { container, router } = await mountRoutes("/recipe?dish=pho-bo", [
    "/recipe?dish=xoi-xoai",
    "/recipe?dish=pho-bo",
  ]);
  await click(container.querySelector('[aria-label="Tăng khẩu phần"]'));
  await click(container.querySelector('[aria-label="Tăng khẩu phần"]'));
  assert.notEqual(
    container.querySelector(".serving-controls [role=status]").textContent,
    catalog.recipes["xoi-xoai"].servings + " người",
  );
  await click(
    container.querySelector('.recipe-checklist input[type="checkbox"]'),
  );
  await click(container.querySelector('.recipe-steps input[type="checkbox"]'));
  assert.equal(container.querySelectorAll("input:checked").length, 2);
  await act(async () => router.navigate(-1));
  assert.equal(
    container.querySelector(".serving-controls [role=status]").textContent,
    catalog.recipes["xoi-xoai"].servings + " người",
  );
  assert.equal(container.querySelectorAll("input:checked").length, 0);
  assert.equal(container.querySelector("progress").value, 0);
});

test("delivery opens without selecting a region and still copies the dish name", async () => {
  const { container } = await mountRoutes("/result?dish=pho-bo");
  const copied = [];
  Object.defineProperty(dom.window.navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (text) => copied.push(text) },
  });
  await click(container.querySelector(".delivery-link"));
  const dialog = container.querySelector("dialog[open]");
  assert.ok(dialog);
  assert.equal(dialog.querySelector("select"), null);
  assert.equal(
    dialog.querySelector('a[href="https://food.grab.com/vn/vi/"]').target,
    "_blank",
  );
  await click(
    [...dialog.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Sao chép tên món",
    ),
  );
  assert.deepEqual(copied, [
    catalog.dishes.find((dish) => dish.id === "pho-bo").name,
  ]);
  assert.ok(dialog.textContent.includes("Đã sao chép tên món"));
});

test("owner submission and admin approval work through the actual forms and database permissions", async () => {
  const db = await setup();
  try {
    let calls = 0,
      submitted,
      approved;
    handleRPC = async (name, args) => {
      calls++;
      if (name === "save_submission")
        return (
          await db.query(
            "select to_jsonb(public.save_submission($1,$2,$3,$4::jsonb,$5::jsonb,$6)) as data",
            [
              args.p_id,
              args.p_revision,
              args.p_request_id,
              JSON.stringify(args.p_data),
              JSON.stringify(args.p_menu),
              args.p_submit,
            ],
          )
        ).rows[0].data;
      assert.equal(name, "review_submission");
      return (
        await db.query(
          "select to_jsonb(public.review_submission($1,$2,$3,$4)) as data",
          [args.p_id, args.p_revision, args.p_approve, args.p_note],
        )
      ).rows[0].data;
    };
    await actor(db, owner);
    const view = await mount(
      e(components.OwnerEditor, {
        email: "owner@example.com",
        onSaved: (record) => {
          submitted = record;
        },
        onClose() {},
      }),
    );
    await click(view.container.querySelector('button[value="submit"]'));
    assert.equal(
      calls,
      0,
      "Required fields must prevent incomplete submissions",
    );
    for (const [name, value] of [
      ["Tên quán / chi nhánh", "Quán kiểm thử"],
      ["Địa chỉ chính xác", "Địa chỉ kiểm thử"],
      ["Số điện thoại của quán", "0000000000"],
      ["Tên người đại diện", "Chủ quán kiểm thử"],
      ["Link thực đơn / nguồn đối chiếu (HTTPS)", "https://example.com/menu"],
      ["Tên món", "Món kiểm thử"],
      ["Giá một phần (VND)", "45000"],
    ])
      await fill(view.container, name, value);
    await click(
      view.container.querySelector('.consent input[type="checkbox"]'),
    );
    assert.equal(view.container.querySelector("form").checkValidity(), true);
    await click(view.container.querySelector('button[value="submit"]'));
    assert.equal(submitted?.status, "pending");
    assert.equal(submitted.menu[0].price, 45000);
    assert.equal(
      (await db.query("select public.get_catalog() as c")).rows[0].c.restaurants
        .length,
      0,
    );
    await view.render(
      e(components.SubmissionReview, {
        record: submitted,
        onSaved: (message) => {
          approved = message;
        },
        onClose() {},
      }),
    );
    await click(
      view.container.querySelector('.consent input[type="checkbox"]'),
    );
    await click(view.container.querySelector('button[value="approve"]'));
    assert.equal(
      approved,
      undefined,
      "An owner cannot approve their own restaurant",
    );
    assert.ok(view.container.querySelector('[role="alert"]'));
    await actor(db, admin);
    await click(view.container.querySelector('button[value="approve"]'));
    assert.equal(approved, "Đã duyệt quán và thực đơn.");
    await actor(db, null);
    const published = (await db.query("select public.get_catalog() as c"))
      .rows[0].c;
    assert.equal(published.restaurants[0].name, "Quán kiểm thử");
    assert.equal(published.links[0].priceVnd, 45000);
    assert.ok(!JSON.stringify(published).includes("owner@example.com"));
  } finally {
    await db.close();
  }
});
