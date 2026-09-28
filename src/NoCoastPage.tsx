import { Label, Lead, Reveal } from "./components/bits";
import { Icon } from "./components/Icon";
import { T } from "./components/T";
import { nocoast } from "./content";

/** The hackathon team's page: one entry per event, newest first, every project open source. */
export function NoCoastPage() {
  return (
    <>
      <section className="intro">
        <div className="blueprint" aria-hidden="true" />
        <div className="wrap center">
          <Label>HACKATHON TEAM · OPEN SOURCE</Label>
          <Lead as="h1" lead={nocoast.name} />
          <Reveal delay={150}><p className="intro-sub"><T>{nocoast.about}</T></p></Reveal>
          <Reveal delay={250}>
            <div className="closing-cta">
              <a className="btn btn-green" href={nocoast.github} target="_blank" rel="noreferrer"><Icon name="github" size={14} /> github.com/nocoastaec</a>
              <a className="btn btn-light" href="#projects">← Back to projects</a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section hack-list">
        <div className="wrap wide">
          <Label>{`${nocoast.hackathons.length} EVENT${nocoast.hackathons.length === 1 ? "" : "S"} · NEWEST FIRST`}</Label>
          {nocoast.hackathons.map((h) => (
            <Reveal key={h.project} className="hack">
              <div className="hack-meta">
                <span className="hack-date">{h.date}</span>
                <span className="hack-event"><T>{h.event}</T></span>
                <span className="hack-award"><T>{h.award}</T></span>
              </div>
              <div className="hack-body">
                <h2 className="proj-title">{h.project}</h2>
                <p className="proj-what">{h.summary}</p>
                <div className="fact"><div className="fact-label">MY PART</div><p>{h.myPart}</p></div>
                <div className="tags">{h.stack.map((s) => <span key={s}>{s}</span>)}</div>
                <div className="links">
                  {h.links.map((l) => (
                    <a key={l.href} className="btn btn-light" href={l.href} target="_blank" rel="noreferrer">{l.label} <span aria-hidden="true">↗</span></a>
                  ))}
                  <a className="btn btn-light" href="#tekt">Full write-up →</a>
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal className="hack hack-next">
            <div className="hack-meta"><span className="hack-date">NEXT</span></div>
            <div className="hack-body"><p className="dim">The next hackathon project will show up here, open-sourced on the NoCoast GitHub.</p></div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
