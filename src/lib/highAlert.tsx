// شير واحد للتصنيف الثلاثي حسب IPSG — يُستخدم في drugs و icu_medications معًا

export type HighAlertType = "general" | "concentrated_electrolyte" | "lasa";

export const HIGH_ALERT_LABELS: Record<HighAlertType, string> = {
  general: "⚠ عالي الخطورة",
  concentrated_electrolyte: "☢ شوارد مركّزة",
  lasa: "🔤 اسم متشابه (LASA)",
};

// ألوان تنبيه أمان حقيقية (مسموحة بالاستثناء عن الباليتة الزخرفية المعتادة)
export const HIGH_ALERT_COLORS: Record<HighAlertType, string> = {
  general: "bg-red-50 text-red-700 border border-red-200",
  concentrated_electrolyte: "bg-orange-50 text-orange-800 border border-orange-200",
  lasa: "bg-purple-50 text-purple-700 border border-purple-200",
};

export function parseHighAlertTypes(raw: unknown): HighAlertType[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as HighAlertType[];
  try {
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function HighAlertBadges({ types }: { types: unknown }) {
  const list = parseHighAlertTypes(types);
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((t) => (
        <span key={t} className={`text-xs rounded-full px-2.5 py-1 font-semibold ${HIGH_ALERT_COLORS[t]}`}>
          {HIGH_ALERT_LABELS[t]}
        </span>
      ))}
    </div>
  );
}
