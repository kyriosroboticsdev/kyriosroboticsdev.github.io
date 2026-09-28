import type { ReactNode } from "react";
import { useInView, useScramble } from "../lib/motion";

/** Mono uppercase label that decodes itself when scrolled into view. */
export function Label({ children, dark }: { children: string; dark?: boolean }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const text = useScramble(children, seen);
  return (
    <div ref={ref} className={`label ${dark ? "label-dark" : ""}`} aria-label={children}>
      <span className="label-mark">✦</span>
      <span aria-hidden="true">{text}</span>
    </div>
  );
}

/** Big statement headline: words rise in one by one; the tail is set in the muted ink. */
export function Lead({ lead, tail, as: Tag = "h2" }: { lead: string; tail?: string; as?: "h1" | "h2" }) {
  const [ref, seen] = useInView<HTMLHeadingElement>();
  const words = [...lead.split(" ").map((w) => [w, false] as const), ...(tail ? tail.split(" ").map((w) => [w, true] as const) : [])];
  return (
    <Tag ref={ref} className={`lead ${seen ? "in" : ""}`} aria-label={tail ? `${lead} ${tail}` : lead}>
      {words.map(([w, muted], i) => (
        <span key={i} className={`word ${muted ? "muted" : ""}`} style={{ transitionDelay: `${i * 45}ms` }} aria-hidden="true">
          {w}{" "}
        </span>
      ))}
    </Tag>
  );
}

/** Fade/slide a block in when it scrolls into view. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${seen ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
