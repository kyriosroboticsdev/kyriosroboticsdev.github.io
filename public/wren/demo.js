// Wren desktop, browser demo: a stand-in for Wren's local service.
//
// index.html next to this file is Wren's real desktop page (shell/prototype in wren-os), copied by
// tools/export_wren.mjs. On Wren it talks to the `wren serve` API on localhost; here this script answers
// those same requests inside the browser, so the real UI runs with no server. Replies from "Wren" are
// scripted, and nothing leaves the browser except Flathub screenshots in the App Store.
//
// Loaded before the page's own script, so window.fetch and WebSocket are replaced before it starts.
"use strict";
(() => {
  // ---------- setup: look like Wren OS on Linux, start on the desktop ----------
  try { Object.defineProperty(navigator, "userAgent", { get: () => "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) WrenDemo" }); } catch {}
  try { if (!localStorage.getItem("wren.settings")) localStorage.setItem("wren.settings", JSON.stringify({ name: "Kailash" })); } catch {}

  const HOME = "/home/kailash";
  const now = () => Math.floor(Date.now() / 1000);
  const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const DEMO_ONLY = "That needs a real computer. In this browser demo, apps and system actions don't run.";
  const ONE_PROJECT = "This demo has one project: ~/projects/pocket-planner";

  // ---------- models ----------
  const BACKENDS = {
    local: { kind: "openai", label: "local · qwen2.5:7b", local: true, model: "qwen2.5:7b" },
    claude: { kind: "anthropic", label: "claude · Claude Sonnet", local: false, model: "Claude Sonnet" },
    "claude-code": { kind: "claude-code", label: "claude-code · your subscription", local: false, model: "Claude Code" },
  };

  // ---------- files ----------
  const T0 = now();
  const f = (size, ageH, text) => ({ dir: false, size, modified: T0 - Math.round(ageH * 3600), text });
  const d = (kids, ageH = 30) => ({ dir: true, modified: T0 - ageH * 3600, kids });
  const DATES_TS = `// Week math for the planner view.\nexport function weekStart(date: Date): Date {\n  const d = new Date(date);\n  const diff = d.getDay();\n  d.setDate(d.getDate() - diff);\n  d.setHours(0, 0, 0, 0);\n  return d;\n}\n\nexport const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);\n`;
  const FS = d({
    Desktop: d({}),
    Documents: d({
      "Engineering notebook.md": f(4210, 20, "# Engineering notebook\n\n## Oct 12\n- Drivetrain: 6-motor, 450 rpm on 3.25\" omnis\n- Intake jammed on the second ring: raise the roller 1/4\"\n\n## Oct 10\n- Started the lift CAD; need the gear ratio by Friday\n"),
      "College essays": d({ "draft-2.md": f(5120, 50, "Draft 2.\n") }),
      "Resume.pdf": f(88300, 200),
    }),
    Downloads: d({
      "IMG_4021.jpg": f(2840000, 3), "IMG_4022.jpg": f(2710000, 3), "screenshot-robot.png": f(612000, 26),
      "game-manual-override.pdf": f(9400000, 70), "lab-report-template.pdf": f(240000, 48),
      "Obsidian-1.9.4.AppImage": f(118000000, 90), "notes (1).txt": f(1300, 5, "remember: order more 4.5\" standoffs\n"),
      "vex-field.step": f(15200000, 120),
    }),
    Music: d({}), Pictures: d({ "Wallpapers": d({}) }), Videos: d({}),
    projects: d({
      "pocket-planner": d({
        "package.json": f(612, 30, `{\n  "name": "pocket-planner",\n  "private": true,\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "test": "vitest run",\n    "lint": "eslint src"\n  }\n}\n`),
        "README.md": f(890, 30, "# pocket-planner\n\nA small weekly planner (React + Vite). A sample project for the Wren demo.\n"),
        src: d({ "App.tsx": f(2400, 30, "export default function App() { /* … */ }\n"), "dates.ts": f(310, 30, DATES_TS), "dates.test.ts": f(720, 30, "import { weekStart } from './dates';\n// weekStart returns the Monday of the week\n"), "budget.ts": f(940, 40, "") }),
        ".git": d({}),
      }),
    }, 10),
    ".config": d({ wren: d({ "config.toml": f(420, 60, 'default = "local"\n') }) }),
  });
  const norm = (p) => {
    p = (p || "~").replace(/^~(?=\/|$)/, HOME);
    if (!p.startsWith("/")) p = HOME + "/" + p;
    const out = [];
    for (const part of p.split("/")) { if (!part || part === ".") continue; if (part === "..") out.pop(); else out.push(part); }
    return "/" + out.join("/");
  };
  // The demo's tree is rooted at HOME; /, /home are synthesized around it.
  function node(path) {
    path = norm(path);
    if (path === "/") return d({ home: d({}), etc: d({}), usr: d({}), tmp: d({}), var: d({}) });
    if (path === "/home") return d({ kailash: FS });
    if (!path.startsWith(HOME)) return path.split("/").length <= 2 ? d({}) : null;
    let n = FS;
    for (const part of path.slice(HOME.length).split("/").filter(Boolean)) { n = n.dir ? n.kids[part] : null; if (!n) return null; }
    return n;
  }
  const tilde = (p) => (p.startsWith(HOME) ? "~" + p.slice(HOME.length) : p);
  const listing = (n) => Object.entries(n.kids).map(([name, e]) => ({ name, dir: e.dir, modified: e.modified, size: e.dir ? 0 : e.size }));
  const human = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`);

  // ---------- undo journal (what Wren changed) ----------
  const JOURNAL = [];
  let journalSeq = 0;
  function journal(summary, saved, undo, patch) {
    const e = { id: ++journalSeq, at: now(), summary, undoable: true, undone_by: null, saved, undo, patch };
    JOURNAL.unshift(e);
    return e;
  }

  // ---------- the sample project ----------
  const PROJ = { fixed: false };
  const projectBase = () => ({
    name: "pocket-planner", root: `${HOME}/projects/pocket-planner`, stack: ["React", "Vite", "Vitest"],
    git: { branch: "main", ahead: 0, behind: 0, changed: PROJ.fixed ? 1 : 0, last_commit: "Planner: drag tasks between days" },
    actions: [
      { id: "dev", label: "Dev", command: "npm run dev", kind: "run" },
      { id: "build", label: "Build", command: "npm run build", kind: "build" },
      { id: "test", label: "Test", command: "npm test", kind: "test" },
      { id: "lint", label: "Lint", command: "npm run lint", kind: "lint" },
    ],
  });
  const TEST_FAIL = ` RUN  v3.2.4 ~/projects/pocket-planner\n\n ✓ src/budget.test.ts (4 tests) 6ms\n ❯ src/dates.test.ts (3 tests | 1 failed) 9ms\n   × weekStart returns the Monday of the week\n     → expected 2026-10-11 to be 2026-10-12\n\n FAIL  src/dates.test.ts > weekStart returns the Monday of the week\nAssertionError: expected 2026-10-11 to be 2026-10-12\n ❯ src/dates.test.ts:9:32\n\n Test Files  1 failed | 1 passed (2)\n      Tests  1 failed | 6 passed (7)\n   Duration  412ms\n`;
  const TEST_PASS = ` RUN  v3.2.4 ~/projects/pocket-planner\n\n ✓ src/budget.test.ts (4 tests) 6ms\n ✓ src/dates.test.ts (3 tests) 5ms\n\n Test Files  2 passed (2)\n      Tests  7 passed (7)\n   Duration  398ms\n`;
  const SCRIPT = {
    dev: { lines: ["> pocket-planner@0.1.0 dev", "> vite", "", "  VITE v6.3.5  ready in 312 ms", "", "  ➜  Local:   http://localhost:5173/", "  ➜  Network: use --host to expose"], forever: true },
    build: { lines: ["> pocket-planner@0.1.0 build", "> vite build", "", "vite v6.3.5 building for production...", "✓ 41 modules transformed.", "dist/index.html                  0.46 kB │ gzip:  0.30 kB", "dist/assets/index-B7x2kQ9a.css   3.12 kB │ gzip:  1.21 kB", "dist/assets/index-Cq1dS0pR.js  148.66 kB │ gzip: 47.90 kB", "✓ built in 1.84s"], ok: true },
    test: { get lines() { return ["> pocket-planner@0.1.0 test", "> vitest run", "", ...(PROJ.fixed ? TEST_PASS : TEST_FAIL).split("\n")]; }, get ok() { return PROJ.fixed; } },
    lint: { lines: ["> pocket-planner@0.1.0 lint", "> eslint src", "", "✓ No problems found."], ok: true },
  };

  // ---------- ports ----------
  const PORTS = [
    { port: 7878, pid: 812, name: "wren", command: "/usr/bin/wren serve", dev: false, system: false, memory_bytes: 14 << 20, uptime_secs: 7200, addrs: ["127.0.0.1"] },
    { port: 11434, pid: 655, name: "ollama", command: "/usr/local/bin/ollama serve", dev: false, system: false, memory_bytes: 5100 << 20, uptime_secs: 7300, addrs: ["127.0.0.1"] },
    { port: 631, pid: 402, name: "cupsd", command: "/usr/sbin/cupsd -l", dev: false, system: true, memory_bytes: 9 << 20, uptime_secs: 7400, addrs: ["127.0.0.1"] },
    { port: 22, pid: 388, name: "sshd", command: "sshd: /usr/sbin/sshd -D", dev: false, system: true, memory_bytes: 6 << 20, uptime_secs: 7400, addrs: ["0.0.0.0"] },
  ];
  const DEV_PORT = { port: 5173, pid: 4410, name: "node", command: "node ~/projects/pocket-planner/node_modules/.bin/vite", dev: true, system: false, memory_bytes: 96 << 20, uptime_secs: 0, addrs: ["127.0.0.1"] };

  // ---------- sessions (task tabs) ----------
  const SESS = new Map();
  let sessSeq = 0;
  function newSession(o = {}) {
    const s = { id: ++sessSeq, title: o.title || `Task ${sessSeq}`, backend: o.backend || "local", route: null, budget: null, log: [], pending: [], busy: false,
      project: o.project ? projectBase() : null, run: null, runOut: "", tok: { input: 0, output: 0 }, ms: 0, cost: 0, steps: [], stop: false };
    SESS.set(s.id, s);
    return s;
  }
  function info(s) {
    const b = BACKENDS[s.backend];
    const project = s.project ? { ...projectBase(), run: s.run } : null;
    return { id: s.id, title: s.title, backend: s.backend, label: b.label, local: b.local, busy: s.busy, control: null, budget_usd: s.budget,
      log_seq: s.log.length, pending: s.pending, project, route: s.route, worktree: null,
      usage: { cost_usd: s.cost, cost_estimated: s.cost, cost_reported: 0, detail: { input: s.tok.input, output: s.tok.output, cache_read: 0, cache_write: 0 },
        free: b.local, priced: true, tokens: s.tok.input + s.tok.output, local_ms: s.ms } };
  }
  const welcome = newSession({ title: "Welcome" });
  welcome.log.push({ type: "text", id: "w1", text:
    "Hi, I'm **Wren**, the assistant built into this OS. This is the real Wren desktop running in your browser, with my replies scripted, so nothing here touches your computer.\n\n" +
    "Things to try:\n- Ask me to **clean up my Downloads** (I'll ask before moving anything, and you can undo it)\n- Ask **what's using port 5173** after pressing Dev in the pocket-planner tab\n- Say **switch to light mode**\n- Press **Test** in the pocket-planner tab, then **Ask Wren to fix**\n- **Ctrl+K** for apps and commands, **Ctrl+Alt+T** for a terminal" });
  welcome.tok = { input: 610, output: 140 };
  welcome.ms = 9400;
  newSession({ title: "pocket-planner", project: true });

  // ---------- the scripted agent ----------
  // Each reply is a list of steps streamed as the service's SSE events. Tool calls that change
  // something wait for the user's Allow, like Wren's approval flow.
  const words = (t) => t.match(/\S+\s*|\s+/g) || [];
  async function* streamText(s, text) {
    for (const w of words(text)) { if (s.stop) return; yield { type: "text_delta", text: w }; await sleep(14 + Math.random() * 30); }
  }
  let apSeq = 0;
  function step(s, o) { const st = { n: s.steps.length + 1, ...o }; s.steps.push(st); return st; }

  async function* toolCall(s, name, input, run, opts = {}) {
    yield { type: "tool_call", name, input };
    const st = step(s, { kind: "tool", tool: name, input, status: "running", undo: opts.approve || opts.change ? "yes" : "read-only",
      approval: opts.approve ? "" : opts.change ? "automatic (logged, can be undone)" : "automatic (read-only)" });
    const t = Date.now();
    if (opts.approve) {
      const id = `ap${++apSeq}`;
      const ask = { id, name, input, risk: opts.risk || "medium", summary: opts.summary, detail: opts.detail, undo: opts.undo };
      s.pending.push(ask);
      yield { type: "approval_request", ...ask };
      const allow = await new Promise((ok) => { ask.answer = ok; });
      s.pending = s.pending.filter((a) => a !== ask);
      if (!allow) { Object.assign(st, { status: "denied", approval: "denied by you", ms: Date.now() - t }); yield { type: "denied", name, risk: ask.risk }; return false; }
      st.approval = "approved by you";
    }
    await sleep(opts.ms ?? 450);
    const out = run();
    const output = typeof out === "string" ? out : out.output;
    Object.assign(st, { status: out.error ? "error" : "ok", output, ms: Date.now() - t, changes: out.change ? [out.change] : [] });
    yield { type: "tool_result", name, output, is_error: !!out.error };
    return true;
  }

  function pick(s, msg) {
    const m = msg.toLowerCase();
    if (/command not found|isn't installed|not recognized/.test(m)) return replyMissingCommand;
    if (/^i ran `/.test(m) && !/\b(npm|pnpm|yarn) (run )?t(est)?\b|vitest/.test(m)) return replyCommandFailed;
    if (/\b(fail\w*|tests?|fix|bugs?|broken)\b/.test(m)) return replyFixTests;
    if (/download|clean ?up|tidy|organi[sz]e|sort my/.test(m)) return replyDownloads;
    if (/\b(dark|light)\b/.test(m)) return replyTheme;
    if (/\bports?\b|listening|process|what's running|dev server/.test(m)) return replyPorts;
    if (/summari[sz]e the file|\bread\b|what does .* say/.test(m)) return replyReadFile;
    if (/folder|overview|what's in/.test(m)) return replyFolder;
    if (/wi-?fi|bluetooth|battery|volume|brightness|settings/.test(m)) return replySettings;
    // Files dragged in as chips arrive as "(Context: path, ...)".
    const ctx = contextPath(msg), n = ctx && node(ctx);
    if (n) return n.dir ? (s2, m2) => replyFolder(s2, `folder ${ctx}`) : (s2, m2) => replyReadFile(s2, `file ${ctx}`);
    return replyAbout;
  }
  const contextPath = (msg) => (msg.match(/\(Context: ([^,)]+)/) || [])[1];

  async function* replyAbout(s, msg) {
    const hello = /^(hi|hey|hello|yo)\b/i.test(msg.trim());
    yield* streamText(s, (hello ? "Hey! " : "") +
      "In this demo my replies are scripted, so I can't answer that one for real. On a Wren computer I run on your choice of model (a local one through Ollama by default, or Claude), and I can read and search your files, run commands and project scripts, change settings, install apps, and use the screen, asking before anything that changes your system.\n\n" +
      "Try one of these to see it work:\n- **Clean up my Downloads folder**\n- **What's listening on port 7878?**\n- **Switch to light mode**\n- **The tests are failing, can you fix them?**");
  }

  async function* replyPorts(s, msg) {
    const want = +(msg.match(/\b(\d{2,5})\b/) || [])[1] || null;
    const list = livePorts();
    yield* toolCall(s, "list_ports", {}, () => list.map((p) => `:${p.port}  ${p.name} (pid ${p.pid})  ${p.command}`).join("\n"), { ms: 380 });
    const p = want && list.find((x) => x.port === want);
    if (want && !p) return yield* streamText(s, `Nothing is listening on port ${want} right now. ${list.some((x) => x.dev) ? "" : "Press **Dev** in the pocket-planner tab and a Vite dev server shows up on 5173."}`);
    if (p) {
      const about = { wren: "That's me: Wren's own service. The desktop, the phone link and the agent all talk to it. Stopping it would cut off the desktop, so leave it running.",
        ollama: "That's Ollama, the local model server. It's what runs qwen2.5 for me, on this computer. Safe to stop if you're done with local AI, but I'd lose my local model until it starts again.",
        node: "That's the Vite dev server for **pocket-planner** (started from the project tab). Safe to stop: use **Stop** in the project bar, or the stop button in the top-bar Ports panel.",
        cupsd: "That's CUPS, the printing service. It only listens on this computer. Safe to stop if you never print, but it's a system service, so I'd leave it.",
        sshd: "That's the SSH server, so other computers can log in to this one. Stop it only if you don't use remote login." }[p.name];
      return yield* streamText(s, `Port **${p.port}** is **${p.name}** (pid ${p.pid}).\n\n${about}`);
    }
    yield* streamText(s, `${list.length} things are listening. ${list.some((x) => x.dev) ? "One is a dev server (**:5173**, pocket-planner). " : ""}The rest are Wren's service (:7878), Ollama (:11434) and two system services. The Ports button in the top bar shows them live, with Stop buttons.`);
  }

  async function* replyDownloads(s) {
    const dl = node("~/Downloads");
    const files = Object.entries(dl.kids).filter(([, e]) => !e.dir);
    yield* toolCall(s, "list_dir", { path: "~/Downloads" }, () => listing(dl).map((e) => `${e.dir ? "[dir] " : ""}${e.name}${e.dir ? "" : "  " + human(e.size)}`).join("\n"), { ms: 320 });
    const groups = { Images: /\.(jpe?g|png|webp|gif)$/i, Documents: /\.(pdf|txt|md|docx?)$/i, Installers: /\.(appimage|deb|flatpakref)$/i, CAD: /\.(step|stp|stl|f3d)$/i };
    const plan = {};
    for (const [name] of files) { const g = Object.keys(groups).find((k) => groups[k].test(name)); if (g) (plan[g] = plan[g] || []).push(name); }
    if (!Object.keys(plan).length) return yield* streamText(s, "Your Downloads folder is already tidy: nothing loose to sort.");
    yield* streamText(s, `${files.length} loose files. I'd sort them into folders:\n` + Object.entries(plan).map(([g, l]) => `- **${g}**: ${l.length} (${l.slice(0, 2).join(", ")}${l.length > 2 ? "…" : ""})`).join("\n") + "\n\nI'll ask before moving anything.");
    const cmd = `cd ~/Downloads && mkdir -p ${Object.keys(plan).join(" ")} && ` + Object.entries(plan).map(([g, l]) => `mv ${l.map((n) => (/\s/.test(n) ? `"${n}"` : n)).join(" ")} ${g}/`).join(" && ");
    const ok = yield* toolCall(s, "run_command", { command: cmd }, () => {
      const moved = [];
      for (const [g, l] of Object.entries(plan)) {
        dl.kids[g] = dl.kids[g] || d({}, 0);
        for (const n of l) { dl.kids[g].kids[n] = dl.kids[n]; delete dl.kids[n]; moved.push([n, g]); }
      }
      const change = journal(`Sorted ${moved.length} files in ~/Downloads into folders`, { kind: "file", path: "~/Downloads" }, () => {
        for (const [n, g] of moved) { const e = dl.kids[g]?.kids[n]; if (e) { dl.kids[n] = e; delete dl.kids[g].kids[n]; } }
        for (const g of Object.keys(plan)) if (dl.kids[g] && !Object.keys(dl.kids[g].kids).length) delete dl.kids[g];
        return `Put ${moved.length} files back in ~/Downloads`;
      }, moved.map(([n, g]) => `rename ${n} → ${g}/${n}`).join("\n"));
      return { output: moved.map(([n, g]) => `${n} → ${g}/`).join("\n"), change: { id: change.id, summary: change.summary, undoable: true } };
    }, { approve: true, risk: "medium", summary: `Move ${files.length} files into folders in ~/Downloads`, detail: cmd, undo: "Wren records every move, so Undo puts the files back." });
    if (!ok) return yield* streamText(s, "Okay, I left everything where it was.");
    yield* streamText(s, `Done. Open **Downloads** in the dock to see the folders. Changed your mind? The clock icon above this chat (Activity) has **Undo** for it, or type \`undo\` in Ctrl+K.`);
  }

  async function* replyTheme(s, msg) {
    const want = /\blight\b/i.test(msg) ? "light" : "dark";
    const before = typeof S !== "undefined" ? S.theme : "dark";
    if (before === want) return yield* streamText(s, `You're already in ${want} mode.`);
    yield* toolCall(s, "change_setting", { setting: "theme", value: want }, () => {
      setSetting("theme", want);
      const change = journal(`Theme: ${before} → ${want}`, { kind: "setting", path: "theme" }, () => { setSetting("theme", before); return `Theme back to ${before}`; }, `- theme = "${before}"\n+ theme = "${want}"`);
      return { output: `theme = ${want} (was ${before})`, change: { id: change.id, summary: change.summary, undoable: true } };
    }, { ms: 300, change: true });
    yield* streamText(s, `Switched to ${want} mode. Settings changes are logged too, so you can undo this from Activity.`);
  }

  async function* replySettings(s) {
    const st = QS_STATE;
    yield* toolCall(s, "get_settings", {}, () => JSON.stringify({ wifi: st.wifi, bluetooth: st.bluetooth, sound: st.sound, brightness: st.brightness, battery: st.battery, power_profile: st.power_profile }, null, 2), { ms: 300 });
    yield* streamText(s, `Wi-Fi is ${st.wifi.enabled ? `on, connected to **${st.wifi.ssid}** (${st.wifi.signal}%)` : "off"}. Bluetooth is ${st.bluetooth.powered ? `on${st.bluetooth.connected.length ? `, with ${st.bluetooth.connected.join(", ")} connected` : ""}` : "off"}. Volume ${st.sound.muted ? "is muted" : `is at ${st.sound.volume}%`}, brightness ${st.brightness}%, battery ${st.battery.percent}%.\n\nI can change any of these: try \`volume 30\` or \`bluetooth off\` in Ctrl+K, or just ask.`);
  }

  async function* replyFolder(s, msg) {
    const path = (msg.match(/folder\s+(\S+)/i) || [])[1]?.replace(/[.,]$/, "") || "~";
    const n = node(path);
    if (!n?.dir) return yield* streamText(s, `I couldn't find a folder at ${path}.`);
    const l = listing(n);
    yield* toolCall(s, "list_dir", { path: tilde(norm(path)) }, () => l.map((e) => `${e.dir ? "[dir] " : ""}${e.name}`).join("\n") || "(empty)", { ms: 300 });
    const dirs = l.filter((e) => e.dir && !e.name.startsWith(".")), fl = l.filter((e) => !e.dir);
    yield* streamText(s, l.length ? `**${tilde(norm(path))}** has ${dirs.length} folder${dirs.length === 1 ? "" : "s"}${dirs.length ? ` (${dirs.slice(0, 5).map((e) => e.name).join(", ")})` : ""} and ${fl.length} file${fl.length === 1 ? "" : "s"}${fl.length ? `, the biggest being ${fl.sort((a, b) => b.size - a.size)[0].name} (${human(fl[0].size)})` : ""}.` : "That folder is empty.");
  }

  async function* replyCommandFailed(s, msg) {
    const cmd = (msg.match(/^I ran `([^`]+)`/) || [])[1] || "that command";
    const exit = (msg.match(/\(exit (\d+)\)/) || [])[1];
    const out = (msg.match(/```\n?([\s\S]*?)```/) || [])[1] || "";
    const key = out.split("\n").map((l) => l.trim()).filter(Boolean).find((l) => /error|cannot|no such|not a|fatal|denied/i.test(l)) || out.trim().split("\n").pop() || "";
    yield* streamText(s, `\`${cmd}\` stopped with exit code ${exit ?? "≠ 0"}. The line that matters:\n\`${key}\`\n\n` +
      (/no such file/i.test(key) ? "The path doesn't exist from the folder you were in. Check the spelling, or run `ls` to see what's there."
        : /not a git repository/i.test(key) ? "This folder isn't a git project. `cd ~/projects/pocket-planner` first."
        : /package\.json/i.test(key) ? "There's no package.json here, so npm has nothing to run. The project is in `~/projects/pocket-planner`."
        : "In this demo I can only explain a few failures. On Wren I'd read the full output, look at the files involved and suggest a fix."));
  }

  async function* replyReadFile(s, msg) {
    const path = (msg.match(/file\s+(.+?)(?:\s+in a few bullet points)?[.?]?$/i) || [])[1] || "~/Documents/Engineering notebook.md";
    const n = node(path);
    if (!n || n.dir) return yield* streamText(s, `I couldn't open ${path}.`);
    yield* toolCall(s, "read_file", { path: tilde(norm(path)) }, () => n.text ?? `(binary file, ${human(n.size)})`, { ms: 300 });
    if (n.text == null) return yield* streamText(s, `That's a binary file (${human(n.size)}), so there's no text to summarize.`);
    const lines = n.text.split("\n").map((l) => l.replace(/^[#\-\s]+/, "").trim()).filter(Boolean);
    yield* streamText(s, `In short:\n${lines.slice(0, 4).map((l) => `- ${l}`).join("\n")}`);
  }

  async function* replyMissingCommand(s, msg) {
    const cmd = (msg.match(/`([^`\s]+)/) || [])[1] || "that program";
    yield* streamText(s, `\`${cmd}\` isn't installed on this computer, so the shell couldn't find it. If it's an app, search for it in the **App Store** (Ctrl+K, then \`install ${cmd}\`). If it's a command-line tool, I can install it with apt for you, after you approve.`);
  }

  async function* replyFixTests(s) {
    const root = "~/projects/pocket-planner";
    if (PROJ.fixed) return yield* streamText(s, "I already fixed `weekStart` in this demo. Press **Test** in the pocket-planner tab: all 7 tests pass now.");
    yield* streamText(s, "Let me run the tests to see the failure.");
    const ran = yield* toolCall(s, "run_command", { command: "npm test", root }, () => ({ output: TEST_FAIL, error: true }),
      { approve: true, risk: "medium", summary: "Run npm test in pocket-planner", detail: `cd ${root} && npm test`, undo: "Wren snapshots the project's git state first, so changes can be undone.", ms: 1200 });
    if (!ran) return yield* streamText(s, "Okay, I won't run anything. The test output in the project bar is enough to start from if you paste it.");
    yield* toolCall(s, "read_file", { path: `${root}/src/dates.ts` }, () => DATES_TS, { ms: 300 });
    yield* streamText(s, "Found it. `weekStart` subtracts `getDay()`, but `getDay()` counts from **Sunday** (0), so every week starts on Sunday. The test expects Monday. Shifting it so Monday is 0 fixes it:");
    const patch = `--- a/src/dates.ts\n+++ b/src/dates.ts\n@@ -2,6 +2,6 @@\n export function weekStart(date: Date): Date {\n   const d = new Date(date);\n-  const diff = d.getDay();\n+  const diff = (d.getDay() + 6) % 7; // Monday = 0\n   d.setDate(d.getDate() - diff);`;
    const wrote = yield* toolCall(s, "write_file", { path: `${root}/src/dates.ts` }, () => {
      const file = node(`${root}/src/dates.ts`), old = file.text;
      file.text = old.replace("const diff = d.getDay();", "const diff = (d.getDay() + 6) % 7; // Monday = 0");
      PROJ.fixed = true;
      const change = journal("Edited src/dates.ts (weekStart: weeks start on Monday)", { kind: "file", path: `${root}/src/dates.ts` }, () => { file.text = old; PROJ.fixed = false; return "Restored src/dates.ts"; }, patch);
      return { output: "Wrote src/dates.ts (1 line changed)", change: { id: change.id, summary: change.summary, undoable: true } };
    }, { approve: true, risk: "medium", summary: "Edit src/dates.ts in pocket-planner", detail: patch, undo: "Wren keeps a copy of the old file: Undo restores it." });
    if (!wrote) return yield* streamText(s, "No problem, I didn't change the file. The fix is the one line above if you'd rather make it yourself.");
    yield* streamText(s, "Fixed. Press **Test** in the project bar to check: all 7 should pass. The edit is in Activity with **Diff** and **Undo**.");
  }

  // Runs one message as an SSE stream.
  function chat(s, message) {
    const enc = new TextEncoder();
    s.stop = false;
    return new ReadableStream({
      async start(ctrl) {
        const send = (ev) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
        const t0 = Date.now();
        s.busy = true;
        s.log.push({ type: "user", text: message.replace(/\n\n\(Context: .*\)$/s, "") });
        step(s, { kind: "user", text: message });
        const b = BACKENDS[s.backend];
        let model = b;
        if (s.route) {
          const big = message.length > 160 || /fix|test|code|clean/i.test(message);
          model = s.route === "local" || !big ? BACKENDS.local : BACKENDS.claude;
          const ev = { type: "route", model: model.model, local: model.local, why: big ? "a multi-step task: a stronger model" : "a quick question: the small local model", expected_usd: model.local ? null : 0.004, flat_rate: false };
          send(ev); s.log.push(ev);
          step(s, { kind: "route", model: model.model, why: ev.why });
        }
        await sleep(model.local ? 700 : 450);
        let text = "", tid = `t${Date.now()}`;
        try {
          for await (const ev of pick(s, message)(s, message)) {
            if (s.stop) break;
            if (ev.type === "text_delta") { text += ev.text; send(ev); continue; }
            if (text) { s.log.push({ type: "text", id: tid, text }); text = ""; tid = `t${Date.now()}`; }
            send(ev);
            if (ev.type !== "approval_request") s.log.push(ev);
          }
        } catch (e) { send({ type: "error", message: String(e.message || e) }); console.error(e); }
        if (text) s.log.push({ type: "text", id: tid, text });
        const out = Math.round(text.length / 4) + 60, inp = 900 + message.length / 4;
        s.tok.input += Math.round(inp); s.tok.output += out;
        const ms = Date.now() - t0;
        if (model.local) s.ms += ms; else s.cost += (inp * 3 + out * 15) / 1e6;
        step(s, { kind: "model", model: model.model, usage: { input: Math.round(inp), output: out }, ms, cost_usd: model.local ? 0 : (inp * 3 + out * 15) / 1e6 });
        const u = info(s).usage;
        send({ type: "usage", totals: { tokens: u.tokens, cost_usd: u.cost_usd, cost_reported: 0, cost_estimated: u.cost_estimated, local_ms: u.local_ms } });
        s.busy = false;
        send({ type: "done", status: info(s) });
        ctrl.close();
      },
    });
  }

  // ---------- project runs ----------
  function startRun(s, id) {
    const a = projectBase().actions.find((x) => x.id === id), sc = SCRIPT[id];
    if (s.run?.status === "running") stopRun(s);
    const run = { action: id, label: a.label, command: a.command, status: "running", started: Date.now(), ended: null, exit_code: null };
    s.run = run; s.runOut = "";
    const lines = [...sc.lines];
    let i = 0;
    s.runTimer = setInterval(() => {
      if (i < lines.length) { s.runOut += lines[i++] + "\n"; if (id === "dev" && i === 4 && !PORTS.includes(DEV_PORT)) { DEV_PORT.uptime_secs = 0; DEV_PORT.started = Date.now(); PORTS.unshift(DEV_PORT); } return; }
      if (sc.forever) return;
      clearInterval(s.runTimer);
      Object.assign(run, { status: sc.ok ? "passed" : "failed", ended: Date.now(), exit_code: sc.ok ? 0 : 1 });
    }, id === "test" ? 70 : 140);
  }
  function stopRun(s) {
    clearInterval(s.runTimer);
    if (s.run?.status === "running") Object.assign(s.run, { status: "stopped", ended: Date.now() });
    if (s.run?.action === "dev") { const i = PORTS.indexOf(DEV_PORT); if (i >= 0) PORTS.splice(i, 1); }
  }
  const livePorts = () => PORTS.map((p) => (p === DEV_PORT ? { ...p, uptime_secs: Math.round((Date.now() - p.started) / 1000) } : { ...p, uptime_secs: p.uptime_secs + Math.round((Date.now() - T0 * 1000) / 1000) }));

  // ---------- quick settings ----------
  const QS_STATE = {
    battery: { charging: false, minutes_left: 312, percent: 84, plugged: false },
    bluetooth: { powered: true, connected: ["WH-1000XM4"] },
    brightness: 70, power_profile: "balanced", power_profiles: ["power-saver", "balanced", "performance"],
    sound: { muted: false, volume: 45 }, wifi: { can_toggle: true, enabled: true, signal: 82, ssid: "Home Wi-Fi" },
  };
  const NETS = [
    { in_use: true, known: true, secure: true, signal: 82, ssid: "Home Wi-Fi" },
    { in_use: false, known: false, secure: true, signal: 64, ssid: "Robotics Lab" },
    { in_use: false, known: true, secure: true, signal: 40, ssid: "School-Guest" },
    { in_use: false, known: false, secure: false, signal: 22, ssid: "Coffee Shop" },
  ];
  const BT = [
    { name: "WH-1000XM4", address: "38:18:4C:00:00:01", connected: true, paired: true },
    { name: "MX Master 3S", address: "D4:3B:04:00:00:02", connected: false, paired: true },
  ];

  // ---------- clipboard ----------
  let clipSeq = 0;
  const CLIP = { enabled: true, items: [] };
  const kindOf = (t) => (/^\s*[[{][\s\S]*[\]}]\s*$/.test(t) ? "json" : /^https?:\/\/\S+$/.test(t.trim()) ? "url" : /^#[0-9a-f]{6}$/i.test(t.trim()) ? "color" : /^[~/][\w./ -]+$/.test(t.trim()) ? "path" : /(Error|Exception|Traceback)\b/.test(t) ? "error" : /[{};]\s*$|=>|function |const /m.test(t) ? "code" : "text");
  function clip(text, agoS = 0) {
    CLIP.items.unshift({ id: ++clipSeq, kind: kindOf(text), preview: text.length > 240 ? text.slice(0, 240) + "…" : text, chars: text.length, ts: now() - agoS, sensitive: false, text });
  }
  clip("TypeError: Cannot read properties of undefined (reading 'map')\n    at TaskList (src/TaskList.tsx:14:22)", 3600);
  clip("#7c9cff", 2400);
  clip('{"team":"8780E","season":"Override","drive":{"motors":6,"rpm":450}}', 900);
  clip("https://flathub.org/apps/org.kicad.KiCad", 300);
  clip("~/projects/pocket-planner/src/dates.ts", 60);
  const CLIP_AI = {
    ts_type: "```ts\ninterface Robot {\n  team: string;\n  season: string;\n  drive: { motors: number; rpm: number };\n}\n```",
    explain_error: "`tasks` is `undefined` when **TaskList** first renders, so `.map` fails on line 14. Give it a default (`tasks = []`) or render nothing until the data loads.",
    explain_code: "It declares a value and returns it. (Scripted answer: on Wren, your local model explains the real code.)",
    summarize: "A short note. (Scripted answer: on Wren, your local model writes the summary.)",
    concise: "Shorter version. (Scripted answer: on Wren, your local model rewrites it.)",
  };

  // ---------- app store ----------
  const CURATED = [
    ["Essentials", "Zen Browser", "app.zen_browser.zen"], ["Essentials", "Discord", "com.discordapp.Discord"], ["Essentials", "Spotify", "com.spotify.Client"],
    ["Essentials", "Obsidian", "md.obsidian.Obsidian"], ["Essentials", "Bitwarden", "com.bitwarden.desktop"], ["Essentials", "Text Editor", "org.gnome.TextEditor"],
    ["Essentials", "Image Viewer", "org.gnome.Loupe"], ["Essentials", "LibreOffice", "org.libreoffice.LibreOffice"], ["Developer", "Visual Studio Code", "com.visualstudio.code"],
    ["Developer", "Postman", "com.getpostman.Postman"], ["Engineering", "FreeCAD", "org.freecad.FreeCAD"], ["Engineering", "KiCad", "org.kicad.KiCad"],
    ["Engineering", "Arduino IDE", "cc.arduino.IDE2"], ["Create", "Blender", "org.blender.Blender"], ["Create", "GIMP", "org.gimp.GIMP"], ["Create", "Inkscape", "org.inkscape.Inkscape"],
    ["Create", "OBS Studio", "com.obsproject.Studio"], ["Create", "Godot Engine", "org.godotengine.Godot"], ["Media & games", "Celluloid", "io.github.celluloid_player.Celluloid"],
    ["Media & games", "VLC", "org.videolan.VLC"], ["Media & games", "Steam", "com.valvesoftware.Steam"],
  ];
  // What Wren OS preinstalls (distro/install.sh), plus one app with an update waiting.
  const INSTALLED = new Map([
    ["app.zen_browser.zen", { version: "1.14.5b", update: null }], ["org.gnome.TextEditor", { version: "48.2", update: null }],
    ["org.gnome.Loupe", { version: "48.1", update: null }], ["io.github.celluloid_player.Celluloid", { version: "0.27", update: "0.28" }],
  ]);
  const storeApp = ([category, name, id]) => ({ category, name, id, flathub: id, installed: INSTALLED.has(id), update: INSTALLED.get(id)?.update || null, version: INSTALLED.get(id)?.version || "", summary: "" });
  const JOBS = new Map();
  let detailsP = null;
  const details = () => (detailsP = detailsP || realFetch(new URL("store/details.json", document.baseURI)).then((r) => r.json()).catch(() => ({})));
  function storeJob(action, id, name) {
    const job = { id, name, action, status: "running", progress: 0, line: "Starting…", error: null };
    JOBS.set(id, job);
    const t = setInterval(() => {
      job.progress = Math.min(100, job.progress + 9 + Math.round(Math.random() * 12));
      job.line = job.progress < 60 ? "Downloading…" : "Installing…";
      if (job.progress < 100) return;
      clearInterval(t);
      job.status = "done";
      if (action === "uninstall") INSTALLED.delete(id);
      else INSTALLED.set(id, { version: action === "update" ? INSTALLED.get(id)?.update || "" : "latest", update: null });
    }, 350);
  }
  const launcherApps = () => [...INSTALLED.keys()].map((id) => ({ key: `${id}.png`, name: CURATED.find((c) => c[2] === id)?.[1] || id, has_icon: true }));

  // ---------- updates ----------
  const UPD = {
    supported: true, can_manage: true, running: null, channel: "beta", download: true, progress: {}, reboot: [],
    state: { checked: now() - 5400, last: null, updates: [
      { name: "wren", from: "0.1.0", to: "0.1.1", wren: true, security: false },
      { name: "wren-os", from: "0.1.0", to: "0.1.1", wren: true, security: false },
      { name: "openssl", from: "3.5.1-1", to: "3.5.1-1+deb13u1", security: true },
      { name: "firmware-linux-free", from: "20241210-1", to: "20241210-2" },
    ] },
    snapshots: { available: true, ready: true, list: [{ id: 3, date: now() - 86400 * 2, reason: "Before update", wren: "0.1.0", bootable: true }, { id: 2, date: now() - 86400 * 6, reason: "Before update", wren: "0.0.9", bootable: true }] },
    version: { wren: "0.1.0", wren_os: "0.1.0" },
  };
  function runUpdate(action) {
    if (action === "check") { UPD.running = "check"; setTimeout(() => { UPD.running = null; UPD.state.checked = now(); }, 1600); return; }
    if (action === "snapshot") { UPD.running = "snapshot"; setTimeout(() => { UPD.running = null; UPD.snapshots.list.unshift({ id: Date.now(), date: now(), reason: "Saved by you", wren: UPD.version.wren, bootable: true }); }, 1400); return; }
    if (action.startsWith("channel-")) { UPD.running = action; setTimeout(() => { UPD.running = null; UPD.channel = action.slice(8); }, 1000); return; }
    if (action.startsWith("download-")) { UPD.download = action === "download-on"; return; }
    if (action === "apply") {
      UPD.running = "apply";
      const phases = [["saving", 6, "Restore point"], ["downloading", 35, "openssl, wren-os"], ["downloading", 60, "wren"], ["installing", 80, "Setting up wren-os"], ["installing", 96, "Setting up wren"]];
      phases.forEach(([phase, percent, text], i) => setTimeout(() => { UPD.progress = { phase, percent, text }; }, i * 900));
      setTimeout(() => {
        UPD.running = null; UPD.progress = {};
        UPD.snapshots.list.unshift({ id: Date.now(), date: now(), reason: "Before update", wren: UPD.version.wren, bootable: true });
        UPD.reboot = ["wren-os", "openssl"]; UPD.state.updates = []; UPD.state.last = { result: "ok" };
      }, phases.length * 900 + 400);
    }
  }

  // ---------- the API ----------
  const realFetch = window.fetch.bind(window);
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  const err = (message, status = 400) => json({ error: message }, status);
  const LOCK = { locked: false };

  async function handle(method, path, q, body) {
    let m;
    const sess = (id) => SESS.get(+id);
    // sessions
    if (path === "/sessions" && method === "GET") return { sessions: [...SESS.values()].map(info) };
    if (path === "/sessions" && method === "POST") {
      if (body.project && !/pocket-planner/.test(body.project)) return err(ONE_PROJECT);
      return info(newSession({ backend: body.backend, project: !!body.project, title: body.project ? "pocket-planner" : undefined }));
    }
    if (path === "/backends") return { available: Object.entries(BACKENDS).map(([name, b]) => ({ name, kind: b.kind })), current: info([...SESS.values()][0]), default: "local" };
    if ((m = path.match(/^\/sessions\/(\d+)(\/.*)?$/))) {
      const s = sess(m[1]), rest = m[2] || "";
      if (!s) return err("No such task", 404);
      if (!rest && method === "DELETE") { SESS.delete(s.id); return { ok: true }; }
      if (!rest) return info(s);
      if (rest === "/chat/stream") return new Response(chat(s, body.message || ""), { headers: { "content-type": "text/event-stream" } });
      if (rest === "/log") { const since = +q.get("since") || 0; return { entries: s.log.slice(since), seq: s.log.length }; }
      if (rest === "/approve") { const a = s.pending.find((x) => x.id === body.id); if (a) a.answer(!!body.allow); return { ok: true }; }
      if (rest === "/stop") { s.stop = true; s.pending.forEach((a) => a.answer(false)); return { ok: true }; }
      if (rest === "/backend") { if (!BACKENDS[body.name]) return err("No such model"); s.backend = body.name; s.route = null; return info(s); }
      if (rest === "/route") { s.route = body.policy || null; return info(s); }
      if (rest === "/title") { s.title = body.title; return info(s); }
      if (rest === "/reset") { s.log = []; s.steps = []; return info(s); }
      if (rest === "/budget") { s.budget = body.usd; return info(s); }
      if (rest === "/control") return err("Computer control needs a real screen: on Wren, Wren sees the screen and uses the mouse and keyboard for the minutes you allow.");
      if (rest === "/project") {
        if (body.path && !/pocket-planner/.test(body.path)) return err(ONE_PROJECT);
        s.project = body.path ? projectBase() : null; if (body.path) s.title = "pocket-planner";
        return info(s);
      }
      if (rest === "/project/refresh") return info(s);
      if (rest === "/project/run" && method === "POST") { startRun(s, body.action); return info(s); }
      if (rest === "/project/run") return s.run ? { ...s.run, output: s.runOut } : null;
      if (rest === "/project/run/stop") { stopRun(s); return info(s); }
      if (rest === "/parallel") return err("Parallel tasks make a git worktree on your disk, so they need the real Wren.");
      if (rest === "/recorder") {
        const tools = s.steps.filter((x) => x.kind === "tool");
        const changes = (x) => (x.changes || []).map((c) => { const j = JOURNAL.find((e) => e.id === c.id); return { ...c, undoable: !!j && !j.undone_by, undone_by: j?.undone_by || null }; });
        return { totals: { tools: tools.length, tool_ms: tools.reduce((n, x) => n + (x.ms || 0), 0), model_ms: s.steps.filter((x) => x.kind === "model").reduce((n, x) => n + x.ms, 0), tokens: s.tok.input + s.tok.output, cost_usd: s.cost },
          steps: s.steps.map((x) => (x.kind === "tool" ? { ...x, changes: changes(x) } : x)) };
      }
      if (rest === "/recorder/report") return new Response(`# ${s.title}\n\n` + s.steps.map((x) => (x.kind === "user" ? `**You:** ${x.text}` : x.kind === "tool" ? `- \`${x.tool}\` ${JSON.stringify(x.input)} · ${x.status}${x.approval ? ` · ${x.approval}` : ""}` : x.kind === "model" ? `- model ${x.model} · ${x.ms} ms` : "")).filter(Boolean).join("\n") + "\n", { headers: { "content-type": "text/markdown" } });
      if (rest === "/access") return { roots: [{ path: "~", what: "Your home folder", access: "read" }, { path: "~/projects/pocket-planner", what: "This task's project", access: "write" }, { path: "/tmp", what: "Scratch space", access: "write" }],
        grants: [], never: ["~/.ssh", "~/.gnupg", "~/.config/wren/secrets", "browser profiles", "password-manager data"], commands_confined: true };
      if (rest.startsWith("/access/grants")) return err("Access grants are on the real Wren only.");
      if (rest.startsWith("/worktree")) return err("Parallel tasks need the real Wren.");
    }
    if (path === "/optimize") {
      const o = body.prompt.replace(/\b(please|could you|can you|i was wondering if|kind of|sort of|just|basically|actually|really)\b\s*/gi, "").replace(/\s+/g, " ").trim();
      return { optimized: o[0] ? o[0].toUpperCase() + o.slice(1) : o, model: "qwen2.5:7b" };
    }
    if (path === "/projects") return { home: HOME, recent: [{ name: "pocket-planner", root: `${HOME}/projects/pocket-planner`, stack: ["React", "Vite", "Vitest"] }] };
    if (path === "/fs/list") {
      const p = norm(q.get("path")), n = node(p);
      if (!n) return err(`No such folder: ${tilde(p)}`, 404);
      if (!n.dir) return err(`${tilde(p)} is a file`);
      return { path: p, sep: "/", parent: p === "/" ? null : p.replace(/\/[^/]+$/, "") || "/", home: HOME, entries: listing(n) };
    }
    // undo journal
    if (path === "/timeline" && method === "DELETE") { JOURNAL.length = 0; return { ok: true }; }
    if (path === "/timeline") return { bytes: 184320 * JOURNAL.length, entries: JOURNAL.map(({ undo, patch, ...e }) => ({ ...e, undoable: !e.undone_by })) };
    if ((m = path.match(/^\/timeline\/(\d+)\/(undo|diff)$/))) {
      const e = JOURNAL.find((x) => x.id === +m[1]);
      if (!e) return err("Not in the undo history", 404);
      if (m[2] === "diff") return { patch: e.patch || "" };
      if (e.undone_by) return err("Already undone");
      const message = e.undo();
      e.undone_by = ++journalSeq;
      return { message };
    }
    // system
    if (path === "/lock" && method === "POST") { LOCK.locked = true; return { display: "Kailash", fingerprint: false, locked: true, user: "kailash", wait: 0 }; }
    if (path === "/lock") return { display: "Kailash", fingerprint: false, locked: LOCK.locked, user: "kailash", wait: 0 };
    if (path === "/unlock") { if (!body.password) return err("Type a password"); LOCK.locked = false; return { ok: true }; }
    if (path === "/unlock/fingerprint") return err("No fingerprint reader", 400);
    if (path === "/fonts/custom" && method === "GET") return { display: null, ui: null };
    if (path.startsWith("/fonts/custom/")) return err("Custom fonts are saved on your computer by the real Wren.");
    if (path === "/setup" && method === "GET") return { claude_code: true, default: "local", display: "Kailash", done: true, user: "kailash",
      models: [{ has_key: null, key_name: null, kind: "openai", local: true, name: "local" }, { has_key: false, key_name: "ANTHROPIC_API_KEY", kind: "anthropic", local: false, name: "claude" }, { has_key: null, key_name: null, kind: "claude-code", local: false, name: "claude-code" }] };
    if (path === "/setup/done" || path === "/backends/default") return { ok: true };
    if (path === "/system/stats") {
      const t = Date.now() / 1000, cpu = 9 + 6 * Math.sin(t / 7) + Math.random() * 5 + (SESS_BUSY() ? 38 : 0);
      return { cpu, ram_used: (5.1 + Math.sin(t / 30) * 0.2) * 1073741824, ram_total: 16 * 1073741824, temp: 47 + cpu / 6, temp_source: "coretemp", pressure: "ok", issues: 0 };
    }
    if (path === "/system/resources") {
      const G = 1073741824;
      return { memory: { total: 16 * G, available: 10.8 * G, psi: 0 }, cpu: { cores: 8 }, disk: { free: 182 * G, total: 476 * G }, pressure: "ok", issues: [],
        models: [{ name: "qwen2.5:7b", memory: 4.9 * G }],
        groups: [{ name: "Wren", kind: "wren", memory: 0.21 * G, cpu: 3 }, { name: "ollama", kind: "model", memory: 4.9 * G, cpu: 2 }, { name: "Zen Browser", kind: "app", memory: 1.4 * G, cpu: 18 }, { name: "Text Editor", kind: "app", memory: 0.18 * G, cpu: 1 }, { name: "labwc", kind: "system", memory: 0.06 * G, cpu: 1 }] };
    }
    if (path === "/system/resources/fix") return { message: `Unloaded ${body.arg || "the model"} from memory (demo)` };
    if (path === "/system/profile") return { battery: true, cpu: { cores: 8, model: "Intel Core i5-1235U" }, disk: { free_gb: 182, total_gb: 476 }, gpu_accel: null,
      ollama: { configured: true, model: "qwen2.5:7b", models: [{ gb: 4.7, name: "qwen2.5:7b" }, { gb: 2.0, name: "llama3.2:3b" }], reachable: true }, os: "linux", ram_gb: 15.6 };
    if (path === "/system/ports") return { ports: livePorts() };
    if (path === "/system/stop") {
      const p = PORTS.find((x) => x.pid === body.pid);
      if (!p) return err("That process already ended");
      if (p === DEV_PORT) { for (const s of SESS.values()) if (s.run?.action === "dev") stopRun(s); return { message: "Stopped node (pid 4410)" }; }
      return err(`Stopping ${p.name} would break the demo, so it's left running.`);
    }
    if (path === "/system/updates" && method === "POST") { runUpdate(body.action); return UPD; }
    if (path === "/system/updates") return UPD;
    if (path === "/usage") { const all = [...SESS.values()]; return { total: { cost_usd: all.reduce((n, s) => n + s.cost, 0), tokens: all.reduce((n, s) => n + s.tok.input + s.tok.output, 0), calls: all.reduce((n, s) => n + s.steps.filter((x) => x.kind === "model").length, 0) + 1 } }; }
    if (path === "/router") return { candidates: [
      { name: "qwen2.5:7b", local: true, size_gb: 4.7, tier: 2, vision: false, available: true },
      { name: "llama3.2:3b", local: true, size_gb: 2.0, tier: 1, vision: false, available: true },
      { name: "Claude Sonnet", local: false, tier: 3, vision: true, available: true, note: "API key" },
      { name: "Claude Code", local: false, flat_rate: true, tier: 3, vision: true, available: true } ] };
    if (path === "/mcp") return { servers: [{ name: "github", command: "npx -y @modelcontextprotocol/server-github", running: true, disabled: false, tools: ["search_repositories", "get_file_contents", "list_issues", "create_issue", "create_pull_request"] }] };
    if (path.startsWith("/mcp")) return err("Tool servers run as programs on your computer, so they need the real Wren.");
    if (path === "/secrets" && method === "GET") return { store: "the system keyring (Secret Service)", secrets: [{ name: "ANTHROPIC_API_KEY", set: false, hint: "", source: "", used_by: ["claude"] }, { name: "GITHUB_TOKEN", set: true, hint: "…k9Qz", source: "keyring", used_by: ["github (MCP)"] }] };
    if (path.startsWith("/secrets")) return err("The demo doesn't take keys. On Wren they go to your system keyring, never to the AI.");
    if (path === "/phone" || path === "/phone/enable") return { addresses: [{ ip: "192.168.1.24", kind: "lan", label: "Home network" }], devices: [{ id: 1, name: "Galaxy S25", paired_at: now() - 86400 * 2, last_seen: now() - 600 }], enabled: true, ntfy: null, pairing: false, port: 7870, running: 7870, screen: false };
    if (path.startsWith("/phone")) return err("Phone pairing needs Wren running on your network.");
    if (path === "/terminal/notify") return { ok: true };
    // quick settings
    if (path === "/settings/status") return QS_STATE;
    if (path === "/settings/wifi" && method === "GET") { if (q.get("rescan")) await sleep(900); return QS_STATE.wifi.enabled ? NETS : []; }
    if (path === "/settings/wifi") { QS_STATE.wifi.enabled = !!body.enabled; QS_STATE.wifi.ssid = body.enabled ? "Home Wi-Fi" : null; return { ok: true }; }
    if (path === "/settings/wifi/connect") { await sleep(900); const n = NETS.find((x) => x.ssid === body.ssid); if (n?.secure && !n.known && !body.password) return err("Needs a password"); NETS.forEach((x) => (x.in_use = x === n)); if (n) { n.known = true; Object.assign(QS_STATE.wifi, { ssid: n.ssid, signal: n.signal }); } return { ok: true }; }
    if (path === "/settings/bluetooth" && method === "GET") { if (q.get("scan")) await sleep(1500); return BT; }
    if (path === "/settings/bluetooth") { QS_STATE.bluetooth.powered = !!body.enabled; if (!body.enabled) { QS_STATE.bluetooth.connected = []; BT.forEach((b) => (b.connected = false)); } return { ok: true }; }
    if (path === "/settings/bluetooth/device") { await sleep(700); const b = BT.find((x) => x.address === body.address); if (b) { b.connected = body.action !== "disconnect"; b.paired = true; } QS_STATE.bluetooth.connected = BT.filter((x) => x.connected).map((x) => x.name); return { ok: true }; }
    if (path === "/settings/sound") { if (body.volume != null) Object.assign(QS_STATE.sound, { volume: body.volume, muted: false }); if (body.muted != null) QS_STATE.sound.muted = body.muted; return { ok: true }; }
    if (path === "/settings/brightness") { QS_STATE.brightness = body.level; return { ok: true }; }
    if (path === "/settings/power-mode") { QS_STATE.power_profile = body.name; return { ok: true }; }
    if (path === "/settings/power") return err(`${{ sleep: "Sleep", restart: "Restart", shutdown: "Shut down" }[body.action] || "That"} isn't available in the browser demo. On Wren it goes to the system.`);
    if (path === "/settings/open-system") return err(DEMO_ONLY);
    // clipboard
    if (path === "/clipboard" && method === "DELETE") { CLIP.items = []; return { ok: true }; }
    if (path === "/clipboard") return { available: true, enabled: CLIP.enabled, items: CLIP.enabled ? CLIP.items.map(({ text, ...c }) => c) : [] };
    if (path === "/clipboard/settings") { CLIP.enabled = !!body.enabled; return { ok: true }; }
    if (path === "/clipboard/copy") { const t = body.text ?? CLIP.items.find((c) => c.id === body.id)?.text; if (t != null) { navigator.clipboard?.writeText(t).catch(() => {}); if (body.text != null) clip(t); } return { ok: true }; }
    if (path === "/clipboard/action") { await sleep(900); return { result: CLIP_AI[body.action] || "Done." }; }
    if ((m = path.match(/^\/clipboard\/(\d+)$/))) { const c = CLIP.items.find((x) => x.id === +m[1]); if (method === "DELETE") { CLIP.items = CLIP.items.filter((x) => x !== c); return { ok: true }; } return c ? { text: c.text } : err("Gone", 404); }
    // apps
    if (path === "/launcher/apps") return { apps: launcherApps(), loading: false };
    if (path === "/launcher/launch" || path === "/apps/launch") return err(DEMO_ONLY);
    if (path === "/windows") { if (q.has("since")) await sleep(55000); return { available: true, version: 1, windows: [] }; }
    if (path.startsWith("/windows/")) return err(DEMO_ONLY);
    if (path === "/control/stop") return { ok: true };
    // store
    if (path === "/store/discover") return { apps: CURATED.map(storeApp), backend: "flatpak", free_bytes: 182e9 };
    if (path === "/store/installed") return { apps: CURATED.filter((c) => INSTALLED.has(c[2])).map(storeApp) };
    if (path === "/store/search") { const s = (q.get("q") || "").toLowerCase(), all = await details(); return { apps: CURATED.filter((c) => c[1].toLowerCase().includes(s) || (all[c[2]]?.summary || "").toLowerCase().includes(s) || c[2].toLowerCase().includes(s)).map(storeApp) }; }
    if ((m = path.match(/^\/store\/details\/(.+)$/))) { const all = await details(); const x = all[decodeURIComponent(m[1])]; return x || err("Not on Flathub", 404); }
    if (path === "/store/jobs") return { jobs: [...JOBS.values()] };
    if ((m = path.match(/^\/store\/(install|uninstall|update)$/))) { storeJob(m[1], body.id, body.name); return { ok: true }; }
    return null;
  }
  const SESS_BUSY = () => [...SESS.values()].some((s) => s.busy);

  window.fetch = async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : input, location.href);
    // Files of the demo itself (store details, icons) go to the network as usual.
    if (url.origin !== location.origin || url.pathname.startsWith(new URL(".", document.baseURI).pathname)) return realFetch(input, init);
    const method = (init.method || "GET").toUpperCase();
    let body = {};
    try { if (init.body) body = JSON.parse(init.body); } catch {}
    await sleep(20 + Math.random() * 60);
    try {
      const r = await handle(method, url.pathname, url.searchParams, body);
      if (r instanceof Response) return r;
      if (r === null && !/\/project\/run$/.test(url.pathname)) { console.debug("[wren demo] not mocked:", method, url.pathname); return err("Not part of the browser demo", 404); }
      return json(r);
    } catch (e) { console.error(e); return err(String(e.message || e), 500); }
  };

  // ---------- terminal: a small pretend shell ----------
  class DemoShell {
    constructor(url) {
      this.readyState = 0; this.binaryType = "arraybuffer";
      const q = new URL(url).searchParams;
      this.cwd = norm(q.get("cwd") || "~"); this.line = ""; this.hist = []; this.hi = 0;
      setTimeout(() => { this.readyState = 1; this.onopen?.(); this.out(`\x1b[2mWren demo shell: a pretend terminal (try \x1b[0mhelp\x1b[2m, \x1b[0mls\x1b[2m, \x1b[0mfastfetch\x1b[2m, \x1b[0mnpm test\x1b[2m in the project).\x1b[0m\r\n`); this.prompt(); }, 60);
    }
    out(s) { this.onmessage?.({ data: s }); }
    prompt() { this.out(`\x1b[1;38;5;111mkailash@wren\x1b[0m:\x1b[1;38;5;147m${tilde(this.cwd)}\x1b[0m$ `); }
    close() { this.readyState = 3; }
    send(raw) {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.t !== "in") return;
      for (const tok of m.d.match(/\x1b\[[0-9;]*[A-Za-z~]|[\s\S]/g) || []) {
        if (tok === "\x1b[A" || tok === "\x1b[B") { // history
          if (!this.hist.length) continue;
          this.hi = Math.max(0, Math.min(this.hist.length, this.hi + (tok === "\x1b[A" ? -1 : 1)));
          this.out("\b \b".repeat(this.line.length)); this.line = this.hist[this.hi] || ""; this.out(this.line);
        }
        else if (tok.startsWith("\x1b")) continue; // other keys: not in the demo
        else if (tok === "\r") { this.out("\r\n"); this.exec(this.line); this.line = ""; }
        else if (tok === "\x7f" || tok === "\b") { if (this.line) { this.line = this.line.slice(0, -1); this.out("\b \b"); } }
        else if (tok === "\x03") { this.out("^C\r\n"); this.line = ""; this.prompt(); }
        else if (tok === "\x0c") { this.out("\x1b[2J\x1b[H"); this.prompt(); this.out(this.line); }
        else if (tok >= " ") { this.line += tok; this.out(tok); }
      }
    }
    path(a) { return norm(a.startsWith("/") || a.startsWith("~") ? a : `${this.cwd}/${a}`); }
    async exec(cmd) {
      cmd = cmd.trim();
      if (cmd) { this.hist.push(cmd); this.hi = this.hist.length; }
      const t = Date.now();
      let code = 0;
      const p = (s = "") => this.out(s.replace(/\n/g, "\r\n") + "\r\n");
      const [name, ...args] = cmd.split(/\s+/);
      const inProj = this.cwd.startsWith(`${HOME}/projects/pocket-planner`);
      switch (name) {
        case "": break;
        case "help": p("Pretend commands: ls, cd, pwd, cat, echo, clear, whoami, uname, date, fastfetch, wren, git status, npm test, npm run build, exit"); break;
        case "pwd": p(this.cwd); break;
        case "whoami": p("kailash"); break;
        case "date": p(new Date().toString()); break;
        case "echo": p(args.join(" ")); break;
        case "clear": this.out("\x1b[2J\x1b[H"); break;
        case "uname": p(args.includes("-a") ? "Linux wren 6.12.43+deb13-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.12.43-1 x86_64 GNU/Linux" : "Linux"); break;
        case "ls": {
          const arg = args.filter((a) => !a.startsWith("-")).join(" ");
          const target = node(arg ? this.path(arg) : this.cwd);
          if (!target) { p(`ls: cannot access '${arg}': No such file or directory`); code = 2; break; }
          if (!target.dir) { p(arg); break; }
          const all = args.some((a) => /^-\w*a/.test(a));
          p(listing(target).filter((e) => all || !e.name.startsWith(".")).sort((a, b) => a.name.localeCompare(b.name)).map((e) => (e.dir ? `\x1b[1;38;5;111m${e.name}\x1b[0m` : /\s/.test(e.name) ? `'${e.name}'` : e.name)).join("  "));
          break;
        }
        case "cd": {
          const arg = args.join(" ").replace(/^["']|["']$/g, ""), to = this.path(arg || "~"), n = node(to);
          if (!n) { p(`bash: cd: ${arg}: No such file or directory`); code = 1; } else if (!n.dir) { p(`bash: cd: ${arg}: Not a directory`); code = 1; } else this.cwd = to;
          break;
        }
        case "cat": {
          const arg = args.join(" ").replace(/^["']|["']$/g, ""), n = arg && node(this.path(arg));
          if (!n) { p(`cat: ${arg}: No such file or directory`); code = 1; } else if (n.dir) { p(`cat: ${arg}: Is a directory`); code = 1; } else p((n.text ?? "(binary file)").replace(/\n$/, ""));
          break;
        }
        case "fastfetch": case "neofetch": {
          const logo = ["      .--.", "  __ /  o \\__", "  \\ \\|   _/  >", "   \\ \\  (__/", "    \\_\\_/", "      | |", "", "", ""];
          const info = ["\x1b[1mkailash@wren\x1b[0m", "------------", ["OS", "Wren OS 0.1.0 (Debian 13 base)"], ["Kernel", "6.12.43+deb13-amd64"], ["Shell", "bash 5.2"],
            ["WM", "labwc (Wayland)"], ["Desktop", "Wren shell"], ["Agent", "wren 0.1.0 · qwen2.5:7b (local)"], ["Memory", "5.1 GiB / 15.6 GiB"]];
          p(logo.map((l, i) => `\x1b[38;5;111m${l.padEnd(20)}\x1b[0m${Array.isArray(info[i]) ? `\x1b[38;5;111m${info[i][0]}\x1b[0m: ${info[i][1]}` : info[i]}`).join("\n"));
          break;
        }
        case "wren":
          if (args[0] === "--version" || args[0] === "-V") p("wren 0.1.0");
          else p("Usage: wren <chat|serve|open|mcp|config|secret|greeter>\n\nIn this demo, use the island at the top (Ctrl+Space) to talk to Wren.");
          break;
        case "git":
          if (!inProj) { p("fatal: not a git repository (or any of the parent directories): .git"); code = 128; }
          else if (args[0] === "status") p(PROJ.fixed ? "On branch main\nChanges not staged for commit:\n  (use \"git add <file>...\" to update what will be committed)\n\t\x1b[31mmodified:   src/dates.ts\x1b[0m" : "On branch main\nnothing to commit, working tree clean");
          else if (args[0] === "log") p("\x1b[33m4e1c9a2\x1b[0m Planner: drag tasks between days\n\x1b[33m9b07d13\x1b[0m Budget view\n\x1b[33m1f3a6e0\x1b[0m First commit");
          else p(`git ${args.join(" ")}: not in the demo`);
          break;
        case "npm": case "pnpm": case "yarn": {
          if (!inProj) { p("npm error code ENOENT\nnpm error path " + this.cwd + "/package.json\nnpm error enoent Could not read package.json"); code = 254; break; }
          const sc = args[0] === "test" || args[0] === "t" ? "test" : args[0] === "run" ? args[1] : null;
          if (!sc || !SCRIPT[sc]) { p(`npm error Missing script: "${args[1] || args[0]}"`); code = 1; break; }
          if (SCRIPT[sc].forever) { p("Run the dev server from the project tab (the Dev button), so Wren can show and stop it."); code = 0; break; }
          for (const l of SCRIPT[sc].lines) { p(l); await sleep(sc === "test" ? 25 : 90); }
          code = SCRIPT[sc].ok ? 0 : 1;
          break;
        }
        case "exit": this.close(); this.onclose?.(); return;
        case "sudo": p("[sudo] This is a demo: no root here."); code = 1; break;
        default: p(`bash: ${name}: command not found`); code = 127;
      }
      // The shell's report after each command, like Wren's bash hook: D;<exit>;<command b64>;<seconds>;<folder b64>
      const b64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
      if (cmd) this.out(`\x1b]133;D;${code};${b64(cmd)};${Math.round((Date.now() - t) / 1000)};${b64(this.cwd)}\x07`);
      this.prompt();
    }
  }
  const RealWS = window.WebSocket;
  window.WebSocket = function (url, protocols) { return /\/terminal\/ws/.test(url) ? new DemoShell(url) : new RealWS(url, protocols); };

  // ---------- demo label ----------
  addEventListener("DOMContentLoaded", () => {
    const tag = document.createElement("div");
    tag.id = "demo-tag";
    tag.innerHTML = `<b>Browser demo</b><span>Wren's real desktop with scripted replies. Nothing runs on your computer.</span>`;
    tag.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:60;display:flex;flex-direction:column;gap:2px;max-width:250px;padding:8px 12px;border-radius:12px;font:12px/1.35 var(--font, system-ui);color:var(--fg);background:rgb(var(--card-rgb, 30 34 44) / .55);backdrop-filter:blur(14px);border:1px solid var(--stroke, rgb(255 255 255 / .1));pointer-events:none";
    tag.querySelector("span").style.cssText = "color:var(--fg-dim)";
    document.body.appendChild(tag);
  });
})();
