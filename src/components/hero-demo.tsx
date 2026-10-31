"use client";

import { useState } from "react";
import { AirplaneTilt } from "@phosphor-icons/react";

type Demo = typeof import("./offline-demo");

// The "Try it offline" button on the hero iPhone. The demo's code only
// downloads when it's tapped, so it never touches the first load; until
// then the phone shows its real screenshot.
export function HeroDemo() {
  const [demo, setDemo] = useState<Demo | null>(null);
  const [open, setOpen] = useState(false);

  async function start() {
    setOpen(true);
    const loaded = demo ?? (await import("./offline-demo"));
    setDemo(loaded);
    loaded.track("open");
  }

  if (open && demo) return <demo.OfflineDemo onClose={() => setOpen(false)} />;

  return (
    <button
      type="button"
      onClick={start}
      aria-busy={open}
      className="glass absolute inset-x-3 bottom-4 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold text-text shadow-lg transition-transform active:scale-95"
    >
      <AirplaneTilt size={14} weight="fill" className="text-accent" aria-hidden />
      {open ? "Loading demo…" : "Try it offline"}
    </button>
  );
}
