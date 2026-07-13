import { useEffect } from "react";

interface SEOOptions {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: object | object[];
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Centralized SEO hook: sets title, meta description/keywords, canonical,
 * Open Graph, Twitter Cards and one-or-many JSON-LD schema blocks.
 */
export function useSEO(opts: SEOOptions) {
  const { title, description = "", keywords = "", image = "", url, type = "website", jsonLd } = opts;

  useEffect(() => {
    document.title = title;

    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:description", description);
    }
    if (keywords) upsertMeta("name", "keywords", keywords);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:locale", "ar_EG");
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", title);

    if (image) {
      upsertMeta("property", "og:image", image);
      upsertMeta("name", "twitter:image", image);
    }

    const canonHref = url ?? window.location.href;
    upsertMeta("property", "og:url", canonHref);
    let canon = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) {
      canon = document.createElement("link");
      canon.rel = "canonical";
      document.head.appendChild(canon);
    }
    canon.href = canonHref;

    // JSON-LD
    document.querySelectorAll("script[data-seo-jsonld]").forEach((s) => s.remove());
    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      blocks.forEach((block) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", "true");
        script.textContent = JSON.stringify(block);
        document.head.appendChild(script);
      });
    }
  }, [title, description, keywords, image, url, type, JSON.stringify(jsonLd)]);
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * Auto-derive a FAQPage schema from any `<details><summary>` accordion blocks
 * present in the article content (FAQ blocks, MCQ blocks, flashcards).
 * Returns null when no such blocks exist — never fabricates content.
 */
export function extractFaqSchema(html: string): object | null {
  if (typeof window === "undefined" || !html) return null;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const items = Array.from(doc.querySelectorAll("details"))
      .map((d) => {
        const q = d.querySelector("summary")?.textContent?.trim();
        const clone = d.cloneNode(true) as HTMLElement;
        clone.querySelector("summary")?.remove();
        const a = clone.textContent?.replace(/\s+/g, " ").trim();
        return q && a ? { q, a } : null;
      })
      .filter(Boolean) as { q: string; a: string }[];
    if (!items.length) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Auto-derive a HowTo schema when the article contains a procedure/steps
 * block. Returns null when no such block exists.
 */
export function extractHowToSchema(html: string, name: string): object | null {
  if (typeof window === "undefined" || !html) return null;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const proc = doc.querySelector(".nh-procedure, .nh-steps");
    if (!proc) return null;
    const steps = Array.from(proc.querySelectorAll("li, .nh-step"))
      .map((el) => el.textContent?.replace(/\s+/g, " ").trim())
      .filter((t): t is string => !!t && t.length > 2);
    if (steps.length < 2) return null;
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name,
      step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
    };
  } catch {
    return null;
  }
}
