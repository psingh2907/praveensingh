"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpenText, Check, Copy, GithubLogo, ListMagnifyingGlass, Package } from "@phosphor-icons/react";
import type { Project } from "@/content";

type OpenSource = NonNullable<Project["openSource"]>;

// The quick start as a small zsh window, with a button that copies every
// command. Stands in for screenshots on open-source cards and case studies.
export function InstallCommands({ lines, className = "" }: { lines: string[]; className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <div className={`overflow-hidden rounded-xl bg-[#1b1b1f] text-white shadow-[0_8px_24px_-12px_rgb(0_0_0/0.5)] ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
        ))}
        <span className="ml-2 text-[11px] text-white/55">Quick start</span>
        <button
          type="button"
          onClick={copy}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {status === "copied" ? <Check size={13} weight="bold" className="text-[#5af78e]" aria-hidden /> : <Copy size={13} aria-hidden />}
          <span aria-live="polite">
            {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy commands"}
          </span>
        </button>
      </div>
      <pre className="whitespace-pre-wrap break-words px-3 py-2.5 font-mono text-[11.5px] leading-relaxed">
        {lines.map((line) => (
          <code key={line} className="block">
            <span className="select-none text-[#5af78e]">$ </span>
            {line}
          </code>
        ))}
      </pre>
    </div>
  );
}

export function OpenSourceLinks({ project }: { project: OpenSource }) {
  const links = [
    { label: "GitHub", href: project.repo, Icon: GithubLogo },
    ...(project.npm ? [{ label: "npm", href: project.npm, Icon: Package }] : []),
    ...(project.docs ? [{ label: "Docs", href: project.docs, Icon: BookOpenText }] : []),
    ...(project.directory ? [{ label: "React Native Directory", href: project.directory, Icon: ListMagnifyingGlass }] : []),
  ];
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map(({ label, href, Icon }) => (
        <li key={label}>
          <a
            href={href}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            <Icon size={16} aria-hidden />
            {label}
            <ArrowUpRight size={12} weight="bold" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
