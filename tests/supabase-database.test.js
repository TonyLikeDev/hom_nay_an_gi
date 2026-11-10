import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { setup, actor, owner, other, admin } from "./helpers/database.js";
const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const payload = {
  name: "Quán thử",
  address: "1 Đường thử",
  area: "Đà Nẵng",
  category: "Món chính",
  phone: "0901234567",
  contactName: "Chủ quán thử",
  contactEmail: "owner@example.com",
  sourceUrl: "https://example.com/menu",
  meals: ["trua"],
  consent: true,
};
const menu = [
  {
    id: randomUUID(),
    name: "Món thử",
    desc: "Một phần ăn",
    cuisine: "viet",
    meals: ["trua"],
    price: 45000,
    imageUrl: "",
  },
  {
    id: randomUUID(),
    name: "Món phụ",
    desc: "Món phụ thử nghiệm",
    cuisine: "viet",
    meals: ["toi"],
    price: 25000,
    imageUrl: "",
  },
];
test("recipe backfill adds missing recipes without overwriting admin edits or visibility", async () => {
  const db = await setup();
  try {
    const seed = await read("supabase/seed.sql");
    await db.exec(seed);
    await db.query("delete from public.recipes where dish_id=$1", ["banh-mi"]);
    await db.query(
      "update public.recipes set data=jsonb_set(data,'{tip}',$1::jsonb),is_visible=false where dish_id=$2",
      [JSON.stringify("Admin-edited recipe tip"), "pho-bo"],
    );
    await db.exec(seed);
    await db.exec(seed);
    const recipes = (
      await db.query("select dish_id,data,is_visible from public.recipes")
    ).rows;
    assert.equal(recipes.length, 105);
    assert.equal(
      recipes.find((r) => r.dish_id === "pho-bo").data.tip,
      "Admin-edited recipe tip",
    );
    assert.equal(recipes.find((r) => r.dish_id === "pho-bo").is_visible, false);
    assert.ok(
      recipes.find((r) => r.dish_id === "banh-mi").data.ingredients.length > 0,
    );
  } finally {
    await db.close();
  }
});

test("seed adds order links to existing restaurants without overwriting admin choices", async () => {
  const db = await setup();
  try {
    const seed = await read("supabase/seed.sql");
    const [missing, cleared] = JSON.parse(
      await read("data/restaurants.json"),
    ).restaurants.filter((r) => r.grabFoodUrl);
    assert.ok(cleared, "needs two restaurants with GrabFood links");
    await db.exec(seed);
    // Simulate a row seeded before links existed, and one where an admin removed the link.
    await db.query(
      "update public.restaurants set data=data-'grabFoodUrl'-'shopeeFoodUrl',revision=1 where id=$1",
      [missing.id],
    );
    await db.query(
      `update public.restaurants set data=jsonb_set(data,'{grabFoodUrl}','""'),revision=1 where id=$1`,
      [cleared.id],
    );
    await db.exec(seed);
    await db.exec(seed);
    const row = async (id) =>
      (
        await db.query(
          "select data,revision from public.restaurants where id=$1",
          [id],
        )
      ).rows[0];
    const filled = await row(missing.id);
    assert.equal(filled.data.grabFoodUrl, missing.grabFoodUrl);
    assert.equal(filled.data.shopeeFoodUrl, missing.shopeeFoodUrl);
    assert.equal(filled.revision, 2);
    const kept = await row(cleared.id);
    assert.equal(kept.data.grabFoodUrl, "");
    assert.equal(kept.revision, 1);
  } finally {
    await db.close();
  }
});

test("test restaurant SQL creates only an owner draft and safely preserves edits on rerun", async () => {
  const db = await setup();
  const sql = await read("supabase/test-restaurant.sql");
  try {
    await assert.rejects(db.exec(sql), /does not exist/);
    await db.exec("rollback");
    assert.equal(
      (await db.query("select id from public.restaurant_submissions")).rows
        .length,
      0,
    );
    await db.query("update auth.users set email=$1 where id=$2", [
      "aividmaking1@gmail.com",
      owner,
    ]);
    await db.exec(sql);
    const draft = (
      await db.query("select * from public.restaurant_submissions")
    ).rows[0];
    assert.equal(draft.owner_id, owner);
    assert.equal(draft.status, "draft");
    assert.equal(draft.data.consent, false);
    assert.equal(draft.menu.length, 3);
    await db.query(
      "update public.restaurant_submissions set data=jsonb_set(data,'{name}','\"Edited test draft\"') where id=$1",
      [draft.id],
    );
    await db.exec(sql);
    const rows = (await db.query("select * from public.restaurant_submissions"))
      .rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].data.name, "Edited test draft");
    await actor(db, owner);
    assert.equal(
      (await db.query("select id from public.restaurant_submissions")).rows
        .length,
      1,
    );
    await actor(db, other);
    assert.equal(
      (await db.query("select id from public.restaurant_submissions")).rows
        .length,
      0,
    );
    await actor(db, null);
    const catalog = (await db.query("select public.get_catalog() as catalog"))
      .rows[0].catalog;
    assert.equal(catalog.restaurants.length, 0);
    assert.equal(catalog.dishes.length, 0);
  } finally {
    await db.close();
  }
});
const save = (
  db,
  id,
  revision = 0,
  data = payload,
  items = menu,
  request = randomUUID(),
  submit = true,
) =>
  db
    .query(
      "select to_jsonb(public.save_submission($1,$2,$3,$4::jsonb,$5::jsonb,$6)) as record",
      [
        id,
        revision,
        request,
        JSON.stringify(data),
        JSON.stringify(items),
        submit,
      ],
    )
    .then((r) => r.rows[0].record);
const catalog = async (db) =>
  (await db.query("select public.get_catalog() as catalog")).rows[0].catalog;

test("recipe edits revoke old evidence, preserve declarations, and keep visibility-only edits and retries safe", async () => {
  const db = await setup();
  try {
    await db.exec(await read("supabase/seed.sql"));
    const beforeUpgrade = await catalog(db);
    await db.exec(
      await read("supabase/migrations/202611090002_catalog_lock_order.sql"),
    );
    assert.deepEqual(
      await catalog(db),
      beforeUpgrade,
      "Reapplying the upgrade must preserve existing data",
    );
    await actor(db, admin);
    const getDish = async (id) =>
      (await db.query("select * from public.dishes where id=$1", [id])).rows[0];
    const recipe = (
      await db.query("select * from public.recipes where dish_id=$1", [
        "ca-phe-dac-san",
      ])
    ).rows[0];
    const originalDish = await getDish(recipe.dish_id);
    assert.ok(originalDish.data.nutritionReviews.length);
    const write = async (revision, data, visible, request = randomUUID()) =>
      (
        await db.query(
          "select public.save_catalog('recipes',$1,$2,$3,$4::jsonb,$5) as record",
          [recipe.dish_id, revision, request, JSON.stringify(data), visible],
        )
      ).rows[0].record;
    const hidden = await write(recipe.revision, recipe.data, false);
    assert.deepEqual(await getDish(recipe.dish_id), originalDish);
    const shown = await write(hidden.revision, recipe.data, true);
    assert.deepEqual(await getDish(recipe.dish_id), originalDish);
    const changed = structuredClone(recipe.data);
    changed.ingredients.push({ name: "Đường thêm", amount: 100, unit: "g" });
    const nonce = randomUUID();
    const saved = await write(shown.revision, changed, true, nonce);
    const updatedDish = await getDish(recipe.dish_id);
    assert.equal(updatedDish.data.nutritionProfile, undefined);
    assert.equal(updatedDish.data.nutritionReviews, undefined);
    assert.deepEqual(
      updatedDish.data.vegetarianReview,
      originalDish.data.vegetarianReview?.status === "reviewed"
        ? undefined
        : originalDish.data.vegetarianReview,
    );
    assert.equal(
      (await write(shown.revision, changed, true, nonce)).revision,
      saved.revision,
    );
    assert.deepEqual(
      await getDish(recipe.dish_id),
      updatedDish,
      "A retry must not invalidate evidence twice",
    );
    const declaration = await getDish("bun-chay");
    assert.equal(declaration.data.vegetarianReview.status, "source-declared");
    const declaredRecipe = (
      await db.query("select * from public.recipes where dish_id='bun-chay'")
    ).rows[0];
    await db.query(
      "select public.save_catalog('recipes',$1,$2,$3,$4::jsonb,true)",
      [
        "bun-chay",
        declaredRecipe.revision,
        randomUUID(),
        JSON.stringify({ ...declaredRecipe.data, tip: "New cooking tip" }),
      ],
    );
    assert.deepEqual(
      await getDish("bun-chay"),
      declaration,
      "Restaurant source declarations are independent of recipe verification",
    );
    const reviewed = await getDish("bruschetta");
    assert.equal(reviewed.data.vegetarianReview.status, "reviewed");
    const reviewedRecipe = (
      await db.query("select * from public.recipes where dish_id='bruschetta'")
    ).rows[0];
    await db.query(
      "select public.save_catalog('recipes',$1,$2,$3,$4::jsonb,false)",
      [
        "bruschetta",
        reviewedRecipe.revision,
        randomUUID(),
        JSON.stringify(reviewedRecipe.data),
      ],
    );
    assert.deepEqual(
      await getDish("bruschetta"),
      reviewed,
      "Hiding an unchanged recipe must preserve its review",
    );
    await actor(db, null);
    const published = await catalog(db);
    assert.equal(
      published.dishes.find((d) => d.id === recipe.dish_id).nutritionReviews,
      undefined,
    );
    assert.deepEqual(published.recipes[recipe.dish_id], changed);
  } finally {
    await db.close();
  }
});

test("admin dish identity changes hide old recipes once and preserve unrelated edits", async () => {
  const db = await setup();
  try {
    await db.exec(await read("supabase/seed.sql"));
    await actor(db, admin);
    for (const [id, change] of [
      ["pho-bo", { name: "Bánh mì thay món cũ" }],
      ["banh-mi", { cuisine: "nhat" }],
    ]) {
      let dish = (
        await db.query("select * from public.dishes where id=$1", [id])
      ).rows[0];
      const getRecipe = async () =>
        (
          await db.query("select * from public.recipes where dish_id=$1", [id])
        ).rows[0];
      const original = await getRecipe();
      const write = async (
        data,
        visible,
        nonce = randomUUID(),
        revision = dish.revision,
      ) =>
        (
          await db.query(
            "select public.save_catalog('dishes',$1,$2,$3,$4::jsonb,$5) as record",
            [id, revision, nonce, JSON.stringify(data), visible],
          )
        ).rows[0].record;
      dish = await write({ ...dish.data, desc: "Updated description" }, true);
      dish = await write(dish.data, false);
      dish = await write(dish.data, true);
      assert.deepEqual(await getRecipe(), original);
      const nonce = randomUUID(),
        revision = dish.revision;
      dish = await write({ ...dish.data, ...change }, true, nonce);
      const hidden = await getRecipe();
      assert.equal(hidden.is_visible, false);
      assert.equal(hidden.revision, original.revision + 1);
      assert.deepEqual(hidden.data, original.data);
      assert.equal((await catalog(db)).recipes[id], undefined);
      assert.deepEqual(await write(dish.data, true, nonce, revision), dish);
      assert.deepEqual(
        await getRecipe(),
        hidden,
        "Retry must not invalidate twice",
      );
      await assert.rejects(
        write({ ...dish.data, name: "Stale edit" }, true, randomUUID(), revision),
        (error) => error.code === "40001",
      );
      assert.deepEqual(await getRecipe(), hidden);
    }
  } finally {
    await db.close();
  }
});

test("owner dish identity changes hide old recipes while price and restaurant edits preserve them", async () => {
  const db = await setup();
  try {
    const id = randomUUID(),
      items = structuredClone(menu);
    await actor(db, owner);
    let record = await save(db, id, 0, payload, items);
    const approve = async () => {
      await actor(db, admin);
      record = (
        await db.query(
          "select to_jsonb(public.review_submission($1,$2,true,'')) as record",
          [id, record.revision],
        )
      ).rows[0].record;
    };
    await approve();
    const recipe = JSON.parse(await read("data/recipes.json"))["pho-bo"];
    const ids = items.map((item) => "d-" + id + "-" + item.id);
    for (const dishId of ids)
      await db.query(
        "select public.save_catalog('recipes',$1,0,$2,$3::jsonb,true)",
        [dishId, randomUUID(), JSON.stringify(recipe)],
      );
    const edit = async (data = payload) => {
      await actor(db, owner);
      record = await save(db, id, record.revision, data, items);
      await approve();
    };
    items[0].price += 1000;
    await edit({ ...payload, address: "New restaurant address" });
    for (const dishId of ids)
      assert.deepEqual((await catalog(db)).recipes[dishId], recipe);
    items[0].name = "Bánh mì thay cho món cũ";
    items[1].cuisine = "nhat";
    await edit();
    for (const dishId of ids) {
      const stored = (
        await db.query("select * from public.recipes where dish_id=$1", [
          dishId,
        ])
      ).rows[0];
      assert.equal(stored.is_visible, false);
      assert.equal(stored.revision, 2);
      assert.deepEqual(
        stored.data,
        recipe,
        "Keep hidden recipe data for admin review",
      );
    }
    await actor(db, null);
    const published = await catalog(db);
    assert.ok(
      published.dishes.some((d) => d.id === ids[0] && d.name === items[0].name),
    );
    for (const dishId of ids)
      assert.equal(published.recipes[dishId], undefined);
  } finally {
    await db.close();
  }
});

test(
  "Supabase SQL: ownership, private submissions, approval, live links, conflicts and public visibility",
  { timeout: 30000 },
  async () => {
    const db = await setup();
    try {
      await db.exec(await read("supabase/seed.sql"));
      await db.exec(await read("supabase/seed.sql"));
      await db.exec(`do $$ declare r record; begin
        for r in select data from public.dishes loop perform private.assert_dish(r.data); end loop;
        for r in select data from public.restaurants loop perform private.assert_restaurant(r.data); end loop;
        for r in select data from public.recipes loop perform private.assert_recipe(r.data); end loop;
      end $$;`);
      await actor(db, null);
      const seed = await catalog(db);
      assert.equal(seed.dishes.length, 105);
      assert.equal(seed.restaurants.length, 157);
      assert.equal(seed.links.length, 167);
      assert.equal(Object.keys(seed.recipes).length, 105);
      await assert.rejects(
        db.query("select * from public.restaurant_submissions"),
        (e) => e.code === "42501",
      );
      await assert.rejects(
        db.query("select * from private.admin_users"),
        (e) => e.code === "42501",
      );
      await assert.rejects(
        db.query("select public.list_accounts(1)"),
        (e) => e.code === "42501",
      );
      await assert.rejects(save(db, randomUUID()), (e) => e.code === "42501");
      await actor(db, owner);
      assert.equal(
        (await db.query("select public.is_admin() as admin")).rows[0].admin,
        false,
      );
      await assert.rejects(
        db.query("insert into public.restaurants(id,data) values($1,$2)", [
          "stolen",
          "{}",
        ]),
        (e) => e.code === "42501",
      );
      await assert.rejects(
        db.query("insert into private.admin_users(user_id) values($1)", [
          owner,
        ]),
        (e) => e.code === "42501",
      );
      await assert.rejects(
        save(db, randomUUID(), 0, { ...payload, consent: false }),
        (e) => e.code === "22023",
      );
      await assert.rejects(
        save(db, randomUUID(), 0, {
          ...payload,
          grabFoodUrl: "https://food.grab.com.evil.example/",
        }),
        (e) => e.code === "22023",
      );
      await assert.rejects(
        save(db, randomUUID(), 0, payload, [{ ...menu[0], price: -1 }]),
        (e) => e.code === "22023",
      );
      await assert.rejects(
        save(db, randomUUID(), 0, payload, [
          { ...menu[0], nutritionReviews: [] },
        ]),
        (e) => e.code === "22023",
      );
      const id = randomUUID(),
        request = randomUUID();
      const submitted = await save(db, id, 0, payload, menu, request);
      assert.equal(submitted.status, "pending");
      assert.equal(submitted.revision, 1);
      await assert.rejects(
        save(db, id, 0, payload, menu, request, false),
        (e) => e.code === "40001",
      );
      assert.equal(
        (await save(db, id, 0, payload, menu, request)).revision,
        1,
        "Lost-response retries do not create duplicates",
      );
      assert.equal(
        (
          await db.query(
            "select count(*)::int as n from public.restaurant_submissions",
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (await catalog(db)).restaurants.length,
        157,
        "Pending records stay private",
      );
      await actor(db, other);
      assert.equal(
        (await db.query("select * from public.restaurant_submissions")).rows
          .length,
        0,
      );
      await assert.rejects(save(db, id, 1), (e) => e.code === "42501");
      await assert.rejects(
        db.query("select public.review_submission($1,1,true,$2)", [id, ""]),
        (e) => e.code === "42501",
      );
      await actor(db, admin);
      assert.equal(
        (await db.query("select public.is_admin() as admin")).rows[0].admin,
        true,
      );
      assert.equal(
        (await db.query("select public.list_accounts(1) as data")).rows[0].data
          .total,
        3,
      );
      await assert.rejects(
        db.query("select public.review_submission($1,2,true,$2)", [id, ""]),
        (e) => e.code === "40001",
      );
      const approved = (
        await db.query(
          "select to_jsonb(public.review_submission($1,1,true,$2)) as record",
          [id, "Đã đối chiếu thực đơn"],
        )
      ).rows[0].record;
      assert.equal(approved.status, "approved");
      await actor(db, null);
      const published = await catalog(db),
        rid = "r-" + id,
        did = "d-" + id + "-" + menu[0].id;
      assert.equal(published.restaurants.length, 158);
      assert.ok(published.dishes.some((d) => d.id === did));
      const venue = published.restaurants.find((r) => r.id === rid);
      assert.equal(venue.contactEmail, undefined);
      assert.equal(venue.contactName, undefined);
      assert.equal(venue.review_note, undefined);
      assert.ok(
        published.links.some(
          (l) =>
            l.restaurantId === rid && l.dishId === did && l.priceVnd === 45000,
        ),
      );
      await actor(db, owner);
      await assert.rejects(save(db, id, 1), (e) => e.code === "40001");
      const edit = await save(
        db,
        id,
        approved.revision,
        { ...payload, name: "Tên mới" },
        [{ ...menu[0], price: 50000 }],
      );
      assert.equal(
        (await catalog(db)).restaurants.find((r) => r.id === rid).name,
        payload.name,
        "Owner edits cannot bypass approval",
      );
      await actor(db, admin);
      await db.query("select public.review_submission($1,$2,true,$3)", [
        id,
        edit.revision,
        "Đã đối chiếu lại",
      ]);
      const current = (
        await db.query("select * from public.restaurants where id=$1", [rid])
      ).rows[0];
      assert.equal(current.data.name, "Tên mới");
      assert.ok(
        !(await catalog(db)).dishes.some(
          (d) => d.id === "d-" + id + "-" + menu[1].id,
        ),
        "Removed menu items leave the public catalog",
      );
      const recipe = (
        await db.query(
          "select data from public.recipes where dish_id='bruschetta'",
        )
      ).rows[0].data;
      await db.query("select public.save_catalog($1,$2,0,$3,$4::jsonb,true)", [
        "recipes",
        did,
        randomUUID(),
        JSON.stringify(recipe),
      ]);
      const updated = (
        await db.query(
          "select public.save_catalog($1,$2,$3,$4,$5::jsonb,$6) as record",
          [
            "restaurants",
            rid,
            current.revision,
            randomUUID(),
            JSON.stringify(current.data),
            false,
          ],
        )
      ).rows[0].record;
      assert.equal(updated.is_visible, false);
      assert.equal(
        (await catalog(db)).recipes[did],
        undefined,
        "Public catalog stays filtered even for admins",
      );
      await actor(db, null);
      const hidden = await catalog(db);
      assert.ok(!hidden.restaurants.some((r) => r.id === rid));
      assert.ok(!hidden.dishes.some((d) => d.id === did));
      assert.ok(!hidden.links.some((l) => l.restaurantId === rid));
      assert.equal(hidden.recipes[did], undefined);
      assert.equal(
        (await db.query("select * from public.recipes where dish_id=$1", [did]))
          .rows.length,
        0,
      );
      assert.equal(
        (await db.query("select * from public.dishes where id=$1", [did])).rows
          .length,
        0,
      );
    } finally {
      await db.close();
    }
  },
);

test(
  "Supabase SQL: admin writes are validated, versioned, replay-safe and atomic",
  { timeout: 30000 },
  async () => {
    const db = await setup();
    try {
      await db.exec(await read("supabase/seed.sql"));
      await actor(db, admin);
      const get = async (table, key, id) =>
        (await db.query(`select * from public.${table} where ${key}=$1`, [id]))
          .rows[0];
      let dish = await get("dishes", "id", "pho-bo");
      const request = randomUUID(),
        data = { ...dish.data, name: 'Phở "đặc biệt"' };
      const write = (
        kind,
        id,
        revision,
        value,
        visible = true,
        nonce = randomUUID(),
      ) =>
        db
          .query(
            "select public.save_catalog($1,$2,$3,$4,$5::jsonb,$6) as record",
            [kind, id, revision, nonce, JSON.stringify(value), visible],
          )
          .then((r) => r.rows[0].record);
      dish = await write(
        "dishes",
        "pho-bo",
        dish.revision,
        data,
        true,
        request,
      );
      assert.equal(dish.revision, 2);
      assert.equal(
        (await write("dishes", "pho-bo", 1, data, true, request)).revision,
        2,
      );
      await assert.rejects(
        write("dishes", "pho-bo", 1, { ...data, name: "Stale" }),
        (e) => e.code === "40001",
      );
      await assert.rejects(
        write("dishes", "pho-bo", 2, { ...data, meals: [] }),
        (e) => e.code === "22023",
      );
      await assert.rejects(
        write("dishes", "pho-bo", 2, {
          ...data,
          nutritionReviews: [
            {
              key: "low-sugar",
              status: "verified",
              source: "https://example.com",
              basis: "Claim",
            },
          ],
          nutritionProfile: {
            scope: "Claim",
            source: "https://example.com",
            foodForm: "solid",
            servingUnit: "g",
            servingQuantity: 100,
            values: { sugarsG: 20 },
          },
        }),
        (e) => e.code === "22023",
      );
      const recipe = await get("recipes", "dish_id", "bruschetta");
      const broken = {
        ...recipe.data,
        ingredients: [{ name: "Salt", amount: 0, unit: "g" }],
      };
      await assert.rejects(
        write("recipes", "bruschetta", recipe.revision, broken),
        (e) => e.code === "22023",
      );
      assert.equal(
        (await get("recipes", "dish_id", "bruschetta")).revision,
        recipe.revision,
      );
      await write("recipes", "bruschetta", recipe.revision, {
        ...recipe.data,
        tip: "Updated recipe",
      });
      assert.equal(
        (await get("dishes", "id", "bruschetta")).data.vegetarianReview,
        undefined,
      );
      const link = await get("restaurant_dishes", "id", "mi-quang/dn-001");
      await write(
        "links",
        link.id,
        link.revision,
        { ...link.data, sourceUrl: "https://example.com/menu" },
        false,
      );
      assert.ok(
        !(await catalog(db)).links.some(
          (l) => l.dishId === "mi-quang" && l.restaurantId === "dn-001",
        ),
      );
      await db.exec("reset role");
      assert.ok(
        (await db.query("select count(*)::int as n from private.audit_log"))
          .rows[0].n > 0,
      );
    } finally {
      await db.close();
    }
  },
);

test(
  "approval rolls back the restaurant and first menu item when a later item fails",
  { timeout: 30000 },
  async () => {
    const db = await setup();
    try {
      const id = randomUUID();
      await db.query(
        "insert into public.restaurant_submissions(id,owner_id,data,menu,status,last_request_id) values($1,$2,$3::jsonb,$4::jsonb,$5,$6)",
        [
          id,
          owner,
          JSON.stringify(payload),
          JSON.stringify([menu[0], { ...menu[1], meals: [] }]),
          "pending",
          randomUUID(),
        ],
      );
      await actor(db, admin);
      await assert.rejects(
        db.query("select public.review_submission($1,1,true,$2)", [id, ""]),
        (e) => e.code === "22023",
      );
      assert.equal(
        (await db.query("select * from public.restaurants")).rows.length,
        0,
      );
      assert.equal(
        (await db.query("select * from public.dishes")).rows.length,
        0,
      );
      assert.equal(
        (await db.query("select * from public.restaurant_dishes")).rows.length,
        0,
      );
      assert.equal(
        (
          await db.query(
            "select status from public.restaurant_submissions where id=$1",
            [id],
          )
        ).rows[0].status,
        "pending",
      );
    } finally {
      await db.close();
    }
  },
);
