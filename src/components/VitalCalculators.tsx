// src/components/VitalCalculators.tsx
import { useMemo, useState } from "react";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </label>
  );
}

function CalcCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h4 className="mb-3 font-bold dark:text-white">{title}</h4>
      {children}
    </div>
  );
}

function ResultBadge({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "danger" | "ok" }) {
  const tones: Record<string, string> = {
    info: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
    warn: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  };
  return <div className={`mt-3 rounded-lg p-3 text-sm font-bold ${tones[tone]}`}>{children}</div>;
}

export default function VitalCalculators() {
  // ---- MAP ----
  const [sbp, setSbp] = useState("");
  const [dbp, setDbp] = useState("");
  const map = useMemo(() => {
    const s = parseFloat(sbp);
    const d = parseFloat(dbp);
    if (isNaN(s) || isNaN(d)) return null;
    return (s + 2 * d) / 3;
  }, [sbp, dbp]);

  // ---- Shock Index ----
  const [hr, setHr] = useState("");
  const [sbp2, setSbp2] = useState("");
  const shockIndex = useMemo(() => {
    const h = parseFloat(hr);
    const s = parseFloat(sbp2);
    if (isNaN(h) || isNaN(s) || s === 0) return null;
    return h / s;
  }, [hr, sbp2]);

  // ---- Pulse Pressure ----
  const [sbp3, setSbp3] = useState("");
  const [dbp3, setDbp3] = useState("");
  const pulsePressure = useMemo(() => {
    const s = parseFloat(sbp3);
    const d = parseFloat(dbp3);
    if (isNaN(s) || isNaN(d)) return null;
    return s - d;
  }, [sbp3, dbp3]);

  return (
    <div dir="rtl" className="my-8 not-prose grid gap-4 sm:grid-cols-2">
      <CalcCard title="🧮 حاسبة MAP (متوسط الضغط الشرياني)">
        <div className="grid grid-cols-2 gap-2">
          <Field label="SBP (mmHg)" value={sbp} onChange={setSbp} placeholder="120" />
          <Field label="DBP (mmHg)" value={dbp} onChange={setDbp} placeholder="80" />
        </div>
        {map !== null && (
          <ResultBadge tone={map >= 65 ? "ok" : "danger"}>
            MAP = {map.toFixed(1)} mmHg — الهدف في Shock: ≥ 65 mmHg
          </ResultBadge>
        )}
      </CalcCard>

      <CalcCard title="🧮 حاسبة Shock Index">
        <div className="grid grid-cols-2 gap-2">
          <Field label="HR (bpm)" value={hr} onChange={setHr} placeholder="90" />
          <Field label="SBP (mmHg)" value={sbp2} onChange={setSbp2} placeholder="120" />
        </div>
        {shockIndex !== null && (
          <ResultBadge tone={shockIndex > 1 ? "danger" : shockIndex >= 0.7 ? "warn" : "ok"}>
            Shock Index = {shockIndex.toFixed(2)} —{" "}
            {shockIndex > 1 ? "صدمة محتملة" : shockIndex >= 0.7 ? "تحذير" : "طبيعي"}
          </ResultBadge>
        )}
      </CalcCard>

      <CalcCard title="🧮 حاسبة Pulse Pressure">
        <div className="grid grid-cols-2 gap-2">
          <Field label="SBP (mmHg)" value={sbp3} onChange={setSbp3} placeholder="120" />
          <Field label="DBP (mmHg)" value={dbp3} onChange={setDbp3} placeholder="80" />
        </div>
        {pulsePressure !== null && (
          <ResultBadge tone="info">Pulse Pressure = {pulsePressure.toFixed(0)} mmHg (الطبيعي ≈ 40)</ResultBadge>
        )}
      </CalcCard>

      <CalcCard title="ℹ️ ملاحظة">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          هذه الحاسبات أدوات مساعدة فقط ولا تُغني عن التقييم السريري الكامل والتقيّد ببروتوكولات مؤسستك.
        </p>
      </CalcCard>
    </div>
  );
}
