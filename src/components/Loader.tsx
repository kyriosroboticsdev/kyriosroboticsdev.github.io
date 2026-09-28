import { useEffect, useState } from "react";
import { reducedMotion, useScramble } from "../lib/motion";
import { NAME } from "../content";

// A body-centred-cubic lattice cell in dimetric view (true isometric hides the back corner behind the centre node), drawn strut by strut:
// the unit the helmet liners are tiled from, and a nod to every other build on the page.
const S = 70;
const iso = (x: number, y: number, z: number): [number, number] =>
  [140 + (x * 0.95 - y * 0.7) * S, 95 + (x * 0.3 + y * 0.55) * S - z * S];
const V = (k: string) => iso(+k[0], +k[1], +k[2]);
const seg = (...ks: string[]) => "M" + ks.map((k) => V(k).join(" ")).join(" L");
const C = iso(0.5, 0.5, 0.5);
const toC = (...ks: string[]) => ks.map((k) => `M${V(k).join(" ")} L${C.join(" ")}`).join(" ");

// (0,0,0) is the hidden back corner, so its three edges are drawn faint.
const LINES: { d: string; hidden?: boolean }[] = [
  { d: seg("001", "101", "111", "011", "001") },            // top face
  { d: seg("101", "100") + " " + seg("111", "110") + " " + seg("011", "010") }, // visible verticals
  { d: seg("100", "110", "010") },                          // visible bottom edges
  { d: seg("000", "100") + " " + seg("000", "010") + " " + seg("000", "001"), hidden: true },
  { d: toC("001", "111", "000", "110") },                   // body diagonals
  { d: toC("101", "011", "100", "010") },
];
const NODES = ["000", "100", "010", "001", "110", "101", "011", "111"].map(V).concat([C]);

const STAGES = ["CALIBRATING ODOMETRY", "MESHING LATTICE", "COMPILING IFC", "LOADING PROJECTS", "READY"];

export function Loader({ onDone }: { onDone: () => void }) {
  const fast = reducedMotion();
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const title = useScramble(NAME.toUpperCase(), true, 1100);

  useEffect(() => {
    const total = fast ? 250 : 2100;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      setPct(Math.round(100 * (1 - Math.pow(1 - t, 2.2))));
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setLeaving(true);
        setTimeout(onDone, fast ? 0 : 750);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fast, onDone]);

  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(pct / 25))];

  return (
    <div className={`loader ${leaving ? "leaving" : ""}`} role="status" aria-label="Loading">
      <div className="loader-corner tl">PORTFOLIO / REV 2026</div>
      <div className="loader-corner tr">UNIT CELL · BCC</div>
      <div className="loader-corner bl">ROBOTICS · AI · ENGINEERING</div>
      <div className="loader-corner br">{String(pct).padStart(3, "0")}%</div>
      <svg className="loader-drawing" viewBox="72 12 148 156" aria-hidden="true">
        {LINES.map((l, i) => (
          <path key={i} d={l.d} pathLength={1} className={l.hidden ? "hidden-edge" : ""} style={{ animationDelay: `${i * 210}ms` }} />
        ))}
        {NODES.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === NODES.length - 1 ? 5 : 3} style={{ animationDelay: `${1100 + i * 80}ms` }} />
        ))}
      </svg>
      <div className="loader-title">{title}</div>
      <div className="loader-bar"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>
      <div className="loader-stage">{stage}</div>
    </div>
  );
}
