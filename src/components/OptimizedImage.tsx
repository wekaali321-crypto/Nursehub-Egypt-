import { useState } from "react";

/**
 * Performance-friendly image:
 * - lazy loading + async decoding
 * - explicit aspect ratio (prevents layout shift / CLS)
 * - shimmer placeholder until loaded
 * - appends width param to Unsplash URLs to avoid downloading full-size images
 */
export default function OptimizedImage({
  src,
  alt,
  className = "",
  width = 800,
  ratio = "16/9",
  rounded = "",
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  ratio?: string;
  rounded?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const optimized = src.includes("images.unsplash.com")
    ? `${src.split("?")[0]}?w=${width}&q=75&auto=format&fit=crop`
    : src;

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${rounded}`} style={{ aspectRatio: ratio }}>
      {!loaded && <div className="absolute inset-0 nh-shimmer" aria-hidden="true" />}
      <img
        src={optimized}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      />
    </div>
  );
}
