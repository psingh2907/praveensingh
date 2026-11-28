"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { setDev, useDev } from "@/lib/dev";

const COUNT = 10_000;
const ROW = 52;
/** FlatList's default: render 10 screens above and below the visible one. */
const WINDOW_SIZE = 21;
/** FlashList's default drawDistance, in px past each edge of the screen. */
const DRAW = 250;

type Mode = "scrollview" | "flatlist" | "flashlist";

const modes: { id: Mode; label: string; note: string }[] = [
  { id: "scrollview", label: "ScrollView", note: "Renders all 10,000 rows up front." },
  { id: "flatlist", label: "FlatList", note: "Renders a window around the screen, mounts and unmounts rows as you scroll." },
  { id: "flashlist", label: "FlashList", note: "Keeps a small pool of cells and recycles them with new data as you scroll." },
];

const names = ["Aarav", "Diya", "Kabir", "Meera", "Rohan", "Isha", "Vihaan", "Anaya", "Arjun", "Sara", "Dev", "Nisha"];
const what = ["Coffee", "Groceries", "Metro card", "Rent split", "Movie night", "Book", "Dinner", "Cab"];

type Item = { id: number; name: string; what: string; amount: string };
let items: Item[] | undefined;
// Built on first use, not at import, so the site never pays for it.
const data = () =>
  (items ??= Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    name: names[(i * 7) % names.length],
    what: what[(i * 5) % what.length],
    amount: `₹${((i * 37) % 900) + 40}`,
  })));

// Every row reports its mount, so recycling shows up as a count that stops
// growing: a recycled cell keeps its key, so its effect doesn't run again.
const Row = memo(function Row({ item, top, onMount }: { item: Item; top?: number; onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return (
    <div
      className="flex items-center gap-2.5 border-b border-white/10 px-3"
      style={{ height: ROW, ...(top === undefined ? {} : { position: "absolute", left: 0, right: 0, top }) }}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 text-[10px] font-semibold">
        {item.name[0]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-white">{item.name}</span>
        <span className="block truncate text-[10px] text-white/50">
          {item.what} · #{item.id + 1}
        </span>
      </span>
      <span className="tabular-nums text-white/80">{item.amount}</span>
    </div>
  );
});

// FlatList vs ScrollView vs FlashList, on this page for real: the same
// 10,000-row feed rendered three ways. With the Perf Monitor open, its
// "Views" count shows what each one costs.
export function ListDemo() {
  const { lists } = useDev();
  return <AnimatePresence>{lists && <Panel key="lists" />}</AnimatePresence>;
}

function Panel() {
  const [mode, setMode] = useState<Mode>("flatlist");
  const [top, setTop] = useState(0);
  const [height, setHeight] = useState(300);
  const [stats, setStats] = useState({ views: 0, mounts: 0 });
  const [took, setTook] = useState<number>();
  const list = useRef<HTMLDivElement>(null);
  const started = useRef<number | null>(null);
  const mounted = useRef(0);
  const onMount = useCallback(() => {
    mounted.current++;
  }, []);
  const bounds = useRef<HTMLDivElement>(null);
  const drag = useDragControls();
  const reduce = useReducedMotion();

  // Render and commit time of the last switch, measured from the tap.
  useLayoutEffect(() => {
    if (started.current !== null) setTook(performance.now() - started.current);
  }, [mode]);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => setHeight(el.clientHeight);
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    const id = window.setInterval(
      () => setStats({ views: el.getElementsByTagName("*").length, mounts: mounted.current }),
      250,
    );
    return () => {
      resize.disconnect();
      clearInterval(id);
    };
  }, []);

  // `at` is the tap's event timestamp, on the same clock as performance.now().
  function choose(next: Mode, at: number) {
    if (next === mode) return;
    started.current = at;
    mounted.current = 0;
    setMode(next);
  }

  const rows = data();
  let body: React.ReactNode;
  let rendered = COUNT;

  if (mode === "scrollview") {
    body = rows.map((item) => <Row key={item.id} item={item} onMount={onMount} />);
  } else {
    const pad = mode === "flatlist" ? ((WINDOW_SIZE - 1) / 2) * height : DRAW;
    let first = Math.max(0, Math.floor((top - pad) / ROW));
    let last = Math.min(COUNT - 1, Math.ceil((top + height + pad) / ROW));
    // FlashList's pool: a key per slot, not per item, so scrolling hands an
    // existing cell new data instead of mounting a new one. It always draws
    // exactly `pool` rows, so every slot stays mounted and none come and go.
    const pool = Math.ceil((height + 2 * DRAW) / ROW) + 2;
    if (mode === "flashlist") {
      first = Math.max(0, Math.min(first, COUNT - pool));
      last = first + pool - 1;
    }
    rendered = last - first + 1;
    const cells = [];
    for (let i = first; i <= last; i++) {
      cells.push(<Row key={mode === "flashlist" ? `cell-${i % pool}` : i} item={rows[i]} top={i * ROW} onMount={onMount} />);
    }
    body = <div style={{ position: "relative", height: COUNT * ROW }}>{cells}</div>;
  }

  const stat = (label: string, value: string, hot = false) => (
    <span className="flex flex-col">
      <span className="text-[9px] uppercase tracking-wider text-white/50">{label}</span>
      <span className={`whitespace-nowrap tabular-nums ${hot ? "text-[#ff453a]" : ""}`}>{value}</span>
    </span>
  );

  return (
    <>
      <div ref={bounds} aria-hidden className="pointer-events-none fixed inset-x-2 bottom-2 top-10" />
      <motion.section
        data-inspector
        aria-labelledby="lists-title"
        drag
        dragListener={false}
        dragControls={drag}
        dragConstraints={bounds}
        dragMomentum={false}
        dragElastic={0.1}
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="fixed left-3 top-[100px] z-[56] w-[300px] overflow-hidden rounded-xl bg-black/80 font-mono text-[11px] text-white shadow-[0_8px_30px_rgb(0_0_0/0.3)] backdrop-blur-md"
      >
        <header
          onPointerDown={(e) => drag.start(e)}
          className="flex touch-none select-none items-center justify-between border-b border-white/15 px-3 py-2 md:cursor-grab"
        >
          <h2 id="lists-title" className="text-[9px] uppercase tracking-wider text-white/50">
            10,000 rows, three ways
          </h2>
          <button
            type="button"
            aria-label="Close list demo"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setDev({ lists: false })}
            className="-mr-1 grid size-5 place-items-center rounded-full text-white/60 outline-none hover:bg-white/15 hover:text-white focus-visible:bg-white/15"
          >
            ×
          </button>
        </header>

        <div role="radiogroup" aria-label="List component" className="m-2 grid grid-cols-3 gap-0.5 rounded-lg bg-white/10 p-0.5">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={(e) => choose(m.id, e.timeStamp)}
              className={`rounded-md px-1 py-1.5 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/60 ${
                mode === m.id ? "bg-white/25 font-semibold" : "text-white/70 hover:bg-white/10"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div
          ref={list}
          onScroll={(e) => {
            if (mode !== "scrollview") setTop(e.currentTarget.scrollTop);
          }}
          className="h-[min(300px,38vh)] overflow-y-auto overscroll-contain border-y border-white/15"
        >
          {body}
        </div>

        <div className="flex justify-between gap-2 px-3 py-2">
          {stat("Rows", rendered.toLocaleString("en-US"), mode === "scrollview")}
          {stat("Views", stats.views.toLocaleString("en-US"), mode === "scrollview")}
          {stat("Mounted", stats.mounts.toLocaleString("en-US"))}
          {stat("Render", took === undefined ? "…" : `${Math.round(took)} ms`, (took ?? 0) > 100)}
        </div>

        <p aria-live="polite" className="border-t border-white/15 px-3 py-2 text-[10px] leading-snug text-white/60">
          {modes.find((m) => m.id === mode)!.note}{" "}
          {mode === "flashlist"
            ? "Scroll: “Mounted” barely moves."
            : mode === "flatlist"
              ? "Scroll fast and watch “Mounted” climb."
              : "Switching to it blocks the thread while they mount."}
        </p>
      </motion.section>
    </>
  );
}
