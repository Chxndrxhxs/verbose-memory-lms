import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@masterlms/shared": fileURLToPath(new URL("../packages/shared/src/index.ts", import.meta.url)),
    },
  },
});
