import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

// index.html sets data-theme before first paint (stored choice, else the OS setting); this keeps React in sync.
const current = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

function apply(t: Theme) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#170a28" : "#fbf7e6");
}

/** The active theme, updated whenever anything changes it. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(current()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    // Follow the OS setting until the visitor picks a theme themselves.
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onOs = () => {
      let stored: string | null = null;
      try { stored = localStorage.getItem("theme"); } catch { /* storage blocked */ }
      if (!stored) apply(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onOs);
    return () => { mo.disconnect(); mq.removeEventListener("change", onOs); };
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    apply(next);
    try { localStorage.setItem("theme", next); } catch { /* the toggle still works for this visit */ }
  }, []);

  return [theme, toggle] as const;
}
