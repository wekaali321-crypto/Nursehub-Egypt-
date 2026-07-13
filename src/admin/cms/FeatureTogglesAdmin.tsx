import { useFeatures } from "./useFeatures";
import { useToast } from "../../components/Toast";
import { PageHeader, cardCls, Toggle } from "./ui";
import type { FeatureToggles } from "../../lib/types";

const FEATURE_META: { key: keyof FeatureToggles; label: string; description: string; icon: string }[] = [
  { key: "premiumPlans", label: "خطط Premium", description: "تفعيل الاشتراكات المدفوعة والمحتوى المميز", icon: "⭐" },
  { key: "store", label: "المتجر الرقمي", description: "بيع الكتب والكورسات وملفات PDF", icon: "🛒" },
  { key: "certificates", label: "الشهادات", description: "إصدار شهادات إتمام للاختبارات والكورسات", icon: "🏆" },
  { key: "exams", label: "الاختبارات", description: "نظام الاختبارات و NCLEX و Prometric", icon: "🎯" },
  { key: "drugGuide", label: "دليل الأدوية", description: "قاعدة بيانات الأدوية والجرعات", icon: "💊" },
  { key: "carePlans", label: "خطط الرعاية", description: "خطط الرعاية التمريضية NANDA", icon: "📋" },
  { key: "aiAssistant", label: "المساعد الذكي", description: "مساعد AI للإجابة على أسئلة التمريض", icon: "🤖" },
  { key: "community", label: "المجتمع", description: "التعليقات والتقييمات والتفاعل", icon: "💬" },
  { key: "newsletter", label: "النشرة البريدية", description: "الاشتراك في القائمة البريدية", icon: "📧" },
  { key: "courses", label: "الكورسات", description: "الكورسات التعليمية عبر الإنترنت (قريباً)", icon: "🎓" },
  { key: "ads", label: "الإعلانات", description: "عرض إعلانات Google AdSense", icon: "📢" },
  { key: "affiliate", label: "التسويق بالعمولة", description: "روابط ونظام العمولات", icon: "🔗" },
];

export default function FeatureTogglesAdmin() {
  const { features, update } = useFeatures();
  const { notify } = useToast();

  const handle = async (key: keyof FeatureToggles, value: boolean) => {
    await update(key, value);
    notify(`${value ? "تم تفعيل" : "تم تعطيل"} ${FEATURE_META.find((f) => f.key === key)?.label}`, value ? "success" : "info");
  };

  const enabledCount = Object.values(features).filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="مفاتيح الميزات"
        subtitle="فعّل أو عطّل أي ميزة فوراً دون الحاجة لإعادة النشر"
        icon="🎚️"
      />

      <div className="mb-6 rounded-2xl bg-gradient-to-l from-sky-500 to-emerald-500 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">الميزات المفعّلة</div>
            <div className="text-3xl font-black">{enabledCount} / {FEATURE_META.length}</div>
          </div>
          <div className="text-5xl opacity-80">⚡</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FEATURE_META.map((f) => (
          <div key={f.key} className={`${cardCls} flex items-center justify-between gap-4 p-4`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${features[f.key] ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-slate-100 dark:bg-slate-800"}`}>
                {f.icon}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-white">{f.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{f.description}</div>
              </div>
            </div>
            <Toggle checked={features[f.key]} onChange={(v) => handle(f.key, v)} />
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        💡 التغييرات تُحفظ فوراً في قاعدة البيانات وتؤثر على الموقع مباشرة لجميع الزوار.
      </p>
    </div>
  );
}
