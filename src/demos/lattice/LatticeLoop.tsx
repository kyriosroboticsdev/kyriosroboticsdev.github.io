import { useEffect, useState } from "react";
import { Convergence, StressStrain, Tradeoff, AMBER, PURPLE, catOf, colorOf, type Design } from "./charts";
import { Turntable } from "./Turntable";
import { useTheme } from "../../lib/theme";

interface LoopData {
  run: string; solver: string; stopReason: string; stoppedAt: number;
  funnel: { attempted: number; printRejected: number; solverFailed: number; solved: number; usable: number };
  history: { iteration: number; hv: number }[];
  featured: string[];
  designs: Design[];
}

const BASE = import.meta.env.BASE_URL;

/** Real output of one self-running FEA design loop: meshes, curves and scores, exported by tools/export_lattice.py. */
export function LatticeLoop() {
  const [data, setData] = useState<LoopData | null>(null);
  const [sel, setSel] = useState<string>("it005_0");
  const [tab, setTab] = useState<"curve" | "tradeoff" | "loop">("tradeoff");
  const [theme] = useTheme();

  useEffect(() => {
    fetch(`${BASE}lattice/data.json`).then((r) => r.json()).then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <div className="demo-body"><p className="dim">Loading run data…</p></div>;
  const featured = data.featured.map((id) => data.designs.find((d) => d.id === id)!).filter(Boolean);
  const d = data.designs.find((x) => x.id === sel)!;
  const f = data.funnel;

  return (
    <div className="demo-body loop">
      <div className="funnel" aria-label="Loop funnel">
        <div><b>{f.attempted}</b><span>designs proposed</span></div>
        <div><b>{f.printRejected}</b><span>rejected as unprintable</span></div>
        <div><b>{f.solved}</b><span>solved in CalculiX</span></div>
        <div><b>{f.usable}</b><span>reached a clean 20% crush</span></div>
        <div><b>{data.stoppedAt}</b><span>iterations, then it stopped itself</span></div>
      </div>

      <div className="picker">
        {featured.map((x) => (
          <button key={x.id} className={`chip ${x.id === sel ? "on" : ""}`} onClick={() => setSel(x.id)}>
            <i className="swatch" style={{ background: colorOf(x) }} />{x.id}
          </button>
        ))}
      </div>

      <div className="loop-grid">
        <div className="loop-mesh">
          {d.mesh && d.frames && <Turntable src={`${BASE}${theme === "dark" && d.meshDark ? d.meshDark : d.mesh}`} frames={d.frames} label={`Rendered views of lattice design ${d.id}`} />}
          <div className="mesh-cap">
            <b>{d.id}</b> · {catOf(d) === "eta" ? "best-cushion front" : "SEA front (what the loop chased)"}<br />
            {d.blend.slice(0, 4).map(([n, w]) => `${n} ${Math.round(w * 100)}%`).join(" / ")}<br />
            {d.cellMm?.toFixed(1)} mm cells · 2×2×2 piece · {d.sizeMm?.join(" × ")} mm · {d.tris?.toLocaleString()} triangles
          </div>
        </div>
        <div className="loop-side">
          <div className="readout">
            <div className="readout-row"><span>relative density ρ</span><b>{d.rho.toFixed(3)}</b></div>
            <div className="readout-row"><span>energy absorbed (SEA)</span><b>{d.sea.toFixed(0)} J/kg</b></div>
            <div className="readout-row"><span>plateau stress</span><b>{d.plateau.toFixed(0)} kPa</b></div>
            <div className="readout-row"><span>plateau flatness (CV)</span><b>{(d.plateauCv * 100).toFixed(1)}%</b></div>
            <div className="readout-row"><span>cushioning efficiency η</span><b>{d.eta.toFixed(3)}</b></div>
          </div>
          <div className="legend">
            <span><i className="swatch" style={{ background: PURPLE }} />best cushions (high η, low stress)</span>
            <span><i className="swatch" style={{ background: AMBER }} />loop's SEA front only</span>
            <span><i className="swatch" style={{ background: "var(--line-2)" }} />other usable designs</span>
          </div>
        </div>
      </div>

      <div className="seg" role="tablist">
        <button className={tab === "tradeoff" ? "on" : ""} onClick={() => setTab("tradeoff")}>The finding</button>
        <button className={tab === "curve" ? "on" : ""} onClick={() => setTab("curve")}>Stress–strain</button>
        <button className={tab === "loop" ? "on" : ""} onClick={() => setTab("loop")}>Convergence</button>
      </div>
      {tab === "tradeoff" && (
        <>
          <p className="chart-title">Energy absorbed isn't the same as a good cushion</p>
          <Tradeoff designs={data.designs} selected={d} onPick={(x) => setSel(x.id)} />
          <p className="demo-foot">
            The loop maximized energy absorbed per kg, but in this design space that mostly tracks density (r = +0.91 with stiffness).
            Re-scoring the same 27 runs by cushioning efficiency (η = 1 is a perfectly flat plateau; 0.5 is a plain spring) found
            that the SEA champion <b>it018_1</b> is barely better than a spring (η 0.58). The real cushions are <b>it005_0</b> and <b>it004_0</b>:
            Schwarz P / diamond / elytra blends at ρ ≈ 0.195, with plateau stress flat to within 1–2%.
          </p>
        </>
      )}
      {tab === "curve" && (
        <>
          <p className="chart-title">{d.id}: FEA crush curve against the other {data.designs.length - 1} usable designs</p>
          <StressStrain designs={data.designs} selected={d} />
          <p className="demo-foot">A flat curve (constant stress while it crushes) is what spreads an impact out. A steep one passes the force straight through.</p>
        </>
      )}
      {tab === "loop" && (
        <>
          <p className="chart-title">Pareto-front hypervolume per iteration</p>
          <Convergence history={data.history} reason={data.stopReason} />
          <p className="demo-foot">Each iteration: the surrogate proposes blends → printability check → mesh → CalculiX → retrain. About 9.5 h of solver time, no human in the loop.</p>
        </>
      )}

      <p className="demo-foot caveat">
        Real run <code>{data.run}</code>: {data.solver}. Caveats: 27 designs across a 9-D blend space, so the fronts are directional, not
        quantitative. The Neo-Hookean card carries about 33% validated error, so the ordering is more trustworthy than the kPa values. Quasi-static only:
        HIC and BrIC need physical impact tests. Piece vs full tile agreed within −2.0% stress, −1.2% SEA (n = 4).
      </p>
    </div>
  );
}
