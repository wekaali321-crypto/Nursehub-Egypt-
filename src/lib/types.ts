export type Category =
  | "articles"
  | "summaries"
  | "drugs"
  | "skills"
  | "careplans"
  | "books";

export interface Article {
  id: string;
  title: string;
  slug: string;
  category: Category;
  excerpt: string;
  content: string; // HTML
  cover: string;
  tags: string[];
  author: string;
  status: "published" | "draft" | "scheduled" | "private" | "archived";
  publishDate: string;
  updatedDate?: string;
  views: number;
  featured?: boolean;
  videoUrl?: string;
  attachments?: { name: string; type: string; url: string }[];
  metaTitle?: string;
  metaDescription?: string;
  rating?: number; // average
  ratingCount?: number;
  // Bilingual fields (English). Arabic uses the base title/excerpt/content above.
  titleEn?: string;
  excerptEn?: string;
  contentEn?: string;
}

export interface Comment {
  id: string;
  articleId: string;
  name: string;
  text: string;
  date: string;
  status: "approved" | "pending";
}

export interface MediaItem {
  id: string;
  name: string;
  type: "image" | "video" | "pdf" | "doc" | "ppt" | "excel";
  url: string;
  size: string;
  date: string;
  folder?: string;
}

export interface MediaFolder {
  id: string;
  name: string;
}

export interface Drug {
  id: string;
  name: string;
  genericName: string;
  drugClass: string;
  category: string;
  dose: string;
  indications: string;
  sideEffects: string;
  nursingConsiderations: string;
  contraindications?: string;
  storage?: string;
  references?: string;
  slug: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: "published" | "draft";
}

export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export interface Subscriber {
  id: string;
  email: string;
  date: string;
  status: "active" | "unsubscribed";
  demo?: boolean;
}

export interface Ad {
  id: string;
  name: string;
  placement: string;
  type: "adsense" | "banner" | "sponsored";
  code: string;
  active: boolean;
}

export interface Affiliate {
  id: string;
  name: string;
  url: string;
  network: string;
  commission: string;
  clicks: number;
}

export interface Redirect {
  id: string;
  from: string;
  to: string;
  type: 301 | 302;
}

export interface ActivityEntry {
  id: string;
  action: string;
  target: string;
  user: string;
  date: string;
}

export interface Rating {
  id: string;
  articleId: string;
  value: number;
}

export interface Product {
  id: string;
  title: string;
  type: "pdf" | "course" | "subscription";
  price: number;
  oldPrice?: number;
  cover: string;
  description: string;
  sales: number;
  slug?: string;
  gallery?: string[];
  previewPdf?: string; // URL to a preview/sample PDF
  fullContent?: string; // long description (HTML)
  author?: string;
  pages?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "editor" | "author" | "viewer";
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  metaDescription: string;
  adsenseEnabled: boolean;
  adsenseClient: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  maintenanceUntil?: string;
  // Branding
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  // Hero
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  // Contact
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  // Social
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  telegram?: string;
  // SEO / Analytics
  gaId?: string;
  ogImage?: string;
}

/** Feature toggles — enable/disable modules instantly without redeploy. */
export interface FeatureToggles {
  premiumPlans: boolean;
  certificates: boolean;
  exams: boolean;
  drugGuide: boolean;
  aiAssistant: boolean;
  store: boolean;
  community: boolean;
  ads: boolean;
  affiliate: boolean;
  newsletter: boolean;
  carePlans: boolean;
  courses: boolean;
}

export const DEFAULT_FEATURES: FeatureToggles = {
  premiumPlans: false,
  certificates: true,
  exams: true,
  drugGuide: true,
  aiAssistant: true,
  store: true,
  community: true,
  ads: false,
  affiliate: false,
  newsletter: true,
  carePlans: true,
  courses: false,
};

export interface TrashEntry {
  id: string;
  type: "article" | "media" | "user";
  label: string;
  data: unknown; // the original record, restorable
  deletedAt: string;
}

export interface ArticleVersion {
  id: string;
  articleId: string;
  title: string;
  content: string;
  savedAt: string;
  author: string;
}

export interface AppNotification {
  id: string;
  type: "comment" | "user" | "system" | "backup" | "revenue" | "error";
  message: string;
  date: string;
  read: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number; // index
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string; // e.g. NCLEX, Prometric, general
  difficulty: "سهل" | "متوسط" | "صعب";
  timeLimit: number; // minutes, 0 = no limit
  passScore: number; // percentage
  questions: Question[];
  status: "published" | "draft";
  demo?: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number; // percentage
  correct: number;
  total: number;
  passed: boolean;
  date: string;
}

// Dynamic custom content types (create new sections without code)
export interface CustomType {
  id: string;
  name: string;       // "دراسات حالة"
  slug: string;       // "case-studies"
  icon: string;       // emoji
  fields: { key: string; label: string; type: "text" | "textarea" | "image" | "url" }[];
  demo?: boolean;
}

export interface CustomEntry {
  id: string;
  typeId: string;
  title: string;
  data: Record<string, string>;
  status: "published" | "draft";
  date: string;
  demo?: boolean;
}

export interface PaymentGateway {
  id: string;
  name: string;
  region: "eg" | "intl";
  enabled: boolean;
  mode: "sandbox" | "live";
  apiKey: string;
  secretKey: string;
  connected: boolean; // true only after a successful test with real keys
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  maxUses: number;
  used: number;
  minPurchase: number;
  expires: string;
  active: boolean;
  demo?: boolean;
}

export interface OrderItem { productId: string; title: string; price: number; qty: number }

export interface Order {
  id: string;
  invoiceNo: string;
  customerName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  couponCode?: string;
  gateway: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  transactionId?: string;
  date: string;
}

export interface CommerceSettings {
  currency: string;
  taxPercent: number;
  serviceFee: number;
  country: string;
}

// Fully dynamic homepage category cards — managed entirely from the admin panel.
export interface HomeCategory {
  id: string;
  title: string;
  icon: string;          // emoji or short text
  image?: string;        // optional cover image URL (from media library)
  description: string;
  color: string;         // tailwind gradient key, e.g. "from-sky-500 to-blue-500"
  order: number;         // display order
  visible: boolean;      // show / hide
  link: string;          // destination page or custom URL
  demo?: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  articles: "المقالات",
  summaries: "الملخصات",
  drugs: "الأدوية",
  skills: "المهارات",
  careplans: "خطط الرعاية",
  books: "الكتب وملفات PDF",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  articles: "📝",
  summaries: "📚",
  drugs: "💊",
  skills: "🩺",
  careplans: "📋",
  books: "📖",
};
