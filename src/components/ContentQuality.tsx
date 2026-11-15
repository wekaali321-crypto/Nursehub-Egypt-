import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CalendarCheck, Flag } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { saveSlot, useImageSlots } from "../lib/imageSlots";
import { Button } from "./ui";

/**
 * Content quality tools under every topic / article / drug page:
 *  - "Report an error": a short private message to the team. Stored as a pending row in `comments` with
 *    article_id "report:<path>" (no new table; reports are never public: visitors only read approved comments).
 *    One D1 write per report; the server caps visitor inserts per IP (comments: 10/hour).
 *  - "Last medical review": a date the ADMIN sets with one click (never invented). Kept in the image-slot table under
 *    `review:<path>`, which visitors already load (cached), so showing it costs no extra request.
 */
export default function ContentQuality() {
  const { pathname } = useLocation();
  const { lang } = useI18n();
  const ar = lang !== "en";
  const { loggedIn: admin } = useAuth();
  const slots = useImageSlots();
  const reviewKey = `review:${pathname}`;
  const reviewed = (() => { try { return slots[reviewKey] ? (JSON.parse(slots[reviewKey]) as { date: string }).date : ""; } catch { return ""; } })();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error" | "limited">("idle");
  const [busyReview, setBusyReview] = useState(false);

  const send = async () => {
    if (!supabase || text.trim().length < 5) return;
    setState("busy");
    const id = "rep-" + (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const { error } = await supabase.from("comments").insert({ id, article_id: `report:${pathname}`.slice(0, 300), name: "بلاغ خطأ", text: text.trim().slice(0, 1500), status: "pending" });
    if (!error) { setState("sent"); setText(""); return; }
    setState(/429|Too many/i.test(`${error.code} ${error.message}`) ? "limited" : "error");
  };
  const markReviewed = async () => {
    setBusyReview(true);
    try { await saveSlot(reviewKey, JSON.stringify({ date: new Date().toISOString().slice(0, 10) })); } finally { setBusyReview(false); }
  };
  const fmt = (d: string) => new Date(d).toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mt-4 space-y-3 print:hidden">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {reviewed && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400"><CalendarCheck size={16} className="text-nh-teal" aria-hidden="true" />{ar ? "آخر مراجعة طبية: " : "Last medical review: "}{fmt(reviewed)}</span>
        )}
        <button type="button" onClick={() => { setOpen((o) => !o); setState("idle"); }} aria-expanded={open} className="inline-flex items-center gap-1.5 font-bold text-nh-teal-dark hover:underline dark:text-teal-300">
          <Flag size={16} aria-hidden="true" />{ar ? "لقيت معلومة غلط؟ بلّغنا" : "Found a mistake? Tell us"}
        </button>
        {admin && (
          <Button size="sm" variant="outline" loading={busyReview} onClick={markReviewed} icon={<CalendarCheck size={14} aria-hidden="true" />}>
            {ar ? "تمت المراجعة الطبية اليوم" : "Medically reviewed today"}
          </Button>
        )}
      </div>
      {open && (
        <div className="rounded-2xl border border-nh-line bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {state === "sent" ? (
            <p className="font-bold text-nh-success">{ar ? "شكرًا! وصل البلاغ للفريق وهيتراجع." : "Thank you — the team will review it."}</p>
          ) : (
            <>
              <label htmlFor="report-text" className="mb-2 block text-sm font-bold text-nh-navy dark:text-slate-100">{ar ? "إيه المعلومة اللي محتاجة تصحيح؟ (ولو تعرف المصدر الصح اكتبه)" : "What needs correcting? (add the correct source if you know it)"}</label>
              <textarea id="report-text" rows={3} maxLength={1500} value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-xl border border-nh-line p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              {state === "error" && <p className="mt-1 text-sm font-bold text-nh-danger">{ar ? "ماوصلش، حاول تاني." : "Not sent, please try again."}</p>}
              {state === "limited" && <p className="mt-1 text-sm font-bold text-nh-danger">{ar ? "بعت بلاغات كتير، حاول بعد شوية." : "Too many reports, try again later."}</p>}
              <div className="mt-2 flex justify-end"><Button size="sm" loading={state === "busy"} disabled={text.trim().length < 5} onClick={send}>{ar ? "إرسال البلاغ" : "Send report"}</Button></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
