import { useMemo, useState } from "react";

// The same rules AssignVexMaterials.py applies inside Fusion, ported 1:1 (first match wins).
const EXCLUDE = /276-9250|Neutral Goal|Match Load|Field|AprilTag|^cup\b|^pin\b/i;
const CONTAINERS = /^(Robot|Drive Train|Lift|Claw|Intake|Odom pod)/i;
const RULES: [RegExp, string, string][] = [
  [/Bronze.*Insert|HS Round Insert/i, "Bronze", "insert"],
  [/Insert Nut|Square Insert \(Steel\)/i, "Steel, Mild", "insert"],
  [/Pneumatic Cylinder/i, "Steel, Mild", "pneumatics"],
  [/Pneumatic Reservoir/i, "Aluminum 6061", "pneumatics"],
  [/Rubber Bumper|276-7499/i, "Rubber", "rubber"],
  [/V5 Brain|V5 Battery|276-4840|276-4842|Smart Motor|^Motor/i, "ABS Plastic", "electronics"],
  [/Screw|Nylock|\bNut\b|Washer|Torx|Shaft Collar|LS Shaft Collar|^SBT\d|^THF\d/i, "Steel, Mild", "fastener"],
  [/Standard Shaft|Shaft Adapter|\bShaft\b/i, "Steel, Mild", "shaft"],
  [/Chain Link/i, "Steel, Mild", "chain"],
  [/Flat Bearing|Pillow Block|Pillow Bearing|Slide Truck/i, "Acetal Resin", "bearing"],
  [/276-6050/i, "ABS Plastic", "linear motion"],
  [/^Component\d+/i, "ABS Plastic", "custom sheet part"],
  [/Flex Wheel/i, "Rubber", "wheel"],
  [/Wheel/i, "Nylon 6/6", "wheel"],
  [/Gear.*Steel|Steel.*Gear|Sprocket.*Steel/i, "Steel, Mild", "steel gear"],
  [/Gear|Sprocket|Rack|winch|276-7573|276-7747|276-7748/i, "Nylon 6/6", "gear"],
  [/Spacer/i, "Nylon 6/6", "spacer"],
  [/C-Chan|C-Channel|Angle|Standoff|Gusset|\bbrace\b|276-2289/i, "Aluminum 6061", "structure"],
];

// Density in g/cm³, just for the swatch label.
const DENSITY: Record<string, number> = {
  Bronze: 8.8, "Steel, Mild": 7.85, "Aluminum 6061": 2.7, Rubber: 1.2,
  "ABS Plastic": 1.05, "Acetal Resin": 1.41, "Nylon 6/6": 1.14,
};

const SAMPLES = [
  "1x2x1x35 C-Channel", "8-32 x 0.500 Screw", "36T High Strength Gear", "2.75in Omni Wheel",
  "11W Smart Motor", "Pneumatic Reservoir", "Standoff 1in", "Component42", "Drive Train v21",
  "Neutral Goal", "HS Round Insert Bronze", "Flex Wheel 2in",
];

function classify(name: string) {
  const n = name.trim();
  if (!n) return null;
  if (EXCLUDE.test(n)) return { kind: "skip", note: "game / field element: no material, kept out of robot mass" } as const;
  if (CONTAINERS.test(n)) return { kind: "skip", note: "subassembly container: its parts get materials, it doesn't" } as const;
  const i = RULES.findIndex(([rx]) => rx.test(n));
  if (i < 0) return { kind: "none", note: "no rule matched: reported so a rule can be added" } as const;
  const [rx, mat, cat] = RULES[i];
  return { kind: "hit", mat, cat, rule: i + 1, src: rx.source } as const;
}

export function MaterialsDemo() {
  const [name, setName] = useState("36T High Strength Gear");
  const r = useMemo(() => classify(name), [name]);

  return (
    <div className="demo-body">
      <label className="field">
        <span>Component name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} spellCheck={false} placeholder="type a VEX part name" />
      </label>
      <div className="chips">
        {SAMPLES.map((s) => (
          <button key={s} className={`chip ${s === name ? "on" : ""}`} onClick={() => setName(s)}>{s}</button>
        ))}
      </div>
      <div className="readout" aria-live="polite">
        {!r && <p className="dim">Type a part name.</p>}
        {r?.kind === "hit" && (
          <>
            <div className="readout-row"><span>material</span><b>{r.mat}</b></div>
            <div className="readout-row"><span>density</span><b>{DENSITY[r.mat]} g/cm³</b></div>
            <div className="readout-row"><span>category</span><b>{r.cat}</b></div>
            <div className="readout-row"><span>matched rule</span><b>#{r.rule} of {RULES.length}</b></div>
            <code className="rule">/{r.src}/i</code>
          </>
        )}
        {r && r.kind !== "hit" && <p className={r.kind === "none" ? "warn-text" : "dim"}>{r.note}</p>}
      </div>
      <p className="demo-foot">
        The script runs these rules over all ~775 instances in the robot, top to bottom, first match wins.
        Specific rules sit above general ones, so a bronze insert never falls through to "gear".
      </p>
    </div>
  );
}
