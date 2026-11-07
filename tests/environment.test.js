import test from "node:test";
import assert from "node:assert/strict";
import { checkEnvironment } from "../scripts/check-env.mjs";
const env = {
  VITE_SUPABASE_URL: "https://example.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_TEST_ONLY_PUBLIC_KEY",
};
const jwt = (role) =>
  "header." +
  Buffer.from(JSON.stringify({ role })).toString("base64url") +
  ".signature";
test("production environment accepts only browser-safe Supabase keys and project origins", () => {
  assert.doesNotThrow(() => checkEnvironment(env));
  assert.doesNotThrow(() =>
    checkEnvironment({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: jwt("anon") }),
  );
  for (const key of [
    "sb_secret_PRIVATE",
    jwt("service_role"),
    "database-password",
    "",
  ])
    assert.throws(() =>
      checkEnvironment({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: key }),
    );
  for (const url of [
    "http://remote.example",
    "https://user:pass@example.com",
    "https://example.com/path",
    "javascript:alert(1)",
  ])
    assert.throws(() => checkEnvironment({ ...env, VITE_SUPABASE_URL: url }));
});
