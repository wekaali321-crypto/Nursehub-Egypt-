import { useCallback, useEffect, useState } from "react";

const KEY = "nursehub_ecg_pattern_images_v1";

/** لكل نمط: undefined = استخدم الرسم المتحرك الافتراضي، "" = محذوف (فاضي)، غير كده = رابط صورة مرفوعة */
type PatternImages = Record<string, string | undefined>;

function load(): PatternImages {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(state: PatternImages) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("ecg-pattern-images-updated"));
  } catch {
    /* تجاهل أخطاء التخزين */
  }
}

/** استخدميه في بطاقات المكتبة (ECGCard) ولوحة التحكم لقراءة/تعديل صورة كل نمط */
export function useEcgPatternImages() {
  const [images, setImages] = useState<PatternImages>(load);

  useEffect(() => {
    const onUpdate = () => setImages(load());
    window.addEventListener("ecg-pattern-images-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("ecg-pattern-images-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  /** url = undefined لاسترجاع الرسم المتحرك الافتراضي، "" لحذفه (يظهر فاضي)، أو رابط صورة مرفوعة */
  const setImage = useCallback((patternId: string, url: string | undefined) => {
    setImages((prev) => {
      const next = { ...prev };
      if (url === undefined) delete next[patternId];
      else next[patternId] = url;
      save(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    save({});
    setImages({});
  }, []);

  return { images, setImage, resetAll };
}
