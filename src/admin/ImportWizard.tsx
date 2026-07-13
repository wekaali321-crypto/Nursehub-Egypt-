import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, slugify } from "../lib/store";
import { useToast } from "../components/Toast";
import { uploadFile } from "../lib/storage";
import { insertImagesIntoHtml, type MatchedImage } from "../lib/importWizard";
import type { Article, Category } from "../lib/types";
import StepIndicator from "./wizard/StepIndicator";
import Step1Input from "./wizard/Step1Input";
import Step2Structure from "./wizard/Step2Structure";
import Step3Enhancements from "./wizard/Step3Enhancements";
import Step4Seo from "./wizard/Step4Seo";
import Step5Publish from "./wizard/Step5Publish";
import type { GeneratedBlock, WizardStep } from "./wizard/types";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1000&q=80";

function useElapsedTimer() {
  const [seconds, setSeconds] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - start.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return { label: `${mm}:${ss}`, seconds };
}

export default function ImportWizard() {
  const { articles, setData, logActivity, pushNotification } = useStore();
  const { notify } = useToast();
  const nav = useNavigate();
  const timer = useElapsedTimer();

  const [step, setStep] = useState<WizardStep>(1);
  const [busy, setBusy] = useState(false);

  // Step 1 output
  const [rawHtml, setRawHtml] = useState("");
  const [images, setImages] = useState<MatchedImage[]>([]);

  // Step 2 output
  const [processedHtml, setProcessedHtml] = useState("");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [category, setCategory] = useState<Category>("articles");
  const [tags, setTags] = useState("");
  const [author, setAuthor] = useState("المدير العام");
  const [coverImageId, setCoverImageId] = useState("");

  // Step 3 output
  const [blocks, setBlocks] = useState<GeneratedBlock[]>([]);

  // Step 4 output
  const [excerpt, setExcerpt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [slug, setSlug] = useState("");
  const [references, setReferences] = useState("");

  const existingSlugs = articles.map((a) => a.slug);

  // Compose the final HTML: processed body + selected AI-generated blocks + references.
  const composeFinalHtml = () => {
    let html = insertImagesIntoHtml(processedHtml, images);
    const selected = blocks.filter((b) => b.selected);
    if (selected.length) {
      html += `\n<hr class="nh-divider"/>\n<h2>📚 ملحق تفاعلي — تم توليده بالذكاء الاصطناعي من محتوى المقال</h2>\n` + selected.map((b) => b.html).join("\n");
    }
    if (references.trim()) {
      html += `\n<div class="nh-box nh-info"><strong>🔖 المراجع:</strong><p>${references.replace(/\n/g, "<br/>")}</p></div>`;
    }
    return html;
  };

  const handleStep1Processed = (html: string, _sourceType: string, warnings: string[], imgs: MatchedImage[]) => {
    setRawHtml(html);
    setImages(imgs);
    if (warnings.length) warnings.forEach((w) => notify(w, "info"));
    setStep(2);
  };

  const handleStep2Next = (payload: { processedHtml: string; title: string; titleEn: string; category: Category; tags: string; author: string; coverImageId: string; images: MatchedImage[] }) => {
    setProcessedHtml(payload.processedHtml);
    setTitle(payload.title);
    setTitleEn(payload.titleEn);
    setCategory(payload.category);
    setTags(payload.tags);
    setAuthor(payload.author);
    setCoverImageId(payload.coverImageId);
    setImages(payload.images);
    setStep(3);
  };

  const handleStep3Next = (generated: GeneratedBlock[]) => {
    setBlocks(generated);
    setStep(4);
  };

  const handleStep4Next = (payload: { excerpt: string; metaTitle: string; metaDescription: string; keywords: string; slug: string; references: string }) => {
    setExcerpt(payload.excerpt);
    setMetaTitle(payload.metaTitle);
    setMetaDescription(payload.metaDescription);
    setKeywords(payload.keywords);
    setSlug(payload.slug || slugify(title));
    setReferences(payload.references);
    setStep(5);
  };

  const publish = async (status: "draft" | "published" | "scheduled" | "private", publishDate: string) => {
    setBusy(true);
    try {
      // 1) Upload every wizard image to permanent Supabase Storage (or local fallback), then
      //    swap the temporary data URLs inside the article body for the permanent URLs.
      const urlMap = new Map<string, string>();
      let coverUrl = FALLBACK_COVER;

      for (const img of images) {
        try {
          const { item } = await uploadFile(img.file, "articles");
          urlMap.set(img.dataUrl, item.url);
          setData((d) => ({ ...d, media: [item, ...d.media] }));
          if (img.id === coverImageId) coverUrl = item.url;
        } catch {
          notify(`تعذّر رفع الصورة "${img.name}" — سيتم استخدام معاينة محلية مؤقتة.`, "info");
          urlMap.set(img.dataUrl, img.dataUrl);
          if (img.id === coverImageId) coverUrl = img.dataUrl;
        }
      }

      // 2) Build the full article body (processed content + images + AI blocks + references),
      // then swap every temporary image data-URL for its permanent, uploaded Storage URL.
      let finalHtml = composeFinalHtml();
      urlMap.forEach((permanentUrl, dataUrl) => {
        finalHtml = finalHtml.split(dataUrl).join(permanentUrl);
      });

      const finalSlug = existingSlugs.includes(slug) ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

      // 3) Merge explicit tags with AI-suggested keywords (deduped) so SEO keywords also power on-site tag search.
      const explicitTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const kwTags = keywords.split(/[،,]/).map((k) => k.trim()).filter(Boolean);
      const mergedTags = Array.from(new Set([...explicitTags, ...kwTags]));

      const article: Article = {
        id: "a" + Date.now(),
        title,
        slug: finalSlug || slugify(title),
        category,
        excerpt: excerpt || title,
        content: finalHtml,
        cover: coverUrl,
        tags: mergedTags,
        author,
        status,
        publishDate,
        updatedDate: new Date().toISOString().slice(0, 10),
        views: 0,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        titleEn: titleEn || undefined,
      };

      setData((d) => ({ ...d, articles: [article, ...d.articles] }));
      logActivity("إنشاء مقال عبر معالج الاستيراد الذكي", article.title);
      if (status === "published") pushNotification("system", `تم نشر مقال جديد عبر المعالج الذكي: ${article.title}`);
      notify(`✅ تم إنشاء المقال في ${timer.label} دقيقة!`, "success");
      nav("/admin/articles");
    } catch (err) {
      notify("حدث خطأ أثناء الحفظ — حاول مرة أخرى.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dark:text-white">🪄 معالج الاستيراد الذكي</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">أنشئ مقالاً احترافياً كاملاً في أقل من 5 دقائق.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 font-mono text-sm font-bold text-white dark:bg-sky-500">
          ⏱ {timer.label}
        </div>
      </div>

      <StepIndicator step={step} onJump={setStep} />

      {step === 1 && <Step1Input onProcessed={handleStep1Processed} />}

      {step === 2 && (
        <Step2Structure
          rawHtml={rawHtml}
          images={images}
          initial={{ title, titleEn, category, tags, author, coverImageId }}
          onBack={() => setStep(1)}
          onNext={handleStep2Next}
        />
      )}

      {step === 3 && (
        <Step3Enhancements html={insertImagesIntoHtml(processedHtml, images)} title={title} onBack={() => setStep(2)} onNext={handleStep3Next} />
      )}

      {step === 4 && (
        <Step4Seo title={title} html={processedHtml} existingSlugs={existingSlugs} onBack={() => setStep(3)} onNext={handleStep4Next} />
      )}

      {step === 5 && (
        <Step5Publish
          title={title}
          html={composeFinalHtml()}
          cover={images.find((i) => i.id === coverImageId)?.dataUrl ?? FALLBACK_COVER}
          category={category}
          author={author}
          references={references}
          busy={busy}
          onBack={() => setStep(4)}
          onPublish={publish}
        />
      )}
    </div>
  );
}
