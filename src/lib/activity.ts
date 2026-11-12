// Data for the Activity window: what's happened lately in Praveen's open
// source. Fetched on the server when the home page is built and again at most
// once a day after that (the page's `revalidate`), so visitors never wait on
// these APIs and the browser ships none of this.
//
// Every source is optional. If one is down or rate-limited it's left out and
// the rest still show; the window hides when there's nothing at all.

const DAY = 60 * 60 * 24;
const PACKAGE = "bareship";
const CLI = "create-bareship";
const REPO = "psingh2907/bareship";

export type Downloads = {
  /** Downloads over the last 30 days. */
  total: number;
  /** One number per day, oldest first, for the sparkline. */
  daily: number[];
};

export type ActivityItem = {
  kind: "release" | "commit" | "post";
  title: string;
  /** ISO date-time. */
  date: string;
  href: string;
};

export type Activity = {
  downloads?: Downloads;
  cliDownloads?: number;
  directory?: { score: number; url: string };
  items: ActivityItem[];
};

async function json<T>(url: string, headers: Record<string, string> = {}): Promise<T | undefined> {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json", ...headers },
      next: { revalidate: DAY },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  } catch (error) {
    console.warn(`activity: ${url} failed (${(error as Error).message})`);
    return undefined;
  }
}

async function downloads(pkg: string): Promise<Downloads | undefined> {
  const data = await json<{ downloads: { downloads: number }[] }>(
    `https://api.npmjs.org/downloads/range/last-month/${pkg}`,
  );
  if (!data?.downloads?.length) return undefined;
  const daily = data.downloads.map((d) => d.downloads);
  return { total: daily.reduce((a, b) => a + b, 0), daily };
}

async function releases(): Promise<ActivityItem[]> {
  const data = await json<{ time?: Record<string, string> }>(`https://registry.npmjs.org/${PACKAGE}`);
  return Object.entries(data?.time ?? {})
    // Skip "created"/"modified" and pre-release tags like 0.0.0-stage.
    .filter(([version]) => /^\d+\.\d+\.\d+$/.test(version))
    .map(([version, date]) => ({
      kind: "release" as const,
      title: `Bareship ${version} released`,
      date,
      href: `https://www.npmjs.com/package/${PACKAGE}/v/${version}`,
    }));
}

type Commit = { html_url: string; commit: { message: string; author: { date: string } }; parents: unknown[] };

async function commits(): Promise<ActivityItem[]> {
  // Optional: a token lifts GitHub's 60-requests-an-hour limit for shared build IPs.
  const token = process.env.GITHUB_TOKEN;
  const data = await json<Commit[]>(
    `https://api.github.com/repos/${REPO}/commits?per_page=10`,
    token ? { authorization: `Bearer ${token}` } : {},
  );
  return (data ?? [])
    .filter((c) => c.parents.length === 1) // merge commits repeat the PR they merge
    .map((c) => {
      const subject = c.commit.message.split("\n")[0];
      // Squash-merged PRs end in "(#23)": link the pull request, not the commit.
      const pr = subject.match(/\(#(\d+)\)$/)?.[1];
      // "fix(app): right-to-left text" reads as "Right-to-left text".
      const text = subject.replace(/\s*\(#\d+\)$/, "").replace(/^\w+(\([^)]*\))?!?:\s*/, "");
      return {
        kind: "commit" as const,
        title: text.charAt(0).toUpperCase() + text.slice(1),
        date: c.commit.author.date,
        href: pr ? `https://github.com/${REPO}/pull/${pr}` : c.html_url,
      };
    });
}

async function directory(): Promise<Activity["directory"]> {
  const data = await json<{ libraries: { npmPkg: string; score: number }[] }>(
    `https://reactnative.directory/api/libraries?search=${CLI}&limit=5`,
  );
  const lib = data?.libraries.find((l) => l.npmPkg === CLI);
  return lib ? { score: lib.score, url: `https://reactnative.directory/package/${CLI}` } : undefined;
}

export async function getActivity(posts: { slug: string; title: string; published: string }[]): Promise<Activity> {
  const [pkg, cli, rel, com, dir] = await Promise.all([
    downloads(PACKAGE),
    downloads(CLI),
    releases(),
    commits(),
    directory(),
  ]);

  const postItems: ActivityItem[] = posts.map((p) => ({
    kind: "post",
    title: p.title,
    date: `${p.published}T09:00:00Z`,
    href: `/blog/${p.slug}`,
  }));

  // A few of each, so a busy week of commits doesn't push out releases and posts.
  const latest = (list: ActivityItem[], n: number) => [...list].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);
  const items = latest([...latest(rel, 2), ...latest(com, 4), ...latest(postItems, 3)], 9);

  return { downloads: pkg, cliDownloads: cli?.total, directory: dir, items };
}
