/**
 * Brand assets for generated materials (certificates, PDF exports, email
 * templates, educational posters). Keeps the NurseHub Egypt identity consistent
 * everywhere and always appends the subtle creator credit.
 */

export const CREATOR_CREDIT = "Created by RN. Ali Ashour";
export const DEV_CREDIT = "Designed & Developed by RN. Ali Ashour";
export const BRAND_NAME = "NurseHub Egypt";

/** Inline SVG logo mark string (usable in HTML/PDF/email). */
export function logoMarkSVG(size = 44): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">
  <defs><linearGradient id="nhg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0284c7"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs>
  <rect width="48" height="48" rx="11" fill="url(#nhg)"/>
  <path d="M24 41c-1 0-1.9-.5-2.5-1.2C17 34.4 9 30 9 21.5 9 16.8 12.6 13 17.2 13c2.9 0 5.4 1.5 6.8 3.8C25.4 14.5 27.9 13 30.8 13 35.4 13 39 16.8 39 21.5c0 .9-.1 1.7-.3 2.5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="rgba(255,255,255,0.14)"/>
  <path d="M14 12v6a6 6 0 0 0 12 0v-4" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="14" cy="10.5" r="2" fill="#fff"/><circle cx="26" cy="10.5" r="2" fill="#fff"/>
  <circle cx="35.5" cy="27.5" r="4.2" fill="#fff"/><circle cx="35.5" cy="27.5" r="1.7" fill="#0284c7"/>
  <path d="M24 22.5v5M21.5 25h5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;
}

/** Full brand lockup as HTML (icon + wordmark + Egypt). */
export function brandLockupHTML(size = 44): string {
  return `<div style="display:flex;align-items:center;gap:10px;justify-content:center">
    ${logoMarkSVG(size)}
    <div style="line-height:1;text-align:left">
      <div style="font-weight:800;font-size:${Math.round(size * 0.5)}px;color:#0f172a">Nurse<span style="color:#0ea5e9">Hub</span></div>
      <div style="font-weight:700;letter-spacing:.25em;font-size:${Math.round(size * 0.24)}px;color:#14b8a6">EGYPT</div>
    </div>
  </div>`;
}

/** Subtle, consistent creator credit line for generated materials. */
export function creditFooterHTML(): string {
  return `<div style="margin-top:14px;padding-top:10px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif">
    ${BRAND_NAME} &nbsp;·&nbsp; <span style="color:#64748b">${CREATOR_CREDIT}</span>
  </div>`;
}

/**
 * Open a print-ready branded document in a new window (for PDF export / print).
 * Always includes the logo header and creator credit footer.
 */
export function printBrandedDocument(title: string, bodyHTML: string) {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
    <title>${title}</title>
    <style>
      body{font-family:'Cairo',Arial,sans-serif;color:#0f172a;margin:0;padding:32px;background:#fff}
      .nh-header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:14px;margin-bottom:20px}
      .nh-title{font-size:22px;font-weight:800}
      table{width:100%;border-collapse:collapse;margin:12px 0}
      th,td{border:1px solid #cbd5e1;padding:8px;text-align:right}
      th{background:#f1f5f9}
      img{max-width:100%}
      @media print{ .no-print{display:none} }
    </style></head><body>
    <div class="nh-header">${brandLockupHTML(40)}<div class="nh-title">${title}</div></div>
    ${bodyHTML}
    ${creditFooterHTML()}
    <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
  </body></html>`);
  w.document.close();
}
