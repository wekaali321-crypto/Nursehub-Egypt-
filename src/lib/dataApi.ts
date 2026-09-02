import { supabase, isSupabaseEnabled, TABLES } from "./supabase";
import type { DataShape } from "./store";
import {
  seedArticles, seedComments, seedMedia, seedProducts, seedUsers,
} from "./seed";
import {
  seedDrugs, seedDrugInteractions, seedDrugAntidotes, seedDrugClassifications,
  seedDrugSuffixes, seedCardiacMedGroups, seedPharmMnemonics,
  seedPages, seedCategories, seedTags, seedSubscribers,
  seedAds, seedAffiliates, seedRedirects, seedActivity,
} from "./seed2";
import { seedOTCConditions } from "./seedOTC";

/**
 * Production data-access layer.
 *
 * When Supabase is configured, ALL reads/writes go to Supabase (PostgreSQL).
 * localStorage is NEVER used for production data — only as a preview fallback
 * when env vars are missing.
 *
 * Each entity has a row<->app mapper so the Supabase snake_case columns map to
 * the app's camelCase shape.
 */

/* ---------- Row <-> App mappers ---------- */
const fromArticle = (r: any) => ({
  id: r.id, title: r.title, slug: r.slug, category: r.category,
  subcategory: r.subcategory ?? undefined, // real sub-folder within `category`, links to Taxonomy.id
  excerpt: r.excerpt,
  content: r.content, cover: r.cover, tags: r.tags ?? [], author: r.author,
  status: r.status, publishDate: r.publish_date, updatedDate: r.updated_date,
  views: r.views ?? 0, featured: r.featured, videoUrl: r.video_url,
  attachments: r.attachments ?? [], metaTitle: r.meta_title, metaDescription: r.meta_description,
  rating: r.rating, ratingCount: r.rating_count,
  // Bilingual fields — required for the per-article AR/EN reading toggle.
  titleEn: r.title_en, excerptEn: r.excerpt_en, contentEn: r.content_en,
});
const toArticle = (a: any) => ({
  id: a.id, title: a.title, slug: a.slug, category: a.category,
  subcategory: a.subcategory ?? null,
  excerpt: a.excerpt,
  content: a.content, cover: a.cover, tags: a.tags, author: a.author, status: a.status,
  publish_date: a.publishDate, updated_date: a.updatedDate ?? a.publishDate, views: a.views ?? 0,
  featured: a.featured ?? false, video_url: a.videoUrl ?? null, attachments: a.attachments ?? [],
  meta_title: a.metaTitle ?? null, meta_description: a.metaDescription ?? null,
  rating: a.rating ?? 0, rating_count: a.ratingCount ?? 0,
  // Bilingual fields — must round-trip on save or the CMS editor would silently wipe them.
  title_en: a.titleEn ?? null, excerpt_en: a.excerptEn ?? null, content_en: a.contentEn ?? null,
});

const fromComment = (r: any) => ({ id: r.id, articleId: r.article_id, name: r.name, text: r.text, date: r.created_at?.slice(0, 10) ?? "", status: r.status });
const toComment = (c: any) => ({ id: c.id, article_id: c.articleId, name: c.name, text: c.text, status: c.status });

const fromMedia = (r: any) => ({ id: r.id, name: r.name, type: r.type, url: r.url, size: r.size, date: r.created_at?.slice(0, 10) ?? "", folder: r.folder });
const toMedia = (m: any) => ({ id: m.id, name: m.name, type: m.type, url: m.url, size: m.size, folder: m.folder ?? "f-root" });

const fromDrug = (r: any) => ({ id: r.id, name: r.name, genericName: r.generic_name, drugClass: r.drug_class, category: r.category, dose: r.dose, indications: r.indications, sideEffects: r.side_effects, nursingConsiderations: r.nursing_considerations, contraindications: r.contraindications, storage: r.storage, references: r.references, slug: r.slug, isHighAlert: r.is_high_alert ?? false, highAlertWarnings: r.high_alert_warnings ?? "", highAlertType: r.high_alert_type ?? [], imageUrl: r.image_url ?? "", showImage: r.show_image ?? false, nameEn: r.name_en ?? "", genericNameEn: r.generic_name_en ?? "", drugClassEn: r.drug_class_en ?? "", categoryEn: r.category_en ?? "", doseEn: r.dose_en ?? "", indicationsEn: r.indications_en ?? "", sideEffectsEn: r.side_effects_en ?? "", nursingConsiderationsEn: r.nursing_considerations_en ?? "", contraindicationsEn: r.contraindications_en ?? "", storageEn: r.storage_en ?? "", referencesEn: r.references_en ?? "", highAlertWarningsEn: r.high_alert_warnings_en ?? "" });
const toDrug = (d: any) => ({ id: d.id, name: d.name, generic_name: d.genericName, drug_class: d.drugClass, category: d.category, dose: d.dose, indications: d.indications, side_effects: d.sideEffects, nursing_considerations: d.nursingConsiderations, contraindications: d.contraindications ?? "", storage: d.storage ?? "", references: d.references ?? "", slug: d.slug, is_high_alert: d.isHighAlert ?? false, high_alert_warnings: d.highAlertWarnings ?? "", high_alert_type: d.highAlertType ?? [], image_url: d.imageUrl ?? "", show_image: d.showImage ?? false, name_en: d.nameEn ?? null, generic_name_en: d.genericNameEn ?? null, drug_class_en: d.drugClassEn ?? null, category_en: d.categoryEn ?? null, dose_en: d.doseEn ?? null, indications_en: d.indicationsEn ?? null, side_effects_en: d.sideEffectsEn ?? null, nursing_considerations_en: d.nursingConsiderationsEn ?? null, contraindications_en: d.contraindicationsEn ?? null, storage_en: d.storageEn ?? null, references_en: d.referencesEn ?? null, high_alert_warnings_en: d.highAlertWarningsEn ?? null });

// تفاعلات الأدوية مع بعض (drug-drug interactions)
const fromInteraction = (r: any) => ({ id: r.id, drugAId: r.drug_a_id, drugBId: r.drug_b_id, severity: r.severity, description: r.description, management: r.management ?? "" });
const toInteraction = (i: any) => ({ id: i.id, drug_a_id: i.drugAId, drug_b_id: i.drugBId, severity: i.severity, description: i.description, management: i.management ?? "" });

// الترياقات الطبية (toxin -> antidote)
const fromAntidote = (r: any) => ({ id: r.id, toxin: r.toxin, antidotes: r.antidotes, notes: r.notes ?? "" });
const toAntidote = (a: any) => ({ id: a.id, toxin: a.toxin, antidotes: a.antidotes, notes: a.notes ?? "" });

// الأصناف الدوائية العامة
const fromClassification = (r: any) => ({ id: r.id, name: r.name, description: r.description, examples: r.examples ?? "" });
const toClassification = (c: any) => ({ id: c.id, name: c.name, description: c.description, examples: c.examples ?? "" });

const fromSuffix = (r: any) => ({ id: r.id, suffix: r.suffix, className: r.class_name, examples: r.examples ?? "" });
const toSuffix = (s: any) => ({ id: s.id, suffix: s.suffix, class_name: s.className, examples: s.examples ?? "" });

const fromCardiacGroup = (r: any) => ({ id: r.id, name: r.name, examples: r.examples ?? "" });
const toCardiacGroup = (c: any) => ({ id: c.id, name: c.name, examples: c.examples ?? "" });

const fromMnemonic = (r: any) => ({ id: r.id, title: r.title, code: r.code ?? "", lines: r.lines ?? "" });
const toMnemonic = (m: any) => ({ id: m.id, title: m.title, code: m.code ?? "", lines: m.lines ?? "" });

const fromFact = (r: any) => ({ id: r.id, number: r.number, content: r.content, source: r.source ?? "", chapter: r.chapter ?? 1 });
const toFact = (f: any) => ({ id: f.id, number: f.number, content: f.content, source: f.source ?? "", chapter: f.chapter ?? 1 });

// حالات شائعة وعلاجها (OTC)
const fromOTC = (r: any) => ({ id: r.id, orderNum: r.order_num ?? 0, nameAr: r.name_ar, nameEn: r.name_en, icon: r.icon ?? "🩺", category: r.category, summary: r.summary, symptoms: r.symptoms, keyQuestions: r.key_questions, redFlags: r.red_flags ?? "", treatment: r.treatment, patientAdvice: r.patient_advice ?? "" });
const toOTC = (o: any) => ({ id: o.id, order_num: o.orderNum ?? 0, name_ar: o.nameAr, name_en: o.nameEn, icon: o.icon ?? "🩺", category: o.category, summary: o.summary, symptoms: o.symptoms, key_questions: o.keyQuestions, red_flags: o.redFlags ?? "", treatment: o.treatment, patient_advice: o.patientAdvice ?? "" });

// Product now also carries fileUrl <-> file_url: the actual deliverable
// (PDF/doc/video) sent to buyers after payment, uploaded via the Media Library.
const fromProduct = (r: any) => ({ id: r.id, title: r.title, type: r.type, price: r.price, oldPrice: r.old_price, cover: r.cover, description: r.description, sales: r.sales ?? 0, fileUrl: r.file_url });
const toProduct = (p: any) => ({ id: p.id, title: p.title, type: p.type, price: p.price, old_price: p.oldPrice ?? null, cover: p.cover, description: p.description, sales: p.sales ?? 0, file_url: p.fileUrl ?? null });

const fromUser = (r: any) => ({ id: r.id, name: r.name, email: r.email, role: r.role });
const toUser = (u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

const fromPage = (r: any) => ({ id: r.id, title: r.title, slug: r.slug, content: r.content, status: r.status });
const fromTax = (r: any) => ({ id: r.id, name: r.name, slug: r.slug });
const fromSub = (r: any) => ({ id: r.id, email: r.email, date: r.created_at?.slice(0, 10) ?? "", status: r.status });
const toSub = (s: any) => ({ id: s.id, email: s.email, status: s.status });
const fromAd = (r: any) => ({ id: r.id, name: r.name, placement: r.placement, type: r.type, code: r.code, active: r.active });
const fromAff = (r: any) => ({ id: r.id, name: r.name, url: r.url, network: r.network, commission: r.commission, clicks: r.clicks ?? 0 });
const fromRedirect = (r: any) => ({ id: r.id, from: r.from, to: r.to, type: r.type });
const fromActivity = (r: any) => ({ id: r.id, action: r.action, target: r.target, user: r.user, date: r.created_at?.slice(0, 16).replace("T", " ") ?? "" });

// Orders — the `orders` table also still has a couple of legacy columns
// (product_id, payment_method, transaction_ref, amount, gateway_name) from an
// earlier schema version; we read/write the newer columns that match the
// current `Order` type and simply leave the legacy ones alone.
export const fromOrder = (r: any) => ({
  id: r.id,
  invoiceNo: r.invoice_no,
  customerName: r.customer_name,
  email: r.email,
  phone: r.phone,
  items: r.items ?? [],
  subtotal: r.subtotal ?? 0,
  discount: r.discount ?? 0,
  tax: r.tax ?? 0,
  total: r.total ?? 0,
  couponCode: r.coupon_code ?? undefined,
  gateway: r.gateway ?? r.gateway_name ?? "",
  paymentStatus: r.status,
  transactionId: r.transaction_id ?? undefined,
  date: r.created_at ? r.created_at.slice(0, 16).replace("T", " ") : "",
});
export const toOrder = (o: any) => ({
  id: o.id,
  invoice_no: o.invoiceNo,
  customer_name: o.customerName,
  email: o.email,
  phone: o.phone,
  items: o.items,
  subtotal: o.subtotal,
  discount: o.discount,
  tax: o.tax,
  total: o.total,
  coupon_code: o.couponCode ?? null,
  gateway: o.gateway,
  status: o.paymentStatus,
  transaction_id: o.transactionId ?? null,
});

/* ---------- Load everything from Supabase ---------- */
export async function loadAllFromSupabase(): Promise<Partial<DataShape>> {
  if (!isSupabaseEnabled || !supabase) throw new Error("Supabase not configured");

  const q = (t: string) => supabase!.from(t).select("*");
  const [
    articles, comments, media, products, users, pages, categories, tags,
    subscribers, ads, affiliates, redirects, activity, drugs, drugInteractions, drugAntidotes, drugClassifications,
    drugSuffixes, cardiacMedGroups, pharmMnemonics, pharmacyFacts, otcConditions, settings, orders,
  ] = await Promise.all([
    q(TABLES.articles), q(TABLES.comments), q(TABLES.media), q(TABLES.products),
    q(TABLES.users), q(TABLES.pages), q(TABLES.categories), q(TABLES.tags),
    q(TABLES.subscribers), q(TABLES.ads), q(TABLES.affiliates), q(TABLES.redirects),
    q(TABLES.activity), q(TABLES.drugs), q(TABLES.drugInteractions), q(TABLES.drugAntidotes), q(TABLES.drugClassifications),
    q(TABLES.drugSuffixes), q(TABLES.cardiacMedGroups), q(TABLES.pharmMnemonics), q(TABLES.pharmacyFacts), q(TABLES.otcConditions), q(TABLES.settings), q(TABLES.orders),
  ]);

  const s = settings.data?.[0];
  return {
    articles: (articles.data ?? []).map(fromArticle),
    comments: (comments.data ?? []).map(fromComment),
    media: (media.data ?? []).map(fromMedia),
    products: (products.data ?? []).map(fromProduct),
    users: (users.data ?? []).map(fromUser),
    pages: (pages.data ?? []).map(fromPage),
    categories: (categories.data ?? []).map(fromTax),
    tags: (tags.data ?? []).map(fromTax),
    subscribers: (subscribers.data ?? []).map(fromSub),
    ads: (ads.data ?? []).map(fromAd),
    affiliates: (affiliates.data ?? []).map(fromAff),
    redirects: (redirects.data ?? []).map(fromRedirect),
    activity: (activity.data ?? []).map(fromActivity),
    drugs: (drugs.data ?? []).map(fromDrug),
    drugInteractions: (drugInteractions.data ?? []).map(fromInteraction),
    drugAntidotes: (drugAntidotes.data ?? []).map(fromAntidote),
    drugClassifications: (drugClassifications.data ?? []).map(fromClassification),
    drugSuffixes: (drugSuffixes.data ?? []).map(fromSuffix),
    cardiacMedGroups: (cardiacMedGroups.data ?? []).map(fromCardiacGroup),
    pharmMnemonics: (pharmMnemonics.data ?? []).map(fromMnemonic),
    pharmacyFacts: (pharmacyFacts.data ?? []).map(fromFact),
    otcConditions: (otcConditions.data ?? []).map(fromOTC),
    orders: (orders.data ?? []).map(fromOrder),
    settings: s
      ? { siteName: s.site_name, tagline: s.tagline, metaDescription: s.meta_description, adsenseEnabled: s.adsense_enabled, adsenseClient: s.adsense_client }
      : undefined,
  };
}

/* ---------- Upsert helpers used by the store on every change ---------- */
type Entity = keyof DataShape;

const UPSERT: Partial<Record<Entity, { table: string; to: (x: any) => any }>> = {
  articles: { table: TABLES.articles, to: toArticle },
  comments: { table: TABLES.comments, to: toComment },
  media: { table: TABLES.media, to: toMedia },
  products: { table: TABLES.products, to: toProduct },
  users: { table: TABLES.users, to: toUser },
  drugs: { table: TABLES.drugs, to: toDrug },
  drugInteractions: { table: TABLES.drugInteractions, to: toInteraction },
  drugAntidotes: { table: TABLES.drugAntidotes, to: toAntidote },
  drugClassifications: { table: TABLES.drugClassifications, to: toClassification },
  drugSuffixes: { table: TABLES.drugSuffixes, to: toSuffix },
  cardiacMedGroups: { table: TABLES.cardiacMedGroups, to: toCardiacGroup },
  pharmMnemonics: { table: TABLES.pharmMnemonics, to: toMnemonic },
  pharmacyFacts: { table: TABLES.pharmacyFacts, to: toFact },
  otcConditions: { table: TABLES.otcConditions, to: toOTC },
  subscribers: { table: TABLES.subscribers, to: toSub },
  pages: { table: TABLES.pages, to: (p: any) => ({ id: p.id, title: p.title, slug: p.slug, content: p.content, status: p.status }) },
  categories: { table: TABLES.categories, to: (t: any) => ({ id: t.id, name: t.name, slug: t.slug }) },
  tags: { table: TABLES.tags, to: (t: any) => ({ id: t.id, name: t.name, slug: t.slug }) },
  ads: { table: TABLES.ads, to: (a: any) => ({ id: a.id, name: a.name, placement: a.placement, type: a.type, code: a.code, active: a.active }) },
  affiliates: { table: TABLES.affiliates, to: (a: any) => ({ id: a.id, name: a.name, url: a.url, network: a.network, commission: a.commission, clicks: a.clicks }) },
  redirects: { table: TABLES.redirects, to: (r: any) => ({ id: r.id, from: r.from, to: r.to, type: r.type }) },
  activity: { table: TABLES.activity, to: (a: any) => ({ id: a.id, action: a.action, target: a.target, user: a.user }) },
  orders: { table: TABLES.orders, to: toOrder },
};

/** Persist a single entity collection diff to Supabase (upsert + delete). */
export async function syncEntity(entity: Entity, current: any[], previous: any[]) {
  if (!isSupabaseEnabled || !supabase) return;
  const cfg = UPSERT[entity];
  if (!cfg) return;

  const currIds = new Set(current.map((x) => x.id));
  const deleted = previous.filter((x) => !currIds.has(x.id));

  // Deletes
  if (deleted.length) {
    await supabase.from(cfg.table).delete().in("id", deleted.map((d) => d.id));
  }
  // Upserts (only changed/new rows to reduce writes)
  const prevById = new Map(previous.map((x) => [x.id, JSON.stringify(x)]));
  const changed = current.filter((x) => prevById.get(x.id) !== JSON.stringify(x));
  if (changed.length) {
    await supabase.from(cfg.table).upsert(changed.map(cfg.to));
  }
}

/** Persist site settings (single row). */
export async function syncSettings(settings: DataShape["settings"]) {
  if (!isSupabaseEnabled || !supabase) return;
  await supabase.from(TABLES.settings).upsert({
    id: 1,
    site_name: settings.siteName,
    tagline: settings.tagline,
    meta_description: settings.metaDescription,
    adsense_enabled: settings.adsenseEnabled,
    adsense_client: settings.adsenseClient,
  });
}

/** Seed an empty Supabase project with starter data (run once from admin). */
export async function seedSupabase() {
  if (!isSupabaseEnabled || !supabase) throw new Error("Supabase not configured");
  await supabase.from(TABLES.articles).upsert(seedArticles.map(toArticle));
  await supabase.from(TABLES.comments).upsert(seedComments.map(toComment));
  await supabase.from(TABLES.media).upsert(seedMedia.map(toMedia));
  await supabase.from(TABLES.products).upsert(seedProducts.map(toProduct));
  await supabase.from(TABLES.users).upsert(seedUsers.map(toUser));
  await supabase.from(TABLES.drugs).upsert(seedDrugs.map(toDrug));
  await supabase.from(TABLES.drugInteractions).upsert(seedDrugInteractions.map(toInteraction));
  await supabase.from(TABLES.drugAntidotes).upsert(seedDrugAntidotes.map(toAntidote));
  await supabase.from(TABLES.drugClassifications).upsert(seedDrugClassifications.map(toClassification));
  await supabase.from(TABLES.drugSuffixes).upsert(seedDrugSuffixes.map(toSuffix));
  await supabase.from(TABLES.cardiacMedGroups).upsert(seedCardiacMedGroups.map(toCardiacGroup));
  await supabase.from(TABLES.pharmMnemonics).upsert(seedPharmMnemonics.map(toMnemonic));
  await supabase.from(TABLES.otcConditions).upsert(seedOTCConditions.map(toOTC));
  await supabase.from(TABLES.pages).upsert(seedPages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, content: p.content, status: p.status })));
  await supabase.from(TABLES.categories).upsert(seedCategories.map((t) => ({ id: t.id, name: t.name, slug: t.slug })));
  await supabase.from(TABLES.tags).upsert(seedTags.map((t) => ({ id: t.id, name: t.name, slug: t.slug })));
  await supabase.from(TABLES.subscribers).upsert(seedSubscribers.map(toSub));
  await supabase.from(TABLES.ads).upsert(seedAds.map((a) => ({ id: a.id, name: a.name, placement: a.placement, type: a.type, code: a.code, active: a.active })));
  await supabase.from(TABLES.affiliates).upsert(seedAffiliates.map((a) => ({ id: a.id, name: a.name, url: a.url, network: a.network, commission: a.commission, clicks: a.clicks })));
  await supabase.from(TABLES.redirects).upsert(seedRedirects.map((r) => ({ id: r.id, from: r.from, to: r.to, type: r.type })));
  await supabase.from(TABLES.activity).upsert(seedActivity.map((a) => ({ id: a.id, action: a.action, target: a.target, user: a.user })));
}
