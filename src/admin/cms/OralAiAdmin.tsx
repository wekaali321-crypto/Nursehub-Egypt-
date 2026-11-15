import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../components/Toast";
import { getAiStatus, type AiStatus } from "../../lib/oral/api";
import { cardCls, Toggle } from "./ui";

/**
 * Admin: the smart oral exam (Workers AI) — live use of today's free budget, on/off switch and a daily cap.
 * Setting: nh_settings key 'oral_ai' = { enabled, dailyLimit }. Reads /api/oral every 15 s only while this page is open.
 * When the cap is reached the site switches to the free oral exam by itself until 00:00 UTC (02:00 Cairo).
 */
export default function OralAiAdmin() {
  const { notify } = useToast();
  const [s, setS] = useState<AiStatus | null | undefined>(undefined);
  const [cfg, setCfg] = useState<{ enabled: boolean; dailyLimit: number }>({ enabled: true, dailyLimit: 9000 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => { const x = await getAiStatus(); if (alive) setS(x); };
    load();
    const t = window.setInterval(load, 15000);
    supabase?.from("nh_settings").select("value").eq("key", "oral_ai").maybeSingle().then(({ data }) => {
      const v = (data?.value ?? null) as { enabled?: boolean; dailyLimit?: number } | null;
      if (alive && v) setCfg({ enabled: v.enabled !== false, dailyLimit: Number(v.dailyLimit) || 9000 });
    });
    return () => { alive = false; clearInterval(t); };
  }, []);

  const save = async (next: { enabled: boolean; dailyLimit: number }) => {
    setCfg(next); setSaving(true);
    const { error } = (await supabase?.from("nh_settings").upsert({ key: "oral_ai", value: next })) ?? { error: null };
    setSaving(false);
    notify(error ? "تعذّر الحفظ" : "تم الحفظ", error ? "error" : "success");
    setS(await getAiStatus());
  };

  const pct = s?.pct ?? 0;
  const bar = !s ? "bg-slate-300" : !s.ai ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <section className={`${cardCls} mt-6 p-5`} aria-labelledby="oral-ai-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="oral-ai-title" className="font-black text-slate-800 dark:text-white">🎙️ الامتحان الشفوي الذكي (Cloudflare Workers AI)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">الرصيد المجاني 10,000 Neuron في اليوم، وبيتجدد 00:00 UTC (‏2 الفجر بتوقيت القاهرة). لما الحد يخلص، الموقع بيحوّل لعلي المجاني لوحده.</p>
        </div>
        <Toggle checked={cfg.enabled} disabled={saving} onChange={(v) => save({ ...cfg, enabled: v })} label={cfg.enabled ? "شغّال" : "متوقف"} />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${s?.ai ? "animate-pulse bg-emerald-500" : "bg-rose-500"}`} />مباشر — بيتحدث كل 15 ثانية</span>
          <span>{s ? `${s.used.toLocaleString("en")} / ${s.limit.toLocaleString("en")} Neuron (${pct}%)` : s === null ? "مش متاح (الـ Function مش شغالة هنا)" : "…"}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} /></div>
        {s && (
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><div className="text-lg font-black text-slate-800 dark:text-white">{s.calls}</div>طلب AI النهارده</div>
            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><div className="text-lg font-black text-slate-800 dark:text-white">{Math.max(0, s.limit - s.used).toLocaleString("en")}</div>Neuron باقية</div>
            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800"><div className="text-lg font-black text-slate-800 dark:text-white">{s.ai ? "ذكي" : "مجاني"}</div>الوضع الحالي للزوار</div>
          </div>
        )}
        {s && !s.enabled && cfg.enabled && <p className="mt-2 text-xs font-bold text-rose-600">ربط Workers AI (اسمه AI) مش موجود في إعدادات Cloudflare Pages — شوف الخطوات في DEPLOY-CLOUDFLARE.md.</p>}
      </div>

      <label className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        الحد اليومي (Neuron):
        <input type="number" min={500} max={10000} step={500} value={cfg.dailyLimit} onChange={(e) => setCfg({ ...cfg, dailyLimit: Number(e.target.value) })}
          className="w-28 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" />
        <button type="button" disabled={saving} onClick={() => save({ ...cfg, dailyLimit: Math.min(10000, Math.max(500, cfg.dailyLimit || 9000)) })} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-50">حفظ الحد</button>
        <span className="text-xs text-slate-500">سيب 9000 عشان يفضل هامش أمان تحت الـ 10,000 المجانية.</span>
      </label>
    </section>
  );
}
