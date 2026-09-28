import { Fragment, useCallback, useState, type ReactNode } from "react";
import { Label, Lead, Reveal } from "./components/bits";
import { Icon } from "./components/Icon";
import { Loader } from "./components/Loader";
import { reducedMotion } from "./lib/motion";
import { EMAIL, GITHUB, NAME, intro, projects, stack, type Demo, type Project } from "./content";
import { CadDiffDemo } from "./demos/CadDiffDemo";
import { LatticeDemo } from "./demos/LatticeDemo";
import { MaterialsDemo } from "./demos/MaterialsDemo";

// Unfinished entries stay visible while writing (npm run dev) and never ship.
const shown = projects.filter((p) => !(p.draft && import.meta.env.PROD));

const DEMOS: Record<Exclude<Demo, "none">, { file: string; el: () => ReactNode }> = {
  materials: { file: "AssignVexMaterials · rules", el: () => <MaterialsDemo /> },
  lattice: { file: "generate_tiles · TPMS slice", el: () => <LatticeDemo /> },
  "cad-diff": { file: "NexusCadDiff · sample export", el: () => <CadDiffDemo /> },
};

export default function App() {
  // Reduced-motion visitors skip the intro animation entirely.
  const [loading, setLoading] = useState(() => !reducedMotion());
  const done = useCallback(() => setLoading(false), []);

  return (
    <>
      {loading && <Loader onDone={done} />}
      <nav className="nav">
        <a className="brand" href="#top"><Mark /> <b>{NAME}</b></a>
        <div className="nav-links">
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </div>
        <a className="btn btn-green" href={GITHUB} target="_blank" rel="noreferrer"><Icon name="github" size={14} /> GitHub</a>
      </nav>

      <main id="top">
        <section className="intro">
          <div className="blueprint" aria-hidden="true" />
          <div className="wrap center">
            <Label>{intro.label}</Label>
            <Lead as="h1" lead={intro.title} />
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

        <section className="closing" id="contact">
          <div className="dots" aria-hidden="true" />
          <div className="wrap center">
            <Label dark>GET IN TOUCH</Label>
            <h2 className="closing-title">Every project here has code<br />you can read.</h2>
            <p className="closing-sub">Happy to walk through any of it: the design decisions, what broke, and what I'd do differently.</p>
            <div className="closing-cta">
              {EMAIL && <a className="btn btn-green" href={`mailto:${EMAIL}`}>Email me</a>}
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
  const demo = p.demo !== "none" ? DEMOS[p.demo] : null;
  return (
    <section className={`section project ${p.draft ? "is-draft" : ""}`} id={p.id}>
      <div className="wrap wide">
        <div className="proj-head">
          <Label>{`${String(n).padStart(2, "0")} · ${p.kicker}`}</Label>
          <Reveal><h2 className="proj-title">{p.title}</h2></Reveal>
          <Reveal delay={80}><p className="proj-what"><T>{p.what}</T></p></Reveal>
        </div>

        <div className={`proj-grid ${demo ? "" : "no-demo"}`}>
          <Reveal className="facts">
            <Fact label="MY ROLE"><p><T>{p.role}</T></p></Fact>
            <Fact label="WHAT I BUILT">
              <ul>{p.built.map((b) => <li key={b}><T>{b}</T></li>)}</ul>
            </Fact>
            <Fact label="RESULT"><p><T>{p.result}</T></p></Fact>
            {p.tags.length > 0 && <div className="tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>}
            <div className="links">
              {p.links.length === 0 && <span className="dim">Code is private while the work is unpublished.</span>}
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

/** Renders [[placeholder]] text as a highlighted to-do, so gaps are impossible to miss before launch. */
function T({ children }: { children: string }) {
  const parts = children.split(/(\[\[.*?\]\])/);
  return <>{parts.map((s, i) => (s.startsWith("[[") ? <mark key={i} className="todo">{s.slice(2, -2)}</mark> : s))}</>;
}

/** Small BCC-cell mark, echoing the loader. */
function Mark() {
  return (
    <svg className="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 21 7v10l-9 5-9-5V7Z" />
      <path d="M3 7l9 5 9-5M12 12v10" opacity=".45" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
