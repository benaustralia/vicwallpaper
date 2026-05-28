import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import manifestData from "../utils/manifest.json";

interface Row {
  id: number;
  source: string;
  title: string;
  date: string;
  classification: string;
  objectUrl: string;
  thumbUrl: string;
}

const STORAGE_KEY = "vw-audit-state-v1";

const AuditPage: NextPage<{ rows: Row[] }> = ({ rows }) => {
  // Per-row state: undefined | "ok" | "bad", saved to localStorage so you
  // can stop and resume on the same device.
  const [marks, setMarks] = useState<Record<number, "ok" | "bad">>({});
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unmarked" | "ok" | "bad">(
    "unmarked",
  );

  // Hydrate from localStorage on mount. The `hydrated` flag gates the persist
  // effect below — otherwise that effect would run on initial render with
  // marks={} and clobber the saved state before we'd had time to read it.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMarks(JSON.parse(raw));
    } catch (e) {
      setStorageError(
        "Couldn't read saved marks (localStorage blocked — Private Browsing?).",
      );
    }
    setHydrated(true);
  }, []);

  // Persist — only after hydration completes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
    } catch (e) {
      setStorageError(
        "Couldn't save marks (localStorage blocked — Private Browsing?).",
      );
    }
  }, [marks, hydrated]);

  const counts = useMemo(() => {
    const ok = Object.values(marks).filter((m) => m === "ok").length;
    const bad = Object.values(marks).filter((m) => m === "bad").length;
    return { ok, bad, unmarked: rows.length - ok - bad, total: rows.length };
  }, [marks, rows.length]);

  const shown = useMemo(() => {
    return rows.filter((r) => {
      const m = marks[r.id];
      if (filter === "ok") return m === "ok";
      if (filter === "bad") return m === "bad";
      if (filter === "unmarked") return !m;
      return true;
    });
  }, [rows, marks, filter]);

  const setMark = (id: number, val: "ok" | "bad") =>
    setMarks((prev) => {
      const next = { ...prev };
      if (next[id] === val) delete next[id]; // toggle off
      else next[id] = val;
      return next;
    });

  const resetAll = () => {
    if (confirm("Clear all marks?")) setMarks({});
  };

  return (
    <>
      <Head>
        <title>Museum links audit — vicwallpaper</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="mx-auto max-w-2xl px-3 pb-32 pt-4 text-white">
        <h1 className="text-xl font-semibold tracking-tight">
          Museum-links audit
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Tap a title to open the museum page in a new tab. Tap ✓ if it loads a
          real Smithsonian / Met page, ✗ if it 404s or stays stuck on CF.
          Progress is saved on this device.
        </p>
        <p className="mt-1 text-xs text-white/40">
          On iOS Safari, this audit tab may get evicted while you're on the
          museum page — closing the museum tab can lose this one. Don't worry:
          your marks are saved automatically, just re-open this URL to resume.
        </p>
        {storageError && (
          <p className="mt-2 rounded bg-rose-500/15 px-3 py-2 text-sm text-rose-300">
            ⚠ {storageError}
          </p>
        )}

        <div className="sticky top-0 z-10 -mx-3 mt-4 border-b border-white/10 bg-black/85 px-3 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex gap-3">
              <span>
                <span className="text-emerald-400">✓ {counts.ok}</span>
              </span>
              <span>
                <span className="text-rose-400">✗ {counts.bad}</span>
              </span>
              <span className="text-white/60">— {counts.unmarked} to go</span>
              <span className="text-white/40">/ {counts.total}</span>
            </div>
            <button
              onClick={resetAll}
              className="rounded border border-white/20 px-2 py-0.5 text-xs text-white/70 hover:bg-white/10"
            >
              reset
            </button>
          </div>
          <div className="mt-2 flex gap-1 text-xs">
            {(["unmarked", "all", "ok", "bad"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 ${
                  filter === f
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/70"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-3 space-y-1">
          {shown.map((r) => {
            const m = marks[r.id];
            return (
              <li
                key={r.id}
                className={`flex items-stretch gap-3 rounded-xl border border-white/5 p-3 ${
                  m === "ok"
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : m === "bad"
                    ? "bg-rose-500/5 border-rose-500/30"
                    : "bg-white/5"
                }`}
              >
                <img
                  src={r.thumbUrl}
                  alt=""
                  className="h-16 w-16 flex-none self-center rounded object-cover bg-black/40"
                  loading="lazy"
                  decoding="async"
                />
                <div className="min-w-0 flex-1">
                  <a
                    href={r.objectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-medium leading-tight text-sky-300 underline-offset-2 hover:underline"
                  >
                    {r.title}
                  </a>
                  <p className="mt-0.5 text-xs text-white/50">
                    [{r.id}] {r.source} · {r.date}
                  </p>
                </div>
                <div className="flex flex-none flex-col gap-2">
                  <button
                    onClick={() => setMark(r.id, "ok")}
                    className={`h-14 w-14 touch-manipulation rounded-lg text-2xl font-semibold active:scale-95 transition ${
                      m === "ok"
                        ? "bg-emerald-500 text-black"
                        : "bg-white/10 text-emerald-300 hover:bg-white/15"
                    }`}
                    aria-label="works"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setMark(r.id, "bad")}
                    className={`h-14 w-14 touch-manipulation rounded-lg text-2xl font-semibold active:scale-95 transition ${
                      m === "bad"
                        ? "bg-rose-500 text-black"
                        : "bg-white/10 text-rose-300 hover:bg-white/15"
                    }`}
                    aria-label="broken"
                  >
                    ✗
                  </button>
                </div>
              </li>
            );
          })}
          {shown.length === 0 && (
            <li className="py-12 text-center text-sm text-white/40">
              Nothing in this filter.
            </li>
          )}
        </ul>
      </main>
    </>
  );
};

export default AuditPage;

export const getStaticProps: GetStaticProps = async () => {
  const rows: Row[] = (manifestData as unknown as Array<{
    source: string;
    title: string;
    date: string;
    classification: string;
    object_url: string;
    cloudinary_url: string;
  }>).map((m, i) => ({
    id: i,
    source: m.source,
    title: m.title,
    date: m.date,
    classification: m.classification,
    objectUrl: m.object_url,
    // tiny square thumbnail straight from Cloudinary
    thumbUrl: m.cloudinary_url.replace(
      "/upload/",
      "/upload/f_auto,q_auto,w_140,h_140,c_fill/",
    ),
  }));
  return { props: { rows } };
};
