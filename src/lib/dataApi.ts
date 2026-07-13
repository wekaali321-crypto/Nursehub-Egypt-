import { supabase, isSupabaseEnabled, TABLES } from "./supabase";
import type { DataShape } from "./store";
import {
  seedArticles, seedComments, seedMedia, seedProducts, seedUsers,
} from "./seed";
import {
  seedDrugs, seedPages, seedCategories, seedTags, seedSubscribers,
  seedAds, seedAffiliates, seedRedirects, seedActivity,
} from "./seed2";

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
  id: r.id, title: r.title, slug: r.slug, category: r.category, excerpt: r.excerpt,
  content: r.content, cover: r.cover, tags: r.tags ?? [], author: r.author,
  status: r.status, publishDate: r.publish_date, updatedDate: r.updated_date,
  views: r.views ?? 0, featured: r.featured, videoUrl: r.video_url,
  attachments: r.attachments ?? [], metaTitle: r.meta_title, metaDescription: r.meta_description,
  rating: r.rating, ratingCount: r.rating_count,
});
const toArticle = (a: any) => ({
  id: a.id, title: a.title, slug: a.slug, category: a.category, excerpt: a.excerpt,
  content: a.content, cover: a.cover, tags: a.tags, author: a.author, status: a.status,
  publish_date: a.publishDate, updated_date: a.updatedDate ?? a.publishDate, views: a.views ?? 0,
  featured: a.featured ?? false, video_url: a.videoUrl ?? null, attachments: a.attachments ?? [],
  meta_title: a.metaTitle ?? null, meta_description: a.metaDescription ?? null,
  rating: a.rating ?? 0, rating_count: a.ratingCount ?? 0,
});

const fromComment = (r: any) => ({ id: r.id, articleId: r.article_id, name: r.name, text: r.text, date: r.created_at?.slice(0, 10) ?? "", status: r.status });
const toComment = (c: any) => ({ id: c.id, article_id: c.articleId, name: c.name, text: c.text, status: c.status });

const fromMedia = (r: any) => ({ id: r.id, name: r.name, type: r.type, url: r.url, size: r.size, date: r.created_at?.slice(0, 10) ?? "", folder: r.folder });
const toMedia = (m: any) => ({ id: m.id, name: m.name, type: m.type, url: m.url, size: m.size, folder: m.folder ?? "f-root" });

const fromDrug = (r: any) => ({ id: r.id, name: r.name, genericName: r.generic_name, drugClass: r.drug_class, category: r.category, dose: r.dose, indications: r.indications, sideEffects: r.side_effects, nursingConsiderations: r.nursing_considerations, contraindications: r.contraindications, storage: r.storage, references: r.references, slug: r.slug });
const toDrug = (d: any) => ({ id: d.id, name: d.name, generic_name: d.genericName, drug_class: d.drugClass, category: d.category, dose: d.dose, indications: d.indications, side_effects: d.sideEffects, nursing_considerations: d.nursingConsiderations, contraindications: d.contraindications ?? "", storage: d.storage ?? "", references: d.references ?? "", slug: d.slug });

const fromProduct = (r: any) => ({ id: r.id, title: r.title, type: r.type, price: r.price, oldPrice: r.old_price, cover: r.cover, description: r.description, sales: r.sales ?? 0 });
const toProduct = (p: any) => ({ id: p.id, title: p.title, type: p.type, price: p.price, old_price: p.oldPrice ?? null, cover: p.cover, description: p.description, sales: p.sales ?? 0 });

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

/* ---------- Load everything from Supabase ---------- */
export async function loadAllFromSupabase(): Promise<Partial<DataShape>> {
  if (!isSupabaseEnabled || !supabase) throw new Error("Supabase not configured");

  const q = (t: string) => supabase!.from(t).select("*");
  const [
    articles, comments, media, products, users, pages, categories, tags,
    subscribers, ads, affiliates, redirects, activity, drugs, settings,
  ] = await Promise.all([
    q(TABLES.articles), q(TABLES.comments), q(TABLES.media), q(TABLES.products),
    q(TABLES.users), q(TABLES.pages), q(TABLES.categories), q(TABLES.tags),
    q(TABLES.subscribers), q(TABLES.ads), q(TABLES.affiliates), q(TABLES.redirects),
    q(TABLES.activity), q(TABLES.drugs), q(TABLES.settings),
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
  subscribers: { table: TABLES.subscribers, to: toSub },
  pages: { table: TABLES.pages, to: (p: any) => ({ id: p.id, title: p.title, slug: p.slug, content: p.content, status: p.status }) },
  categories: { table: TABLES.categories, to: (t: any) => ({ id: t.id, name: t.name, slug: t.slug }) },
  tags: { table: TABLES.tags, to: (t: any) => ({ id: t.id, name: t.name, slug: t.slug }) },
  ads: { table: TABLES.ads, to: (a: any) => ({ id: a.id, name: a.name, placement: a.placement, type: a.type, code: a.code, active: a.active }) },
  affiliates: { table: TABLES.affiliates, to: (a: any) => ({ id: a.id, name: a.name, url: a.url, network: a.network, commission: a.commission, clicks: a.clicks }) },
  redirects: { table: TABLES.redirects, to: (r: any) => ({ id: r.id, from: r.from, to: r.to, type: r.type }) },
  activity: { table: TABLES.activity, to: (a: any) => ({ id: a.id, action: a.action, target: a.target, user: a.user }) },
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
  await supabase.from(TABLES.pages).upsert(seedPages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, content: p.content, status: p.status })));
  await supabase.from(TABLES.categories).upsert(seedCategories.map((t) => ({ id: t.id, name: t.name, slug: t.slug })));
  await supabase.from(TABLES.tags).upsert(seedTags.map((t) => ({ id: t.id, name: t.name, slug: t.slug })));
  await supabase.from(TABLES.subscribers).upsert(seedSubscribers.map(toSub));
  await supabase.from(TABLES.ads).upsert(seedAds.map((a) => ({ id: a.id, name: a.name, placement: a.placement, type: a.type, code: a.code, active: a.active })));
  await supabase.from(TABLES.affiliates).upsert(seedAffiliates.map((a) => ({ id: a.id, name: a.name, url: a.url, network: a.network, commission: a.commission, clicks: a.clicks })));
  await supabase.from(TABLES.redirects).upsert(seedRedirects.map((r) => ({ id: r.id, from: r.from, to: r.to, type: r.type })));
  await supabase.from(TABLES.activity).upsert(seedActivity.map((a) => ({ id: a.id, action: a.action, target: a.target, user: a.user })));
}
