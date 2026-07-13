import { useEffect, useState } from "react";

/** Thin gradient bar at the top showing article read progress. */
export default function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrollable = h.scrollHeight - h.clientHeight;
      setPct(scrollable > 0 ? Math.min(100, (h.scrollTop / scrollable) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent">
      <div className="h-full bg-gradient-to-l from-sky-500 to-emerald-500 transition-[width] duration-150" style={{ width: `${pct}%` }} />
    </div>
  );
}
