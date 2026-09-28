import { useEffect, useRef, useState, type PointerEvent } from "react";

export interface Frames { count: number; cols: number; px: number }

/**
 * Drag-to-spin view of a pre-rendered turntable sprite sheet.
 * Only rendered images ship with the site; the lattice geometry itself never leaves the lab machine.
 */
export function Turntable({ src, frames, label }: { src: string; frames: Frames; label: string }) {
  const { count, cols } = frames;
  const rows = Math.ceil(count / cols);
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; f: number } | null>(null);
  const idle = useRef(true);

  useEffect(() => {
    setReady(false);
    const img = new Image();
    img.onload = () => setReady(true);
    img.src = src;
  }, [src]);

  // Slow auto-spin while visible and untouched; never runs for reduced-motion visitors.
  useEffect(() => {
    if (!ready || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (host.current) io.observe(host.current);
    const t = setInterval(() => { if (visible && idle.current && !document.hidden) setFrame((f) => (f + 1) % count); }, 90);
    return () => { clearInterval(t); io.disconnect(); };
  }, [ready, count]);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, f: frame };
    idle.current = false;
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const w = e.currentTarget.clientWidth;
    const step = Math.round(((e.clientX - drag.current.x) / w) * count);
    setFrame((((drag.current.f - step) % count) + count) % count);
  };
  const up = () => { drag.current = null; };

  const col = frame % cols, row = Math.floor(frame / cols);
  return (
    <div className="mesh-view" ref={host} role="img" aria-label={label}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { idle.current = false; setFrame((f) => (f + 1) % count); }
        if (e.key === "ArrowRight") { idle.current = false; setFrame((f) => (f - 1 + count) % count); }
      }} tabIndex={0}>
      <div className="turntable" style={{
        backgroundImage: ready ? `url(${src})` : "none",
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${cols > 1 ? (col / (cols - 1)) * 100 : 0}% ${rows > 1 ? (row / (rows - 1)) * 100 : 0}%`,
      }} />
      {!ready && <div className="mesh-wait">LOADING RENDERS…</div>}
      <div className="mesh-tip">drag to rotate · pre-rendered views</div>
    </div>
  );
}
