"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AirplaneTilt, ArrowClockwise, Heart, WifiSlash, X } from "@phosphor-icons/react";

// A working miniature of Bareship's offline write queue, drawn in the hero
// phone when a visitor asks for it (hero-demo.tsx loads this file then).
// It copies the Bareship app's feed (its colours, offline banner, post cards,
// sample posts and wording, from the template's theme and mocks) and is
// labelled as a demo on screen: it re-creates the behaviour in the browser,
// it isn't a screenshot. Each like is applied on the "phone" at once, written
// to an outbox that survives a restart (the page's localStorage stands in for
// the database), and sent in order when the phone is back online.

type Post = { id: string; author: string; body: string; likes: number; liked: boolean };
type Change = { key: string; postId: string; liked: boolean; status: "waiting" | "synced" };
type Saved = { posts: Post[]; outbox: Change[]; online: boolean };

const STORAGE = "bareship-demo-v2";
const SEND_MS = 650;
const SYNCED_MS = 1400;

// Bareship's seed data (src/mocks/db.ts): the first four posts.
const starting: Post[] = [
  { id: "p1", author: "Demo User", body: "Shipped the new onboarding flow today. Three screens, zero config.", likes: 0, liked: false },
  { id: "p2", author: "Ada Lovelace", body: "Offline-first is a product decision before it is an engineering one.", likes: 7, liked: false },
  { id: "p3", author: "Grace Hopper", body: "Reminder: cursor pagination stays correct while new posts arrive.", likes: 14, liked: false },
  { id: "p4", author: "Alan Turing", body: "Tried the dark theme on an OLED screen at night. Worth it.", likes: 21, liked: false },
];

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    // A change confirmed just before the restart has nothing left to show.
    return { ...saved, outbox: saved.outbox.filter((c) => c.status === "waiting") };
  } catch {
    return null;
  }
}

function save(state: Saved) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(state));
  } catch {}
}

export function track(action: string) {
  if (typeof window.gtag === "function") window.gtag("event", "offline_demo", { action });
}

const likesLabel = (n: number) => `${n} ${n === 1 ? "like" : "likes"}`;

export function OfflineDemo({ onClose }: { onClose: () => void }) {
  // Each visit to the demo starts offline with a fresh feed, unless changes
  // are still waiting from last time: those are the point.
  const [state, setState] = useState<Saved>(() => {
    const saved = load();
    return saved?.outbox.length ? saved : { posts: starting, outbox: [], online: false };
  });
  const [restarting, setRestarting] = useState(false);

  useEffect(() => save(state), [state]);

  // The outbox goes out in order, one change at a time: while online, the
  // oldest waiting change is the one being sent. Going offline mid-send
  // leaves it waiting, since the server never confirmed it.
  const inFlight = state.online && !restarting ? state.outbox.find((c) => c.status === "waiting") : undefined;
  const inFlightKey = inFlight?.key;
  useEffect(() => {
    if (!inFlightKey) return;
    const timer = setTimeout(
      () =>
        setState((s) => ({
          ...s,
          outbox: s.outbox.map((c) => (c.key === inFlightKey ? { ...c, status: "synced" } : c)),
        })),
      SEND_MS,
    );
    return () => clearTimeout(timer);
  }, [inFlightKey]);

  // "Saved" shows for a moment, then the change leaves the outbox.
  const synced = state.outbox
    .filter((c) => c.status === "synced")
    .map((c) => c.key)
    .join();
  useEffect(() => {
    if (!synced) return;
    const keys = synced.split(",");
    const timer = setTimeout(
      () => setState((s) => ({ ...s, outbox: s.outbox.filter((c) => !keys.includes(c.key)) })),
      SYNCED_MS,
    );
    return () => clearTimeout(timer);
  }, [synced]);

  function like(post: Post) {
    const liked = !post.liked;
    track(state.online ? "like_online" : "like_offline");
    setState((s) => ({
      ...s,
      // The screen updates at once: it reads the local copy, not the network.
      posts: s.posts.map((p) => (p.id === post.id ? { ...p, liked, likes: p.likes + (liked ? 1 : -1) } : p)),
      outbox: [...s.outbox, { key: `${post.id}-${Date.now()}`, postId: post.id, liked, status: "waiting" }],
    }));
  }

  function toggleNetwork() {
    track(state.online ? "go_offline" : "go_online");
    setState((s) => ({ ...s, online: !s.online }));
  }

  // Throw away everything in memory and start again from what was saved.
  function restart() {
    track("restart");
    setRestarting(true);
    setTimeout(() => {
      const saved = load();
      if (saved) setState(saved);
      setRestarting(false);
    }, 900);
  }

  const waiting = state.outbox.filter((c) => c.status === "waiting").length;
  const statusOf = (id: string) => {
    const changes = state.outbox.filter((c) => c.postId === id);
    if (inFlight?.postId === id) return "sending";
    if (changes.some((c) => c.status === "waiting")) return "waiting";
    if (changes.some((c) => c.status === "synced")) return "synced";
    return null;
  };

  // Sizes are in em off a base that follows the screen's width (cqw), so the
  // app keeps a real phone's proportions at every size of the frame.
  return (
    <div className="@container absolute inset-0">
      <div className="absolute inset-0 flex flex-col bg-[#F3F5F8] text-[clamp(7.5px,4.1cqw,11px)] leading-[1.35] text-[#121923] dark:bg-[#0E131A] dark:text-[#F3F5F8]">
        {restarting ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-[0.8em] bg-[#0A6C96] text-white dark:bg-[#0E131A]">
            <span className="text-[1.6em] font-bold tracking-tight">Bareship</span>
            <ArrowClockwise className="h-[1.4em] w-[1.4em] animate-spin opacity-80 motion-reduce:animate-none" aria-hidden />
            <span className="sr-only">Relaunching the app</span>
          </div>
        ) : (
          <>
            {/* The app bar, clear of the Dynamic Island. */}
            <div className="border-b border-[#D6DDE6] bg-white px-[1.3em] pb-[0.7em] pt-[3.4em] dark:border-[#2E3947] dark:bg-[#151C25]">
              <p className="mt-[1em] text-[1.45em] font-bold tracking-tight">Feed</p>
            </div>

            {/* Bareship's offline banner (shared/ui/offline). */}
            <p
              role="status"
              aria-live="polite"
              className={`flex items-center gap-[0.6em] border-b border-[#D6DDE6] px-[1.3em] py-[0.6em] text-[0.88em] text-[#536071] transition-colors dark:border-[#2E3947] dark:text-[#8792A1] ${
                state.online ? "bg-white dark:bg-[#151C25]" : "bg-[#E7ECF1] dark:bg-[#1D2631]"
              }`}
            >
              {state.online ? (
                <span>{waiting > 0 ? "Back online. Syncing your changes…" : "You're online. Everything is saved."}</span>
              ) : (
                <>
                  <WifiSlash className="h-[1.3em] w-[1.3em] shrink-0" aria-hidden />
                  <span>
                    {waiting > 0
                      ? `You're offline. ${waiting} ${waiting === 1 ? "change" : "changes"} will sync when you reconnect.`
                      : "You're offline. Showing saved content."}
                  </span>
                </>
              )}
            </p>

            <ul className="flex-1 overflow-hidden">
              {state.posts.map((post) => {
                const status = statusOf(post.id);
                return (
                  <li
                    key={post.id}
                    className="border-b border-[#D6DDE6] bg-white px-[1.3em] pt-[1em] dark:border-[#2E3947] dark:bg-[#151C25]"
                  >
                    <div className="flex items-center gap-[0.8em]">
                      <span
                        aria-hidden
                        className="grid h-[2.6em] w-[2.6em] shrink-0 place-items-center rounded-full bg-[#E7ECF1] text-[0.9em] font-semibold text-[#536071] dark:bg-[#1D2631] dark:text-[#8792A1]"
                      >
                        {post.author.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">{post.author}</p>
                        <p className="text-[0.88em] text-[#536071] dark:text-[#8792A1]">2 weeks ago</p>
                      </div>
                    </div>
                    <p className="mt-[0.7em]">{post.body}</p>
                    <button
                      type="button"
                      onClick={() => like(post)}
                      aria-pressed={post.liked}
                      aria-label={`${post.liked ? "Unlike" : "Like"} ${post.author}'s post, ${likesLabel(post.likes)}`}
                      className="flex min-h-[2.9em] items-center gap-[0.35em] text-[0.88em] text-[#536071] active:scale-95 dark:text-[#8792A1]"
                    >
                      <Heart
                        weight={post.liked ? "fill" : "regular"}
                        className={`h-[1.5em] w-[1.5em] ${post.liked ? "text-[#B42318] dark:text-[#F97066]" : ""}`}
                        aria-hidden
                      />
                      <span className="tabular-nums">{likesLabel(post.likes)}</span>
                      {status === "waiting" && <span className="text-[#6C7888]">Waiting to sync</span>}
                      {status === "sending" && <span className="text-[#0A6C96] dark:text-[#55B6E0]">Syncing…</span>}
                      {status === "synced" && <span className="text-[#1F7A4A] dark:text-[#62C58C]">Saved</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* The demo's own controls, apart from the app: a system-style pill. */}
        <div className="pointer-events-none absolute inset-x-[0.8em] bottom-[1.6em] flex flex-col items-center gap-[0.5em]">
          {!state.online && waiting === 0 && !restarting && (
            <p className="rounded-full bg-black/70 px-[1em] py-[0.35em] text-center text-[0.85em] text-white backdrop-blur @max-[13rem]:hidden">
              Like a post, restart, then turn airplane mode off
            </p>
          )}
          <div className="pointer-events-auto flex items-center gap-[0.3em] rounded-full bg-black/75 p-[0.35em] text-white shadow-lg backdrop-blur">
            <span className="px-[0.7em] text-[0.8em] font-semibold uppercase tracking-wider text-white/70">Demo</span>
            <button
              type="button"
              onClick={toggleNetwork}
              role="switch"
              aria-checked={!state.online}
              aria-label="Airplane mode"
              className={`grid h-[2.6em] w-[2.6em] place-items-center rounded-full transition-colors ${
                state.online ? "bg-white/15" : "bg-[#ff9f0a]"
              }`}
            >
              <AirplaneTilt weight="fill" className="h-[1.4em] w-[1.4em]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={restart}
              aria-label="Restart the app"
              className="grid h-[2.6em] w-[2.6em] place-items-center rounded-full bg-white/15"
            >
              <ArrowClockwise weight="bold" className="h-[1.3em] w-[1.3em]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close the demo"
              className="grid h-[2.6em] w-[2.6em] place-items-center rounded-full bg-white/15"
            >
              <X weight="bold" className="h-[1.2em] w-[1.2em]" aria-hidden />
            </button>
          </div>
          <Link
            href="/work/bareship"
            className="pointer-events-auto text-[0.8em] font-medium text-[#0A6C96] dark:text-[#55B6E0] @max-[13rem]:hidden"
          >
            How Bareship&apos;s outbox works →
          </Link>
        </div>
      </div>
    </div>
  );
}
