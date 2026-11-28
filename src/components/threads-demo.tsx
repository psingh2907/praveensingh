"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { setDev, useDev } from "@/lib/dev";

const PERIOD = 1600;
const BLOCK = 2000;

type Result = { js: number; ms: number };

// Why Reanimated exists, shown on this page for real. Two dots run the same
// path: one is moved by JavaScript every frame (requestAnimationFrame, which
// is Animated without the native driver), the other by a CSS transform
// animation that the browser's compositor runs off the main thread (a
// Reanimated worklet on the UI thread). "Block" then hogs the main thread
// with a busy loop: the JS dot freezes, the compositor one keeps going.
export function ThreadsDemo() {
  const { threads } = useDev();
  return <AnimatePresence>{threads && <Panel key="threads" />}</AnimatePresence>;
}

function Demo() {
  const js = useRef<HTMLDivElement>(null);
  const frame = useRef(1000 / 60);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>();

  // The JS-driven dot, positioned from the clock each frame like an Animated
  // timing. After a stall it jumps to where it should be, which is exactly
  // what a frozen JS thread looks like on a phone.
  useEffect(() => {
    let id = 0;
    // Timed from mount, when the CSS dot's animation starts too, so the two
    // run in step until the thread is blocked.
    const t0 = performance.now();
    let prev = t0;
    let gaps: number[] = [];
    const tick = (now: number) => {
      gaps.push(now - prev);
      prev = now;
      if (gaps.length === 30) {
        const sorted = [...gaps].sort((a, b) => a - b);
        frame.current = Math.min(frame.current, sorted[15]);
        gaps = [];
      }
      const t = (Math.max(0, now - t0) % (PERIOD * 2)) / PERIOD;
      const p = (1 - Math.cos(Math.PI * t)) / 2;
      if (js.current) js.current.style.transform = `translateX(${p * 100}%)`;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  function block() {
    if (busy) return;
    setBusy(true);
    setResult(undefined);
    // Two frames so "busy" is on screen before the thread locks up.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const start = performance.now();
        while (performance.now() - start < BLOCK) {
          // A long synchronous task, like parsing a huge JSON response on the JS thread.
        }
        const ms = performance.now() - start;
        setBusy(false);
        setResult({ ms, js: Math.round(ms / frame.current) });
      }),
    );
  }

  const lane = (label: string, detail: string, dot: React.ReactNode) => (
    <div>
      <p className="flex items-baseline justify-between gap-2">
        <span className="shrink-0 font-semibold">{label}</span>
        <span className="truncate text-[10px] text-white/50">{detail}</span>
      </p>
      <div className="mt-1.5 h-5 rounded-full bg-white/10 px-1 py-1">{dot}</div>
    </div>
  );

  return (
  <div className="space-y-3 px-3 py-3">
    {lane(
      "JS thread",
      "Animated, JS driver",
      <div ref={js} className="h-full w-[calc(100%-12px)]">
        <span className={`block size-3 rounded-full ${busy ? "bg-[#ff453a]" : "bg-[#61dafb]"}`} />
      </div>,
    )}
    {lane(
      "UI thread",
      "Reanimated worklet",
      <div className="thread-run h-full w-[calc(100%-12px)]">
        <span className="block size-3 rounded-full bg-[#5af78e]" />
      </div>,
    )}

    <p aria-live="polite" className="min-h-[30px] leading-snug text-white/75">
      {busy ? (
        <>
          <span aria-hidden className="thread-spin mr-1.5 inline-block size-2.5 rounded-full border-[1.5px] border-white/30 border-t-white align-[-1px]" />
          JS thread busy. Try clicking anything.
        </>
      ) : result ? (
        <>
          JS thread froze {(result.ms / 1000).toFixed(1)}s and dropped <span className="text-[#ff453a]">~{result.js} frames</span>. The UI
          thread didn&apos;t wait.
        </>
      ) : (
        "Both dots run the same 60 fps animation. Now block the JS thread."
      )}
    </p>

    <button
      type="button"
      onPointerDownCapture={(e) => e.stopPropagation()}
      onClick={block}
      disabled={busy}
      className="w-full rounded-lg bg-white/15 px-3 py-2 font-semibold outline-none transition-colors hover:bg-white/25 focus-visible:bg-white/25 disabled:opacity-60"
    >
      {busy ? "Blocking…" : `Block JS thread for ${BLOCK / 1000}s`}
    </button>
  </div>
  );
}

function Panel() {
  const bounds = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  return (
    <>
      <div ref={bounds} aria-hidden className="pointer-events-none fixed inset-x-2 bottom-2 top-10" />
      <motion.section
        data-inspector
        aria-labelledby="threads-title"
        drag
        dragConstraints={bounds}
        dragMomentum={false}
        dragElastic={0.1}
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="fixed right-3 top-11 z-[56] w-[288px] touch-none select-none overflow-hidden rounded-xl bg-black/80 font-mono text-[11px] text-white shadow-[0_8px_30px_rgb(0_0_0/0.3)] backdrop-blur-md md:cursor-grab"
      >
        <header className="flex items-center justify-between border-b border-white/15 px-3 py-2">
          <h2 id="threads-title" className="text-[9px] uppercase tracking-wider text-white/50">
            JS thread vs UI thread
          </h2>
          <button
            type="button"
            aria-label="Close thread demo"
            onClick={() => setDev({ threads: false })}
            className="-mr-1 grid size-5 place-items-center rounded-full text-white/60 outline-none hover:bg-white/15 hover:text-white focus-visible:bg-white/15"
          >
            ×
          </button>
        </header>

        <Demo />
        <p className="border-t border-white/15 px-3 py-2 text-[10px] leading-snug text-white/50">
          In the browser, requestAnimationFrame stands in for the JS thread and a compositor CSS animation for the UI
          thread. Same rule on a phone: keep animations off the JS thread.
        </p>
      </motion.section>
    </>
  );
}

/**
 * The same demo inline, for a blog post: no floating window, just the two
 * lanes and the button, with a caption under it.
 */
export function ThreadsFigure({ caption }: { caption?: string }) {
  return (
    <figure className="not-prose my-8">
      <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-[#1c1c1e] font-mono text-[12px] text-white shadow-[0_8px_30px_rgb(0_0_0/0.18)]">
        <p className="border-b border-white/15 px-3 py-2 text-[9px] uppercase tracking-wider text-white/50">
          JS thread vs UI thread · live
        </p>
        <Demo />
      </div>
      {caption && <figcaption className="mx-auto mt-3 max-w-md text-center text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}
