import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  resolve: {
    // Vite 8 resolves tsconfig `paths` natively, so the
    // `vite-tsconfig-paths` plugin is no longer needed.
    tsconfigPaths: true,
  },
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
  },
});
