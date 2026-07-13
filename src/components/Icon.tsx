/**
 * Unified medical/nursing SVG icon set — replaces emoji for a professional look.
 * All icons inherit `currentColor` and scale via the `size` prop.
 */
export type IconName =
  | "article" | "summary" | "drug" | "skill" | "careplan" | "book"
  | "quiz" | "tools" | "store" | "search" | "heart" | "heartFilled"
  | "clock" | "eye" | "download" | "share" | "check" | "shield"
  | "stethoscope" | "pill" | "syringe" | "chart" | "star" | "starFilled"
  | "arrowLeft" | "arrowRight" | "user" | "calendar" | "bell" | "cart"
  | "verified" | "reference" | "warning" | "brain" | "calculator" | "cross";

import type { ReactElement } from "react";

const paths: Record<IconName, ReactElement> = {
  article: <><path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M14 4v5h5M7 13h8M7 17h5" /></>,
  summary: <><path d="M4 5h16M4 10h16M4 15h10M4 20h7" /></>,
  drug: <><rect x="3" y="8" width="12" height="8" rx="4" transform="rotate(45 9 12)" /><path d="M9 6.5 15 12.5" /></>,
  skill: <><path d="M6 3v6a6 6 0 0 0 12 0V3" /><circle cx="6" cy="3" r="1.4" /><circle cx="18" cy="3" r="1.4" /><path d="M12 15v3a3 3 0 0 0 6 0v-2" /><circle cx="19" cy="14" r="2" /></>,
  careplan: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 3v2h6V3M8 11h2v2H8zM8 15h2v2H8zM13 12h4M13 16h4" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>,
  quiz: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 9a2 2 0 1 1 3 1.6c-.6.4-1 .8-1 1.4M9.5 15h.01" /></>,
  tools: <><path d="M14 7a4 4 0 0 0-5.5 4.5L3 17l4 4 5.5-5.5A4 4 0 0 0 17 10l-2.5 2.5L12 10l2.5-2.5Z" /></>,
  store: <><path d="M4 9h16l-1 11H5L4 9Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  heart: <><path d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z" /></>,
  heartFilled: <><path d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z" fill="currentColor" stroke="none" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  check: <><path d="m4 12 5 5L20 6" /></>,
  shield: <><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  stethoscope: <><path d="M6 3v6a6 6 0 0 0 12 0V3" /><circle cx="6" cy="3" r="1.4" /><circle cx="18" cy="3" r="1.4" /><path d="M12 15v3a3 3 0 0 0 6 0v-2" /><circle cx="19" cy="14" r="2" /></>,
  pill: <><rect x="3" y="8" width="12" height="8" rx="4" transform="rotate(45 9 12)" /></>,
  syringe: <><path d="m18 2 4 4M17 5 5 17l-2 4 4-2L19 7M14 6l4 4M9 13l2 2" /></>,
  chart: <><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7" /></>,
  star: <><path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 19.6l1.1-6L3.4 9.4l6-.8L12 3Z" /></>,
  starFilled: <><path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 19.6l1.1-6L3.4 9.4l6-.8L12 3Z" fill="currentColor" stroke="none" /></>,
  arrowLeft: <><path d="M19 12H5m6-6-6 6 6 6" /></>,
  arrowRight: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.5 13h11l2-8H6" /></>,
  verified: <><path d="m12 2 2.5 2 3.5-.5.5 3.5 2 2.5-2 2.5-.5 3.5-3.5-.5L12 22l-2.5-2-3.5.5-.5-3.5L3.5 15l2-2.5-.5-3.5 3.5.5L12 2Z" /><path d="m9 12 2 2 4-4" /></>,
  reference: <><path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M14 4v5h5M8 14h6M8 17h4" /></>,
  warning: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 9v5M12 17h.01" /></>,
  brain: <><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 5 3 3 0 0 0 5 1V4a3 3 0 0 0-3 0Zm6 0a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 5 3 3 0 0 1-5 1" /></>,
  calculator: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v4M8 19h4" /></>,
  cross: <><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" /></>,
};

export default function Icon({ name, size = 20, className = "", strokeWidth = 1.9 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
