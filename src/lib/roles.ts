export type Role = "superadmin" | "admin" | "editor" | "author" | "viewer";

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "مدير عام (Super Admin)",
  admin: "مدير (Admin)",
  editor: "محرر (Editor)",
  author: "كاتب (Author)",
  viewer: "مشاهد (Viewer)",
};

export const ROLE_COLORS: Record<Role, string> = {
  superadmin: "bg-rose-100 text-rose-600 dark:bg-rose-500/10",
  admin: "bg-sky-100 text-sky-600 dark:bg-sky-500/10",
  editor: "bg-violet-100 text-violet-600 dark:bg-violet-500/10",
  author: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10",
  viewer: "bg-slate-200 text-slate-600 dark:bg-slate-700",
};

export type Permission =
  | "manage_settings"
  | "manage_users"
  | "manage_monetization"
  | "publish"
  | "edit_any"
  | "edit_own"
  | "delete"
  | "comment_moderate"
  | "view";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: ["manage_settings", "manage_users", "manage_monetization", "publish", "edit_any", "edit_own", "delete", "comment_moderate", "view"],
  admin: ["manage_monetization", "publish", "edit_any", "edit_own", "delete", "comment_moderate", "view"],
  editor: ["publish", "edit_any", "edit_own", "comment_moderate", "view"],
  author: ["edit_own", "view"],
  viewer: ["view"],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_settings: "إدارة الإعدادات",
  manage_users: "إدارة المستخدمين",
  manage_monetization: "إدارة تحقيق الدخل",
  publish: "نشر المحتوى",
  edit_any: "تعديل أي محتوى",
  edit_own: "تعديل محتواه فقط",
  delete: "الحذف",
  comment_moderate: "إدارة التعليقات",
  view: "العرض",
};

export function can(role: Role, perm: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}
