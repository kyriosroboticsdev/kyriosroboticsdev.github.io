import { useEffect, useRef, useState } from "react";

// The embedded site renders at a desktop width and is scaled down to fit, so it looks like the real thing.
const DESKTOP = 1280;

/**
 * A real, deployed site inside a browser frame. Starts as a screenshot (fast, and works even if the
 * site is down); one click swaps in the live, fully interactive page.
 */
export function LiveSite({ url, poster, title }: { url: string; poster: string; title: string }) {
  const [live, setLive] = useState(false);
  const [scale, setScale] = useState(0.5);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / DESKTOP));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const host = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div className="site-body">
      <div className="urlbar">
        <span className="lock" aria-hidden="true">●</span>
        <span className="url">{host}</span>
        <a href={url} target="_blank" rel="noreferrer" className="url-open">Open ↗</a>
      </div>
      <div className="site-frame" ref={box} style={{ height: 800 * scale }}>
        {live ? (
          <iframe src={url} title={title} loading="lazy" style={{ width: DESKTOP, height: 800, transform: `scale(${scale})` }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer" />
        ) : (
          <button className="site-poster" onClick={() => setLive(true)} aria-label={`Load the live ${title}`}>
            <img src={poster} alt={`Screenshot of ${title}`} loading="lazy" decoding="async" />
            <span className="site-play">▶ Try it live, right here</span>
          </button>
        )}
      </div>
    </div>
  );
}
