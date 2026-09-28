import { useMemo, useState } from "react";

type Set = { w: number; l: number };

/**
 * Shuttleranked's rating update, ported line for line from src/components/NotificationPopup.jsx.
 * Standard Elo expectation, but K scales with how the match was won.
 */
function calcElo(wElo: number, lElo: number, sets: Set[]) {
  const exp = 1 / (1 + Math.pow(10, (lElo - wElo) / 400));
  let K = 32, totalDiff = 0, deuces = 0;
  const totalSets = sets.length;
  sets.forEach((s) => {
    totalDiff += Math.abs(s.w - s.l);
    if (s.w >= 20 && s.l >= 20) deuces++;
  });
  const dom = Math.min(totalDiff / totalSets / 10, 1.5);
  const spd = totalSets === 1 ? 1.3 : totalSets === 2 ? 1.1 : 0.9;
  const deuce = Math.max(1 - deuces * 0.1, 0.7);
  K = K * (1 + dom * 0.5) * spd * deuce;
  return { change: Math.max(Math.round(K * (1 - exp)), 4), exp, dom, spd, deuce, K };
}

const FLOOR = 800; // the app never lets a rating fall below this

// Scores are always written winner-first, as the app's score entry asks.
const PRESETS: { label: string; sets: Set[] }[] = [
  { label: "Straight-set blowout", sets: [{ w: 21, l: 8 }, { w: 21, l: 11 }] },
  { label: "Deuce thriller", sets: [{ w: 23, l: 21 }, { w: 19, l: 21 }, { w: 22, l: 20 }] },
  { label: "Comeback in three", sets: [{ w: 15, l: 21 }, { w: 21, l: 17 }, { w: 21, l: 12 }] },
  { label: "Single game to 21", sets: [{ w: 21, l: 16 }] },
];

export function EloDemo() {
  const [a, setA] = useState(1040);
  const [b, setB] = useState(1180);
  const [winner, setWinner] = useState<"a" | "b">("a");
  const [preset, setPreset] = useState(0);
  const sets = PRESETS[preset].sets;

  const wElo = winner === "a" ? a : b, lElo = winner === "a" ? b : a;
  const r = useMemo(() => calcElo(wElo, lElo, sets), [wElo, lElo, sets]);
  const after = (me: "a" | "b", elo: number) => (me === winner ? elo + r.change : Math.max(elo - r.change, FLOOR));

  return (
    <div className="demo-body elo">
      <div className="elo-players">
        {(["a", "b"] as const).map((k) => {
          const elo = k === "a" ? a : b, set = k === "a" ? setA : setB;
          const next = after(k, elo);
          return (
            <div key={k} className={`elo-card ${winner === k ? "won" : ""}`}>
              <div className="elo-name">Player {k.toUpperCase()}{winner === k && <span className="elo-badge">WON</span>}</div>
              <div className="elo-rating"><b>{next}</b><span className={next >= elo ? "up" : "down"}>{next >= elo ? "+" : "−"}{Math.abs(next - elo)}</span></div>
              <label className="slider"><span>rating before<b>{elo}</b></span>
                <input type="range" min={800} max={1600} step={10} value={elo} onChange={(e) => set(Number(e.target.value))} />
              </label>
              <button className="chip" onClick={() => setWinner(k)} disabled={winner === k}>{winner === k ? "Winner" : "Make winner"}</button>
            </div>
          );
        })}
      </div>

      <div className="chips">
        {PRESETS.map((p, i) => (
          <button key={p.label} className={`chip ${i === preset ? "on" : ""}`} onClick={() => setPreset(i)}>{p.label}</button>
        ))}
      </div>
      <div className="elo-sets" aria-label="Set scores, winner first">
        {sets.map((s, i) => (
          <span key={i} className={s.w >= 20 && s.l >= 20 ? "deuce" : ""}>{s.w}–{s.l}</span>
        ))}
      </div>

      <div className="readout">
        <div className="readout-row"><span>winner's expected win chance</span><b>{(r.exp * 100).toFixed(0)}%</b></div>
        <div className="readout-row"><span>dominance · avg margin / 10, cap 1.5</span><b>×{(1 + r.dom * 0.5).toFixed(2)}</b></div>
        <div className="readout-row"><span>match length · {sets.length} set{sets.length > 1 ? "s" : ""}</span><b>×{r.spd.toFixed(2)}</b></div>
        <div className="readout-row"><span>deuce sets · −10% each, floor 0.7</span><b>×{r.deuce.toFixed(2)}</b></div>
        <div className="readout-row total"><span>K = 32 × multipliers → points moved</span><b>K {r.K.toFixed(1)} → {r.change}</b></div>
      </div>
      <p className="demo-foot">
        This runs the app's actual rating function. An upset moves more points than an expected win, and a blowout moves more than a
        deuce-riddled scrape. In the app, doubles uses each team's average rating, no rating drops below {FLOOR}, and global ratings only
        move once per 2 hours per player to blunt farming.
      </p>
    </div>
  );
}
