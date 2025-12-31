// vite.config.ts
import { defineConfig } from "file:///C:/Users/Windows/Sistema-Noxus-uso-interno-2.0/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Windows/Sistema-Noxus-uso-interno-2.0/node_modules/@vitejs/plugin-react-swc/index.js";
import tailwindcss from "file:///C:/Users/Windows/Sistema-Noxus-uso-interno-2.0/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///C:/Users/Windows/Sistema-Noxus-uso-interno-2.0/node_modules/autoprefixer/lib/autoprefixer.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/Windows/Sistema-Noxus-uso-interno-2.0/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Windows\\Sistema-Noxus-uso-interno-2.0";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8082,
    hmr: {
      overlay: false
    }
  },
  optimizeDeps: {
    include: ["sonner", "class-variance-authority"]
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      // Point to existing CJS builds; Vite will pre-bundle to ESM
      sonner: path.resolve(__vite_injected_original_dirname, "./node_modules/sonner/dist/index.js"),
      "class-variance-authority": path.resolve(
        __vite_injected_original_dirname,
        "./node_modules/class-variance-authority/dist/index.js"
      )
    }
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxXaW5kb3dzXFxcXFNpc3RlbWEtTm94dXMtdXNvLWludGVybm8tMi4wXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxXaW5kb3dzXFxcXFNpc3RlbWEtTm94dXMtdXNvLWludGVybm8tMi4wXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9XaW5kb3dzL1Npc3RlbWEtTm94dXMtdXNvLWludGVybm8tMi4wL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJ0YWlsd2luZGNzc1wiO1xyXG5pbXBvcnQgYXV0b3ByZWZpeGVyIGZyb20gXCJhdXRvcHJlZml4ZXJcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MixcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiBmYWxzZSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcInNvbm5lclwiLCBcImNsYXNzLXZhcmlhbmNlLWF1dGhvcml0eVwiXSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgIC8vIFBvaW50IHRvIGV4aXN0aW5nIENKUyBidWlsZHM7IFZpdGUgd2lsbCBwcmUtYnVuZGxlIHRvIEVTTVxyXG4gICAgICBzb25uZXI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9ub2RlX21vZHVsZXMvc29ubmVyL2Rpc3QvaW5kZXguanNcIiksXHJcbiAgICAgIFwiY2xhc3MtdmFyaWFuY2UtYXV0aG9yaXR5XCI6IHBhdGgucmVzb2x2ZShcclxuICAgICAgICBfX2Rpcm5hbWUsXHJcbiAgICAgICAgXCIuL25vZGVfbW9kdWxlcy9jbGFzcy12YXJpYW5jZS1hdXRob3JpdHkvZGlzdC9pbmRleC5qc1wiLFxyXG4gICAgICApLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGNzczoge1xyXG4gICAgcG9zdGNzczoge1xyXG4gICAgICBwbHVnaW5zOiBbdGFpbHdpbmRjc3MoKSwgYXV0b3ByZWZpeGVyKCldLFxyXG4gICAgfSxcclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb1UsU0FBUyxvQkFBb0I7QUFDalcsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sa0JBQWtCO0FBQ3pCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUxoQyxJQUFNLG1DQUFtQztBQVF6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLFVBQVUsMEJBQTBCO0FBQUEsRUFDaEQ7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQWlCLGdCQUFnQjtBQUFBLEVBQzVDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBO0FBQUEsTUFFcEMsUUFBUSxLQUFLLFFBQVEsa0NBQVcscUNBQXFDO0FBQUEsTUFDckUsNEJBQTRCLEtBQUs7QUFBQSxRQUMvQjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLEtBQUs7QUFBQSxJQUNILFNBQVM7QUFBQSxNQUNQLFNBQVMsQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO0FBQUEsSUFDekM7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
