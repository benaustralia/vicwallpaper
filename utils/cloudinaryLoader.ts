// Custom next/image loader: every <Image> request is served by Cloudinary,
// which performs the resize/format/quality work on the fly (so Next's own
// optimizer is not used). Data URLs (blur placeholders) pass through untouched.
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.startsWith("data:")) return src;
  const t = `f_auto,q_${quality || "auto"},w_${width},c_limit`;
  return src.replace("/upload/", `/upload/${t}/`);
}
