import { useState } from "react";
import { emailTemplates, type EmailTemplateKey } from "../lib/email";
import { useToast } from "../components/Toast";

const OPTIONS: { key: EmailTemplateKey; label: string; render: () => string }[] = [
  { key: "welcome", label: "رسالة ترحيب", render: () => emailTemplates.welcome("عزيزي المتعلم") },
  { key: "newsletter", label: "نشرة بريدية", render: () => emailTemplates.newsletter("أساسيات العناية بالجروح", "دليل شامل لمبادئ العناية بالجروح وخطوات التعقيم الصحيحة.") },
  { key: "resetPassword", label: "استعادة كلمة المرور", render: () => emailTemplates.resetPassword("#") },
  { key: "purchase", label: "تأكيد شراء", render: () => emailTemplates.purchase("حزمة ملخصات التمريض") },
];

export function EmailTemplatesAdmin() {
  const { notify } = useToast();
  const [sel, setSel] = useState<EmailTemplateKey>("welcome");
  const current = OPTIONS.find((o) => o.key === sel)!;
  const html = current.render();

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-600 dark:bg-sky-500/10">
        قوالب البريد موحّدة بهوية NurseHub Egypt (نفس الشعار والألوان) مع اعتماد المصمّم في التذييل. يمكن إرسالها عبر أي مزوّد (Supabase / Resend / SMTP).
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button key={o.key} onClick={() => setSel(o.key)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${sel === o.key ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{o.label}</button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold dark:text-white">المعاينة</h3>
            <button onClick={() => { navigator.clipboard?.writeText(html); notify("تم نسخ كود HTML"); }} className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-500/10">نسخ HTML</button>
          </div>
          <iframe title="email-preview" srcDoc={html} className="h-[520px] w-full rounded-lg border border-slate-200 dark:border-slate-700" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 font-bold dark:text-white">كود HTML</h3>
          <textarea readOnly value={html} className="h-[520px] w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] dark:border-slate-700 dark:bg-slate-800" dir="ltr" />
        </div>
      </div>
    </div>
  );
}
