import { useCallback, useEffect, useState } from "react";
import { DEFAULT_ECG_LEARN_SECTIONS, ECG_LEARN_INTRO, type EcgLearnSection } from "./ecgLearnData";

const KEY = "nursehub_ecg_learn_v1";

export interface EcgLearnState {
  intro: { title: string; titleEn: string };
  sections: EcgLearnSection[];
  /** لكل قسم ولكل خانة صورة: undefined = استخدم الرسم الافتراضي، "" = محذوفة (فاضية)، غير كده = رابط صورة مرفوعة */
  images: Record<number, Record<string, string | undefined>>;
}

function defaultState(): EcgLearnState {
  return { intro: { ...ECG_LEARN_INTRO }, sections: DEFAULT_ECG_LEARN_SECTIONS, images: {} };
}

function mergeWithDefaults(saved: Partial<EcgLearnState> | null): EcgLearnState {
  const base = defaultState();
  if (!saved) return base;
  // ادمجي الأقسام: لو الأدمن عدّل قسم موجود استخدمي نسخته، ولو فيه قسم جديد ضيفته في الكود خدي الافتراضي
  const savedSections = saved.sections ?? [];
  const savedById = new Map(savedSections.map((s) => [s.id, s]));
  const sections = base.sections.map((def) => savedById.get(def.id) ?? def);
  return {
    intro: saved.intro ?? base.intro,
    sections,
    images: saved.images ?? {},
  };
}

function load(): EcgLearnState {
  try {
    const raw = localStorage.getItem(KEY);
    return mergeWithDefaults(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultState();
  }
}

function save(state: EcgLearnState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("ecg-learn-updated"));
  } catch {
    /* تجاهل أخطاء التخزين (مساحة ممتلئة مثلًا) */
  }
}

/** استخدميه في الواجهة العامة (ECGLearn.tsx) وفي لوحة التحكم لقراءة المحتوى الحالي */
export function useEcgLearnContent() {
  const [state, setState] = useState<EcgLearnState>(load);

  useEffect(() => {
    const onUpdate = () => setState(load());
    window.addEventListener("ecg-learn-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("ecg-learn-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const updateSection = useCallback((id: number, patch: Partial<EcgLearnSection>) => {
    setState((prev) => {
      const next: EcgLearnState = { ...prev, sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
      save(next);
      return next;
    });
  }, []);

  const updateIntro = useCallback((patch: Partial<EcgLearnState["intro"]>) => {
    setState((prev) => {
      const next: EcgLearnState = { ...prev, intro: { ...prev.intro, ...patch } };
      save(next);
      return next;
    });
  }, []);

  /** url = undefined لاسترجاع الرسم الافتراضي، "" لحذفها نهائيًا (تظهر فاضية)، أو رابط صورة مرفوعة */
  const setImage = useCallback((sectionId: number, slotKey: string, url: string | undefined) => {
    setState((prev) => {
      const sectionImages = { ...(prev.images[sectionId] ?? {}) };
      if (url === undefined) delete sectionImages[slotKey];
      else sectionImages[slotKey] = url;
      const next: EcgLearnState = { ...prev, images: { ...prev.images, [sectionId]: sectionImages } };
      save(next);
      return next;
    });
  }, []);

  const resetSection = useCallback((id: number) => {
    setState((prev) => {
      const def = DEFAULT_ECG_LEARN_SECTIONS.find((s) => s.id === id);
      if (!def) return prev;
      const images = { ...prev.images };
      delete images[id];
      const next: EcgLearnState = { ...prev, sections: prev.sections.map((s) => (s.id === id ? def : s)), images };
      save(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    const next = defaultState();
    save(next);
    setState(next);
  }, []);

  return { state, updateSection, updateIntro, setImage, resetSection, resetAll };
}
