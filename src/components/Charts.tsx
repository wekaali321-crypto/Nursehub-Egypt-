/** Lightweight dependency-free SVG charts (RTL-friendly). */

export function BarChart({ data, color = "#0ea5e9", height = 160 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{d.value}</span>
          <div className="w-full rounded-t-lg transition-all" style={{ height: `${(d.value / max) * (height - 40)}px`, background: `linear-gradient(to top, ${color}, ${color}cc)`, minHeight: 4 }} />
          <span className="text-[10px] text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data, color = "#10b981", height = 160 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const w = 300;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((d, i) => [i * step, height - 30 - (d.value / max) * (height - 50)]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]},${p[1]}`).join(" ");
  const area = `${path} L ${w},${height - 30} L 0,${height - 30} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} />)}
      {data.map((d, i) => <text key={i} x={i * step} y={height - 8} fontSize="9" textAnchor="middle" className="fill-slate-400">{d.label}</text>)}
    </svg>
  );
}

export function DonutChart({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const seg = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth="14" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return seg;
          })}
        </g>
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize="14" fontWeight="700" className="fill-slate-700 dark:fill-white">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-600 dark:text-slate-300">{d.label}</span>
            <span className="font-bold dark:text-white">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
