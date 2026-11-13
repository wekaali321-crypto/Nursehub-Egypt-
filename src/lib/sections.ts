import { useMemo } from "react";
import { useStore } from "./store";

const CATEGORY_PATH_RE = /^\/category\/([^/?#]+)\/?$/;

/**
 * Which article sections actually contain published content.
 * An empty section must not be promoted (menu, footer, home cards, sitemap): visitors and Google see a hollow page.
 * "drugs" is the drug guide hub (its own content), so it is always available.
 * While data is still loading nothing is hidden, to avoid links flickering away.
 */
export function useSectionAvailability() {
  const { articles, loading } = useStore();
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) if (a.status === "published") counts[a.category] = (counts[a.category] || 0) + 1;
    const hasContent = (cat: string) => loading || cat === "drugs" || (counts[cat] || 0) > 0;
    /** true for every path except an empty /category/<section> */
    const pathAvailable = (path: string | undefined | null) => {
      const m = path ? CATEGORY_PATH_RE.exec(path) : null;
      return !m || hasContent(m[1]);
    };
    return { hasContent, pathAvailable };
  }, [articles, loading]);
}
