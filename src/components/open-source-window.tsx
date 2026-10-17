import Link from "next/link";
import { ArrowRight, BookBookmark, Scales } from "@phosphor-icons/react/ssr";
import { projects } from "@/content";
import { InstallCommands, OpenSourceLinks } from "./open-source";
import { Window } from "./window";

/** A blog post's public lab repo (PostMeta.repo). */
export type Lab = { slug: string; title: string; repo: string };

// "psingh2907/bareship" from the repo URL, as GitHub writes it.
const repoName = (url: string) => new URL(url).pathname.slice(1);

// Praveen's own open-source work, kept apart from the client apps in Selected
// Work. The cards borrow GitHub's pinned-repo look (book icon, owner/name,
// licence) so they read as code, not as someone else's product.
export function OpenSourceWork({ labs }: { labs: Lab[] }) {
  const packages = projects.filter((p) => p.openSource);

  return (
    <Window id="open-source" title="Open Source">
      <div className="p-4 md:p-8">
        <h2 data-split className="text-3xl font-semibold tracking-tighter md:text-4xl">
          Open source
        </h2>
        <p className="mt-2 max-w-[60ch] text-muted">
          Built and maintained by me, outside client work. Free to use, with the code in the open.
        </p>

        <ul className="mt-6 flex flex-col gap-4">
          {packages.map((project) => {
            const os = project.openSource!;
            return (
              <li
                key={project.slug}
                className="grid gap-6 rounded-xl border border-hairline bg-surface-2 p-5 ring-1 ring-accent/25 md:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <BookBookmark size={18} aria-hidden className="shrink-0 text-muted" />
                    <a href={os.repo} className="font-mono font-medium text-accent hover:underline">
                      {repoName(os.repo)}
                    </a>
                    <span className="rounded-full border border-hairline px-2 py-px text-[11px] font-medium text-muted">
                      Public
                    </span>
                  </p>
                  <h3 className="mt-3 flex flex-wrap items-baseline gap-x-2.5 text-2xl font-semibold tracking-tight">
                    {project.name}
                    {os.version && (
                      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-sm font-semibold text-accent tabular-nums">
                        v{os.version}
                      </span>
                    )}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted">{project.summary}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#3178c6]" />
                      TypeScript
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Scales size={15} aria-hidden />
                      {os.license}
                    </span>
                    <span>{project.platforms}</span>
                  </p>
                  {project.note && <p className="mt-3 text-sm leading-snug text-muted">{project.note}</p>}
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
                    <OpenSourceLinks project={os} />
                    <Link
                      href={`/work/${project.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                    >
                      Read the case study<span className="sr-only">: {project.name}</span>
                      <ArrowRight size={14} weight="bold" aria-hidden />
                    </Link>
                  </div>
                </div>
                <InstallCommands lines={os.install} className="self-start" />
              </li>
            );
          })}
        </ul>

        {labs.length > 0 && (
          <section className="mt-8">
            <h3 className="text-lg font-semibold tracking-tight">Lab repos</h3>
            <p className="mt-1 text-sm text-muted">The code and raw results behind my blog posts.</p>
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {labs.map((lab) => (
                <li key={lab.repo} className="flex flex-col rounded-xl border border-hairline bg-surface-2 p-4">
                  <p className="flex min-w-0 items-center gap-2 text-sm">
                    <BookBookmark size={16} aria-hidden className="shrink-0 text-muted" />
                    <a href={lab.repo} className="truncate font-mono text-[13px] font-medium text-accent hover:underline">
                      {repoName(lab.repo)}
                    </a>
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-snug text-muted">{lab.title}</p>
                  <Link
                    href={`/blog/${lab.slug}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                  >
                    Read the post<span className="sr-only">: {lab.title}</span>
                    <ArrowRight size={14} weight="bold" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <p className="border-t border-hairline px-4 py-2 text-center text-xs text-muted">
        {packages.length + labs.length} repositories
      </p>
    </Window>
  );
}
