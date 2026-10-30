// Tells IndexNow search engines (Bing, Yandex, Seznam, Naver; Bing feeds
// ChatGPT search and Copilot) which pages changed, so they're recrawled in
// hours instead of days. Reads the live sitemap, so run it after a deploy.
// The GitHub workflow .github/workflows/indexnow.yml runs it after every
// successful production deploy.
//
//   node scripts/indexnow.mjs              # pages whose sitemap date is in the last 2 days
//   node scripts/indexnow.mjs --days 7     # ...in the last 7 days
//   node scripts/indexnow.mjs --all        # every page in the sitemap
//   node scripts/indexnow.mjs --dry-run    # print the list, send nothing
//
// The key is public by design: search engines check that the site serves it
// at /<key>.txt (public/<key>.txt) before trusting a submission.

const SITE = "https://www.praveensingh.co.in";
const KEY = "4abf17545cf0890f1504b867fb6ec361";

const args = process.argv.slice(2);
const all = args.includes("--all");
const dryRun = args.includes("--dry-run");
const days = Number(args[args.indexOf("--days") + 1]) || 2;

const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const since = Date.now() - days * 24 * 60 * 60 * 1000;
const urls = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  .map(([, entry]) => ({
    url: entry.match(/<loc>([^<]+)/)?.[1],
    modified: Date.parse(entry.match(/<lastmod>([^<]+)/)?.[1] ?? ""),
  }))
  .filter((e) => e.url && (all || e.modified >= since))
  .map((e) => e.url);

if (urls.length === 0) {
  console.log(`Nothing changed in the last ${days} days.`);
  process.exit(0);
}
console.log(urls.join("\n"));
if (dryRun) process.exit(0);

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
// 200 and 202 both mean accepted; 202 means the key is still being checked.
console.log(`IndexNow: ${response.status} ${response.statusText} for ${urls.length} URLs`);
if (!response.ok) process.exit(1);
