import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import Bridge from "../components/Icons/Bridge";
import Modal from "../components/Modal";
import getResults from "../utils/cachedImages";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";

const Home: NextPage = ({ images }: { images: ImageProps[] }) => {
  const router = useRouter();
  const { photoId } = router.query;
  const [lastViewedPhoto, setLastViewedPhoto] = useLastViewedPhoto();

  const lastViewedPhotoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // This effect keeps track of the last viewed photo in the modal to keep the index page in sync when the user navigates back
    if (lastViewedPhoto && !photoId) {
      lastViewedPhotoRef.current.scrollIntoView({ block: "center" });
      setLastViewedPhoto(null);
    }
  }, [photoId, lastViewedPhoto, setLastViewedPhoto]);

  return (
    <>
      <Head>
        <title>vicwallpaper — Mid-Victorian Wallcoverings, 1840–1860</title>
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">
        {photoId && (
          <Modal
            images={images}
            onClose={() => {
              setLastViewedPhoto(photoId);
            }}
          />
        )}
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
          <div className="after:content relative mb-5 flex h-[629px] flex-col items-center justify-end gap-4 overflow-hidden rounded-lg bg-white/10 px-6 pb-16 pt-64 text-center text-white shadow-highlight after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight lg:pt-0">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <span className="flex max-h-full max-w-full items-center justify-center">
                <Bridge />
              </span>
              <span className="absolute left-0 right-0 bottom-0 h-[400px] bg-linear-to-b from-black/0 via-black to-black"></span>
            </div>
            <h1 className="relative z-10 mt-8 mb-2 font-serif text-5xl font-black tracking-tight">
              vicwallpaper
            </h1>
            <p className="relative z-10 mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              1840 – 1860 · CC0
            </p>
            <p className="relative z-10 max-w-[40ch] text-white/75 sm:max-w-[34ch]">
              {images.length} public-domain wallpaper designs and wallcoverings
              for the mid-Victorian interior, from the Metropolitan Museum of Art
              and Cooper Hewitt, Smithsonian Design Museum.
            </p>
          </div>
          {images.map((image) => (
            <Link
              key={image.id}
              href={`/?photoId=${image.id}`}
              ref={
                image.id === Number(lastViewedPhoto) ? lastViewedPhotoRef : null
              }
              shallow
              className="after:content group relative mb-5 block w-full cursor-zoom-in after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight"
            >
              <Image
                alt={image.title}
                className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110"
                style={{ transform: "translate3d(0, 0, 0)" }}
                placeholder={image.blurDataUrl ? "blur" : "empty"}
                blurDataURL={image.blurDataUrl || undefined}
                src={image.url}
                width={image.width || 720}
                height={image.height || 480}
                sizes="(max-width: 640px) 100vw,
                  (max-width: 1280px) 50vw,
                  (max-width: 1536px) 33vw,
                  25vw"
              />
            </Link>
          ))}
        </div>
      </main>
      <footer className="p-6 text-center text-sm text-white/60 sm:p-12">
        All images are in the public domain (CC0), reproduced from the
        open-access collections of{" "}
        <a
          href="https://www.metmuseum.org/"
          target="_blank"
          className="font-semibold hover:text-white"
          rel="noreferrer"
        >
          The Metropolitan Museum of Art
        </a>{" "}
        and{" "}
        <a
          href="https://www.cooperhewitt.org/"
          target="_blank"
          className="font-semibold hover:text-white"
          rel="noreferrer"
        >
          Cooper Hewitt, Smithsonian Design Museum
        </a>
        . Credit lines and catalogue links accompany each plate.
      </footer>
    </>
  );
};

export default Home;

export async function getStaticProps() {
  return {
    props: {
      images: await getResults(),
    },
  };
}
