import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import { Label, Lead, Reveal } from "./components/bits";
import { Icon } from "./components/Icon";
import { Loader } from "./components/Loader";
import { T } from "./components/T";
import { ContactButtons } from "./components/Contact";
import { reducedMotion } from "./lib/motion";
import { GITHUB, NAME, intro, projects, stack, type Demo, type Project } from "./content";
import { CadDiffDemo } from "./demos/CadDiffDemo";
import { LatticeLoop } from "./demos/lattice/LatticeLoop";
import { NoCoastPage } from "./NoCoastPage";
import { MaterialsDemo } from "./demos/MaterialsDemo";
import { LiveSite } from "./demos/LiveSite";
import { EloDemo } from "./demos/EloDemo";

// Unfinished entries stay visible while writing (npm run dev) and never ship.
const shown = projects.filter((p) => !(p.draft && import.meta.env.PROD));

const DEMOS: Record<Exclude<Demo, "none" | "site">, { file: string; el: () => ReactNode; wide?: boolean }> = {
  materials: { file: "AssignVexMaterials · rules", el: () => <MaterialsDemo /> },
  lattice: { file: "runs/loop_2026-09-14 · real FEA output", el: () => <LatticeLoop />, wide: true },
  "cad-diff": { file: "NexusCadDiff · sample export", el: () => <CadDiffDemo /> },
  elo: { file: "shuttleranked · calcElo()", el: () => <EloDemo /> },
};

export default function App() {
  // Reduced-motion visitors skip the intro animation entirely.
  const [loading, setLoading] = useState(() => !reducedMotion());
  const done = useCallback(() => setLoading(false), []);
  const route = useRoute();

  return (
    <>
      {loading && <Loader onDone={done} />}
      <nav className="nav">
        <a className="brand" href="#top"><Mark /> <b>{NAME}</b></a>
        <div className="nav-links">
          <a href="#projects">Projects</a>
          <a href="#/nocoast" className={route === "nocoast" ? "on" : ""}>NoCoast</a>
          <a href="#contact">Contact</a>
        </div>
        <a className="btn btn-accent" href={GITHUB} target="_blank" rel="noreferrer"><Icon name="github" size={14} /> GitHub</a>
      </nav>

      <main id="top">
        {route === "nocoast" ? <NoCoastPage /> : <>
        <section className="intro">
          <div className="blueprint" aria-hidden="true" />
          <div className="wrap center">
            <Label>{intro.label}</Label>
            <Lead as="h1" lead={NAME} tail={intro.descriptor} />
            <Reveal delay={200}><p className="intro-sub">{intro.sub}</p></Reveal>
            <Reveal delay={320}>
              <div className="thread" aria-label={intro.thread.join(", then ")}>
                {intro.thread.map((t, i) => (
                  <Fragment key={t}>
                    {i > 0 && <Icon name="arrow" size={14} className="thread-arrow" />}
                    <span>{t}</span>
                  </Fragment>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="wrap wide" id="projects">
            <Reveal delay={420}>
              <ol className="index">
                {shown.map((p, i) => (
                  <li key={p.id}>
                    <a href={`#${p.id}`}>
                      <span className="index-n">{String(i + 1).padStart(2, "0")}</span>
                      <span className="index-t">{p.title}</span>
                      <span className="index-k">{p.kicker}</span>
                      <Icon name="arrow" size={16} className="index-go" />
                    </a>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {shown.map((p, i) => <ProjectSection key={p.id} p={p} n={i + 1} />)}
        </>}

        <section className="closing" id="contact">
          <div className="dots" aria-hidden="true" />
          <div className="wrap center">
            <Label dark>GET IN TOUCH</Label>
            <h2 className="closing-title">Want the story behind<br />any of these?</h2>
            <p className="closing-sub">Happy to walk through any of it: the design decisions, what broke, and what I'd do differently.</p>
            <div className="closing-cta">
              <ContactButtons />
              <a className="btn btn-outline" href={GITHUB} target="_blank" rel="noreferrer"><Icon name="github" size={14} /> GitHub</a>
            </div>
          </div>
          <footer className="wrap wide footer">
            <div>
              <div className="brand light"><Mark /> <b>{NAME}</b></div>
              <p className="footer-note">Static site, no trackers. Every demo runs in your browser.</p>
            </div>
            <div>
              <div className="footer-head">PROJECTS</div>
              {shown.map((p) => <a key={p.id} href={`#${p.id}`}>{p.title}</a>)}
            </div>
            <div>
              <div className="footer-head">CONTACT</div>
              <ContactButtons variant="list" />
              <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
            </div>
            <div>
              <div className="footer-head">TOOLS I USE</div>
              {stack.map((s) => <span key={s}>{s}</span>)}
            </div>
          </footer>
        </section>
      </main>
    </>
  );
}

function ProjectSection({ p, n }: { p: Project; n: number }) {
  const demo = p.demo === "site" && p.site
    ? { file: "live site", el: () => <LiveSite url={p.site!.url} poster={`${import.meta.env.BASE_URL}${p.site!.poster}`} title={`${p.title} site`} />, wide: false }
    : p.demo !== "none" && p.demo !== "site" ? DEMOS[p.demo] : null;
  return (
    <section className={`section project ${p.draft ? "is-draft" : ""}`} id={p.id}>
      <div className="wrap wide">
        <div className="proj-head">
          <Label>{`${String(n).padStart(2, "0")} · ${p.kicker}`}</Label>
          <Reveal><h2 className="proj-title">{p.title}</h2></Reveal>
          <Reveal delay={80}><p className="proj-what"><T>{p.what}</T></p></Reveal>
        </div>

        <div className={`proj-grid ${demo ? (demo.wide ? "wide-demo" : "") : "no-demo"}`}>
          <Reveal className="facts">
            <Fact label="MY ROLE"><p><T>{p.role}</T></p></Fact>
            <Fact label="WHAT I BUILT">
              <ul>{p.built.map((b) => <li key={b}><T>{b}</T></li>)}</ul>
            </Fact>
            {p.result && <Fact label="RESULT"><p><T>{p.result}</T></p></Fact>}
            {p.tags.length > 0 && <div className="tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>}
            <div className="links">
              {p.page && <a className="btn btn-accent" href={p.page.href}>{p.page.label} <span aria-hidden="true">→</span></a>}
              {p.privateCode && <span className="dim">Code is private while the work is unpublished.</span>}
              {p.links.map((l) => (
                <a key={l.href} className="btn btn-light" href={l.href} target="_blank" rel="noreferrer">
                  {l.label === "GitHub" && <Icon name="github" size={14} />}{l.label}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </Reveal>

          {demo && (
            <Reveal className="window" delay={120}>
              <div className="win-top">
                <span className="win-dots" aria-hidden="true"><i /><i /><i /></span>
                <span className="win-file">{demo.file}</span>
                <span className="win-live">LIVE DEMO</span>
              </div>
              {demo.el()}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <div className="fact-label">{label}</div>
      {children}
    </div>
  );
}

/** Small BCC-cell mark, echoing the loader. */
export function Mark() {
  return (
    <svg className="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 21 7v10l-9 5-9-5V7Z" />
      <path d="M3 7l9 5 9-5M12 12v10" opacity=".45" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** "#/nocoast" is a page; any other hash is an anchor on the home page. */
function useRoute() {
  const read = () => (location.hash.startsWith("#/nocoast") ? "nocoast" : "home");
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      const next = read();
      setRoute(next);
      // An anchor clicked from another page only exists after the home page renders.
      requestAnimationFrame(() => {
        const id = location.hash.slice(1);
        const el = id && !id.startsWith("/") ? document.getElementById(id) : null;
        if (el) el.scrollIntoView();
        else if (id.startsWith("/")) window.scrollTo(0, 0);
      });
    };
    addEventListener("hashchange", on);
    if (location.hash.length > 2) on(); // a shared link like /#lattice lands before the page has rendered
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}
