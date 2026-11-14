import { supabase } from "./supabase";

const ids = new Map<string, Promise<string | null>>();

/** Article id for a slug (primary lookup used by the quiz widgets). Memoised per page session so the three widgets share one query. */
export function fetchArticleIdBySlug(slug: string): Promise<string | null> {
  let p = ids.get(slug);
  if (!p) {
    p = (async () => {
      if (!supabase) return null;
      const { data } = await supabase.from("articles").select("id").eq("slug", slug).maybeSingle();
      return (data as { id: string } | null)?.id ?? null;
    })();
    p.catch(() => ids.delete(slug));
    ids.set(slug, p);
  }
  return p;
}
