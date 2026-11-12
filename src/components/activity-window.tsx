import { ArrowUpRight, DownloadSimple, GitCommit, Notebook, Package, Trophy } from "@phosphor-icons/react/ssr";
import type { Activity, ActivityItem } from "@/lib/activity";
import { Window } from "./window";

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const count = new Intl.NumberFormat("en-GB");

// Each kind of notification comes from an "app", with its icon tile, as macOS
// Notification Center groups them.
const apps: Record<ActivityItem["kind"], { name: string; Icon: typeof Package; tile: string }> = {
  release: { name: "npm", Icon: Package, tile: "bg-[#cb3837] text-white" },
  // The ring keeps the near-black tile visible on dark mode's dark cards.
  commit: { name: "GitHub · bareship", Icon: GitCommit, tile: "bg-[#1f2328] text-white ring-1 ring-white/15" },
  post: { name: "Notes · new post", Icon: Notebook, tile: "bg-gradient-to-b from-[#ffd60a] to-[#ffb800] text-[#3a2c00]" },
};

/** The last 30 days of downloads as a line, scaled to the busiest day. */
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const step = 100 / Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(2)},${(30 - (v / max) * 28).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden className="mt-3 h-12 w-full text-accent">
      <polygon points={`0,30 ${points} 100,30`} className="fill-current opacity-15" />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Widget({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-hairline bg-surface-2 p-4 ${className}`}>{children}</div>;
}

// Notification Center for the portfolio: widgets with Bareship's numbers on
// top, then the latest releases, merged changes and posts. A server component;
// the data is fetched at build time and refreshed daily (lib/activity.ts).
export function ActivityWindow({ activity, className }: { activity: Activity; className?: string }) {
  const { downloads, cliDownloads, directory, items } = activity;
  if (!downloads && !directory && items.length === 0) return null;

  return (
    <Window id="activity" title="Activity" className={className}>
      <div className="p-4 md:p-8">
        <h2 data-split className="text-3xl font-semibold tracking-tighter md:text-4xl">
          Lately
        </h2>
        <p className="mt-2 max-w-[60ch] text-muted">
          What&rsquo;s shipped recently in my open source and on the blog. Updated daily.
        </p>

        {(downloads || directory) && (
          <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {downloads && (
              <Widget>
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  <DownloadSimple size={14} weight="bold" aria-hidden />
                  npm downloads · last 30 days
                </p>
                <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">{count.format(downloads.total)}</span>
                  <span className="font-mono text-sm text-muted">bareship</span>
                  {cliDownloads !== undefined && (
                    <span className="text-sm text-muted">
                      + <span className="tabular-nums">{count.format(cliDownloads)}</span>{" "}
                      <span className="font-mono">create-bareship</span>
                    </span>
                  )}
                </p>
                <Sparkline values={downloads.daily} />
              </Widget>
            )}
            {directory && (
              <Widget className="flex flex-col">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  <Trophy size={14} weight="bold" aria-hidden />
                  React Native Directory
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{directory.score}</p>
                <p className="mt-1 text-sm leading-snug text-muted">
                  Directory score for <span className="font-mono">create-bareship</span>
                </p>
                <a
                  href={directory.url}
                  className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-accent hover:underline"
                >
                  See the listing
                  <ArrowUpRight size={13} weight="bold" aria-hidden />
                </a>
              </Widget>
            )}
          </div>
        )}

        {items.length > 0 && (
          <section className="mt-8" aria-labelledby="activity-recent">
            <h3 id="activity-recent" className="text-lg font-semibold tracking-tight">
              Notifications
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {items.map((item) => {
                const app = apps[item.kind];
                const external = item.href.startsWith("http");
                return (
                  <li key={`${item.kind}-${item.href}`}>
                    <a
                      href={item.href}
                      className="flex items-start gap-3 rounded-2xl border border-hairline bg-surface-2 p-3 transition-colors hover:bg-accent-soft"
                    >
                      <span
                        aria-hidden
                        className={`grid size-9 shrink-0 place-items-center rounded-[10px] shadow-sm ${app.tile}`}
                      >
                        <app.Icon size={20} weight="fill" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3 text-xs text-muted">
                          <span className="truncate font-medium uppercase tracking-wide">{app.name}</span>
                          <time dateTime={item.date} className="shrink-0 tabular-nums">
                            {day.format(new Date(item.date))}
                          </time>
                        </span>
                        <span className="mt-0.5 block text-[15px] font-medium leading-snug">
                          {item.title}
                          {external && <span className="sr-only"> (opens on another site)</span>}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
      <p className="border-t border-hairline px-4 py-2 text-center text-xs text-muted">
        From npm, GitHub and the React Native Directory
      </p>
    </Window>
  );
}
