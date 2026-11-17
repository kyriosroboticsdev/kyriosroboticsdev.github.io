// Everything a reader sees lives here, so editing the site never means touching layout code.
// Anything wrapped in [[double brackets]] is a placeholder that still needs a real, verified fact.

export const NAME = "Kailash Kannan";
export const GITHUB = "https://github.com/kyriosroboticsdev";
// Contact buttons. email and whatsapp are reversed + base64 (see components/Contact.tsx) to keep them
// away from scrapers. To change one: btoa("new value".split("").reverse().join("")) in a browser console.
export const CONTACT = {
  email: "bW9jLmxpYW1nQDYwbmFubmFraHNhbGlhaw==",
  whatsapp: "MDMzNTkwNDQyMjE=", // digits with country code, no + or spaces
  discord: "kyriosondakeys.",
};

export const intro = {
  label: "PORTFOLIO · 2026",
  descriptor: "Engineer. Builder.",
  sub:
    "I build systems where robots, software and engineering meet: competition robots, engineering research and AI-powered software for real users. Each project below says what it is, what I personally did, and where you can check it, and most have a demo you can try right here.",
  thread: ["Physical systems", "Robotics", "CAD", "Software", "AI", "Tools for people"],
};

export type Demo = "materials" | "lattice" | "cad-diff" | "elo" | "site" | "none";


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
  // For demo: "site", a live page shown in a browser frame. A relative url is a page on this site;
  // label replaces the address shown in the frame's URL bar, file the frame's title.
  site?: { url: string; poster: string; label?: string; file?: string };
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
    id: "wren",
    title: "Wren OS",
    kicker: "OPERATING SYSTEM · AI · RUST",
    what:
      "A lightweight Linux operating system with an AI assistant built into the desktop. It's made to run on the kind of computer most AI tools leave behind: the minimum spec reference machine is a 2014 Chromebook with 4 GB of RAM.",
    role: "Solo project, built with the assistance of Claude.",
    built: [
      "Agent service in Rust, a single ~6 MB binary: its own agent loop over a local model (Ollama) or a paid tier AI subscription API or login; its OS tools are also served over MCP",
      "Safety by design: reading is automatic, but writing files or running commands waits for your approval; every change goes into an undo journal, and on Linux commands run in a sandbox",
      "Desktop: glass top bar with a “Wren island”, task tabs that run side by side on their own models, a Ctrl+K command bar, a terminal that catches failed commands, file explorer, settings and an App Store (Flathub)",
      "Developer tools: project tabs that run build/test/dev scripts with live output, a ports & processes panel, a token and cost meter with budgets, and a router that picks a local or cloud model for each message",
      "Bootable OS on Debian 13: greetd login screen, labwc session, .deb packages from a signed apt repository, in-OS updates with restore points",
      "Android app (Kotlin): QR pairing with signed requests, approving Wren's actions from notifications, remote screen control",
      "IOT Device Connect, dubbed 'SmartConnect'. Any device with Wren installed in any form can wirelessly connect to one setup, and can be accessed and controlled by the other securely.",
    ],
    result:
      "Boots as a real OS in a test VM sized like the Chromebook (2 GB of RAM): login screen, desktop, apps. The phone app works on a Galaxy S25. Next: install it on the Chromebook itself, then a public beta.",
    links: [{ label: "Full-screen demo", href: "wren/index.html" }],
    privateCode: true,
    tags: ["Rust", "Linux / Debian", "JavaScript", "Kotlin", "Ollama", "Claude API", "MCP"],
    demo: "site",
    site: { url: "wren/index.html", poster: "shots/wren.webp", label: "Wren desktop · runs in your browser, replies are scripted", file: "interactive demo" },
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
    what: "The public website for EV², a startup building AI-powered, self-driving-capable electric ATVs and utility vehicles.",
    role: "Website designer and developer, working directly with the founder. I built the first redesign, then hand-coded the current version.",
    built: [
      "Repositioned the site from an engineering spec sheet into a video-led customer experience",
      "First version: Next.js + Tailwind on Vercel, with a pilot-program sign-up flow",
      "Current version, hand-coded: terrain-by-terrain showcase (mud, snow, desert, mining…), specs matrix, booking and fleet-quote flows",
      "Web-optimized company footage throughout",
    ],
    result: "Live as the company's public website.",
    links: [{ label: "goev2.com", href: "https://goev2.com/" }],
    tags: ["JavaScript", "Vite", "CSS", "Next.js (v1)", "AWS S3"],
    demo: "site",
    site: { url: "https://goev2.com/", poster: "shots/ev2.webp" },
  },
  {
    id: "shuttleranked",
    title: "Shuttleranked",
    kicker: "INDEPENDENT · DEPLOYED",
    what: "Compete with your friends to see who's objectively the best badminton player. Every match you log moves an Elo rating, so the leaderboard settles it.",
    role: "Sole developer. I designed and built the whole app, front to back.",
    built: [
      "Full-stack app: React front end, Firebase auth and Firestore data, deployed on Vercel",
      "Elo rating written from scratch: K scales with margin of victory, match length and deuce sets",
      "Singles and doubles ladders, friend groups with invites, tournaments, rating-history charts",
      "Anti-farming: global ratings move at most once every 2 hours per player",
    ],
    result: "Live with 30 active users, and up to 50 peak users a day.",
    links: [
      { label: "Live app", href: "https://shuttleranked.vercel.app/" },
      { label: "GitHub", href: "https://github.com/kyriosroboticsdev/shuttleranked" },
    ],
    tags: ["React", "Vite", "Firebase", "Recharts", "Vercel"],
    demo: "elo",
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
      event: "NASA Space Apps Challenge",
      date: "November 2026",
      project: "LunarNav",
      summary: "Pick a landing site and a date at the Moon's south pole and find out, in plain English, whether a lander will have sunlight for power and Earth in view to talk home. Built on real NASA terrain (LOLA) and JPL ephemeris data.",
      award: "Submitted for judging · team of 5",
      myPart: "Science backend: Sun and Earth positions from JPL ephemerides, terrain horizon masks from NASA LOLA elevation data, sunlight and communication windows, solar power and a quick go/no-go check. Built the first dashboard and 3D sky view, and deployed the app on Microsoft Azure (Static Web Apps + Container Apps) with CI.",
      links: [
        { label: "Live planner", href: "https://salmon-moss-05338201e.3.azurestaticapps.net/" },
        { label: "Walkthrough", href: "https://salmon-moss-05338201e.3.azurestaticapps.net/presentation.html" },
        { label: "Repository", href: "https://github.com/kyriosroboticsdev/Nocoast-NasaSpaceHacks" },
      ],
      stack: ["Python", "FastAPI", "Skyfield", "NASA LOLA", "TypeScript", "Three.js", "Azure"],
    },
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
      writeup: "#tekt",
    },
  ],
};
