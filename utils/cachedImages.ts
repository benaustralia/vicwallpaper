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
  cloudinary_url: string;
}

let cached: ImageProps[] | null = null;

/** Insert a Cloudinary transformation into a delivery URL. */
function cld(url: string, transform: string): string {
  return url.replace("/upload/", `/upload/${transform}/`);
}

// Build a tiny blurred base64 placeholder straight from Cloudinary —
// the storage-agnostic equivalent of the template's original `sharp` probe,
// with no native dependency and no full-image download.
async function blurPlaceholder(cloudinaryUrl: string): Promise<string> {
  try {
    const tiny = cld(cloudinaryUrl, "w_16,e_blur:400,q_40,f_jpg");
    const res = await fetch(tiny);
    if (!res.ok) return "";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export default async function getResults(): Promise<ImageProps[]> {
  if (cached) return cached;

  const records = manifest as ManifestRecord[];

  cached = await Promise.all(
    records.map(async (m, id) => ({
      id,
      url: m.cloudinary_url,
      width: Number(m.width_px) || 0,
      height: Number(m.height_px) || 0,
      blurDataUrl: await blurPlaceholder(m.cloudinary_url),
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
    })),
  );
  return cached;
}
