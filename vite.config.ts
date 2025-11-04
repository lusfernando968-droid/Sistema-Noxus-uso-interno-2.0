import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8082,
    hmr: {
      overlay: false,
    },
  },
  optimizeDeps: {
    include: ["sonner", "class-variance-authority"],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Point to existing CJS builds; Vite will pre-bundle to ESM
      sonner: path.resolve(__dirname, "./node_modules/sonner/dist/index.js"),
      "class-variance-authority": path.resolve(
        __dirname,
        "./node_modules/class-variance-authority/dist/index.js",
      ),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
}));
