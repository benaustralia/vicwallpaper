#!/usr/bin/env python3
"""
Prepare vicwallpaper images for Cloudflare R2 hosting.

Source masters live in the sibling `wallpapers-1850s` project (met/ and
cooper-hewitt/ subdirs), not in this repo. For each utils/manifest.json
record this:
  1. Recompresses the matching local master to a web-appropriate size
     (1600x1600> max, quality 82, strip metadata, 4:2:0 chroma subsampling —
     same convention as the sibling `odyssey` project's public/art masters)
     via ImageMagick, into scripts/r2_images/<source-dir>/<filename>.jpg.
  2. Generates a tiny base64 blur placeholder (PIL: downsize to 16px wide,
     Gaussian blur, low-quality JPEG) — replicates what Cloudinary's
     `w_16,e_blur:400,q_40,f_jpg` transform used to do on request, but
     precomputed offline since R2 has no on-the-fly image transform.
  3. Writes an updated utils/manifest.json with `r2_key`/`r2_url`/
     `blur_data_url` fields (cloudinary_public_id/cloudinary_url removed).

Run this before scripts/upload-r2.py after adding/replacing source images.
"""
import base64
import io
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageFilter

REPO_ROOT = Path(__file__).parent.parent
WALLPAPERS_DIR = Path.home() / "Documents" / "wallpapers-1850s"
OUT_DIR = Path(__file__).parent / "r2_images"

R2_PUBLIC_BASE = "https://pub-f5c22aa86528412dbb20a32c7e51398c.r2.dev"


def main():
    manifest = json.load(open(REPO_ROOT / "utils" / "manifest.json"))
    results = []
    errors = []

    for i, r in enumerate(manifest):
        # Prefer existing r2_key naming if already migrated, else fall back
        # to the legacy cloudinary_public_id field for the source filename.
        pid = r.get("r2_key") or r.get("cloudinary_public_id")
        fname = Path(pid).name
        if not fname.endswith(".jpg"):
            fname += ".jpg"
        subdir = "met" if r["source"] == "Met" else "cooper-hewitt"
        src_path = WALLPAPERS_DIR / subdir / fname
        if not src_path.exists():
            errors.append(f"missing source: {src_path}")
            continue

        out_path = OUT_DIR / subdir / fname
        out_path.parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            "convert", str(src_path),
            "-resize", "1600x1600>",
            "-quality", "82",
            "-interlace", "Plane",
            "-sampling-factor", "4:2:0",
            "-strip",
            str(out_path),
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            errors.append(f"convert failed for {src_path}: {proc.stderr}")
            continue

        with Image.open(out_path) as im:
            out_w, out_h = im.size
            small = im.convert("RGB").copy()
            small.thumbnail((16, max(1, 16 * out_h // out_w)))
            small = small.filter(ImageFilter.GaussianBlur(radius=2))
            buf = io.BytesIO()
            small.save(buf, format="JPEG", quality=40)
            blur_data_url = (
                "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
            )

        r2_key = f"images/{subdir}/{fname}"
        new_r = dict(r)
        new_r.pop("cloudinary_public_id", None)
        new_r.pop("cloudinary_url", None)
        new_r["r2_key"] = r2_key
        new_r["r2_url"] = f"{R2_PUBLIC_BASE}/{r2_key}"
        new_r["width_px"] = str(out_w)
        new_r["height_px"] = str(out_h)
        new_r["blur_data_url"] = blur_data_url
        results.append(new_r)

        if (i + 1) % 25 == 0 or i + 1 == len(manifest):
            print(f"  {i + 1}/{len(manifest)} processed")

    print(f"\nProcessed: {len(results)} / {len(manifest)}")
    if errors:
        print(f"Errors ({len(errors)}):")
        for e in errors:
            print(f"  {e}")

    manifest_path = REPO_ROOT / "utils" / "manifest.json"
    json.dump(results, open(manifest_path, "w"), indent=2, ensure_ascii=False)
    print(f"\nWrote {manifest_path}")

    total_out = sum((OUT_DIR / r["r2_key"].split("images/", 1)[1]).stat().st_size for r in results)
    print(f"Total compressed size: {total_out / 1e6:.2f} MB across {len(results)} files")
    print(f"Next: python3 scripts/upload-r2.py")


if __name__ == "__main__":
    main()
