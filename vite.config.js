import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { checkEnvironment } from "./scripts/check-env.mjs";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const demo = mode === "demo";
  if (
    env.VITE_SUPABASE_URL ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (command === "build" && !demo)
  )
    checkEnvironment(env);
  return {
    plugins: [react()],
    define: {
      __DEMO__: JSON.stringify(
        demo || (command === "serve" && !env.VITE_SUPABASE_URL),
      ),
    },
  };
});
