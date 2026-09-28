// Everything a reader sees lives here, so editing the site never means touching layout code.
// Anything wrapped in [[double brackets]] is a placeholder that still needs a real, verified fact.

export const NAME = "Kailash Kannan";
export const GITHUB = "https://github.com/kyriosroboticsdev";
export const EMAIL = ""; // optional: shown in the footer when set

export const intro = {
  label: "PORTFOLIO · 2026",
  title: "I build systems where robots, software and engineering meet.",
  sub:
    "Competition robots, engineering research and AI-powered software for real users. Each project below says what it is, what I personally did, and where you can check it. Most have a demo you can try right here.",
  thread: ["Physical systems", "Robotics", "CAD", "Software", "AI", "Tools for people"],
};

export type Demo = "materials" | "lattice" | "cad-diff" | "none";

export interface Project {
  id: string;
  title: string;
  kicker: string;              // one-line category, shown in mono
  what: string;                // 1. what is it, in normal language
  role: string;                // 2. what I personally did
  built: string[];             // 3. specific technical contributions
  result: string;              // 4. result: users, competitions, deployments, awards
  links: { label: string; href: string }[]; // 5. where to see it
  tags: string[];
  demo: Demo;
  draft?: boolean;             // hidden from the live site until filled in
}

export const projects: Project[] = [
  {
    id: "tekt",
    title: "Tekt (NoCoast-AEC)",
    kicker: "AI · BIM · FULL-STACK",
    what:
      "Describe a building in plain English and get a real, editable building model back, in the IFC format that architects' and engineers' software opens.",
    role: "[[Confirm: founding contributor and repository admin. Wrote the first commit, the scaffolding and the original prompt → IFC pipeline.]]",
    built: [
      "Prompt → intermediate representation → IFC pipeline, with edit operations and versioning",
      "Claude and local-model (GGUF) planner providers",
      "Desktop app shell (Electron → Tauri, ~5 MB release build)",
      "Viewer features: section slider, follow-build cut, selection as prompt context",
      "Redesigned UI, tekt rebrand with light and dark themes",
      "Presentation site with a live, serverless demo; project documentation",
    ],
    result: "[[Confirm exact wording: Best Design, AEC International Hackathon; only high-school team of seven.]]",
    links: [
      { label: "Live demo", href: "https://nocoast-aec-site.vercel.app" },
      { label: "GitHub", href: "https://github.com/nocoastaec/NoCoast-AEC" },
      { label: "My commits", href: "https://github.com/nocoastaec/NoCoast-AEC/commits?author=kyriosroboticsdev" },
    ],
    tags: ["React", "TypeScript", "Python", "IfcOpenShell", "Tauri / Rust", "LLMs"],
    demo: "none",
  },
  {
    id: "lattice",
    title: "Lattice Helmet Liner Research",
    kicker: "RESEARCH · SIMULATION · ML",
    what:
      "Research into 3D-printed TPU lattice liners for football helmets that reduce both linear and rotational impact, the two components linked to concussion.",
    role: "[[Confirm: led the computational side (geometry generation, ML pipeline, material characterization plan) within a two-team structure.]]",
    built: [
      "Parametric generator for lattice tiles (gyroid, TPMS and strut families, cross-family blends) → printable STL",
      "ML pipeline: feature importance (RF/XGBoost + SHAP), Gaussian-process surrogate, multi-objective Bayesian optimization that proposes the next design to print",
      "Physics-informed surrogate prior (Gibson–Ashby density scaling)",
      "Hyperelastic material characterization plan (ASTM D412 tension, pure shear, equibiaxial) for a SimScale Ogden fit",
      "Fusion 360 add-in that pulls generated geometry into CAD",
    ],
    result:
      "Pipeline complete and validated on synthetic data; physical impact testing against the Virginia Tech STAR protocol is next. [[Update when real results exist.]]",
    links: [],
    tags: ["Python", "BoTorch", "XGBoost", "SHAP", "Fusion 360 API", "FEA"],
    demo: "lattice",
  },
  {
    id: "fusion-tools",
    title: "Fusion 360 Tools for VEX Robots",
    kicker: "CAD · AUTOMATION · OPEN SOURCE",
    what:
      "An open-source set of Fusion 360 scripts and add-ins that automate the slow, error-prone parts of CADing a 775-part competition robot.",
    role: "Designed and tested every tool on my team's 8780E robot assembly, then cleaned them up and published them for other teams. [[Confirm wording]]",
    built: [
      "Rule-based material assignment across the whole robot, so mass and center of gravity are real",
      "Rigid-group setup and joint diagnostics for a moving assembly",
      "Mass / center-of-gravity report for tipping analysis",
      "STEP export of a design's version history (ribbon add-in with a range picker)",
      "CAD diffing that turns version history into engineering-notebook data",
    ],
    result: "14 tools, MIT-licensed, with dry-run modes and a write-up of the Fusion API pitfalls they work around.",
    links: [{ label: "GitHub", href: "https://github.com/kyriosroboticsdev/fusion-vex-tools" }],
    tags: ["Python", "Fusion 360 API", "VEX V5"],
    demo: "materials",
  },
  {
    id: "nexus",
    title: "Nexus Engineering Notebook",
    kicker: "ROBOTICS · SOFTWARE · AI",
    what:
      "A desktop engineering-notebook app for VEX teams that drafts design-iteration pages directly from changes in the robot's CAD.",
    role: "[[Confirm: sole developer.]]",
    built: [
      "Electron notebook app with block-based pages and Word export",
      "Fusion add-in that diffs CAD versions: mass, center of gravity, parts added/removed, parameters",
      "Timeline mode that preserves the whole design journey, including parts tried and removed",
      "AI interview flow: asks targeted questions about each change, then writes the page in the team's voice",
      "Robot spec export (mass, footprint, yaw inertia) for a driving simulator",
    ],
    result: "[[Users / teams / competition use?]]",
    links: [{ label: "GitHub", href: "https://github.com/kyriosroboticsdev/Nexus-VEX" }],
    tags: ["Electron", "JavaScript", "Python", "Fusion 360 API", "LLMs"],
    demo: "cad-diff",
  },
  {
    id: "ev2",
    title: "EV² Website",
    kicker: "PROFESSIONAL · WEB",
    what: "A video-led website redesign for EV², a startup building self-driving-capable electric ATVs.",
    role: "Website designer and developer, working directly with the founder.",
    built: [
      "Repositioned the site from a spec sheet into a customer experience",
      "Next.js + Tailwind build deployed on Vercel",
      "Web-optimized company footage and a pilot-program sign-up flow",
    ],
    result: "[[Live? Confirm founder is OK with it being featured.]]",
    links: [],
    tags: ["Next.js", "TypeScript", "Tailwind", "Vercel"],
    demo: "none",
    draft: true,
  },
  {
    id: "rndp",
    title: "RNDP.AI",
    kicker: "AI · PRODUCT",
    what: "[[One sentence: what is it?]]",
    role: "[[What did you personally do?]]",
    built: ["[[Specific contributions]]"],
    result: "[[Result]]",
    links: [],
    tags: [],
    demo: "none",
    draft: true,
  },
  {
    id: "shuttleranked",
    title: "Shuttleranked",
    kicker: "INDEPENDENT · DEPLOYED",
    what: "[[One sentence: what is it?]]",
    role: "[[What did you personally do?]]",
    built: ["[[Specific contributions]]"],
    result: "[[Users? Deployment?]]",
    links: [],
    tags: [],
    demo: "none",
    draft: true,
  },
];

export const stack = ["Python", "TypeScript / React", "Rust (Tauri)", "Fusion 360 API", "ML: BoTorch, XGBoost", "VEX V5"];
