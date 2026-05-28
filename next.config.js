module.exports = {
  images: {
    // All images are delivered and optimized by Cloudinary via a custom loader.
    loader: "custom",
    loaderFile: "./utils/cloudinaryLoader.ts",
  },
};
