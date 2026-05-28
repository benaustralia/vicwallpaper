import { Dialog, DialogBackdrop } from "@headlessui/react";
import { motion } from "motion/react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import type { ImageProps } from "../utils/types";
import SharedModal from "./SharedModal";

export default function Modal({
  images,
  onClose,
}: {
  images: ImageProps[];
  onClose?: () => void;
}) {
  const router = useRouter();

  const { photoId } = router.query;
  let index = Number(photoId);

  const [direction, setDirection] = useState(0);
  const [curIndex, setCurIndex] = useState(index);

  function handleClose() {
    router.push("/", undefined, { shallow: true });
    onClose();
  }

  function changePhotoId(newVal: number) {
    if (newVal > index) {
      setDirection(1);
    } else {
      setDirection(-1);
    }
    setCurIndex(newVal);
    // Next 16: stay on the index route by pushing `?photoId=N`. The earlier
    // `as="/p/N"` form (legacy URL rewriting) now resolves to the standalone
    // /p/[photoId] page and causes a full navigation away from the modal.
    router.push(
      { pathname: "/", query: { photoId: newVal } },
      undefined,
      { shallow: true },
    );
  }

  // Keyboard navigation. The listener is registered exactly once (empty deps)
  // and reads the latest index/length/handler from a ref. This avoids any
  // possibility of two listeners ever coexisting under React 19's dev
  // double-invocation, which broke the unmaintained `react-use-keypress`.
  // Use `curIndex` (state) — not `index` (router.query, which lags one render
  // behind state updates after router.push). Otherwise a quick click→key-press
  // sequence reads a stale index from the ref.
  const navRef = useRef({ index: curIndex, length: images.length, changePhotoId });
  navRef.current = { index: curIndex, length: images.length, changePhotoId };
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const { index, length, changePhotoId } = navRef.current;
      if (e.key === "ArrowRight" && index + 1 < length) {
        changePhotoId(index + 1);
      } else if (e.key === "ArrowLeft" && index > 0) {
        changePhotoId(index - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog
      static
      open={true}
      onClose={handleClose}
      className="fixed inset-0 z-10 flex items-center justify-center"
    >
      <DialogBackdrop
        as={motion.div}
        key="backdrop"
        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <SharedModal
        index={curIndex}
        direction={direction}
        images={images}
        changePhotoId={changePhotoId}
        closeModal={handleClose}
        navigation={true}
      />
    </Dialog>
  );
}
