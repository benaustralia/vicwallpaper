module.exports = {
  images: {
    // Images are static JPEGs hosted on a Cloudflare R2 public bucket
    // (previously delivered/optimized on the fly by Cloudinary). Next's
    // built-in Image Optimization (the default loader) handles resizing/
    // format conversion at request time instead.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-f5c22aa86528412dbb20a32c7e51398c.r2.dev",
      },
    ],
  },
};
