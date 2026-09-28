import { useEffect, useMemo, useRef, useState } from "react";

// Triply periodic minimal surfaces (TPMS): the implicit functions behind the gyroid-family tiles.
// A sheet lattice is the set of points where |f| < t, so t (wall thickness) sets how much material there is.
const FAMILIES = {
  gyroid: {
    label: "Gyroid",
    f: (x: number, y: number, z: number) => Math.sin(x) * Math.cos(y) + Math.sin(y) * Math.cos(z) + Math.sin(z) * Math.cos(x),
  },
  schwarzP: {
    label: "Schwarz P",
    f: (x: number, y: number, z: number) => Math.cos(x) + Math.cos(y) + Math.cos(z),
  },
  diamond: {
    label: "Diamond",
    f: (x: number, y: number, z: number) =>
      Math.sin(x) * Math.sin(y) * Math.sin(z) + Math.sin(x) * Math.cos(y) * Math.cos(z) +
      Math.cos(x) * Math.sin(y) * Math.cos(z) + Math.cos(x) * Math.cos(y) * Math.sin(z),
  },
} as const;
type Family = keyof typeof FAMILIES;

const TAU = Math.PI * 2;

/** Fraction of one unit cell that is solid: Monte-Carlo-free, on a fixed 3D grid. */
function relativeDensity(fam: Family, t: number, n = 40) {
  const f = FAMILIES[fam].f;
  let solid = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++)
        if (Math.abs(f(((i + 0.5) / n) * TAU, ((j + 0.5) / n) * TAU, ((k + 0.5) / n) * TAU)) < t) solid++;
  return solid / n ** 3;
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function LatticeDemo() {
  const [fam, setFam] = useState<Family>("gyroid");
  const [t, setT] = useState(0.45);
  const [cells, setCells] = useState(3);
  const [z, setZ] = useState(0.25);
  const canvas = useRef<HTMLCanvasElement>(null);

  const rho = useMemo(() => relativeDensity(fam, t), [fam, t]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const size = 280;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = size * dpr;
    cv.height = size * dpr;
    const ctx = cv.getContext("2d")!;
    const img = ctx.createImageData(cv.width, cv.height);
    const f = FAMILIES[fam].f;
    const ink = hex(cssVar("--green") || "#3d7a57");
    const bg = hex(cssVar("--panel-2") || "#ecebe5");
    const zz = z * TAU;
    for (let py = 0; py < cv.height; py++) {
      for (let px = 0; px < cv.width; px++) {
        const v = Math.abs(f((px / cv.width) * cells * TAU, (py / cv.height) * cells * TAU, zz));
        // Soft edge over a narrow band so the walls don't alias.
        const a = Math.max(0, Math.min(1, (t - v) / 0.04 + 0.5));
        const o = (py * cv.width + px) * 4;
        img.data[o] = bg[0] + (ink[0] - bg[0]) * a;
        img.data[o + 1] = bg[1] + (ink[1] - bg[1]) * a;
        img.data[o + 2] = bg[2] + (ink[2] - bg[2]) * a;
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [fam, t, cells, z]);

  // Gibson–Ashby: bending-dominated foams scale stiffness with density squared (C ≈ 1).
  const stiffness = rho * rho;

  return (
    <div className="demo-body lattice">
      <div className="lattice-grid">
        <canvas ref={canvas} className="lattice-canvas" style={{ width: 280, height: 280 }} aria-label={`${FAMILIES[fam].label} lattice cross-section`} />
        <div className="lattice-controls">
          <div className="seg" role="tablist">
            {(Object.keys(FAMILIES) as Family[]).map((k) => (
              <button key={k} className={k === fam ? "on" : ""} onClick={() => setFam(k)}>{FAMILIES[k].label}</button>
            ))}
          </div>
          <Slider label="Wall thickness" value={t} min={0.1} max={1.1} step={0.01} onChange={setT} fmt={(v) => v.toFixed(2)} />
          <Slider label="Cells across" value={cells} min={1} max={6} step={1} onChange={setCells} fmt={(v) => String(v)} />
          <Slider label="Slice height" value={z} min={0} max={1} step={0.01} onChange={setZ} fmt={(v) => `${Math.round(v * 100)}%`} />
          <div className="readout">
            <div className="readout-row"><span>relative density</span><b>{(rho * 100).toFixed(1)}%</b></div>
            <div className="readout-row"><span>relative stiffness ≈ ρ²</span><b>{(stiffness * 100).toFixed(1)}%</b></div>
            <div className="bar"><span style={{ transform: `scaleX(${rho})` }} /></div>
          </div>
        </div>
      </div>
      <p className="demo-foot">
        A 2D slice through the same implicit surfaces the tile generator meshes into printable STL. Density is measured
        on a 40³ grid; stiffness uses Gibson–Ashby scaling, the same physics prior built into the ML surrogate.
        Illustrative only: these aren't test results.
      </p>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string;
}) {
  return (
    <label className="slider">
      <span>{label}<b>{fmt(value)}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function hex(c: string): [number, number, number] {
  const m = c.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}
