// Icons and store details for the Wren demo's App Store and app grid, from Flathub's public API.
// Shaped like Wren's own /store/details answer (crates/wren/src/serve.rs, store_app_details).
// Run once, or again when the curated list changes:  node tools/fetch_wren_store.mjs
import { mkdir, writeFile } from "node:fs/promises";

// Wren's curated list (crates/wren-tools/src/store.rs, CURATED), Flathub ids only.
const IDS = [
  "app.zen_browser.zen", "com.discordapp.Discord", "com.spotify.Client", "md.obsidian.Obsidian", "com.bitwarden.desktop",
  "org.gnome.TextEditor", "org.gnome.Loupe", "org.libreoffice.LibreOffice", "com.visualstudio.code", "com.getpostman.Postman",
  "org.freecad.FreeCAD", "org.kicad.KiCad", "cc.arduino.IDE2", "org.blender.Blender", "org.gimp.GIMP", "org.inkscape.Inkscape",
  "com.obsproject.Studio", "org.godotengine.Godot", "io.github.celluloid_player.Celluloid", "org.videolan.VLC", "com.valvesoftware.Steam",
];
const OUT = new URL("../public/wren/store/", import.meta.url);
await mkdir(new URL("icon/", OUT), { recursive: true });

const details = {};
for (const id of IDS) {
  const r = await fetch(`https://flathub.org/api/v2/appstream/${id}`);
  if (!r.ok) { console.warn(`${id}: ${r.status}`); continue; }
  const v = await r.json();
  const shots = (v.screenshots || [])
    .map((s) => (s.sizes || []).find((z) => { const w = parseInt(z.width, 10); return w >= 600 && w <= 1300; })?.src)
    .filter(Boolean).slice(0, 3);
  details[id] = { name: v.name, summary: v.summary, description: v.description, developer: v.developer_name, license: v.project_license, homepage: v.urls?.homepage, screenshots: shots };
  if (v.icon?.startsWith("https://dl.flathub.org/")) {
    const img = await fetch(v.icon);
    if (img.ok) await writeFile(new URL(`icon/${id}.png`, OUT), Buffer.from(await img.arrayBuffer()));
  }
  console.log(`${id}: ${v.name}`);
}
await writeFile(new URL("details.json", OUT), JSON.stringify(details));
