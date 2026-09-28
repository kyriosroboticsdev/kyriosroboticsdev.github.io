"""
Export one run of the helmet-lattice FEA design loop into static site data.

    python tools/export_lattice.py <helmet-lattice repo> [run name]

Writes public/lattice/data.json (loop funnel, hypervolume history, every usable
design's scores and stress-strain curve) and public/lattice/<design>.webp for the
featured designs: a pre-rendered turntable sprite sheet of the actual 2x2x2-cell
mesh CalculiX crushed.

The meshes themselves never leave this machine. Anything WebGL draws has to be
sent to the visitor, so the site only ever gets pixels.

Everything is read from the run's own tables; nothing here is typed in by hand.
"""

import csv
import json
import os
import re
import sys

import numpy as np
import pyvista as pv
import trimesh
from PIL import Image

REPO = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Kyrio\helmet-lattice"
RUN = sys.argv[2] if len(sys.argv) > 2 else "loop_2026-09-14"
RUN_DIR = os.path.join(REPO, "runs", RUN)
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "lattice")

# Three best cushions (efficiency front) and three of what the loop actually chased (SEA front).
FEATURED = ["it005_0", "it004_0", "it015_0", "it018_1", "it020_1", "it014_0"]

# Turntable: FRAMES views around the vertical axis, packed COLS wide into one sprite sheet.
FRAMES, COLS, PX = 60, 10, 440
# Mesh colours per site theme; slightly brighter than the chart swatches since shading darkens them.
COLORS = {"light": {"eta": "#6b3fa0", "sea": "#c2650a"}, "dark": {"eta": "#dcb033", "sea": "#a883f7"}}

BLENDS = ["gyroid", "schwartz", "diamond", "re_entrant", "honeycomb", "elytra", "voronoi", "spinodoid", "bouligand"]
PRETTY = {"schwartz": "Schwarz P", "re_entrant": "re-entrant", "gyroid": "gyroid", "diamond": "diamond",
          "honeycomb": "honeycomb", "elytra": "elytra", "voronoi": "Voronoi", "spinodoid": "spinodoid",
          "bouligand": "Bouligand"}


def f(v):
    try:
        return round(float(v), 4)
    except (TypeError, ValueError):
        return None


def render_turntable(mesh, color, out):
    """Render FRAMES views of the mesh orbiting its vertical (Z) axis into one WebP sheet."""
    pvm = pv.wrap(mesh)
    c = np.array(mesh.bounds).mean(axis=0)
    r = float(np.linalg.norm(mesh.extents)) / 2
    p = pv.Plotter(off_screen=True, window_size=(PX, PX))
    p.add_mesh(pvm, color=color, smooth_shading=True, specular=0.25, specular_power=12, ambient=0.18, diffuse=0.85)
    p.enable_anti_aliasing("ssaa")
    rows = -(-FRAMES // COLS)
    sheet = Image.new("RGBA", (COLS * PX, rows * PX))
    for i in range(FRAMES):
        a = 2 * np.pi * i / FRAMES
        eye = c + r * np.array([3.2 * np.cos(a), 3.2 * np.sin(a), 1.7])
        # Set the camera fields directly: assigning camera_position once and reusing the
        # plotter left every frame at the first view.
        p.camera.position = tuple(eye)
        p.camera.focal_point = tuple(c)
        p.camera.up = (0, 0, 1)
        p.camera.view_angle = 30
        p.reset_camera_clipping_range()
        p.render()
        img = p.screenshot(transparent_background=True, return_img=True)
        sheet.paste(Image.fromarray(img), ((i % COLS) * PX, (i // COLS) * PX))
    p.close()
    sheet.save(out, "WEBP", quality=78, method=6)


def main():
    os.makedirs(OUT, exist_ok=True)
    master = {r["design_id"]: r for r in csv.DictReader(open(os.path.join(RUN_DIR, "master_table.csv"), encoding="utf-8"))}
    scored = list(csv.DictReader(open(os.path.join(RUN_DIR, "rescore.csv"), encoding="utf-8")))
    stop = json.load(open(os.path.join(RUN_DIR, "stop_state.json"), encoding="utf-8"))

    status = [r["fea_status"] for r in master.values()]
    funnel = {
        "attempted": len(status),
        "printRejected": status.count("print_rejected") + status.count("realize_rejected"),
        "solverFailed": status.count("failed"),
        "solved": status.count("ok"),
        "usable": len(scored),
    }

    designs = []
    for s in scored:
        did = s["design_id"]
        m = master[did]
        blend = sorted(((PRETTY[b], f(m.get("blend_" + b)) or 0) for b in BLENDS), key=lambda x: -x[1])
        curve_path = os.path.join(RUN_DIR, "curves", did + ".csv")
        curve = [[f(r["strain"]), f(r["stress_kPa"])] for r in csv.DictReader(open(curve_path))] if os.path.exists(curve_path) else []
        designs.append({
            "id": did,
            "iteration": int(s["iteration"]),
            "rho": f(s["rel_density"]),
            "cellMm": f(m.get("cell_size_built_mm") or m.get("cell_size_mm")),
            "sea": f(s["SEA_J_per_kg"]),
            "stress20": f(s["stress_at_20pct_kPa"]),
            "plateau": f(s["plateau_stress_kPa_10_20"]),
            "plateauCv": f(s["plateau_cv"]),
            "eta": f(s["cushioning_efficiency"]),
            "frontSea": s["front_as_screened"] == "True",
            "frontEta": s["front_efficiency"] == "True",
            "blend": [[n, w] for n, w in blend if w >= 0.01],
            "curve": curve,
            "mesh": None,
        })

    by_id = {d["id"]: d for d in designs}
    for did in FEATURED:
        d = by_id[did]
        src = master[did]["raw_file_path"].replace("\\", os.sep)
        mesh = trimesh.load(os.path.join(REPO, src))
        cat = "eta" if d["frontEta"] else "sea"
        out = os.path.join(OUT, did + ".webp")
        render_turntable(mesh, COLORS["light"][cat], out)
        render_turntable(mesh, COLORS["dark"][cat], os.path.join(OUT, did + "-dark.webp"))
        d["mesh"] = "lattice/%s.webp" % did
        d["meshDark"] = "lattice/%s-dark.webp" % did
        d["frames"] = {"count": FRAMES, "cols": COLS, "px": PX}
        d["tris"] = int(len(mesh.faces))
        d["sizeMm"] = [round(float(x), 1) for x in mesh.extents]
        print("%-8s %6d tris  %5.0f KB" % (did, len(mesh.faces), os.path.getsize(out) / 1024))

    history = [{"iteration": h["iteration"], "hv": round(h["best_metric"], 1)} for h in stop.get("history", []) if "iteration" in h]
    data = {
        "run": RUN,
        "solver": "CalculiX, Neo-Hookean TPU card, quasi-static crush to 20% strain, 2x2x2-cell piece",
        "stopReason": "best hypervolume improved < 1%% for %d rounds" % stop.get("stale_rounds", 0),
        "stoppedAt": stop.get("iteration"),
        "funnel": funnel,
        "history": history,
        "featured": FEATURED,
        "designs": designs,
    }
    with open(os.path.join(OUT, "data.json"), "w", encoding="utf-8") as fh:
        json.dump(data, fh, separators=(",", ":"))
    print("funnel", funnel, "| designs", len(designs), "| history", len(history))


if __name__ == "__main__":
    main()
