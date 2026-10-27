import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export type TrafficDaily = { day: string; visitors: number; views: number; installs: number };
export type TrafficMonthly = { month: string; visitors: number; views: number; installs: number; app_users: number };
export type TrafficStats = {
  generated_at: string;
  online_now: number;
  online_app: number;
  today: { visitors: number; views: number; new_visitors: number; installs: number; app_users: number };
  yesterday: { visitors: number; views: number };
  totals: { visitors: number; views: number; installers: number; since: string | null };
  daily: TrafficDaily[];
  monthly: TrafficMonthly[];
  installs_by_kind: Record<string, number>;
  installs_by_platform: Record<string, number>;
  devices_30d: Record<string, number>;
  sources_30d: Record<string, number>;
  top_pages_30d: { path: string; views: number; visitors: number }[];
};

/** Real visitor numbers from admin_site_stats(), refreshed every few seconds while the tab is visible. */
export function useSiteTraffic(intervalMs = 10_000) {
  const [stats, setStats] = useState<TrafficStats | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setError("قاعدة البيانات غير متصلة.");
      return;
    }
    const { data, error: err } = await supabase.rpc("admin_site_stats");
    if (err) {
      setError(/admin_site_stats|does not exist|schema cache/i.test(err.message) ? "لم يتم تفعيل جداول الزوار بعد (شغّل supabase/site_traffic.sql مرة واحدة)." : err.message);
      return;
    }
    setError("");
    setStats(data as TrafficStats);
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, intervalMs);
    const onVis = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load, intervalMs]);

  return { stats, error, reload: load };
}
