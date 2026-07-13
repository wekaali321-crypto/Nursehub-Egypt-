import { logoMarkSVG, CREATOR_CREDIT, BRAND_NAME } from "./brand";

/**
 * Branded, RTL email templates. Every email uses the unified NurseHub Egypt
 * logo header and the subtle creator credit footer for full brand consistency.
 * These HTML strings can be sent via any provider (Supabase / Resend / SMTP).
 */
function shell(title: string, body: string): string {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <div style="max-width:560px;margin:0 auto;padding:24px">
      <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(2,132,199,.08)">
        <div style="background:linear-gradient(135deg,#0284c7,#14b8a6);padding:22px;text-align:center">
          <div style="display:inline-flex;align-items:center;gap:10px">
            ${logoMarkSVG(40)}
            <div style="text-align:left;line-height:1">
              <div style="font-weight:800;font-size:20px;color:#fff">NurseHub</div>
              <div style="font-weight:700;letter-spacing:.25em;font-size:10px;color:#e0f2fe">EGYPT</div>
            </div>
          </div>
        </div>
        <div style="padding:28px">
          <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
          ${body}
        </div>
        <div style="border-top:1px solid #e2e8f0;padding:14px;text-align:center;font-size:11px;color:#94a3b8">
          ${BRAND_NAME} &nbsp;·&nbsp; <span style="color:#64748b">${CREATOR_CREDIT}</span>
        </div>
      </div>
    </div>
  </body></html>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:linear-gradient(to left,#0ea5e9,#10b981);color:#fff;text-decoration:none;font-weight:700;padding:10px 24px;border-radius:9999px">${label}</a>`;

export const emailTemplates = {
  welcome: (name = "عزيزي المتعلم") =>
    shell("مرحباً بك في NurseHub Egypt 👋", `
      <p style="line-height:1.9">${name}، سعداء بانضمامك إلى منصتنا لتعليم التمريض. استكشف المقالات والملخصات والأدوية والاختبارات والأدوات الطبية.</p>
      <p style="text-align:center;margin-top:18px">${btn("https://nursehub.eg", "ابدأ التعلّم")}</p>`),
  newsletter: (title: string, excerpt: string, url = "#") =>
    shell("جديد على المنصة 📰", `
      <h2 style="font-size:17px;margin:0 0 6px">${title}</h2>
      <p style="line-height:1.9;color:#475569">${excerpt}</p>
      <p style="text-align:center;margin-top:18px">${btn(url, "اقرأ المقال")}</p>`),
  resetPassword: (url = "#") =>
    shell("إعادة تعيين كلمة المرور 🔐", `
      <p style="line-height:1.9">تلقّينا طلباً لإعادة تعيين كلمة مرورك. إن لم تطلب ذلك تجاهل هذه الرسالة.</p>
      <p style="text-align:center;margin-top:18px">${btn(url, "إعادة تعيين كلمة المرور")}</p>
      <p style="font-size:12px;color:#94a3b8">الرابط صالح لمدة 60 دقيقة.</p>`),
  purchase: (product: string) =>
    shell("تم تأكيد طلبك ✅", `
      <p style="line-height:1.9">شكراً لك! تم تأكيد حصولك على: <b>${product}</b>. يمكنك الوصول إليه من حسابك.</p>`),
};

export type EmailTemplateKey = keyof typeof emailTemplates;
