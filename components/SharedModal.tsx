import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUturnLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { variants } from "../utils/animationVariants";
import downloadPhoto from "../utils/downloadPhoto";
import { range } from "../utils/range";
import type { ImageProps, SharedModalProps } from "../utils/types";

export default function SharedModal({
  index,
  images,
  changePhotoId,
  closeModal,
  navigation,
  currentPhoto,
  direction,
}: SharedModalProps) {
  const [loaded, setLoaded] = useState(false);

  let filteredImages = images?.filter((img: ImageProps) =>
    range(index - 15, index + 15).includes(img.id),
  );

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (index < images?.length - 1) {
        changePhotoId(index + 1);
      }
    },
    onSwipedRight: () => {
      if (index > 0) {
        changePhotoId(index - 1);
      }
    },
    trackMouse: true,
  });

  let currentImage = images ? images[index] : currentPhoto;

  return (
    <MotionConfig
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
    >
      <div
        className="relative z-50 flex aspect-3/2 w-full max-w-7xl items-center wide:h-full xl:taller-than-854:h-auto"
        {...handlers}
      >
        {/* Main image */}
        <div className="w-full overflow-hidden">
          <div className="relative flex aspect-3/2 items-center justify-center">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={index}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 flex items-center justify-center"
              >
                <Image
                  src={currentImage.url}
                  width={currentImage.width || 1280}
                  height={currentImage.height || 853}
                  priority
                  className="max-h-full max-w-full w-auto h-auto object-contain"
                  alt={currentImage.title}
                  onLoad={() => setLoaded(true)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Buttons + bottom nav bar */}
        <div className="absolute inset-0 mx-auto flex max-w-7xl items-center justify-center">
          {/* Buttons */}
          {loaded && (
            <div className="relative aspect-3/2 max-h-full w-full">
              {navigation && (
                <>
                  {index > 0 && (
                    <button
                      className="absolute left-3 top-[calc(50%-16px)] rounded-full bg-black/50 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none"
                      style={{ transform: "translate3d(0, 0, 0)" }}
                      onClick={() => changePhotoId(index - 1)}
                    >
                      <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                  )}
                  {index + 1 < images.length && (
                    <button
                      className="absolute right-3 top-[calc(50%-16px)] rounded-full bg-black/50 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none"
                      style={{ transform: "translate3d(0, 0, 0)" }}
                      onClick={() => changePhotoId(index + 1)}
                    >
                      <ChevronRightIcon className="h-6 w-6" />
                    </button>
                  )}
                </>
              )}
              <div className="absolute top-0 right-0 flex items-center gap-2 p-3 text-white">
                <a
                  href={currentImage.url}
                  className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white"
                  target="_blank"
                  title="Open full-size image"
                  rel="noreferrer"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                </a>
                <button
                  onClick={() =>
                    downloadPhoto(currentImage.url, `${currentImage.title}.jpg`)
                  }
                  className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white"
                  title="Download full-size image"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="absolute top-0 left-0 flex items-center gap-2 p-3 text-white">
                <button
                  onClick={() => closeModal()}
                  className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white"
                >
                  {navigation ? (
                    <XMarkIcon className="h-5 w-5" />
                  ) : (
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Catalogue metadata caption */}
          <figcaption
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-col gap-1 bg-linear-to-t from-black/90 via-black/65 to-transparent px-5 pt-20 text-white sm:px-8 ${
              navigation ? "pb-28" : "pb-8"
            }`}
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/60">
              {currentImage.source}
              {currentImage.licence ? ` · ${currentImage.licence}` : ""}
            </p>
            <h2 className="max-w-3xl font-serif text-xl font-semibold leading-tight sm:text-2xl">
              {currentImage.title}
            </h2>
            <p className="text-sm italic text-white/80">
              {currentImage.date}
              {currentImage.dateApproximate ? " (approx.)" : ""}
              {currentImage.country ? ` · ${currentImage.country}` : ""}
            </p>
            <div className="mt-1 max-w-3xl space-y-0.5 text-sm text-white/70">
              {currentImage.medium && <p>{currentImage.medium}</p>}
              {currentImage.maker && (
                <p>
                  <span className="text-white/45">Maker — </span>
                  {currentImage.maker}
                </p>
              )}
              {currentImage.creditLine && (
                <p className="text-white/55">{currentImage.creditLine}</p>
              )}
            </div>
            {currentImage.objectUrl && (
              <a
                href={currentImage.objectUrl}
                target="_blank"
                rel="noreferrer"
                className="pointer-events-auto mt-2 inline-block w-fit text-xs font-semibold uppercase tracking-[0.15em] text-white/80 underline-offset-4 hover:text-white hover:underline"
              >
                View in museum collection →
              </a>
            )}
          </figcaption>

          {/* Bottom Nav bar */}
          {navigation && (
            <div className="fixed inset-x-0 bottom-0 z-40 overflow-hidden bg-linear-to-b from-black/0 to-black/60">
              <motion.div
                initial={false}
                className="mx-auto mt-6 mb-6 flex aspect-3/2 h-14"
              >
                <AnimatePresence initial={false}>
                  {filteredImages.map(({ url, id }) => (
                    <motion.button
                      initial={{
                        width: "0%",
                        x: `${Math.max((index - 1) * -100, 15 * -100)}%`,
                      }}
                      animate={{
                        scale: id === index ? 1.25 : 1,
                        width: "100%",
                        x: `${Math.max(index * -100, 15 * -100)}%`,
                      }}
                      exit={{ width: "0%" }}
                      onClick={() => changePhotoId(id)}
                      key={id}
                      className={`${
                        id === index
                          ? "z-20 rounded-md shadow shadow-black/50"
                          : "z-10"
                      } ${id === 0 ? "rounded-l-md" : ""} ${
                        id === images.length - 1 ? "rounded-r-md" : ""
                      } relative inline-block w-full shrink-0 transform-gpu overflow-hidden focus:outline-none`}
                    >
                      <Image
                        alt="thumbnail"
                        width={180}
                        height={120}
                        className={`${
                          id === index
                            ? "brightness-110 hover:brightness-110"
                            : "brightness-50 contrast-125 hover:brightness-75"
                        } h-full transform object-cover transition`}
                        src={url}
                      />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
