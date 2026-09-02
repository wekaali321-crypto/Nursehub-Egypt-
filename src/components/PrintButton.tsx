export default function PrintButton({ label = "طباعة" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-bold text-slate-600 transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-700"
    >
      🖨️ {label}
    </button>
  );
}
