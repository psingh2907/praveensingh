import { CalendarBlank } from "@phosphor-icons/react/ssr";

// "Book a call" in the menu bar, on every page: the one action a recruiter
// should never have to scroll for. A green dot says Praveen is available; on
// narrow screens it shrinks to the calendar icon.
export function BookCallPill({ href }: { href: string }) {
  return (
    <a
      href={href}
      aria-label="Book a call with Praveen"
      className="inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent-fill px-2 text-[12px] font-medium text-white shadow-sm transition-transform active:scale-95 sm:px-2.5"
    >
      <span
        aria-hidden
        className="live-dot hidden h-1.5 w-1.5 rounded-full bg-[#30d158] sm:block"
      />
      <CalendarBlank
        size={14}
        weight="bold"
        aria-hidden
        className="sm:hidden"
      />
      <span className="hidden sm:inline">Book a call</span>
    </a>
  );
}
