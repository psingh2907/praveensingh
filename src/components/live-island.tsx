"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Command, Phone, PhoneDisconnect, PhoneX } from "@phosphor-icons/react";
import { availability, site } from "@/content";
import { bootDelay, openWindow } from "@/lib/desktop";

type Mode = "boot" | "live" | "ringing" | "missed";

// Sizes are fractions of the phone screen (cqh/cqw of the island layer in
// phone.tsx), widths included, so a tap animates every edge and corner
// smoothly: mixing rounded-full or percentages with px made the island jump
// before it grew. Compact states are a little taller than Apple's island and
// centred on it (3.37% down the screen, where the camera is).
const sizes: Record<Mode, string> = {
  boot: "top-[1.07cqh] h-[4.6cqh] w-[44cqw] rounded-[2.3cqh]",
  live: "top-[1.07cqh] h-[4.6cqh] w-[60cqw] rounded-[2.3cqh]",
  missed: "top-[1.07cqh] h-[4.6cqh] w-[60cqw] rounded-[2.3cqh]",
  ringing: "top-[1.07cqh] h-[11.5cqh] w-[94cqw] rounded-[4.6cqh]",
};

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, delay: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.08 } },
};

// The front phone's Dynamic Island boots first: the boot screen in miniature,
// a ⌘ and a filling bar, drawn by the server and animated in CSS so it plays
// from first paint. Then it grows into a live activity saying Praveen is
// available. Tap it and Praveen calls you: accept opens the Mail window,
// decline leaves a missed call. On Android phones it really buzzes.
export function LiveIsland() {
  const [mode, setMode] = useState<Mode>("boot");
  const accept = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const next: Partial<Record<Mode, [Mode, number]>> = {
      // The bar fills in about 1.1s from navigation; hydration may land later.
      boot: [
        "live",
        Math.max(300, (bootDelay() + 1.2) * 1000 - performance.now()),
      ],
      ringing: ["missed", 12000],
      missed: ["live", 3500],
    };
    const step = next[mode];
    if (!step) return;
    const id = setTimeout(() => setMode(step[0]), step[1]);
    return () => clearTimeout(id);
  }, [mode]);

  useEffect(() => {
    if (mode === "ringing") accept.current?.focus({ preventScroll: true });
  }, [mode]);

  function ring() {
    setMode("ringing");
    try {
      navigator.vibrate?.([180, 120, 180, 120, 180]);
    } catch {}
  }

  const round =
    "flex aspect-square h-[64cqh] shrink-0 items-center justify-center rounded-full";
  // A compact Live Activity: the leading slot ends before the camera (which
  // sits 61% across the island when it's 60% of the screen wide), the
  // trailing slot sits right of it.
  const leading =
    "absolute inset-y-0 left-[6%] right-[42%] flex min-w-0 items-center gap-[22cqh]";
  const trailing =
    "absolute inset-y-0 left-[70%] right-[7%] flex items-center justify-end";

  return (
    <>
      <div
        className={`absolute left-1/2 z-10 -translate-x-1/2 overflow-hidden bg-black text-white [container-type:size] transition-[width,height,border-radius] duration-[400ms] ease-[cubic-bezier(0.2,0.9,0.25,1)] motion-reduce:transition-none ${sizes[mode]}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {mode === "boot" && (
            <motion.div
              key="boot"
              aria-hidden
              {...fade}
              className="absolute inset-0"
            >
              <span className={leading}>
                <Command
                  weight="bold"
                  className="h-[48cqh] w-[48cqh] shrink-0"
                />
              </span>
              <span className={trailing}>
                <span className="island-boot-bar w-full" />
              </span>
            </motion.div>
          )}

          {mode === "live" && (
            <motion.button
              key="live"
              type="button"
              onClick={ring}
              aria-label={`${availability.short}. Tap for a call from ${site.name}`}
              {...fade}
              className="absolute inset-0"
            >
              <span className={leading}>
                <span className="truncate text-[45cqh] font-semibold leading-none text-white">
                  {availability.short}
                </span>
              </span>
              <span className={trailing}>
                <span
                  aria-hidden
                  className="live-dot h-[36cqh] w-[36cqh] rounded-full bg-[#30d158]"
                />
              </span>
            </motion.button>
          )}

          {mode === "ringing" && (
            <motion.div
              key="ringing"
              role="group"
              aria-label={`Incoming call from ${site.name}`}
              {...fade}
              className="flex h-full w-full items-center gap-[10cqh] pl-[22cqh] pr-[14cqh]"
            >
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[17cqh] text-white/55">mobile</span>
                <span className="block truncate text-[22cqh] font-semibold">
                  {site.name}
                </span>
              </span>
              <button
                type="button"
                aria-label="Decline"
                onClick={() => setMode("missed")}
                className={`${round} bg-[#ff3b30]`}
              >
                <PhoneDisconnect
                  weight="fill"
                  aria-hidden
                  className="h-[55%] w-[55%]"
                />
              </button>
              <button
                ref={accept}
                type="button"
                aria-label="Accept, and write to Praveen"
                onClick={() => {
                  setMode("live");
                  openWindow("contact");
                }}
                className={`${round} bg-[#30d158]`}
              >
                <Phone
                  weight="fill"
                  aria-hidden
                  className="ring-wiggle h-[55%] w-[55%]"
                />
              </button>
            </motion.div>
          )}

          {mode === "missed" && (
            <motion.button
              key="missed"
              type="button"
              onClick={ring}
              aria-label="Missed call. Call back"
              {...fade}
              className="absolute inset-0"
            >
              <span className={leading}>
                <span className="truncate text-[45cqh] font-semibold leading-none text-[#ff453a]">
                  Missed call
                </span>
              </span>
              <span className={trailing}>
                <PhoneX
                  weight="fill"
                  aria-hidden
                  className="h-[54cqh] w-[54cqh] text-[#ff453a]"
                />
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {/* The front camera, where Apple's bezel has it (56.6% across, 3.35% down the
        screen), so it stays visible through the island as on a real phone. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[56.6%] top-[3.35%] z-20 aspect-square w-[3%] -translate-1/2 rounded-full bg-[radial-gradient(circle_at_40%_40%,#2a3a66_0%,#111a33_35%,#05070d_70%)] ring-1 ring-white/5"
      />
    </>
  );
}
