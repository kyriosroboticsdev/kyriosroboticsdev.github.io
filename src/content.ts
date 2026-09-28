// Everything a reader sees lives here, so editing the site never means touching layout code.
// Anything wrapped in [[double brackets]] is a placeholder that still needs a real, verified fact.

export const NAME = "Kailash Kannan";
export const GITHUB = "https://github.com/kyriosroboticsdev";
export const EMAIL = ""; // optional: shown in the footer when set

export const intro = {
  label: "PORTFOLIO · 2026",
  descriptor: "Engineer. Builder.",
  sub:
    "I build systems where robots, software and engineering meet: competition robots, engineering research and AI-powered software for real users. Each project below says what it is, what I personally did, and where you can check it, and most have a demo you can try right here.",
  thread: ["Physical systems", "Robotics", "CAD", "Software", "AI", "Tools for people"],
};

export type Demo = "materials" | "lattice" | "cad-diff" | "site" | "none";


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
  page?: { label: string; href: string }; // a deeper page on this site
  privateCode?: boolean;       // say so instead of showing links
  site?: { url: string; poster: string }; // for demo: "site", a live deployed page shown in a browser frame
  draft?: boolean;             // hidden from the live site until filled in
}

export const projects: Project[] = [
  {
    id: "tekt",
    title: "Tekt (NoCoast-AEC)",
    kicker: "AI · BIM · FULL-STACK",
    what:
      "Describe a building in plain English and get a real, editable building model back, in the IFC format that architects' and engineers' software opens.",
    role: "Founding member and repository admin. I started the repo and its scaffolding, and co-designed the IFC generation approach with the backend developer: I worked out how the IFC structure should be produced, in person and through diagrams, and he implemented it. I led the UI redesign, the desktop app shell and the presentation.",
    built: [
      "Repository scaffolding (frontend + backend) and the initial project structure",
      "Design of the prompt → IFC generation approach, worked out with the backend developer",
      "Redesigned UI, ported onto the team's versioned-projects API",
      "Desktop app shell: Electron → Tauri, ~5 MB release build",
      "tekt rebrand: logo, light and dark themes",
      "Prebuilt Rome demo: the Colosseum valley, c. 320 AD, ~1,000 BIM elements",
      "Presentation site with a live, serverless demo; README and project documentation",
    ],
    result: "Best Collaborative Project, AEC International Hackathon. Built by a team of 6 in 26 hours, among 40+ contestants.",
    links: [
      { label: "Live demo", href: "https://nocoast-aec-site.vercel.app" },
      { label: "GitHub", href: "https://github.com/nocoastaec/NoCoast-AEC" },
      { label: "My UI PR (#3)", href: "https://github.com/nocoastaec/NoCoast-AEC/pull/3" },
      { label: "My rebrand PR (#15)", href: "https://github.com/nocoastaec/NoCoast-AEC/pull/15" },
    ],
    tags: ["React", "TypeScript", "Python", "IfcOpenShell", "Tauri / Rust", "LLMs"],
    demo: "site",
    site: { url: "https://nocoast-aec-site.vercel.app/", poster: "shots/tekt.webp" },
    page: { label: "NoCoast team page", href: "#/nocoast" },
  },
  {
    id: "lattice",
    title: "Lattice Helmet Liner Research",
    kicker: "RESEARCH · SIMULATION · ML",
    what:
      "Research into 3D-printed TPU lattice liners for football helmets that reduce both linear and rotational impact, the two components linked to concussion. A self-running ML + FEA loop designs lattices, simulates crushing them and decides what to try next.",
    role: "Led the computational side (geometry generation, the ML + FEA loop, material characterization plan) in a two-team structure: a testing/hardware team and an ML team.",
    built: [
      "Generative geometry: nine lattice families (gyroid, Schwarz P, diamond, re-entrant, honeycomb, elytra, Voronoi, spinodoid, Bouligand) blended into one field, then meshed to printable STL",
      "Self-running design loop: Latin-hypercube seeding → Gaussian-process surrogate → multi-objective Bayesian optimization (qEHVI) → FEA → retrain, with a diminishing-returns stopping rule",
      "Printability screen before any solver time: unsupported-overhang fraction and disconnected bodies",
      "CalculiX FEA pipeline: tetrahedral meshing, hyperelastic TPU card, quasi-static crush; 2×2×2-cell screening pieces checked against full tiles",
      "Analysis that caught the loop optimizing the wrong thing, and a re-scoring by cushioning efficiency",
      "Upstream: RF/XGBoost + SHAP feature importance, Gibson–Ashby physics prior, TPU hyperelastic characterization plan (ASTM D412, pure shear, equibiaxial)",
    ],
    result:
      "First autonomous run: 133 designs proposed, 27 simulated to a clean 20% crush, stopped itself after 25 iterations (~9.5 h of solver time). It identified two Schwarz P / diamond / elytra blends with nearly flat plateaus (η ≈ 0.82–0.87). Physical impact testing (Virginia Tech STAR protocol) is next.",
    links: [],
    privateCode: true,
    tags: ["Python", "BoTorch", "CalculiX FEA", "XGBoost", "SHAP", "trimesh", "Fusion 360 API"],
    demo: "lattice",
  },
  {
    id: "fusion-tools",
    title: "Fusion 360 Tools for VEX Robots",
    kicker: "CAD · AUTOMATION · OPEN SOURCE",
    what:
      "An open-source set of Fusion 360 scripts and add-ins that automate the slow, error-prone parts of CADing a 775-part competition robot.",
    role: "Designed and tested every tool on my team's 8780E robot assembly, then cleaned them up and published them for other teams.",
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
    role: "Sole developer.",
    built: [
      "Electron notebook app with block-based pages and Word export",
      "Fusion add-in that diffs CAD versions: mass, center of gravity, parts added/removed, parameters",
      "Timeline mode that preserves the whole design journey, including parts tried and removed",
      "AI interview flow: asks targeted questions about each change, then writes the page in the team's voice",
      "Robot spec export (mass, footprint, yaw inertia) for a driving simulator",
    ],
    result: "",
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
    result: "Live as the company's public website.",
    links: [{ label: "goev2.com", href: "https://goev2.com/" }],
    tags: ["Next.js", "TypeScript", "Tailwind", "Vercel"],
    demo: "none",
  },
  {
    id: "shuttleranked",
    title: "Shuttleranked",
    kicker: "INDEPENDENT · DEPLOYED",
    what: "Compete with your friends to see who's objectively the best badminton player. Every match you log moves an Elo rating, so the leaderboard settles it.",
    role: "Sole developer. I designed and built the whole app, front to back.",
    built: [
      "Full-stack web app: frontend, backend and data layer",
      "Elo rating algorithm written from scratch",
      "Deployed and running in production",
    ],
    result: "Live with 30 active users, and up to 50 peak users a day.",
    links: [], // TODO: live URL and/or repo link
    tags: [],
    demo: "none",
  },
];

export const stack = ["Python", "TypeScript / React", "Rust (Tauri)", "Fusion 360 API", "ML: BoTorch, XGBoost", "VEX V5"];

// The hackathon team gets its own page (#/nocoast). Add each new event to the top of `hackathons`.
export const nocoast = {
  name: "NoCoast",
  github: "https://github.com/nocoastaec",
  about:
    "A student team that builds at hackathons and open-sources every project it makes.",
  hackathons: [
    {
      event: "AEC International Hackathon",
      date: "September 2026",
      project: "Tekt (NoCoast-AEC)",
      summary: "Prompt → BIM → IFC: describe a building in one sentence and get a real IFC model back, viewable in the browser or a 5 MB desktop app.",
      award: "Best Collaborative Project · team of 6 among 40+ contestants · 26 hours",
      myPart: "Founding member and repo admin. Scaffolding, IFC-generation design with the backend developer, UI redesign, Tauri desktop app, tekt rebrand, Rome demo, presentation site and docs.",
      links: [
        { label: "Live demo", href: "https://nocoast-aec-site.vercel.app" },
        { label: "Repository", href: "https://github.com/nocoastaec/NoCoast-AEC" },
        { label: "App (web)", href: "https://nocoast-aec.vercel.app" },
      ],
      stack: ["React", "That Open Engine", "FastAPI", "IfcOpenShell", "Tauri / Rust", "Claude"],
    },
  ],
};
