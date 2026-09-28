/** Renders [[placeholder]] text as a highlighted to-do, so gaps are impossible to miss before launch. */
export function T({ children }: { children: string }) {
  const parts = children.split(/(\[\[.*?\]\])/);
  return <>{parts.map((s, i) => (s.startsWith("[[") ? <mark key={i} className="todo">{s.slice(2, -2)}</mark> : s))}</>;
}
