import type { ComponentType } from "react";

/* ============================================================================
   مكوّنات الرسومات (SVG) الافتراضية لمكتبة "تعلّم قراءة رسم القلب".
   كل مكوّن مربوط باسمه في حقل "builtin" داخل src/lib/ecgLearnData.ts —
   لو الأدمن رفع صورة بديلة لخانة معيّنة، الواجهة العامة بتعرض الصورة دي
   بدل الـSVG تلقائيًا (شوف src/pages/ECGLearn.tsx و src/admin/ECGLearnAdmin.tsx).
   ============================================================================ */

export function HeartConductionSVG() {
  return (
    <svg viewBox="0 0 420 320" className="mx-auto w-full max-w-md">
      <path
        d="M 210 40 C 120 -20 20 40 20 130 C 20 210 100 260 210 300 C 320 260 400 210 400 130 C 400 40 300 -20 210 40 Z"
        fill="#fecaca"
        stroke="#b91c1c"
        strokeWidth="3"
      />
      {/* septum */}
      <line x1="210" y1="60" x2="210" y2="280" stroke="#b91c1c" strokeWidth="2" strokeDasharray="4 4" />
      {/* SA node */}
      <circle cx="150" cy="85" r="10" fill="#f59e0b" />
      <text x="150" y="70" textAnchor="middle" className="fill-slate-800 text-[11px] font-bold">SA</text>
      {/* AV node */}
      <circle cx="210" cy="150" r="9" fill="#0ea5e9" />
      <text x="210" y="140" textAnchor="middle" className="fill-slate-800 text-[11px] font-bold">AV</text>
      {/* His bundle + branches */}
      <line x1="210" y1="150" x2="210" y2="200" stroke="#0ea5e9" strokeWidth="4" />
      <path d="M210 200 C 190 220 150 240 120 255" stroke="#0ea5e9" strokeWidth="3" fill="none" />
      <path d="M210 200 C 230 220 270 240 300 255" stroke="#0ea5e9" strokeWidth="3" fill="none" />
      {/* purkinje fibers */}
      <path d="M120 255 L100 270 M120 255 L130 275 M120 255 L150 270" stroke="#0ea5e9" strokeWidth="2" fill="none" />
      <path d="M300 255 L320 270 M300 255 L290 275 M300 255 L270 270" stroke="#0ea5e9" strokeWidth="2" fill="none" />
      <text x="90" y="105" className="fill-slate-600 text-[10px] font-bold">RA</text>
      <text x="330" y="105" className="fill-slate-600 text-[10px] font-bold">LA</text>
      <text x="90" y="230" className="fill-slate-600 text-[10px] font-bold">RV</text>
      <text x="330" y="230" className="fill-slate-600 text-[10px] font-bold">LV</text>
    </svg>
  );
}

export function PQRSTWaveSVG({ highlight }: { highlight?: "p" | "qrs" | "st" | "t" | "pr" | "qt" }) {
  const hl = (part: string) => (highlight === part ? "#dc2626" : "#0f172a");
  return (
    <svg viewBox="0 0 420 160" className="mx-auto w-full max-w-lg">
      <rect x="0" y="0" width="420" height="160" fill="#fff1f2" opacity="0.4" />
      {Array.from({ length: 21 }).map((_, i) => (
        <line key={"v" + i} x1={i * 20} y1={0} x2={i * 20} y2={160} stroke="#fecdd3" strokeWidth={i % 5 === 0 ? 1.2 : 0.5} />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={"h" + i} x1={0} y1={i * 20} x2={420} y2={i * 20} stroke="#fecdd3" strokeWidth={i % 5 === 0 ? 1.2 : 0.5} />
      ))}
      <path
        d="M20,100 L60,100 Q70,85 80,100 L95,100 L100,140 L112,40 L124,110 L140,100 L160,100 Q185,75 210,100 L260,100"
        fill="none"
        stroke="#0f172a"
        strokeWidth="3"
      />
      <text x="70" y="80" textAnchor="middle" fontWeight="bold" fill={hl("p")}>P</text>
      <text x="112" y="35" textAnchor="middle" fontWeight="bold" fill={hl("qrs")}>R</text>
      <text x="100" y="150" textAnchor="middle" fontWeight="bold" fill={hl("qrs")}>Q</text>
      <text x="124" y="128" textAnchor="middle" fontWeight="bold" fill={hl("qrs")}>S</text>
      <text x="195" y="80" textAnchor="middle" fontWeight="bold" fill={hl("t")}>T</text>
      {/* brackets */}
      <line x1="60" y1="112" x2="100" y2="112" stroke={hl("pr")} strokeWidth="2" />
      <text x="80" y="127" textAnchor="middle" fontSize="10" fill={hl("pr")}>PR interval</text>
      <line x1="112" y1="150" x2="160" y2="150" stroke={hl("st")} strokeWidth="2" />
      <text x="136" y="163" textAnchor="middle" fontSize="10" fill={hl("st")}>ST segment</text>
      <line x1="100" y1="20" x2="210" y2="20" stroke={hl("qt")} strokeWidth="2" />
      <text x="155" y="14" textAnchor="middle" fontSize="10" fill={hl("qt")}>QT interval</text>
    </svg>
  );
}

export function LeadDirectionSVG() {
  return (
    <svg viewBox="0 0 380 200" className="mx-auto w-full max-w-md">
      <circle cx="130" cy="100" r="14" fill="#0ea5e9" />
      <text x="130" y="105" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">+</text>
      <line x1="150" y1="100" x2="260" y2="100" stroke="#0ea5e9" strokeWidth="3" markerEnd="url(#arrow)" />
      <path d="M170,60 L150,80 L170,80 L180,50 L190,90 L200,60 L215,80 L260,80" fill="none" stroke="#16a34a" strokeWidth="3" />
      <text x="215" y="45" textAnchor="middle" fill="#16a34a" fontWeight="bold" fontSize="12">positive wave</text>
      <text x="130" y="130" textAnchor="middle" fontSize="11" fill="#334155">اتجاه التيار = اتجاه القطب</text>
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#0ea5e9" />
        </marker>
      </defs>
    </svg>
  );
}

export function GraphPaperSVG() {
  return (
    <svg viewBox="0 0 220 220" className="mx-auto w-56">
      {Array.from({ length: 23 }).map((_, i) => (
        <line key={"v" + i} x1={i * 10} y1={0} x2={i * 10} y2={220} stroke="#fda4af" strokeWidth={i % 5 === 0 ? 1.4 : 0.4} />
      ))}
      {Array.from({ length: 23 }).map((_, i) => (
        <line key={"h" + i} x1={0} y1={i * 10} x2={220} y2={i * 10} stroke="#fda4af" strokeWidth={i % 5 === 0 ? 1.4 : 0.4} />
      ))}
      <rect x="0" y="0" width="10" height="10" fill="#fb7185" opacity="0.5" />
      <rect x="0" y="0" width="50" height="50" fill="none" stroke="#be123c" strokeWidth="2" />
    </svg>
  );
}

export function ChestLeadsSVG() {
  return (
    <svg viewBox="0 0 260 220" className="mx-auto w-full max-w-sm">
      <path d="M130 10 C 60 10 40 60 45 110 C 50 170 90 205 130 215 C 170 205 210 170 215 110 C 220 60 200 10 130 10 Z" fill="#fde8e8" stroke="#94a3b8" strokeWidth="2" />
      {[
        { x: 105, y: 70, l: "V1" },
        { x: 155, y: 70, l: "V2" },
        { x: 130, y: 90, l: "V3" },
        { x: 130, y: 115, l: "V4" },
        { x: 165, y: 120, l: "V5" },
        { x: 195, y: 125, l: "V6" },
      ].map((p) => (
        <g key={p.l}>
          <circle cx={p.x} cy={p.y} r="6" fill="#dc2626" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">{p.l}</text>
        </g>
      ))}
      <circle cx="20" cy="20" r="7" fill="#f59e0b" />
      <text x="20" y="8" textAnchor="middle" fontSize="10" fontWeight="bold">RA</text>
      <circle cx="240" cy="20" r="7" fill="#f59e0b" />
      <text x="240" y="8" textAnchor="middle" fontSize="10" fontWeight="bold">LA</text>
      <circle cx="80" cy="210" r="7" fill="#16a34a" />
      <text x="80" y="222" textAnchor="middle" fontSize="10" fontWeight="bold">RL</text>
      <circle cx="180" cy="210" r="7" fill="#16a34a" />
      <text x="180" y="222" textAnchor="middle" fontSize="10" fontWeight="bold">LL</text>
    </svg>
  );
}

export function AxisWheelSVG() {
  const spokes = [
    { deg: -150, label: "aVR" },
    { deg: -30, label: "aVL" },
    { deg: 0, label: "I" },
    { deg: 60, label: "II" },
    { deg: 90, label: "aVF" },
    { deg: 120, label: "III" },
  ];
  const cx = 120, cy = 120, r = 95;
  return (
    <svg viewBox="0 0 240 240" className="mx-auto w-full max-w-xs">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
      {spokes.map((s) => {
        const rad = (s.deg * Math.PI) / 180;
        const x2 = cx + r * Math.cos(rad);
        const y2 = cy + r * Math.sin(rad);
        const lx = cx + (r + 16) * Math.cos(rad);
        const ly = cy + (r + 16) * Math.sin(rad);
        return (
          <g key={s.label}>
            <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="1.2" />
            <text x={lx} y={ly} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">{s.label}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="4" fill="#dc2626" />
      <path d={`M ${cx} ${cy} L ${cx + 80 * Math.cos((-15 * Math.PI) / 180)} ${cy + 80 * Math.sin((-15 * Math.PI) / 180)}`} stroke="#dc2626" strokeWidth="3" markerEnd="url(#axisArrow)" />
      <defs>
        <marker id="axisArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#dc2626" />
        </marker>
      </defs>
    </svg>
  );
}

export function BundleBranchCompareSVG() {
  const beat = (kind: "normal" | "rbbb" | "lbbb") => {
    if (kind === "rbbb") return "M0,30 L6,30 L10,6 L14,40 L18,18 L22,30 L34,30";
    if (kind === "lbbb") return "M0,30 L4,45 L8,35 L12,50 L18,20 L26,30 L34,30";
    return "M0,30 L6,30 L10,6 L14,40 L18,30 L34,30";
  };
  return (
    <svg viewBox="0 0 380 120" className="mx-auto w-full max-w-md">
      {["V1", "V6"].map((lead, li) =>
        (["normal", "rbbb", "lbbb"] as const).map((kind, ki) => (
          <g key={lead + kind} transform={`translate(${ki * 120 + 20},${li * 55 + 20})`}>
            <path d={beat(lead === "V1" ? kind : kind === "rbbb" ? "lbbb" : kind === "lbbb" ? "rbbb" : "normal")} fill="none" stroke="#0f172a" strokeWidth="2.5" />
            {li === 0 && (
              <text x="17" y="-8" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
                {kind === "normal" ? "Normal" : kind === "rbbb" ? "RBBB" : "LBBB"}
              </text>
            )}
            {ki === 0 && (
              <text x="-12" y="30" fontSize="10" fontWeight="bold" fill="#64748b">{lead}</text>
            )}
          </g>
        ))
      )}
    </svg>
  );
}

export function STCompareSVG() {
  const shape = (kind: "normal" | "elevated" | "depressed") => {
    const stY = kind === "elevated" ? 22 : kind === "depressed" ? 38 : 30;
    return `M0,30 L6,30 L10,10 L14,45 L18,${stY} L26,${stY} L34,18 L44,30`;
  };
  return (
    <svg viewBox="0 0 380 70" className="mx-auto w-full max-w-md">
      {(["normal", "elevated", "depressed"] as const).map((k, i) => (
        <g key={k} transform={`translate(${i * 120 + 20},18)`}>
          <line x1="-6" y1="30" x2="120" y2="30" stroke="#fecdd3" strokeWidth="1" />
          <path d={shape(k)} fill="none" stroke={k === "elevated" ? "#dc2626" : k === "depressed" ? "#0ea5e9" : "#0f172a"} strokeWidth="2.5" />
          <text x="20" y="-4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
            {k === "normal" ? "Iso-electric" : k === "elevated" ? "Elevated ST" : "Depressed ST"}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function PWaveShapesSVG() {
  const shape = (kind: "normal" | "mitral" | "pulmonale") => {
    if (kind === "mitral") return "M0,20 Q4,4 9,14 Q13,4 18,20";
    if (kind === "pulmonale") return "M0,20 Q9,-4 18,20";
    return "M0,20 Q9,8 18,20";
  };
  return (
    <svg viewBox="0 0 320 50" className="mx-auto w-full max-w-sm">
      {(["normal", "mitral", "pulmonale"] as const).map((k, i) => (
        <g key={k} transform={`translate(${i * 100 + 20},20)`}>
          <line x1="-8" y1="20" x2="90" y2="20" stroke="#fecdd3" strokeWidth="1" />
          <path d={shape(k)} fill="none" stroke="#0f172a" strokeWidth="2.5" />
          <text x="9" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
            {k === "normal" ? "Normal" : k === "mitral" ? "P Mitral" : "P Pulmonale"}
          </text>
        </g>
      ))}
    </svg>
  );
}

export const ECG_LEARN_SVG_REGISTRY: Record<string, ComponentType<any>> = {
  HeartConductionSVG,
  PQRSTWaveSVG,
  LeadDirectionSVG,
  GraphPaperSVG,
  ChestLeadsSVG,
  AxisWheelSVG,
  BundleBranchCompareSVG,
  STCompareSVG,
  PWaveShapesSVG,
};
