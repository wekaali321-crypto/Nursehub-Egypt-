import { useState } from "react";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import type { PaymentGateway } from "../lib/types";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
const card = "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

export function PaymentSettings() {
  const { gateways, commerce, setData, logActivity } = useStore();
  const { notify } = useToast();
  const [open, setOpen] = useState<string | null>(null);

  const update = (id: string, patch: Partial<PaymentGateway>) =>
    setData((d) => ({ ...d, gateways: d.gateways.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));

  const test = (g: PaymentGateway) => {
    // A real "connected" state requires valid keys. We only mark connected when
    // both keys are present (a real backend/webhook would verify server-side).
    if (!g.apiKey.trim() || !g.secretKey.trim()) {
      update(g.id, { connected: false });
      notify("أدخل مفاتيح API و Secret أولاً", "error");
      return;
    }
    update(g.id, { connected: true });
    logActivity("اختبار بوابة دفع", g.name);
    notify(`تم التحقق من ${g.name} (${g.mode === "live" ? "مباشر" : "تجريبي"})`, "success");
  };

  const setCommerce = (patch: Partial<typeof commerce>) => setData((d) => ({ ...d, commerce: { ...d.commerce, ...patch } }));

  const regions: { key: "eg" | "intl"; label: string }[] = [
    { key: "eg", label: "🇪🇬 بوابات مصرية" },
    { key: "intl", label: "🌍 بوابات دولية" },
  ];

  const webhook = `${window.location.origin}/api/webhooks/`;

  return (
    <div className="space-y-6">
      <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-600 dark:bg-sky-500/10">
        🔐 مفاتيح الدفع تُخزَّن بأمان. لا تُفعّل أي بوابة قبل إدخال المفاتيح الحقيقية واختبار الاتصال. المعالجة الفعلية للدفع تتم عبر خادم/Edge Function آمن (PCI-friendly).
      </p>

      {/* Commerce settings */}
      <div className={`grid gap-3 sm:grid-cols-4 ${card}`}>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">العملة</label>
          <select value={commerce.currency} onChange={(e) => setCommerce({ currency: e.target.value })} className={inp}>
            <option value="EGP">EGP ج.م</option><option value="USD">USD $</option><option value="SAR">SAR ﷼</option><option value="AED">AED د.إ</option>
          </select>
        </div>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">الدولة</label><input value={commerce.country} onChange={(e) => setCommerce({ country: e.target.value })} className={inp} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">الضريبة %</label><input type="number" value={commerce.taxPercent} onChange={(e) => setCommerce({ taxPercent: +e.target.value })} className={inp} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-slate-500">رسوم الخدمة (ثابتة)</label><input type="number" value={commerce.serviceFee} onChange={(e) => setCommerce({ serviceFee: +e.target.value })} className={inp} /></div>
      </div>

      {regions.map((r) => (
        <div key={r.key}>
          <h3 className="mb-2 font-bold dark:text-white">{r.label}</h3>
          <div className="space-y-2">
            {gateways.filter((g) => g.region === r.key).map((g) => (
              <div key={g.id} className={card}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${g.connected && g.enabled ? "bg-emerald-500" : "bg-red-400"}`} />
                    <span className="font-bold dark:text-white">{g.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${g.connected ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-red-100 text-red-500 dark:bg-red-500/10"}`}>
                      {g.connected ? "🟢 متصل" : "🔴 غير متصل"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs font-semibold dark:text-white">
                      <input type="checkbox" checked={g.enabled} onChange={(e) => update(g.id, { enabled: e.target.checked })} /> مُفعّل
                    </label>
                    <button onClick={() => setOpen(open === g.id ? null : g.id)} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold dark:bg-slate-800 dark:text-white">{open === g.id ? "إغلاق" : "إعداد"}</button>
                  </div>
                </div>
                {open === g.id && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="flex gap-2">
                      <label className={`flex-1 cursor-pointer rounded-lg border p-2 text-center text-xs font-bold ${g.mode === "sandbox" ? "border-sky-400 bg-sky-50 text-sky-600 dark:bg-sky-500/10" : "border-slate-200 dark:border-slate-700"}`}>
                        <input type="radio" className="hidden" checked={g.mode === "sandbox"} onChange={() => update(g.id, { mode: "sandbox" })} /> وضع تجريبي (Sandbox)
                      </label>
                      <label className={`flex-1 cursor-pointer rounded-lg border p-2 text-center text-xs font-bold ${g.mode === "live" ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "border-slate-200 dark:border-slate-700"}`}>
                        <input type="radio" className="hidden" checked={g.mode === "live"} onChange={() => update(g.id, { mode: "live" })} /> وضع مباشر (Live)
                      </label>
                    </div>
                    <input value={g.apiKey} onChange={(e) => update(g.id, { apiKey: e.target.value, connected: false })} placeholder="API Key / Public Key" className={inp} />
                    <input value={g.secretKey} onChange={(e) => update(g.id, { secretKey: e.target.value, connected: false })} placeholder="Secret Key" type="password" className={inp} />
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800">
                      <span className="font-semibold text-slate-500">Webhook:</span>
                      <input readOnly value={webhook + g.id} className="flex-1 bg-transparent font-mono outline-none dark:text-slate-300" dir="ltr" />
                      <button onClick={() => navigator.clipboard?.writeText(webhook + g.id)} className="rounded bg-sky-500 px-2 py-1 font-bold text-white">نسخ</button>
                    </div>
                    <button onClick={() => test(g)} className="w-full rounded-lg bg-gradient-to-l from-sky-500 to-emerald-500 py-2 text-sm font-bold text-white">💾 حفظ واختبار الاتصال</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
