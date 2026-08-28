import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";

function Tile({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-bold text-slate-800 dark:text-white">{label}</span>
    </Link>
  );
}

export default function NursingGuidePage() {
  const { settings } = useStore();

  useSEO({
    title: `دليل التمريض | ${settings.siteName}`,
    description: "كل أدوات ومراجع الأدوية في مكان واحد: أصناف، لاحقات، ترياقات، تفاعلات، أدوية القلب، ومذكرات فارماكولوجي.",
    keywords: "nursing guide, دليل تمريض, أدوية",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "الأدوية", path: "/drugs" }, { label: "دليل التمريض" }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">دليل التمريض</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">نصائح ومراجع احترافية — كل أدوات الأدوية في مكان واحد</p>
      </div>

      <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">🔷 أساسيات</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile to="/drugs/classifications" icon="🧬" label="الأصناف الدوائية" />
        <Tile to="/drugs" icon="💊" label="كل الأدوية" />
        <Tile to="/drugs/suffixes" icon="🔤" label="لاحقات الأدوية" />
        <Tile to="/drugs/interactions" icon="🔄" label="فحص التفاعلات" />
        <Tile to="/drugs/cardiac" icon="❤️" label="أدوية القلب" />
        <Tile to="/drugs/mnemonics" icon="🧠" label="مذكرات فارماكولوجي" />
      </div>

      <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">🟢 نصائح خاصة</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile to="/drugs/antidotes" icon="🧪" label="الترياقات" />
        <Tile to="/drugs" icon="⚠️" label="الأدوية عالية الخطورة" />
      </div>
    </div>
  );
}
