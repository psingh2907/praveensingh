"use client";

import { CalendarCheck, Clock, Globe, VideoCamera } from "@phosphor-icons/react";
import { site } from "@/content";
import { Avatar } from "./avatar";
import { BookingFrame, BookingLink, LengthSwitch, useBookingLength } from "./booking";
import { Window } from "./window";

// The Calendar app, for booking a call: a sidebar with what each call is
// for, and Cal.com's booking page where the month grid would be.
export function CalendarWindow({ className }: { className?: string }) {
  const { minutes, setMinutes, event } = useBookingLength();

  return (
    <Window
      id="calendar"
      title="Calendar"
      toolbar={<LengthSwitch value={minutes} onChange={setMinutes} />}
      className={className}
    >
      <div className="md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b border-hairline px-6 py-6 md:border-b-0 md:border-r md:px-5">
          <h2 data-split className="text-2xl font-semibold tracking-tight">
            Book a call
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Pick a time that suits you. It goes straight into my calendar.
          </p>

          <div className="mt-5 flex items-center gap-2.5 text-sm">
            <Avatar size={36} />
            <div>
              <p className="font-medium">{site.name}</p>
              <p className="text-xs text-muted">{site.role}</p>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5 text-sm">
            <li className="flex items-center gap-2">
              <Clock size={16} aria-hidden className="text-accent" />
              {minutes} minutes
            </li>
            <li className="flex items-center gap-2">
              <VideoCamera size={16} aria-hidden className="text-accent" />
              Video call, link in the invite
            </li>
            <li className="flex items-center gap-2">
              <Globe size={16} aria-hidden className="text-accent" />
              Times in your time zone
            </li>
          </ul>

          <ul className="mt-5 space-y-2 text-sm leading-snug">
            <li className="flex gap-2">
              <CalendarCheck size={16} aria-hidden className="mt-0.5 shrink-0 text-[#ff3b30]" />
              <span>
                <span className="font-medium">15 min intro:</span>{" "}
                <span className="text-muted">a role or a quick question</span>
              </span>
            </li>
            <li className="flex gap-2">
              <CalendarCheck size={16} aria-hidden className="mt-0.5 shrink-0 text-[#ff3b30]" />
              <span>
                <span className="font-medium">30 min call:</span>{" "}
                <span className="text-muted">a project, an upgrade or an app audit</span>
              </span>
            </li>
          </ul>

          <div className="mt-5">
            <BookingLink event={event} />
          </div>
        </aside>

        <BookingFrame event={event} className="min-h-[560px]" />
      </div>
    </Window>
  );
}
