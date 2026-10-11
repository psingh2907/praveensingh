"use client";

import { useEffect } from "react";
import { firstUse } from "@/components/effects";
import { site } from "@/content";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// Visit any page with ?ga_ignore=1 to stop this browser being counted (it
// sticks), and ?ga_ignore=0 to undo it.
function ignored() {
  try {
    const ask = new URLSearchParams(location.search).get("ga_ignore");
    if (ask === "1") localStorage.setItem("ga_ignore", "1");
    else if (ask === "0") localStorage.removeItem("ga_ignore");
    return localStorage.getItem("ga_ignore") === "1";
  } catch {
    return false;
  }
}

function load(id: string) {
  if (ignored()) return;
  window.dataLayer = window.dataLayer || [];
  // gtag.js reads the arguments object itself, not an array.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // Counts this page. GA4's enhanced measurement counts later client-side
  // page changes from the History API.
  window.gtag("config", id);
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
}

// Google Analytics 4, loaded the way the GSAP effects are (effects.tsx): on
// the visitor's first scroll, touch, click, key or mouse move, not at load,
// so gtag.js (~150 KiB) never competes with the first paint. Crawlers and
// Lighthouse never interact, so they aren't counted either. A visitor who
// leaves without touching the page isn't counted. Production only.
export function Analytics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const start = () => {
      firstUse.forEach((type) => window.removeEventListener(type, start));
      load(site.gaId);
    };
    // Opened scrolled down (a reload, a #link): the visitor is already here.
    if (window.scrollY > 0) start();
    else firstUse.forEach((type) => window.addEventListener(type, start, { passive: true }));
    return () => firstUse.forEach((type) => window.removeEventListener(type, start));
  }, []);

  return null;
}
