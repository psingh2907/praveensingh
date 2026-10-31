"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { site } from "@/content";

type Event = (typeof site.booking)[number];

const dark = "(prefers-color-scheme: dark)";
const subscribe = (change: () => void) => {
  const query = matchMedia(dark);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
};

function track(action: string, minutes: number) {
  if (typeof window.gtag === "function")
    window.gtag("event", "book_call", { action, minutes });
}

/** The 15/30-minute switch, styled like Calendar's Day/Week/Month control. */
export function LengthSwitch({
  value,
  onChange,
}: {
  value: number;
  onChange: (minutes: number) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Call length"
      className="flex rounded-lg bg-black/5 p-0.5 text-[13px] dark:bg-white/10"
    >
      {site.booking.map((event) => (
        <button
          key={event.minutes}
          type="button"
          role="radio"
          aria-checked={value === event.minutes}
          onClick={() => {
            onChange(event.minutes);
            track("switch", event.minutes);
          }}
          className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
            value === event.minutes
              ? "bg-surface text-text shadow-sm"
              : "text-muted hover:text-text"
          }`}
        >
          {event.label}
        </button>
      ))}
    </div>
  );
}

type CalApi = ((...args: unknown[]) => void) & {
  ns: Record<string, (...args: unknown[]) => void>;
  loaded?: boolean;
  q?: unknown[];
};

// Cal.com's own loader (from its embed snippet): queues calls until
// https://app.cal.com/embed/embed.js arrives, so it's safe to call at once.
function cal(): CalApi {
  const w = window as unknown as { Cal?: CalApi };
  if (!w.Cal) {
    const push = (api: { q: unknown[] }, args: unknown) => api.q.push(args);
    const api = function (...args: unknown[]) {
      const c = w.Cal!;
      if (!c.loaded) {
        c.ns = {};
        c.q = c.q || [];
        document.head.appendChild(document.createElement("script")).src =
          "https://app.cal.com/embed/embed.js";
        c.loaded = true;
      }
      if (args[0] === "init") {
        const ns = function (...a: unknown[]) {
          push(ns as unknown as { q: unknown[] }, a);
        } as unknown as { q: unknown[] };
        ns.q = [];
        const name = args[1] as string;
        c.ns[name] = c.ns[name] || (ns as unknown as (...a: unknown[]) => void);
        push(c.ns[name] as unknown as { q: unknown[] }, args);
        push(c as unknown as { q: unknown[] }, ["initNamespace", name]);
        return;
      }
      push(c as unknown as { q: unknown[] }, args);
    } as CalApi;
    w.Cal = api;
  }
  return w.Cal;
}

let namespaces = 0;

// Cal.com's booking calendar, through its official embed (which handles the
// frame, its height and booking events). Nothing loads until the calendar is
// about to scroll into view, so it never costs the first load. It follows
// the page's light or dark theme; bookings go straight to Praveen's
// calendar, with a Cal Video link.
export function BookingFrame({
  event,
  className = "",
}: {
  event: Event;
  className?: string;
}) {
  const isDark = useSyncExternalStore(
    subscribe,
    () => matchMedia(dark).matches,
    () => false,
  );
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setNear(true),
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    const el = ref.current;
    if (!near || !el) return;
    // A fresh namespace for each event and theme, so switching re-renders cleanly.
    const ns = `book${++namespaces}`;
    const box = document.createElement("div");
    box.className = "w-full";
    el.replaceChildren(box);
    const api = cal();
    api("init", ns, { origin: "https://cal.com" });
    const calLink = new URL(event.url).pathname.slice(1);
    api.ns[ns]("inline", {
      elementOrSelector: box,
      calLink,
      config: { layout: "month_view", theme: isDark ? "dark" : "light" },
    });
    api.ns[ns]("ui", {
      theme: isDark ? "dark" : "light",
      layout: "month_view",
      hideEventTypeDetails: false,
    });
    api.ns[ns]("on", {
      action: "bookingSuccessful",
      callback: () => track("booked", event.minutes),
    });
    track("view", event.minutes);
    return () => el.replaceChildren();
  }, [near, event, isDark]);

  return (
    <div
      ref={ref}
      aria-label={`Book a ${event.minutes}-minute call with ${site.name}`}
      className={`relative ${className}`}
    />
  );
}

/** Opens the same event on Cal.com, for anyone whose browser blocks the frame. */
export function BookingLink({ event }: { event: Event }) {
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("open_cal", event.minutes)}
      className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
    >
      Open on Cal.com
      <ArrowUpRight size={12} weight="bold" aria-hidden />
    </a>
  );
}

export function useBookingLength() {
  // The 15-minute intro first: the easiest yes for a recruiter.
  const [minutes, setMinutes] = useState(site.booking[0].minutes);
  const event =
    site.booking.find((e) => e.minutes === minutes) ?? site.booking[0];
  return { minutes, setMinutes, event };
}

/** The switch, the calendar and the Cal.com link together, for pages outside the desktop (/hire). */
export function BookingPanel() {
  const { minutes, setMinutes, event } = useBookingLength();
  return (
    <div className="overflow-hidden rounded-xl border border-hairline">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <LengthSwitch value={minutes} onChange={setMinutes} />
        <BookingLink event={event} />
      </div>
      <BookingFrame event={event} className="min-h-[560px]" />
    </div>
  );
}
