import { about, experience, faq, projects, site } from "@/content";
import { livePosts } from "@/blog";
import { absolute, caseStudyPath } from "@/lib/seo";

export const dynamic = "force-static";

// A plain-Markdown summary for AI tools (the llms.txt proposal, llmstxt.org).
// Google ignores it and few crawlers ask for it, but it's generated from
// content.ts, so it costs nothing to keep accurate.
export async function GET() {
  const posts = await livePosts();
  const text = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    about.statement,
    "",
    ...about.facts.map((f) => `- ${f.label}: ${f.value}`),
    `- Email: ${site.email}`,
    `- LinkedIn: ${site.linkedin}`,
    `- GitHub: ${site.github}`,
    "",
    "## Pages",
    "",
    `- [Home](${absolute("/")}): portfolio, experience and contact`,
    `- [Résumé](${absolute("/resume")}): experience, projects, skills, education and certifications`,
    `- [Résumé PDF](${absolute(site.resume)})`,
    `- [Hire](${absolute("/hire")}): what Praveen can be hired for (upgrades, performance, native modules, offline-first, CI/CD, on-device AI), with proof and how to get in touch`,
    "",
    "## Case studies",
    "",
    ...projects.map((p) => `- [${p.name}](${absolute(caseStudyPath(p))}): ${p.summary}`),
    "",
    "## Open source",
    "",
    ...projects.flatMap(({ name, openSource: os }) =>
      os
        ? [
            `- ${name}${os.version ? ` ${os.version}` : ""}: [GitHub](${os.repo})${os.npm ? ` · [npm](${os.npm})` : ""}${os.docs ? ` · [Docs](${os.docs})` : ""}${os.directory ? ` · [React Native Directory](${os.directory})` : ""} (${os.license})`,
          ]
        : [],
    ),
    ...posts.flatMap((p) => (p.repo ? [`- [${new URL(p.repo).pathname.slice(1)}](${p.repo}): lab repo for "${p.title}"`] : [])),
    "",
    "## Blog",
    "",
    `- [All posts](${absolute("/blog")}) · [RSS](${absolute("/blog/rss.xml")}) · [Every post in full](${absolute("/llms-full.txt")})`,
    ...posts.map(
      (p) => `- [${p.title}](${absolute(`/blog/${p.slug}`)}) ([Markdown](${absolute(`/blog/${p.slug}.md`)})): ${p.description}`,
    ),
    "",
    "## Experience",
    "",
    ...experience.map((j) => `- ${j.title}, ${j.company} (${j.start} to ${j.end}): ${j.points.join(" ")}`),
    "",
    "## FAQ",
    "",
    ...faq.flatMap((f) => [`### ${f.question}`, "", f.answer, ""]),
  ].join("\n");

  return new Response(text, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
