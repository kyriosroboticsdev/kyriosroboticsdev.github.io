import { useState } from "react";
import { CONTACT } from "../content";

// Email and phone are stored reversed + base64 so they never appear as plain text in the page
// or the public repo, where scrapers look. They're only assembled when someone clicks.
const decode = (s: string) => [...atob(s)].reverse().join("");

const ICONS = {
  mail: "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2 8 6 8-6",
  whatsapp: "M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3ZM9 8.5c0 3.5 2.9 6.5 6.4 6.5l1.1-1.5-2-1-1 .8a4.6 4.6 0 0 1-2.4-2.4l.8-1-1-2Z",
  discord: "M8.5 17c-2.8 0-4.5-1-4.5-1 0-4.8 1.9-8.6 1.9-8.6A8.6 8.6 0 0 1 9.4 6l.4.9a13 13 0 0 1 4.4 0l.4-.9a8.6 8.6 0 0 1 3.5 1.4S20 11.2 20 16c0 0-1.7 1-4.5 1l-1-1.6M9.3 12.4h.01M14.7 12.4h.01",
};

function Glyph({ d }: { d: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Email, WhatsApp and Discord buttons. `variant` picks the button style for dark or light sections. */
export function ContactButtons({ variant = "dark" }: { variant?: "dark" | "list" }) {
  const [copied, setCopied] = useState(false);

  const email = () => { location.href = `mailto:${decode(CONTACT.email)}`; };
  const whatsapp = () => { window.open(`https://wa.me/${decode(CONTACT.whatsapp)}`, "_blank", "noopener"); };
  const discord = async () => {
    try { await navigator.clipboard.writeText(CONTACT.discord); } catch { /* clipboard blocked: the label still shows the name */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (variant === "list") {
    return (
      <>
        <button className="link-btn" onClick={email}>Email</button>
        <button className="link-btn" onClick={whatsapp}>WhatsApp</button>
        <button className="link-btn" onClick={discord}>{copied ? "Discord name copied ✓" : `Discord · ${CONTACT.discord}`}</button>
      </>
    );
  }
  return (
    <>
      <button className="btn btn-accent" onClick={email}><Glyph d={ICONS.mail} /> Email me</button>
      <button className="btn btn-outline" onClick={whatsapp}><Glyph d={ICONS.whatsapp} /> WhatsApp</button>
      <button className="btn btn-outline" onClick={discord} aria-live="polite">
        <Glyph d={ICONS.discord} /> {copied ? "Copied ✓" : <>Discord · <span className="handle">{CONTACT.discord}</span></>}
      </button>
    </>
  );
}
