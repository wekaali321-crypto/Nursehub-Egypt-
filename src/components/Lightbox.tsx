// src/components/Lightbox.tsx
// Full-screen image viewer shared by the quiz runner and course chapters.
// Tap the image to toggle between "fit to screen" and full resolution (scrollable / pinch-zoomable).
import { useEffect, useState } from 'react';

export function ImageLightbox({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90" role="dialog" aria-modal="true" dir="ltr">
      <div className="flex items-center justify-between px-4 py-2 text-white">
        <button onClick={() => setFull((v) => !v)} className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold hover:bg-white/25">
          {full ? 'Fit' : '100%'}
        </button>
        <button onClick={onClose} aria-label="Close" className="rounded-full bg-white/15 px-3 py-1 text-lg leading-none hover:bg-white/25">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2" style={{ touchAction: 'pan-x pan-y pinch-zoom' }} onClick={onClose}>
        <img
          src={src}
          alt={alt ?? ''}
          onClick={(e) => {
            e.stopPropagation();
            setFull((v) => !v);
          }}
          className={full ? 'mx-auto max-w-none cursor-zoom-out' : 'mx-auto max-h-full max-w-full cursor-zoom-in object-contain'}
          style={full ? undefined : { maxHeight: 'calc(100vh - 70px)' }}
        />
      </div>
    </div>
  );
}

/** Image thumbnail that opens the lightbox on click. */
export function ZoomImage({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img src={src} alt={alt ?? ''} loading="lazy" onClick={() => setOpen(true)} className={`cursor-zoom-in ${className ?? ''}`} dir="ltr" />
      {open && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
