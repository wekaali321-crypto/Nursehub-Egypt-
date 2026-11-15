import { supabase } from "./supabase";
import { cachedQuery, TTL } from "./remoteCache";

/**
 * Number of rows of a public table (optionally where col = value) WITHOUT downloading them:
 * one `select('id', { count: 'exact', head: true })` request, cached on the device for 6 h. null when it could not be read.
 */
export function countRows(table: string, filter?: [string, string]): Promise<number | null> {
  const key = `count_v1_${table}${filter ? `_${filter[0]}=${filter[1]}` : ""}`;
  return cachedQuery(key, TTL.content, async () => {
    if (!supabase) return null;
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  }).catch(() => null);
}
