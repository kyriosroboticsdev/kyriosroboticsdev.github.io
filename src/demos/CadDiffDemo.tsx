import { useState } from "react";
import sample from "./sample-cad-diff.json";

// The contract file NexusCadDiff writes and the notebook imports, shown two ways.
type Diff = typeof sample;

const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
const fmtKg = (v: number) => `${v > 0 ? "+" : ""}${(v * 1000).toFixed(0)} g`;

function draftText(d: Diff) {
  const m = d.massProps;
  const added = d.components.added.map((c) => `${c.qty}× ${c.name}`).join(", ");
  const changed = d.components.changed
    .map((c) => `${c.name} (${c.occurrenceDelta > 0 ? "+" : ""}${c.occurrenceDelta})`)
    .join(", ");
  const params = d.parameters.changed.map((p) => `${p.name} ${p.from} → ${p.to}`).join(", ");
  return [
    `Between ${d.before.versionLabel.split(" ")[0]} and ${d.after.versionLabel.split(" ")[0]} the mechanism lost ${Math.abs(m.delta.massKg * 1000).toFixed(0)} g (${fmtPct(m.delta.massPct)}) and got ${Math.abs(m.delta.bboxPct[2])}% shorter.`,
    `Added: ${added}. Changed: ${changed}. Parameters: ${params}.`,
    "Why? The notebook asks the builder this next, one question per change. The CAD knows what changed, but only the team knows why.",
  ];
}

export function CadDiffDemo() {
  const [view, setView] = useState<"page" | "json">("page");
  const d = sample;
  const m = d.massProps;

  return (
    <div className="demo-body">
      <div className="seg" role="tablist">
        <button className={view === "page" ? "on" : ""} onClick={() => setView("page")}>Notebook page</button>
        <button className={view === "json" ? "on" : ""} onClick={() => setView("json")}>cad-diff.json</button>
      </div>

      {view === "json" ? (
        <pre className="json">{JSON.stringify(d, null, 2)}</pre>
      ) : (
        <div className="nb-page">
          <div className="nb-head">
            <span>DESIGN ITERATION</span>
            <span>{d.before.name} · {d.before.versionLabel.split(" ")[0]} → {d.after.versionLabel.split(" ")[0]}</span>
          </div>
          <div className="nb-stats">
            <div><span>mass</span><b>{m.after.massLb.toFixed(2)} lb</b><i className="good">{fmtKg(m.delta.massKg)}</i></div>
            <div><span>height</span><b>{m.after.bbox[2]} in</b><i className="good">{fmtPct(m.delta.bboxPct[2])}</i></div>
            <div><span>bodies</span><b>{m.after.bodyCount}</b><i>+{m.delta.bodyCount}</i></div>
          </div>
          <table className="nb-table">
            <thead><tr><th>Change</th><th>Part / parameter</th><th>Detail</th></tr></thead>
            <tbody>
              {d.components.added.map((c) => <tr key={c.name}><td>added</td><td>{c.name}</td><td>×{c.qty}</td></tr>)}
              {d.components.changed.map((c) => <tr key={c.name}><td>qty</td><td>{c.name}</td><td>{c.occurrenceDelta}</td></tr>)}
              {d.parameters.changed.map((p) => <tr key={p.name}><td>param</td><td>{p.name}</td><td>{p.from} → {p.to}</td></tr>)}
            </tbody>
          </table>
          {draftText(d).map((p, i) => <p key={i} className={i === 2 ? "nb-ask" : ""}>{p}</p>)}
        </div>
      )}
      <p className="demo-foot">
        Sample data, same schema the add-in exports (<code>nexus.cad-diff/1</code>). In the app, an AI interview fills in
        the <em>why</em> and writes the final page. This preview shows only the facts pulled from CAD.
      </p>
    </div>
  );
}
