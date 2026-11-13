import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

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
  plugins: [react(), tailwindcss(), rootRelativePublicLinks()],
  base: "/",
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Stable vendor chunks: cached across deploys and only downloaded by the pages that need them.
        manualChunks(id: string) {
          const m = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(id);
          if (!m) return undefined;
          const pkg = m[1];
          if (/^(react|react-dom|scheduler|react-router|react-router-dom|@remix-run\/router)$/.test(pkg)) return "vendor-react";
          if (pkg.startsWith("@supabase/")) return "vendor-supabase";
          // admin-only rich-text editor and .docx/.pdf import tooling: grouped so they load as one request, only in the admin
          if (pkg.startsWith("@tiptap/") || pkg.startsWith("prosemirror-") || /^(orderedmap|rope-sequence|w3c-keyname|linkifyjs|tippy\.js)$/.test(pkg)) return "vendor-editor";
          if (/^(mammoth|jszip|bluebird|@xmldom\/xmldom|xmlbuilder|underscore|dingbat-to-unicode|lop|option|path-is-absolute|pako|lie|immediate|readable-stream|setimmediate|core-util-is|inherits|isarray|safe-buffer|string_decoder|process-nextick-args|util-deprecate)$/.test(pkg)) return "vendor-docs";
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
