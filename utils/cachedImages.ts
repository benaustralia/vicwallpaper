import type { ImageProps } from "./types";
import manifest from "./manifest.json";

// Shape of one manifest.json record (a superset of what we surface).
interface ManifestRecord {
  source: string;
  title: string;
  maker: string;
  date: string;
  date_approximate: string;
  medium: string;
  country: string;
  classification: string;
  credit_line: string;
  licence: string;
  object_url: string;
  width_px: string;
  height_px: string;
  r2_url: string;
  blur_data_url: string;
}

let cached: ImageProps[] | null = null;

// Images are served as static, pre-sized (max 1600px) JPEGs from a
// Cloudflare R2 public bucket. There's no on-the-fly transform endpoint
// (unlike the old Cloudinary loader), so each record's blur placeholder is
// precomputed offline (see scripts/prep-r2-images.py) and stored directly in
// manifest.json as `blur_data_url` — no network fetch needed at build time.
export default async function getResults(): Promise<ImageProps[]> {
  if (cached) return cached;

  const records = manifest as ManifestRecord[];

  cached = records.map((m, id) => ({
    id,
    url: m.r2_url,
    width: Number(m.width_px) || 0,
    height: Number(m.height_px) || 0,
    blurDataUrl: m.blur_data_url || "",
    title: m.title,
    source: m.source,
    date: m.date,
    dateApproximate: m.date_approximate === "yes",
    medium: m.medium,
    classification: m.classification,
    maker: m.maker,
    country: m.country,
    creditLine: m.credit_line,
    licence: m.licence,
    objectUrl: m.object_url,
  }));
  return cached;
}
