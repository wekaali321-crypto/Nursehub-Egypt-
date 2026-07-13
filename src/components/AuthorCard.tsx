import { useStore } from "../lib/store";
import { useI18n } from "../lib/i18n";

const GRADIENTS = [
  "from-sky-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-purple-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-sky-500",
];

function gradientFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

/** Author card shown on the article page — real published-article count from the store. */
export default function AuthorCard({ name }: { name: string }) {
  const { articles, users } = useStore();
  const { lang } = useI18n();
  const user = users.find((u) => u.name === name);
  const count = articles.filter((a) => a.author === name && a.status === "published").length;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradientFor(name)} text-lg font-black text-white shadow-md`}>
        {initials}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-bold text-slate-800 dark:text-white">{name}</span>
          <span title={lang === "ar" ? "موثّق" : "Verified"} className="text-sky-500">✔️</span>
        </div>
        <div className="text-xs text-slate-400">
          {user?.role === "admin"
            ? (lang === "ar" ? "فريق التحرير الطبي" : "Medical Editorial Team")
            : (lang === "ar" ? "كاتب مساهم" : "Contributing Author")}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {lang === "ar" ? `${count.toLocaleString("ar-EG")} مقال منشور` : `${count} published articles`}
        </div>
      </div>
    </div>
  );
}
