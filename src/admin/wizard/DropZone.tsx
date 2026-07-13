import { useRef, useState, type ReactNode } from "react";

/** Generic drag & drop zone — click-to-browse fallback included. */
export default function DropZone({
  onFiles, accept, multiple = false, children, className = "",
}: {
  onFiles: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${dragOver ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" : "border-slate-300 hover:border-sky-400 dark:border-slate-700"} ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ""; }}
      />
      {children}
    </div>
  );
}
