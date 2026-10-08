import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Women Who Grow, Families That Rise | Mini Greens Company",
  description:
    "Start growing microgreens at home with our starter kit and training, sell them with Mini Greens Company, and build an income of your own, with no platform fee.",
  alternates: { canonical: "/women-who-grow" },
};

const PILLARS = [
  {
    title: "An opportunity",
    body: "Opportunity should not depend on where you live, your age, or the circumstances of your life. Microgreens grow at home, in a small space, with a simple setup.",
  },
  {
    title: "A platform",
    body: "We handle the selling, the orders, and the delivery. You focus on growing. Partner women keep their earnings, because there is no platform fee.",
  },
  {
    title: "A business of your own",
    body: "Start small, grow at your own pace, and build something that is yours. Whether it is a side income or a full business, the choice is yours.",
  },
];

const STEPS = [
  { n: "1", title: "Get your starter kit", body: "A microgreens starter kit with seeds and everything you need to begin at home." },
  { n: "2", title: "Learn with training", body: "Hands-on training on how to grow microgreens well, and how to sell them with confidence." },
  { n: "3", title: "Grow and sell", body: "Grow in your own space, and sell with Mini Greens. We handle the orders and delivery." },
  { n: "4", title: "Earn for yourself", body: "Keep what you earn. You build an income and a business that belongs to you." },
];

const IMPACT = [
  "Better education for children, when a woman earns.",
  "Greater financial security for the whole family.",
  "More confidence in her own abilities.",
  "A stronger future for the next generation.",
];

export default function WomenWhoGrowPage() {
  return (
    <PageShell
      eyebrow="Women entrepreneurship"
      title="Women Who Grow, Families That Rise"
      intro="In many homes, a woman is the one who holds everything together. We believe she should also have the chance to build something for herself."
      badge={
        <span className="inline-flex items-center gap-2 rounded-full bg-(--color-leaf) px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(31,58,36,0.25)]">
          <span className="font-serif-display text-base">Sumam</span>
          <span className="text-white/80">· MGC&apos;s women entrepreneurship program</span>
        </span>
      }
    >
      <div className="space-y-16 pb-16">
        {/* Hero image */}
        <figure>
          <div className="overflow-hidden rounded-3xl shadow-[0_12px_40px_rgba(31,58,36,0.18)]">
            <Image
              src="/images/women-who-grow/hero.png"
              alt="A woman tending trays of fresh microgreens on a wooden shelf at home"
              width={2000}
              height={1129}
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="h-auto w-full object-cover"
            />
          </div>
          <figcaption className="mt-2 text-xs text-(--color-forest)/50">
            Illustrative image, not a photo of a specific partner.
          </figcaption>
        </figure>

        {/* Intro */}
        <section className="mx-auto max-w-3xl text-center">
          <p className="font-serif-display text-2xl leading-snug text-(--color-forest) md:text-3xl">
            A woman does not simply become part of a family. She is often the pillar that holds it together, and
            she still carries dreams of her own.
          </p>
          <p className="mt-6 text-[15px] leading-relaxed text-(--color-forest)/70">
            At Mini Greens Company, we are strongly promoting women entrepreneurship through agriculture. We want
            to give women an opportunity, a platform, and the space to build something of their own.
          </p>
        </section>

        {/* Pillars */}
        <section>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
            What we believe
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-black/[0.07] bg-white p-7 shadow-[0_2px_14px_rgba(31,58,36,0.06)]"
              >
                <h3 className="font-serif-display text-xl text-(--color-forest)">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-(--color-forest)/70">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Journey */}
        <section className="rounded-3xl bg-(--color-forest) p-8 text-white md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Your path</p>
          <h2 className="font-serif-display mt-3 text-3xl md:text-4xl">From a seed to your own income</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/75">
            You do not need to know farming. We give you the seeds, the training, and a place to sell. You bring
            the care and the commitment.
          </p>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-2xl bg-white/10 p-6">
                <span className="font-serif-display text-3xl text-(--color-leaf-light,#a8d5a2)">{s.n}</span>
                <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Impact */}
        <section className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-serif-display text-3xl text-(--color-forest)">When a woman earns, a family rises</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-(--color-forest)/70">
              It is not just an individual achievement. It can mean:
            </p>
          </div>
          <ul className="space-y-3">
            {IMPACT.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-2xl border border-black/[0.07] bg-white p-5 text-sm leading-relaxed text-(--color-forest)/80"
              >
                <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-(--color-leaf)" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Sumam + CTA */}
        <section className="rounded-3xl bg-(--color-cream) p-8 text-center md:p-14">
          <p className="font-serif-display text-5xl leading-none text-(--color-leaf) md:text-7xl">Sumam</p>
          <h2 className="font-serif-display mx-auto mt-3 max-w-2xl text-3xl text-(--color-forest) md:text-4xl">
            Our women entrepreneurship program
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-(--color-forest)/70">
            Sumam is how we help create new women entrepreneurs, from growing at home to selling with us. Start with
            a partner application and our team will get in touch.
          </p>
          <Link
            href="/partner/apply"
            className="mt-8 inline-flex items-center rounded-full bg-(--color-forest) px-7 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Apply to become a partner
          </Link>
        </section>

        <p className="mx-auto max-w-2xl text-center font-serif-display text-2xl leading-snug text-(--color-forest)">
          Give women an opportunity. Give them a platform. Let them build something of their own.
        </p>
      </div>
    </PageShell>
  );
}
