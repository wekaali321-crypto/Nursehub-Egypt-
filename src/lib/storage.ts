import { supabase, isSupabaseEnabled } from "./supabase";
import { compressToWebP, humanSize } from "./image";
import type { MediaItem } from "./types";

export const STORAGE_BUCKET = "media";

function detectType(name: string): MediaItem["type"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  return "doc";
}

export interface UploadResult {
  item: MediaItem;
}

/**
 * Uploads a file to Supabase Storage (production) or creates a local object URL
 * (preview/demo). Images are auto-compressed and converted to WebP.
 *
 * Returns a MediaItem ready to be stored in the `media` table.
 */
export async function uploadFile(file: File, folder = "f-root"): Promise<UploadResult> {
  const type = detectType(file.name);
  let uploadBlob: Blob = file;
  let name = file.name;
  let size = file.size;

  // Auto-optimize images → WebP
  if (type === "image") {
    const out = await compressToWebP(file);
    // compressToWebP returns an object URL; refetch as blob for upload
    try {
      const res = await fetch(out.url);
      uploadBlob = await res.blob();
      size = out.size;
      name = file.name.replace(/\.[^.]+$/, ".webp");
    } catch {
      uploadBlob = file;
    }
  }

  const id = "m" + Date.now() + Math.floor(Math.random() * 1000);
  const path = `${folder}/${id}-${name}`;

  if (isSupabaseEnabled && supabase) {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, uploadBlob, { cacheControl: "3600", upsert: false, contentType: uploadBlob.type || undefined });
    if (error) throw error;
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return {
      item: {
        id,
        name,
        type,
        url: data.publicUrl,
        size: humanSize(size),
        date: new Date().toISOString().slice(0, 10),
        folder,
      },
    };
  }

  // Local fallback (object URL) — used only when Supabase isn't configured
  const url = URL.createObjectURL(uploadBlob);
  return {
    item: { id, name, type, url, size: humanSize(size), date: new Date().toISOString().slice(0, 10), folder },
  };
}

/** Delete a file from Supabase Storage (no-op in local mode). */
export async function deleteStorageFile(item: MediaItem) {
  if (isSupabaseEnabled && supabase && item.url.includes(STORAGE_BUCKET)) {
    const idx = item.url.indexOf(`${STORAGE_BUCKET}/`);
    if (idx >= 0) {
      const path = item.url.slice(idx + STORAGE_BUCKET.length + 1).split("?")[0];
      await supabase.storage.from(STORAGE_BUCKET).remove([decodeURIComponent(path)]);
    }
  }
}

export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
export { detectType };
