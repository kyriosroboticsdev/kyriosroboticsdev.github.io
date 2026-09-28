import { useState, type PointerEvent, type ReactNode } from "react";

export interface Design {
  id: string; iteration: number; rho: number; cellMm: number; sea: number; stress20: number;
  plateau: number; plateauCv: number; eta: number; frontSea: boolean; frontEta: boolean;
  blend: [string, number][]; curve: [number, number][]; mesh: string | null; sizeMm?: number[]; tris?: number;
  frames?: { count: number; cols: number; px: number };
  meshDark?: string;
}

// Category colours come from theme tokens; each pair is validated against its own surface.
export const PURPLE = "var(--cat-1)"; // themed: purple in light mode, gold in dark (see styles.css)
export const AMBER = "var(--cat-2)";  // themed: amber in light mode, lavender in dark
export const catOf = (d: Design) => (d.frontEta ? "eta" : d.frontSea ? "sea" : "other");
export const colorOf = (d: Design) => (d.frontEta ? PURPLE : d.frontSea ? AMBER : "var(--line-2)");

const W = 900, H = 330, M = { l: 56, r: 20, t: 16, b: 42 };
const iw = W - M.l - M.r, ih = H - M.t - M.b;

function Frame({ children, tip, onMove, onLeave, onClick, label }: {
  children: ReactNode; tip: { x: number; y: number; body: ReactNode } | null; label: string;
  onMove: (x: number, y: number) => void; onLeave: () => void; onClick?: () => void;
}) {
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onMove(((e.clientX - r.left) / r.width) * W - M.l, ((e.clientY - r.top) / r.height) * H - M.t);
  };
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onPointerMove={move} onPointerLeave={onLeave} onClick={onClick}>
        <g transform={`translate(${M.l},${M.t})`}>{children}</g>
      </svg>
      {tip && (
        <div className="chart-tip" style={{ left: `${((tip.x + M.l) / W) * 100}%`, top: `${((tip.y + M.t) / H) * 100}%` }}>{tip.body}</div>
      )}
    </div>
  );
}

function Axes({ xt, yt, xl, yl }: { xt: [number, string][]; yt: [number, string][]; xl: string; yl: string }) {
  return (
    <g className="axes">
      {yt.map(([y, s]) => (
        <g key={s}><line x1={0} x2={iw} y1={y} y2={y} className="grid" /><text x={-8} y={y} dy="0.32em" textAnchor="end">{s}</text></g>
      ))}
      <line x1={0} x2={iw} y1={ih} y2={ih} className="base" />
      {xt.map(([x, s]) => <text key={s} x={x} y={ih + 16} textAnchor="middle">{s}</text>)}
      <text x={iw / 2} y={ih + 32} textAnchor="middle" className="ax-label">{xl}</text>
      <text transform={`translate(${-40},${ih / 2}) rotate(-90)`} textAnchor="middle" className="ax-label">{yl}</text>
    </g>
  );
}

/** Stress–strain from the FEA crush: every usable design faint, the selected one in its colour. */
export function StressStrain({ designs, selected }: { designs: Design[]; selected: Design }) {
  const ymax = Math.ceil(Math.max(...designs.flatMap((d) => d.curve.map((p) => p[1]))) / 500) * 500;
  const x = (s: number) => (s / 0.2) * iw, y = (v: number) => ih - (v / ymax) * ih;
  const path = (d: Design) => d.curve.map(([s, v], i) => `${i ? "L" : "M"}${x(s).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const [hx, setHx] = useState<number | null>(null);
  const hit = hx === null ? null : selected.curve.reduce((a, p) => (Math.abs(x(p[0]) - hx) < Math.abs(x(a[0]) - hx) ? p : a));
  return (
    <Frame label={`Stress–strain curve for ${selected.id} against the other usable designs`}
      onMove={(mx) => setHx(mx >= 0 && mx <= iw ? mx : null)} onLeave={() => setHx(null)}
      tip={hit ? { x: x(hit[0]), y: y(hit[1]), body: <><b>{selected.id}</b><br />{(hit[0] * 100).toFixed(1)}% strain · {hit[1].toFixed(0)} kPa</> } : null}>
      <Axes xl="nominal strain" yl="stress (kPa)"
        xt={[0, 0.05, 0.1, 0.15, 0.2].map((s) => [x(s), `${s * 100}%`])}
        yt={Array.from({ length: ymax / 500 + 1 }, (_, i) => [y(i * 500), String(i * 500)])} />
      {designs.filter((d) => d !== selected).map((d) => <path key={d.id} d={path(d)} className="ghost-line" />)}
      <path d={path(selected)} fill="none" stroke={colorOf(selected)} strokeWidth={2} />
      {hit && <><line x1={x(hit[0])} x2={x(hit[0])} y1={0} y2={ih} className="cross" /><circle cx={x(hit[0])} cy={y(hit[1])} r={4.5} fill={colorOf(selected)} stroke="var(--panel)" strokeWidth={2} /></>}
    </Frame>
  );
}

/** The finding: plateau stress vs cushioning efficiency. Click a featured design to load it. */
export function Tradeoff({ designs, selected, onPick }: { designs: Design[]; selected: Design; onPick: (d: Design) => void }) {
  const lx = (v: number) => ((Math.log10(v) - Math.log10(20)) / (Math.log10(3000) - Math.log10(20))) * iw;
  const pts = designs.filter((d) => d.plateau && d.eta);
  const lo = Math.floor(Math.min(...pts.map((d) => d.eta)) * 10) / 10;
  const y = (e: number) => ih - ((e - lo) / (0.9 - lo)) * ih;
  const [hover, setHover] = useState<Design | null>(null);
  const champ = pts.find((d) => d.id === "it018_1");
  const near = (mx: number, my: number) => {
    let best: Design | null = null, bd = 16 * 16;
    for (const d of pts) { const dd = (lx(d.plateau) - mx) ** 2 + (y(d.eta) - my) ** 2; if (dd < bd) { bd = dd; best = d; } }
    return best;
  };
  return (
    <Frame label="Cushioning efficiency against plateau stress for the 27 usable designs"
      onMove={(mx, my) => setHover(near(mx, my))} onLeave={() => setHover(null)}
      onClick={() => hover?.mesh && onPick(hover)}
      tip={hover ? { x: lx(hover.plateau), y: y(hover.eta), body: <><b>{hover.id}</b> · ρ {hover.rho.toFixed(2)}<br />η {hover.eta.toFixed(2)} · {hover.plateau.toFixed(0)} kPa{hover.mesh ? <><br /><i>click to view</i></> : null}</> } : null}>
      <Axes xl="plateau stress, 10–20% strain (kPa, log scale) → stiffer" yl="cushioning efficiency η"
        xt={[30, 100, 300, 1000].map((v) => [lx(v), String(v)])}
        yt={Array.from({ length: Math.round((0.9 - lo) * 10) + 1 }, (_, i) => lo + i / 10).map((e) => [y(e), e.toFixed(1)])} />
      {[...pts].sort((a, b) => Number(a.frontEta || a.frontSea) - Number(b.frontEta || b.frontSea)).map((d) => (
        <circle key={d.id} cx={lx(d.plateau)} cy={y(d.eta)} r={d === selected ? 7 : 5}
          fill={colorOf(d)} stroke={d === selected ? "var(--ink)" : "var(--panel)"} strokeWidth={2}
          style={{ cursor: d.mesh ? "pointer" : "default" }} />
      ))}
      {champ && <text x={lx(champ.plateau) - 12} y={y(champ.eta) + 4} textAnchor="end" className="note-text">loop's SEA champion →</text>}
    </Frame>
  );
}

/** Hypervolume of the screened Pareto front per iteration, until the loop stopped itself. */
export function Convergence({ history, reason }: { history: { iteration: number; hv: number }[]; reason: string }) {
  const n = history.length, max = Math.ceil(Math.max(...history.map((h) => h.hv)) / 1e5) * 1e5;
  const x = (i: number) => ((i - 1) / (n - 1)) * iw, y = (v: number) => ih - (v / max) * ih;
  const [hi, setHi] = useState<number | null>(null);
  const h = hi === null ? null : history[hi];
  return (
    <Frame label="Pareto hypervolume per loop iteration"
      onMove={(mx) => setHi(mx >= -8 && mx <= iw + 8 ? Math.max(0, Math.min(n - 1, Math.round((mx / iw) * (n - 1)))) : null)} onLeave={() => setHi(null)}
      tip={h ? { x: x(h.iteration), y: y(h.hv), body: <><b>iteration {h.iteration}</b><br />hypervolume {(h.hv / 1000).toFixed(0)}k</> } : null}>
      <Axes xl="loop iteration" yl="front hypervolume"
        xt={[1, 5, 10, 15, 20, 25].filter((i) => i <= n).map((i) => [x(i), String(i)])}
        yt={Array.from({ length: max / 1e5 + 1 }, (_, i) => [y(i * 1e5), `${i * 100}k`])} />
      <path d={history.map((p, i) => `${i ? "L" : "M"}${x(p.iteration)} ${y(p.hv)}`).join("")} fill="none" stroke={PURPLE} strokeWidth={2} />
      <text x={iw} y={y(history[n - 1].hv) + 22} textAnchor="end" className="note-text">stopped: {reason}</text>
      {h && <><line x1={x(h.iteration)} x2={x(h.iteration)} y1={0} y2={ih} className="cross" /><circle cx={x(h.iteration)} cy={y(h.hv)} r={4.5} fill={PURPLE} stroke="var(--panel)" strokeWidth={2} /></>}
    </Frame>
  );
}
