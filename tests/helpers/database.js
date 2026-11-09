import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

export const owner = "10000000-0000-4000-8000-000000000001";
export const other = "10000000-0000-4000-8000-000000000002";
export const admin = "10000000-0000-4000-8000-000000000003";

export async function setup() {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated;
      create table auth.users(id uuid primary key,email text,created_at timestamptz default now());
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated;`);
    const folder = new URL("../../supabase/migrations/", import.meta.url);
    for (const file of (await readdir(folder))
      .filter((name) => name.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(file, folder), "utf8"));
    await db.query(
      "insert into auth.users(id,email) values($1,$2),($3,$4),($5,$6)",
      [
        owner,
        "owner@example.com",
        other,
        "other@example.com",
        admin,
        "admin@example.com",
      ],
    );
    await db.query("insert into private.admin_users(user_id) values($1)", [
      admin,
    ]);
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}

export async function actor(db, id) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id || "",
  ]);
  await db.exec("set role " + (id ? "authenticated" : "anon"));
}
