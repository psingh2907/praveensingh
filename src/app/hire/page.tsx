import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlank, DownloadSimple, EnvelopeSimple, LinkedinLogo } from "@phosphor-icons/react/ssr";
import { BookingPanel } from "@/components/booking";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { about, hire, process, recommendations, site } from "@/content";
import { absolute, breadcrumbs, faqPage, ids, pageMetadata } from "@/lib/seo";

// For people who arrive ready to hire: what Praveen can be hired for, with
// proof from the case studies and posts, and one step to get in touch.
// "Developer" in the title, because that's how the role is searched.
const title = "Hire a Senior React Native Developer";
const description = `Hire ${site.name}, a Senior React Native developer in ${site.location}: upgrades, performance, native modules, offline-first apps and CI/CD. Available now.`;
const path = "/hire";

export const metadata: Metadata = pageMetadata({ title, description, path });

const heading = "text-xs font-medium uppercase tracking-[0.18em] text-accent";
const fact = (label: string) => about.facts.find((f) => f.label === label)?.value;

export default function Hire() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Hire", path },
  ];
  const [recommendation] = recommendations;

  return (
    <PageShell title="Hire Praveen" crumbs={crumbs}>
      <JsonLd
        nodes={[
          {
            "@type": "Service",
            "@id": absolute(`${path}#service`),
            name: "React Native app development and consulting",
            serviceType: "React Native development",
            description,
            url: absolute(path),
            provider: { "@id": ids.person },
            areaServed: "Worldwide",
            availableChannel: { "@type": "ServiceChannel", serviceUrl: absolute(path), availableLanguage: "en" },
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "React Native services",
              itemListElement: hire.services.map((s) => ({
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: s.title, description: s.body },
              })),
            },
          },
          faqPage(hire.faq, `${path}#faq`),
          breadcrumbs(crumbs),
        ]}
      />

      <article className="px-6 py-10 md:px-12">
        <p className={heading}>Available now</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tighter md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-muted">
          I&apos;m {site.name}, a {site.role} in {site.location}, with 5+ years shipping Android and iOS apps for upGrad,
          Delightree and a UK fintech. I&apos;m open to senior roles and consulting, and can start immediately.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent("React Native work")}`}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-accent-fill px-6 py-3 text-[15px] font-medium text-white transition-transform active:scale-[0.98]"
          >
            <EnvelopeSimple size={18} weight="bold" aria-hidden />
            Email me
          </a>
          <a
            href="#book"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-hairline bg-surface px-6 py-3 text-[15px] font-medium text-accent transition-colors hover:bg-surface-2"
          >
            <CalendarBlank size={18} weight="bold" aria-hidden />
            Book a call
          </a>
          <a
            href={site.linkedin}
            target="_blank"
            rel="me noreferrer"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-hairline bg-surface px-6 py-3 text-[15px] font-medium text-accent transition-colors hover:bg-surface-2"
          >
            <LinkedinLogo size={18} weight="bold" aria-hidden />
            LinkedIn
          </a>
          <a
            href={site.resume}
            download
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-hairline bg-surface px-6 py-3 text-[15px] font-medium text-accent transition-colors hover:bg-surface-2"
          >
            <DownloadSimple size={18} weight="bold" aria-hidden />
            Résumé PDF
          </a>
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl bg-surface-2 p-5 text-sm sm:grid-cols-2">
          {["Open to", "Joining", "Based in", "Focus"].map((label) => (
            <div key={label}>
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium">{fact(label)}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-12">
          <h2 className={heading}>What I can help with</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {hire.services.map((s) => (
              <li key={s.title} className="flex flex-col rounded-xl border border-hairline p-5">
                <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 leading-relaxed">{s.body}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.proof}</p>
                <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-sm">
                  {s.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="font-medium text-accent hover:underline">
                        {l.label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className={heading}>Ways to work together</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {hire.ways.map((w) => (
              <li key={w.title} className="rounded-xl bg-surface-2 p-5">
                <h3 className="font-semibold">{w.title}</h3>
                <p className="mt-1 leading-relaxed text-muted">{w.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className={heading}>How I work</h2>
          <dl className="mt-4 max-w-[62ch] space-y-4">
            {process.map((p) => (
              <div key={p.title}>
                <dt className="font-semibold">{p.title}</dt>
                <dd className="mt-0.5 leading-relaxed text-muted">{p.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <figure className="mt-12 max-w-[62ch] border-l-2 border-accent pl-5">
          <blockquote className="text-lg leading-relaxed">“{recommendation.quote}”</blockquote>
          <figcaption className="mt-3 text-sm text-muted">
            <span className="font-medium text-text">{recommendation.name}</span>, {recommendation.role}.{" "}
            {recommendation.relation}.
          </figcaption>
        </figure>

        <section id="book" className="mt-12">
          <h2 className={heading}>Book a call</h2>
          <p className="mt-3 max-w-[62ch] text-muted">
            A 15-minute intro for a role or a quick question, or 30 minutes for a project. Times show in your time
            zone, and the invite has the video link.
          </p>
          <div className="mt-4">
            <BookingPanel />
          </div>
        </section>

        <section id="faq" className="mt-12">
          <h2 className={heading}>Questions</h2>
          <div className="mt-4 max-w-[62ch] space-y-5">
            {hire.faq.map((f) => (
              <div key={f.question}>
                <h3 className="font-semibold">{f.question}</h3>
                <p className="mt-1 leading-relaxed text-muted">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-xl bg-accent-soft p-6 md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Tell me about the role or project</h2>
          <p className="mt-2 text-muted">A few lines are enough. I reply within 24 hours.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent("React Native work")}`}
              className="whitespace-nowrap rounded-full bg-accent-fill px-6 py-3 text-[15px] font-medium text-white transition-transform active:scale-[0.98]"
            >
              {site.email}
            </a>
            <Link
              href="/#work"
              className="whitespace-nowrap rounded-full border border-hairline bg-surface px-6 py-3 text-[15px] font-medium text-accent transition-colors hover:bg-surface-2"
            >
              See the work
            </Link>
          </div>
        </section>
      </article>
    </PageShell>
  );
}
