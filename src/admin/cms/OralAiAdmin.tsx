import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../components/Toast";
import { getAiStatus, type AiStatus } from "../../lib/oral/api";
import { getTarekStatus, type TarekEndpoint, type TarekStatus } from "../../lib/tarekAudio";
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
    <>
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
    <TarekVoiceAdmin endpoint="/api/tts" settingsKey="oral_tts" title="🗣️ صوت الامتحان الشفوي — Tarek (ElevenLabs)"
      note="كل جمل الممتحن (علي أو دنيا) بصوت Tarek. لو الحد خلص أو الخدمة وقفت، الامتحان بيكمل مكتوب من غير صوت ومع تنبيه للزائر." />
    <TarekVoiceAdmin endpoint="/api/ali-reader" settingsKey="site_reader" title="🎧 قارئ الموقع «استمع للمحتوى» — Tarek"
      note="رصيد منفصل تمامًا عن الامتحان الشفوي: قراءة الصفحات عمرها ما تاكل من رصيد الامتحان." />
    </>
  );
}

/**
 * One Tarek (ElevenLabs) quota: this month's characters (live), on/off and a monthly cap — nh_settings[settingsKey] = { enabled, monthlyLimit }.
 * The cap here can only LOWER the one set in Cloudflare (ELEVENLABS_TTS_MONTHLY_CHARS / SITE_READER_MONTHLY_CHARS).
 */
function TarekVoiceAdmin({ endpoint, settingsKey, title, note }: { endpoint: TarekEndpoint; settingsKey: "oral_tts" | "site_reader"; title: string; note: string }) {
  const { notify } = useToast();
  const [s, setS] = useState<TarekStatus | null | undefined>(undefined);
  const [cfg, setCfg] = useState<{ enabled: boolean; monthlyLimit: number }>({ enabled: true, monthlyLimit: 0 });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = async () => { const x = await getTarekStatus(endpoint); if (alive) setS(x); };
    load();
    const t = window.setInterval(load, 60000);
    supabase?.from("nh_settings").select("value").eq("key", settingsKey).maybeSingle().then(({ data }) => {
      const v = (data?.value ?? null) as { enabled?: boolean; monthlyLimit?: number } | null;
      if (alive && v) setCfg({ enabled: v.enabled !== false, monthlyLimit: Number(v.monthlyLimit) || 0 });
    });
    return () => { alive = false; clearInterval(t); };
  }, [endpoint, settingsKey]);
  const save = async (next: { enabled: boolean; monthlyLimit: number }) => {
    setCfg(next); setSaving(true);
    // keep any other fields already stored under this key
    const { data } = (await supabase?.from("nh_settings").select("value").eq("key", settingsKey).maybeSingle()) ?? { data: null };
    const prev = (data?.value ?? {}) as Record<string, unknown>;
    const value: Record<string, unknown> = { ...prev, enabled: next.enabled };
    if (next.monthlyLimit > 0) value.monthlyLimit = next.monthlyLimit; else delete value.monthlyLimit;
    const { error } = (await supabase?.from("nh_settings").upsert({ key: settingsKey, value })) ?? { error: null };
    setSaving(false);
    notify(error ? "تعذّر الحفظ" : "تم الحفظ", error ? "error" : "success");
  };
  const pct = s?.pct ?? 0;
  const bar = !s ? "bg-slate-300" : !s.tts ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <section className={`${cardCls} mt-4 p-5`} aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-800 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{note} الجمل المتكررة بتتخزن على Cloudflare ومش بتتحسب تاني.</p>
        </div>
        <Toggle checked={cfg.enabled} disabled={saving} onChange={(v) => save({ ...cfg, enabled: v })} label={cfg.enabled ? "شغّال" : "متوقف"} />
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
          <span>الشهر {s?.month ?? ""}</span>
          <span>{s ? `${s.used.toLocaleString("en")} / ${s.limit.toLocaleString("en")} حرف (${pct}%) — ${s.calls} طلب` : s === null ? "مش متاح" : "…"}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} /></div>
        {s && !s.configured && <p className="mt-2 text-xs font-bold text-rose-600">مفتاح ElevenLabs مش متضاف: ضيف ELEVENLABS_API_KEY (Secret) في إعدادات Cloudflare Pages — الخطوات في DEPLOY-CLOUDFLARE.md.</p>}
      </div>
      <label className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        حد شهري أقل (اختياري، حرف):
        <input type="number" min={0} step={1000} value={cfg.monthlyLimit || ""} placeholder={s ? String(s.limit) : ""} onChange={(e) => setCfg({ ...cfg, monthlyLimit: Number(e.target.value) })}
          className="w-32 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" />
        <button type="button" disabled={saving} onClick={() => save({ ...cfg, monthlyLimit: Math.max(0, Math.round(cfg.monthlyLimit || 0)) })} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-50">حفظ الحد</button>
        <span className="text-xs text-slate-500">فاضي = حد Cloudflare.</span>
      </label>
    </section>
  );
}
