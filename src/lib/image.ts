/**
 * Compress an image file in the browser and convert it to WebP.
 * Returns a data/object URL plus the new size in bytes.
 * Falls back to the original file if processing fails.
 */
export async function compressToWebP(
  file: File,
  maxWidth = 1600,
  quality = 0.8
): Promise<{ url: string; size: number; type: string }> {
  if (!file.type.startsWith("image/")) {
    return { url: URL.createObjectURL(file), size: file.size, type: file.type };
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no ctx");
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    if (!blob) throw new Error("no blob");
    return { url: URL.createObjectURL(blob), size: blob.size, type: "image/webp" };
  } catch {
    return { url: URL.createObjectURL(file), size: file.size, type: file.type };
  }
}

export function humanSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}
