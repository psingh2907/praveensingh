// Writes the latest Bareship release on npm to src/generated/bareship-release.json,
// which content.ts reads for the version line. Runs before `next dev` and
// `next build`, so every deploy shows the current version. Bareship's release
// workflow and a daily check (.github/workflows/bareship-version.yml) start a
// deploy when a new version is out.
//
// Never fails the build: if npm can't be reached, the last file is kept, or the
// fallback below is written.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const OUT = new URL("../src/generated/bareship-release.json", import.meta.url);
// The release this was written against. Only used when npm is down and there is no file yet.
const FALLBACK = { version: "0.2.0", released: "2026-10-17T14:49:29.985Z" };

async function latest() {
  const res = await fetch("https://registry.npmjs.org/bareship", {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`npm answered ${res.status}`);
  const pkg = await res.json();
  const version = pkg["dist-tags"]?.latest;
  const released = pkg.time?.[version];
  if (!version || !released) throw new Error("no latest version in the npm metadata");
  return { version, released };
}

let release;
try {
  release = await latest();
  console.log(`bareship-release: ${release.version} (${release.released})`);
} catch (error) {
  const kept = await readFile(OUT, "utf8").then(JSON.parse, () => null);
  release = kept ?? FALLBACK;
  console.warn(`bareship-release: ${error.message}; using ${release.version}`);
}

await mkdir(new URL(".", OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(release, null, 2) + "\n");
