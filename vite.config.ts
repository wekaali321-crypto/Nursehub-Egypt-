import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The build uses a relative base ("./"), which turns public-file links in index.html into
// "./manifest.webmanifest" etc. Those break on nested routes (/courses/acls/... would request
// /courses/acls/manifest.webmanifest and get the SPA page back), so the manifest, favicon and
// touch icons must point at the site root.
const rootRelativePublicLinks = (): Plugin => ({
  name: "root-relative-public-links",
  enforce: "post",
  transformIndexHtml(html) {
    return html.replace(/(<link\b[^>]*\bhref=")\.\/(manifest\.webmanifest|favicon\.png|apple-touch-icon\.png|icon-[^"]+)"/g, '$1/$2"');
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), rootRelativePublicLinks()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
