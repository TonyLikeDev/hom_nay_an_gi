export function checkEnvironment(env) {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY)
    throw Error(
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Use npm run build:demo for an explicitly read-only preview.",
    );
  const url = new URL(env.VITE_SUPABASE_URL);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !(
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    )
  )
    throw Error(
      "VITE_SUPABASE_URL must be the HTTPS project origin or a local Supabase URL.",
    );
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  let anonymous = false;
  if (key.split(".").length === 3) {
    try {
      anonymous =
        JSON.parse(Buffer.from(key.split(".")[1], "base64url")).role === "anon";
    } catch {}
  }
  if (!key.startsWith("sb_publishable_") && !anonymous)
    throw Error(
      "Only a publishable key or legacy anon key may be bundled. Never put a secret/service-role key in VITE_ variables.",
    );
}
