import { useState } from "react";
import { useStore } from "../lib/store";
import type { Comment, Product, User } from "../lib/types";
import { ROLE_LABELS, ROLE_COLORS, ROLE_PERMISSIONS, PERMISSION_LABELS, type Role, type Permission } from "../lib/roles";
import { supabase } from "../lib/supabase";

export function CommentsAdmin() {
  const { comments, articles, setData } = useStore();
  const setStatus = (id: string, status: Comment["status"]) => setData((d) => ({ ...d, comments: d.comments.map((c) => (c.id === id ? { ...c, status } : c)) }));
  const del = (id: string) => setData((d) => ({ ...d, comments: d.comments.filter((c) => c.id !== id) }));
  const title = (aid: string) => articles.find((a) => a.id === aid)?.title ?? "—";

  return (
    <div className="space-y-3">
      {comments.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-400 dark:border-slate-700">لا توجد تعليقات</div>}
      {comments.map((c) => (
        <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2"><span className="font-bold dark:text-white">{c.name}</span><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.status === "approved" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-amber-100 text-amber-600 dark:bg-amber-500/10"}`}>{c.status === "approved" ? "معتمد" : "معلق"}</span></div>
              <div className="text-xs text-slate-400">على: {title(c.articleId)} • {c.date}</div>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{c.text}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              {c.status === "pending" && <button onClick={() => setStatus(c.id, "approved")} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">موافقة</button>}
              {c.status === "approved" && <button onClick={() => setStatus(c.id, "pending")} className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-white">إخفاء</button>}
              <button onClick={() => del(c.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

export function ProductsAdmin() {
  const { products, setData } = useStore();
  const [form, setForm] = useState<Partial<Product>>({ type: "pdf", price: 0 });
  const add = () => {
    if (!form.title) return alert("أدخل اسم المنتج");
    const p: Product = { id: "p" + Date.now(), title: form.title!, type: form.type as Product["type"], price: Number(form.price) || 0, oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined, cover: form.cover || "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80", description: form.description || "", sales: 0 };
    setData((d) => ({ ...d, products: [p, ...d.products] }));
    // Notify subscribed visitors that a new product/book is available.
    if (supabase) {
      supabase.functions.invoke("send-push", {
        body: {
          title: "📚 جديد في المتجر",
          body: p.title,
          link: `/product/${p.id}`,
          tag: p.id,
          role: "visitor",
        },
      }).catch(() => {}); // best-effort — never block saving on this
    }
    setForm({ type: "pdf", price: 0 });
  };
  const del = (id: string) => setData((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <img src={p.cover} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <div className="flex-1"><div className="font-bold dark:text-white">{p.title}</div><div className="text-sm text-emerald-500">{p.price} ج.م • {p.sales} مبيعة</div></div>
            <button onClick={() => del(p.id)} className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-bold text-red-600 dark:bg-red-500/10">حذف</button>
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">➕ منتج جديد</h3>
        <input placeholder="اسم المنتج" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Product["type"] })} className={inp}><option value="pdf">ملف PDF</option><option value="course">كورس</option><option value="subscription">اشتراك</option></select>
        <input type="number" placeholder="السعر" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={inp} />
        <input type="number" placeholder="السعر القديم (اختياري)" value={form.oldPrice ?? ""} onChange={(e) => setForm({ ...form, oldPrice: Number(e.target.value) })} className={inp} />
        <input placeholder="رابط الصورة" value={form.cover ?? ""} onChange={(e) => setForm({ ...form, cover: e.target.value })} className={inp} />
        <textarea placeholder="الوصف" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inp} />
        <button onClick={add} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">إضافة المنتج</button>
      </div>
    </div>
  );
}

const ALL_ROLES: Role[] = ["superadmin", "admin", "editor", "author", "viewer"];
const ALL_PERMS: Permission[] = ["manage_settings", "manage_users", "manage_monetization", "publish", "edit_any", "edit_own", "delete", "comment_moderate", "view"];

export function UsersAdmin() {
  const { users, setData, logActivity } = useStore();
  const [form, setForm] = useState<Partial<User>>({ role: "author" });
  const add = () => {
    if (!form.name || !form.email) return alert("أكمل البيانات");
    setData((d) => ({ ...d, users: [...d.users, { id: "u" + Date.now(), name: form.name!, email: form.email!, role: form.role as User["role"] }] }));
    logActivity("إضافة مستخدم", form.name!);
    setForm({ role: "author" });
  };
  const del = (id: string) => setData((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) }));
  const changeRole = (id: string, role: Role) => setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, role } : u)) }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"><tr><th className="p-3">الاسم</th><th className="p-3">البريد</th><th className="p-3">الصلاحية</th><th className="p-3"></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3 font-semibold dark:text-white">{u.name}</td>
                  <td className="p-3 text-slate-500">{u.email}</td>
                  <td className="p-3">
                    <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value as Role)} className={`rounded-full border-0 px-2 py-1 text-xs font-bold ${ROLE_COLORS[u.role as Role]}`}>
                      {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </td>
                  <td className="p-3">{u.role !== "superadmin" && <button onClick={() => del(u.id)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10">حذف</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold dark:text-white">➕ مستخدم جديد</h3>
          <input placeholder="الاسم" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
          <input placeholder="البريد الإلكتروني" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })} className={inp}>
            {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button onClick={add} className="w-full rounded-lg bg-sky-500 py-2 font-bold text-white">إضافة</button>
        </div>
      </div>

      {/* Permissions matrix */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 font-bold dark:text-white">🔐 مصفوفة الصلاحيات</h3>
        <table className="w-full text-right text-xs">
          <thead><tr><th className="p-2">الصلاحية</th>{ALL_ROLES.map((r) => <th key={r} className="p-2 text-center">{ROLE_LABELS[r].split(" ")[0]}</th>)}</tr></thead>
          <tbody>
            {ALL_PERMS.map((perm) => (
              <tr key={perm} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-2 font-semibold dark:text-white">{PERMISSION_LABELS[perm]}</td>
                {ALL_ROLES.map((r) => (
                  <td key={r} className="p-2 text-center">{ROLE_PERMISSIONS[r].includes(perm) ? <span className="text-emerald-500">✔</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
