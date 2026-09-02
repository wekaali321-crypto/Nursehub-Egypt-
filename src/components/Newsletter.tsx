import { useState } from "react";
import { useI18n } from "../lib/i18n";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const { t } = useI18n();

  return (
    <section className="mx-auto my-12 max-w-5xl px-4">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-sky-600 to-emerald-500 p-8 text-center text-white md:p-12">
        <div className="text-4xl">📧</div>
        <h2 className="mt-3 text-2xl font-black md:text-3xl">{t("news.title")}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sky-50">{t("news.desc")}</p>
        {done ? (
          <div className="mx-auto mt-6 max-w-md rounded-xl bg-white/20 py-3 font-bold">{t("news.done")}</div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) setDone(true); }}
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("news.placeholder")}
              className="flex-1 rounded-full px-5 py-3 text-slate-800 outline-none"
            />
            <button className="rounded-full bg-slate-900 px-6 py-3 font-bold hover:bg-slate-800">{t("news.button")}</button>
          </form>
        )}
      </div>
    </section>
  );
}
