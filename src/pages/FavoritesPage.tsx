import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useFavorites } from "../lib/favorites";
import { useI18n } from "../lib/i18n";
import { ArticleCard, Breadcrumbs } from "../components/common";
import { useSEO } from "../lib/seo";

export default function FavoritesPage() {
  const { articles } = useStore();
  const { favorites } = useFavorites();
  const { lang } = useI18n();
  useSEO({ title: lang === "ar" ? "المفضلة | NurseHub Egypt" : "Favorites | NurseHub Egypt" });

  const saved = articles.filter((a) => favorites.includes(a.id) && a.status === "published");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: lang === "ar" ? "المفضلة" : "Favorites" }]} />
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-rose-500 to-pink-500 p-6 text-white sm:p-8">
        <div className="text-4xl sm:text-5xl">❤️</div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">{lang === "ar" ? "مقالاتي المحفوظة" : "My Saved Articles"}</h1>
        <p className="mt-1 text-rose-50">{saved.length} {lang === "ar" ? "عنصر محفوظ" : "saved items"}</p>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-slate-700">
          <div className="text-5xl">🤍</div>
          <p className="mt-3">{lang === "ar" ? "لم تحفظ أي مقال بعد. اضغط زر «حفظ» في أي مقال." : "No saved articles yet. Tap “Save” on any article."}</p>
          <Link to="/category/articles" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{lang === "ar" ? "تصفح المقالات" : "Browse Articles"}</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{saved.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
      )}
    </div>
  );
}
