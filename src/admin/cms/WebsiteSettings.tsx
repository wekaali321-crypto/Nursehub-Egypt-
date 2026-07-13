import { useState } from "react";
import { useStore } from "../../lib/store";
import { useToast } from "../../components/Toast";
import { PageHeader, cardCls, Field, inputCls, Btn, Toggle } from "./ui";
import type { SiteSettings } from "../../lib/types";

const TABS = [
  { id: "general", label: "عام", icon: "🏢" },
  { id: "branding", label: "الهوية", icon: "🎨" },
  { id: "hero", label: "الصفحة الرئيسية", icon: "🖼️" },
  { id: "contact", label: "التواصل", icon: "📞" },
  { id: "social", label: "التواصل الاجتماعي", icon: "🌐" },
  { id: "seo", label: "SEO والتحليلات", icon: "🔍" },
  { id: "maintenance", label: "وضع الصيانة", icon: "🛠️" },
];

export default function WebsiteSettings() {
  const { settings, setData } = useStore();
  const { notify } = useToast();
  const [tab, setTab] = useState("general");
  const [form, setForm] = useState<SiteSettings>(settings);

  const set = (k: keyof SiteSettings, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    setData((d) => ({ ...d, settings: form }));
    notify("تم حفظ الإعدادات بنجاح", "success");
  };

  return (
    <div>
      <PageHeader
        title="إعدادات الموقع"
        subtitle="تحكم كامل في الموقع دون الحاجة لأي برمجة"
        icon="⚙️"
        actions={<Btn variant="success" onClick={save}>💾 حفظ التغييرات</Btn>}
      />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === t.id ? "bg-gradient-to-l from-sky-500 to-blue-500 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300"}`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className={`${cardCls} p-6`}>
        {tab === "general" && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="اسم الموقع" required><input className={inputCls} value={form.siteName} onChange={(e) => set("siteName", e.target.value)} /></Field>
            <Field label="الشعار النصي (Tagline)"><input className={inputCls} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
            <Field label="وصف الموقع" hint="يظهر في محركات البحث"><textarea className={inputCls} rows={3} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} /></Field>
          </div>
        )}

        {tab === "branding" && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="رابط الشعار (Logo URL)" hint="اتركه فارغاً لاستخدام الشعار الافتراضي"><input className={inputCls} value={form.logoUrl || ""} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://..." /></Field>
            <div />
            <Field label="اللون الأساسي">
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor || "#0284c7"} onChange={(e) => set("primaryColor", e.target.value)} className="h-11 w-16 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700" />
                <input className={inputCls} value={form.primaryColor || "#0284c7"} onChange={(e) => set("primaryColor", e.target.value)} />
              </div>
            </Field>
            <Field label="اللون الثانوي">
              <div className="flex items-center gap-2">
                <input type="color" value={form.accentColor || "#14b8a6"} onChange={(e) => set("accentColor", e.target.value)} className="h-11 w-16 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700" />
                <input className={inputCls} value={form.accentColor || "#14b8a6"} onChange={(e) => set("accentColor", e.target.value)} />
              </div>
            </Field>
          </div>
        )}

        {tab === "hero" && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="عنوان الـ Hero"><input className={inputCls} value={form.heroTitle || ""} onChange={(e) => set("heroTitle", e.target.value)} placeholder="كل ما يحتاجه الممرض في مكان واحد" /></Field>
            <Field label="النص الفرعي للـ Hero"><input className={inputCls} value={form.heroSubtitle || ""} onChange={(e) => set("heroSubtitle", e.target.value)} /></Field>
            <Field label="صورة خلفية الـ Hero" hint="رابط صورة"><input className={inputCls} value={form.heroImage || ""} onChange={(e) => set("heroImage", e.target.value)} placeholder="https://..." /></Field>
          </div>
        )}

        {tab === "contact" && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="البريد الإلكتروني"><input className={inputCls} type="email" value={form.contactEmail || ""} onChange={(e) => set("contactEmail", e.target.value)} placeholder="info@nursehub.eg" /></Field>
            <Field label="رقم الهاتف"><input className={inputCls} value={form.contactPhone || ""} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+20 ..." /></Field>
            <Field label="العنوان"><input className={inputCls} value={form.contactAddress || ""} onChange={(e) => set("contactAddress", e.target.value)} placeholder="القاهرة، مصر" /></Field>
          </div>
        )}

        {tab === "social" && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Facebook"><input className={inputCls} value={form.facebook || ""} onChange={(e) => set("facebook", e.target.value)} placeholder="https://facebook.com/..." /></Field>
            <Field label="Twitter / X"><input className={inputCls} value={form.twitter || ""} onChange={(e) => set("twitter", e.target.value)} placeholder="https://x.com/..." /></Field>
            <Field label="Instagram"><input className={inputCls} value={form.instagram || ""} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/..." /></Field>
            <Field label="YouTube"><input className={inputCls} value={form.youtube || ""} onChange={(e) => set("youtube", e.target.value)} placeholder="https://youtube.com/..." /></Field>
            <Field label="Telegram"><input className={inputCls} value={form.telegram || ""} onChange={(e) => set("telegram", e.target.value)} placeholder="https://t.me/..." /></Field>
          </div>
        )}

        {tab === "seo" && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Google Analytics ID" hint="مثال: G-XXXXXXXXXX"><input className={inputCls} value={form.gaId || ""} onChange={(e) => set("gaId", e.target.value)} placeholder="G-..." /></Field>
            <Field label="صورة المشاركة (OG Image)"><input className={inputCls} value={form.ogImage || ""} onChange={(e) => set("ogImage", e.target.value)} placeholder="https://..." /></Field>
            <div className="md:col-span-2 space-y-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <Toggle checked={!!form.adsenseEnabled} onChange={(v) => set("adsenseEnabled", v)} label="تفعيل Google AdSense" description="عرض الإعلانات على الموقع" />
              {form.adsenseEnabled && (
                <Field label="AdSense Client ID"><input className={inputCls} value={form.adsenseClient || ""} onChange={(e) => set("adsenseClient", e.target.value)} placeholder="ca-pub-..." /></Field>
              )}
            </div>
          </div>
        )}

        {tab === "maintenance" && (
          <div className="space-y-5">
            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-500/10">
              <Toggle checked={!!form.maintenanceMode} onChange={(v) => set("maintenanceMode", v)} label="🛠️ وضع الصيانة" description="عند التفعيل، يرى الزوار صفحة صيانة بينما يستطيع المشرفون الدخول" />
            </div>
            {form.maintenanceMode && (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="رسالة الصيانة"><textarea className={inputCls} rows={3} value={form.maintenanceMessage || ""} onChange={(e) => set("maintenanceMessage", e.target.value)} placeholder="الموقع تحت الصيانة، سنعود قريباً" /></Field>
                <Field label="وقت العودة المتوقع"><input className={inputCls} type="datetime-local" value={form.maintenanceUntil || ""} onChange={(e) => set("maintenanceUntil", e.target.value)} /></Field>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Btn variant="success" onClick={save}>💾 حفظ جميع التغييرات</Btn>
      </div>
    </div>
  );
}
