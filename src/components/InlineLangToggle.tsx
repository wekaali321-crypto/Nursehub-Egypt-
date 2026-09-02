import { useI18n } from "../lib/i18n";

export default function InlineLangToggle({ light = false }: { light?: boolean }) {
  const { lang, setLang } = useI18n();
  const base =
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition print:hidden";
  const cls = light
    ? `${base} bg-white/20 text-white hover:bg-white/30`
    : `${base} border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300`;
  return (
    <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className={cls}>
      🌍 {lang === "ar" ? "EN" : "عربي"}
    </button>
  );
}
