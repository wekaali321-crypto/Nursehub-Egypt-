import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { isSupabaseConfigured, verifySupabaseConnection, getSupabaseStatus } from "./lib/supabase";

/**
 * Application bootstrap
 *
 * 1. Verify Supabase connection on startup
 * 2. Show clear error if configuration is missing
 * 3. Mount the React application
 * 4. Register service worker for PWA
 */

async function bootstrap() {
  // Check configuration
  const status = getSupabaseStatus();

  if (!isSupabaseConfigured()) {
    // Show clear configuration error on the page
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0c4a6e,#0f172a);padding:2rem;font-family:'Cairo','Segoe UI',sans-serif">
        <div style="max-width:520px;background:rgba(255,255,255,0.06);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:2.5rem;color:white;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
          <div style="width:72px;height:72px;margin:0 auto 1rem;background:linear-gradient(135deg,#ef4444,#f97316);border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:0 10px 30px rgba(239,68,68,0.4)">⚠️</div>
          <h1 style="margin:0 0 0.75rem;font-size:24px;font-weight:800">إعداد غير مكتمل</h1>
          <p style="margin:0 0 1.5rem;color:#94a3b8;line-height:1.6;font-size:14px">
            NurseHub Egypt غير متصل بقاعدة البيانات.<br/>
            يرجى إضافة متغيرات البيئة التالية في ملف <code style="background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:4px;font-size:12px">.env</code>:
          </p>
          <div style="background:rgba(0,0,0,0.4);border-radius:12px;padding:1rem;text-align:left;font-family:'Courier New',monospace;font-size:12px;line-height:1.8;margin-bottom:1rem">
            <div><span style="color:#60a5fa">SUPABASE_URL</span><span style="color:#94a3b8">=</span><span style="color:#86efac">https://xxx.supabase.co</span></div>
            <div><span style="color:#60a5fa">SUPABASE_PUBLISHABLE_KEY</span><span style="color:#94a3b8">=</span><span style="color:#86efac">sb_publishable_...</span></div>
          </div>
          <div style="font-size:11px;color:#64748b;line-height:1.6">
            <b>Details:</b> ${status.error || "Configuration incomplete"}
          </div>
        </div>
      </div>
    `;
    console.error(
      "%c[Supabase] ✗ Configuration Missing%c\n" +
      "NurseHub Egypt cannot start without Supabase credentials.\n" +
      "Please configure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env",
      "color:#ef4444;font-weight:bold;font-size:14px",
      "color:#94a3b8;font-size:11px"
    );
    return;
  }

  // Verify connection
  console.info("%c[NurseHub] Starting application...", "color:#0ea5e9;font-weight:bold");
  const connected = await verifySupabaseConnection();

  if (!connected) {
    console.warn(
      "%c[Supabase] ⚠ Connection could not be verified%c\n" +
      "The application will continue, but some features may not work.\n" +
      "Check your Supabase project status and network connection.",
      "color:#f59e0b;font-weight:bold;font-size:13px",
      "color:#94a3b8;font-size:11px"
    );
  }

  // Mount React app
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    document.body.innerHTML = `
      <div style="color:#ef4444;padding:2rem;text-align:center;font-family:'Cairo',sans-serif">
        <h1>Root element #root not found</h1>
        <p>Check index.html</p>
      </div>
    `;
    return;
  }

  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Register service worker (PWA)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").then(
        (registration) => {
          console.info("[PWA] ✓ Service worker registered:", registration.scope);
        },
        (err) => {
          console.warn("[PWA] ⚠ Service worker registration failed:", err);
        }
      );
    });
  }
}

// Global error handlers for production debugging
window.addEventListener("error", (e) => {
  console.error("[NurseHub Error]", e.message, e.filename, e.lineno);
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("[NurseHub Promise Error]", e.reason);
});

// Start the application
bootstrap();
