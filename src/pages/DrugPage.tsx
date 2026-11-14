import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { useSEO, breadcrumbSchema } from "../lib/seo";
import { HighAlertBadges, parseHighAlertTypes } from "../lib/highAlert";
import { useI18n, bilingual } from "../lib/i18n";
import CrossRefBox from "../components/CrossRefBox";
import SafetyLinksBox from "../components/SafetyLinksBox";
import PrintButton from "../components/PrintButton";
import InlineLangToggle from "../components/InlineLangToggle";
import DrugSection, { DrugText } from "../components/drugs/DrugSection";
import DrugSectionNav from "../components/drugs/DrugSectionNav";
import DrugCard from "../components/drugs/DrugCard";

const BLOCK_LABELS = {
  dose: { ar: "الجرعة", en: "Dosage" },
  indications: { ar: "دواعي الاستعمال", en: "Indications" },
  sideEffects: { ar: "الآثار الجانبية", en: "Side Effects" },
  nursing: { ar: "الاعتبارات التمريضية", en: "Nursing Considerations" },
  contraindications: { ar: "موانع الاستعمال", en: "Contraindications" },
  storage: { ar: "التخزين", en: "Storage" },
  references: { ar: "المراجع", en: "References" },
};

export default function DrugPage() {
  const { slug } = useParams();
  const { drugs, drugInteractions } = useStore();
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const drug = drugs.find((d) => d.slug === slug);
  const interactions = drug
    ? drugInteractions
        .filter((i) => i.drugAId === drug.id || i.drugBId === drug.id)
        .map((i) => ({ ...i, other: drugs.find((d) => d.id === (i.drugAId === drug.id ? i.drugBId : i.drugAId)) }))
        .filter((i) => i.other)
    : [];

  useSEO({
    title: drug ? `${drug.name} (${drug.genericName}) | ${t("drugs.title")}` : t("drug.notFound"),
    description: drug ? `${drug.name}: ${drug.indications}` : "",
    keywords: drug ? `${drug.name}, ${drug.genericName}, ${drug.drugClass}, جرعة, تمريض` : "",
    type: "article",
    jsonLd: drug
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Drug",
            name: drug.name,
            activeIngredient: drug.genericName,
            drugClass: drug.drugClass,
            description: drug.indications,
          },
          breadcrumbSchema([
            { name: lang === "en" ? "Home" : "الرئيسية", url: window.location.origin },
            { name: t("drugs.title"), url: `${window.location.origin}/drugs` },
            { name: drug.name, url: window.location.href },
          ]),
        ]
      : undefined,
  });

  if (!drug) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold dark:text-white">{t("drug.notFound")}</h1>
        <Link to="/drugs" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 font-bold text-white">{t("drug.backToGuide")}</Link>
      </div>
    );
  }

  const related = drugs.filter((d) => d.category === drug.category && d.id !== drug.id).slice(0, 4);
  const highAlertTypes = parseHighAlertTypes(drug.highAlertType);
  const showHighAlert = drug.isHighAlert || highAlertTypes.length > 0;

  const name = bilingual(drug.name, drug.nameEn, lang).text;
  const genericName = bilingual(drug.genericName, drug.genericNameEn, lang).text;
  const drugClass = bilingual(drug.drugClass, drug.drugClassEn, lang).text;
  const category = bilingual(drug.category, drug.categoryEn, lang).text;

  const text = {
    dose: bilingual(drug.dose, drug.doseEn, lang).text,
    indications: bilingual(drug.indications, drug.indicationsEn, lang).text,
    sideEffects: bilingual(drug.sideEffects, drug.sideEffectsEn, lang).text,
    nursing: bilingual(drug.nursingConsiderations, drug.nursingConsiderationsEn, lang).text,
    contra: bilingual(drug.contraindications, drug.contraindicationsEn, lang).text,
    storage: bilingual(drug.storage, drug.storageEn, lang).text,
    refs: bilingual(drug.references, drug.referencesEn, lang).text,
    warnings: bilingual(drug.highAlertWarnings, drug.highAlertWarningsEn, lang).text,
  };
  const has = (v: string) => !!v.trim();
  const hasWarnings = !!(drug.isHighAlert && drug.highAlertWarnings);

  // Quick navigation: only the sections that exist for this drug (no empty sections are invented).
  const NAV = { interactions: { ar: "التفاعلات", en: "Interactions" }, warnings: { ar: "تحذيرات الخطورة", en: "High-alert" } };
  const navItems = [
    ...(hasWarnings ? [{ id: "warnings", label: NAV.warnings[lang] }] : []),
    ...(has(text.dose) ? [{ id: "dose", label: BLOCK_LABELS.dose[lang] }] : []),
    ...(drug.contraindications && has(text.contra) ? [{ id: "contra", label: BLOCK_LABELS.contraindications[lang] }] : []),
    ...(has(text.indications) ? [{ id: "indications", label: BLOCK_LABELS.indications[lang] }] : []),
    ...(has(text.sideEffects) ? [{ id: "side-effects", label: BLOCK_LABELS.sideEffects[lang] }] : []),
    ...(has(text.nursing) ? [{ id: "nursing", label: BLOCK_LABELS.nursing[lang] }] : []),
    ...(interactions.length > 0 ? [{ id: "interactions", label: NAV.interactions[lang] }] : []),
    ...(drug.storage && has(text.storage) ? [{ id: "storage", label: BLOCK_LABELS.storage[lang] }] : []),
    ...(drug.references && has(text.refs) ? [{ id: "references", label: BLOCK_LABELS.references[lang] }] : []),
  ];
  const navTitle = lang === "ar" ? "في هذه الصفحة" : "On this page";
  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/drugs/all"));

  return (
    <div className="bg-[#F1F4F6] pb-12 dark:bg-slate-950 print:bg-white">
      <header className="relative z-20 bg-[#153448] text-white print:bg-white print:text-black">
        {showHighAlert && (
          <div className="relative bg-red-700 text-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm font-black">
              <span>{t("drug.highAlertBadge")}</span>
              {highAlertTypes.length > 0 && <HighAlertBadges types={highAlertTypes} />}
            </div>
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden print:hidden">
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="absolute -top-20 end-[-5rem] h-60 w-60 rounded-full bg-[#168C91]/40 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-5 pt-4 md:pb-7 md:pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <nav aria-label="Breadcrumb" className="min-w-0 text-xs text-slate-300 sm:text-sm">
              <ol className="flex flex-wrap items-center gap-1">
                <li><Link to="/" className="hover:text-teal-200">{lang === "ar" ? "الرئيسية" : "Home"}</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link to="/drugs" className="hover:text-teal-200">{t("drugs.title")}</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="max-w-[50vw] truncate font-semibold text-white">{name}</li>
              </ol>
            </nav>
            <div className="flex items-center gap-2">
              <button type="button" onClick={goBack} className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/20">
                {lang === "ar" ? "→ القائمة" : "← List"}
              </button>
              <InlineLangToggle light />
              <PrintButton label={t("drug.printCard")} />
            </div>
          </div>
          <h1 className="mt-4 break-words text-3xl font-black leading-tight md:text-4xl">{name}</h1>
          <p className="mt-1 text-base text-teal-100 print:text-black md:text-lg">{genericName}{drugClass ? <> • {drugClass}</> : null}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#168C91]/60 bg-[#168C91]/20 px-3 py-1 text-xs font-bold text-teal-100 sm:text-sm">{category}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4">
        <DrugSectionNav items={navItems} title={navTitle} variant="chips" />
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
          <main className="min-w-0 space-y-4">
            <div className="print:hidden"><CrossRefBox table="drugs" id={drug.id} /></div>
            <div className="print:hidden"><SafetyLinksBox table="drugs" id={drug.id} /></div>

            {drug.showImage && drug.imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <img src={drug.imageUrl} alt={drug.name} className="mx-auto max-h-80 w-auto rounded-xl object-contain" />
              </div>
            )}

            {hasWarnings && (
              <DrugSection id="warnings" icon="⚠️" title={t("drug.highAlertWarningsHeading")} tone="danger">
                <DrugText tone="danger">{text.warnings}</DrugText>
              </DrugSection>
            )}

            {has(text.dose) && <DrugSection id="dose" icon="💉" title={BLOCK_LABELS.dose[lang]} tone="dose"><DrugText>{text.dose}</DrugText></DrugSection>}

            {drug.contraindications && has(text.contra) && (
              <DrugSection id="contra" icon="🚫" title={BLOCK_LABELS.contraindications[lang]} tone="danger"><DrugText tone="danger">{text.contra}</DrugText></DrugSection>
            )}

            {has(text.indications) && <DrugSection id="indications" icon="✅" title={BLOCK_LABELS.indications[lang]}><DrugText>{text.indications}</DrugText></DrugSection>}
            {has(text.sideEffects) && <DrugSection id="side-effects" icon="⚠️" title={BLOCK_LABELS.sideEffects[lang]}><DrugText>{text.sideEffects}</DrugText></DrugSection>}
            {has(text.nursing) && <DrugSection id="nursing" icon="🩺" title={BLOCK_LABELS.nursing[lang]}><DrugText>{text.nursing}</DrugText></DrugSection>}

            {interactions.length > 0 && (
              <DrugSection id="interactions" icon="🔄" title={t("drug.knownInteractions").replace(/^🔄\s*/, "")}>
                <div className="grid gap-3">
                  {interactions.map((i) => {
                    const sevStyle =
                      i.severity === "severe"
                        ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300"
                        : i.severity === "moderate"
                        ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-300"
                        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300";
                    const sevLabel = i.severity === "severe" ? t("drug.severitySevere") : i.severity === "moderate" ? t("drug.severityModerate") : t("drug.severityMild");
                    const desc = bilingual(i.description, i.descriptionEn, lang).text;
                    const management = bilingual(i.management, i.managementEn, lang).text;
                    return (
                      <div key={i.id} className={`rounded-xl border p-3 ${sevStyle}`}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="font-bold">{t("drug.with")} {bilingual(i.other!.name, i.other!.nameEn, lang).text}</span>
                          <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold dark:bg-black/20">{sevLabel}</span>
                        </div>
                        <p className="whitespace-pre-line text-sm leading-7">{desc}</p>
                        {management && <p className="mt-1 whitespace-pre-line text-sm font-bold">💡 {management}</p>}
                      </div>
                    );
                  })}
                </div>
                <Link to="/drugs/interactions" className="mt-3 inline-block text-sm font-bold text-[#168C91] hover:underline dark:text-teal-300">{t("drug.checkOtherInteraction")}</Link>
              </DrugSection>
            )}

            {drug.storage && has(text.storage) && <DrugSection id="storage" icon="🧊" title={BLOCK_LABELS.storage[lang]}><DrugText>{text.storage}</DrugText></DrugSection>}
            {drug.references && has(text.refs) && <DrugSection id="references" icon="📚" title={BLOCK_LABELS.references[lang]}><DrugText>{text.refs}</DrugText></DrugSection>}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-500/5 dark:text-amber-300">
              ⚠️ {t("drug.disclaimer")}
            </div>

            {related.length > 0 && (
              <section className="pt-2 print:hidden">
                <h2 className="mb-3 border-s-4 border-[#168C91] ps-3 text-lg font-black text-[#153448] dark:text-white">{t("drug.similarInCategory")}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {related.map((d) => <DrugCard key={d.id} d={d} />)}
                </div>
              </section>
            )}
          </main>

          <aside>
            <DrugSectionNav items={navItems} title={navTitle} variant="list" />
          </aside>
        </div>
      </div>
    </div>
  );
}
