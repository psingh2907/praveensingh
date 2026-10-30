import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { site } from "@/content";
import { allPosts, tagSlug } from "@/blog";
import { PostList } from "@/blog/post-list";
import { absolute, breadcrumbs, ids, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export async function generateStaticParams() {
  const tags = new Set((await allPosts()).flatMap((p) => p.tags));
  return [...tags].map((tag) => ({ tag: tagSlug(tag) }));
}

async function find(slug: string) {
  const posts = await allPosts();
  const tag = posts.flatMap((p) => p.tags).find((t) => tagSlug(t) === slug);
  return tag ? { tag, posts: posts.filter((p) => p.tags.includes(tag)) } : null;
}

// Short enough for a search snippet (about 155 characters).
const summary = (tag: string, count: number) =>
  `${count} ${count === 1 ? "post" : "posts"} on ${tag} by ${site.name}, ${site.role}: hands-on, measured write-ups with code and lab repos.`;

export async function generateMetadata({ params }: PageProps<"/blog/tags/[tag]">): Promise<Metadata> {
  const found = await find((await params).tag);
  if (!found) return {};
  return pageMetadata({
    title: `${found.tag} posts`,
    description: summary(found.tag, found.posts.length),
    path: `/blog/tags/${tagSlug(found.tag)}`,
  });
}

export default async function TagPage({ params }: PageProps<"/blog/tags/[tag]">) {
  const found = await find((await params).tag);
  if (!found) notFound();
  const path = `/blog/tags/${tagSlug(found.tag)}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: found.tag, path },
  ];

  return (
    <PageShell title={found.tag} crumbs={crumbs}>
      <JsonLd
        nodes={[
          {
            "@type": "CollectionPage",
            "@id": absolute(`${path}#page`),
            url: absolute(path),
            name: `${found.tag} posts`,
            description: summary(found.tag, found.posts.length),
            about: found.tag,
            author: { "@id": ids.person },
            isPartOf: { "@id": absolute("/blog#blog") },
            // The posts, as the BlogPosting nodes their own pages define.
            hasPart: found.posts.map((p) => ({
              "@type": "BlogPosting",
              "@id": absolute(`/blog/${p.slug}#post`),
              headline: p.title,
              url: absolute(`/blog/${p.slug}`),
            })),
          },
          breadcrumbs(crumbs),
        ]}
      />
      <div className="px-6 py-10 md:px-12">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Topic</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tighter md:text-5xl">{found.tag}</h1>
        <p className="mt-3 max-w-[66ch] leading-relaxed text-muted">{summary(found.tag, found.posts.length)}</p>
        <div className="mt-8">
          <PostList posts={found.posts} />
        </div>
      </div>
    </PageShell>
  );
}
