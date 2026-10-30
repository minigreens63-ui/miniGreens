import Link from "next/link";
import { ArrowRight, ArrowsClockwise, CalendarBlank, CalendarCheck, Check, Leaf, Sliders } from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

const HIGHLIGHTS = [
  { Icon: CalendarBlank, label: "Skip any week" },
  { Icon: Leaf, label: "Supports our partner growers" },
  { Icon: ArrowsClockwise, label: "Cancel anytime" },
];

type Plan = {
  name: string;
  Icon: PhosphorIcon;
  pitch: string;
  bestFor: string[];
  cta: string;
  href: string;
};

// Plan structure from the MGC 2.0 subscription brief: Weekly and Monthly are "choose your
// products, receive them on this cadence", i.e. the custom builder with the frequency
// preset. Price is the sum of the chosen products, so none is shown here.
const PLANS: Plan[] = [
  {
    name: "Weekly Plan",
    Icon: CalendarCheck,
    pitch: "Fresh greens as part of your weekly routine, delivered every week.",
    bestFor: ["Families", "Health-conscious homes", "Regular tea drinkers"],
    cta: "Start Weekly",
    href: "/subscriptions/custom?frequency=weekly",
  },
  {
    name: "Monthly Plan",
    Icon: CalendarBlank,
    pitch: "Plan ahead once and receive your products through the month.",
    bestFor: ["Individuals", "Families", "Offices"],
    cta: "Start Monthly",
    href: "/subscriptions/custom?frequency=monthly",
  },
  {
    name: "Build Your Own",
    Icon: Sliders,
    pitch: "No fixed plan. Pick your products, quantity and schedule.",
    bestFor: ["Microgreen tea bags", "Mix and match", "Any frequency"],
    cta: "Build My Plan",
    href: "/subscriptions/custom",
  },
];

const STEPS = ["Choose your products", "Pick weekly or monthly", "We deliver on schedule"];

export function SubscriptionTeaser() {
  return (
    <section id="subscriptions" className="relative overflow-hidden bg-[#eef1e4]">
      <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
            Subscriptions
          </p>
          <h2 className="font-serif-display mt-3 text-4xl leading-[1.08] text-(--color-forest) sm:text-5xl">
            Fresh. Healthy.
            <br />
            Delivered Regularly.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-(--color-forest)/75">
            Choose your greens. Choose your schedule. Make it a habit. No need to place the same
            order again and again.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {HIGHLIGHTS.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-xs font-medium text-(--color-forest)">
                <Icon size={20} weight="light" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3">
              <span className="font-display flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-forest) text-sm font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-(--color-forest)">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PLANS.map(({ name, Icon, pitch, bestFor, cta, href }, i) => {
            const primary = i === 0;
            return (
              <div
                key={name}
                className={`flex flex-col rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(31,58,36,0.08)] ${
                  primary ? "ring-1 ring-(--color-forest)/15" : ""
                }`}
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-(--color-cream) text-(--color-forest)">
                  <Icon size={22} weight="light" />
                </span>
                <h3 className="font-serif-display mt-4 text-2xl text-(--color-forest)">{name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-(--color-forest)/75">{pitch}</p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-(--color-forest)/55">
                  {i === 2 ? "Can include" : "Best for"}
                </p>
                <ul className="mt-2 flex-1 space-y-2 text-sm text-(--color-forest)/80">
                  {bestFor.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check size={13} weight="bold" className="text-(--color-leaf)" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className={`mt-6 flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    primary
                      ? "bg-(--color-sun) text-(--color-forest) hover:bg-(--color-sun-dark)"
                      : "border border-(--color-forest)/30 text-(--color-forest) hover:border-(--color-forest)"
                  }`}
                >
                  {cta}
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-sm text-(--color-forest)/70">
          Prefer a ready-made box?{" "}
          <Link href="/subscriptions#plans" className="font-semibold text-(--color-forest) underline underline-offset-4 hover:text-(--color-leaf)">
            See our curated boxes
          </Link>
        </p>
      </div>
    </section>
  );
}
