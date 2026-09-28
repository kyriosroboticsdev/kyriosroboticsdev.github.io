import { useEffect, useRef, useState } from "react";

const GLYPHS = "/\_[]<>=+*#%~^";
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Reveal `text` left to right through random glyphs, like the label is being decoded. */
export function useScramble(text: string, active: boolean, duration = 900) {
  const [out, setOut] = useState(() => (reducedMotion() ? text : text.replace(/\S/g, " ")));
  useEffect(() => {
    if (!active) return;
    if (reducedMotion()) return setOut(text);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const done = Math.floor(t * text.length);
      setOut(
        [...text]
          .map((ch, i) => (i < done || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join(""),
      );
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, active, duration]);
  return out;
}

/** True once the element has scrolled into view (stays true). */
export function useInView<T extends Element>(margin = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen] as const;
}
