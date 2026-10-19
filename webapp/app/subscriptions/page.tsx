import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  ArrowDown,
  ArrowRight,
  Basket,
  CalendarCheck,
  Check,
  PencilSimple,
  SunHorizon,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import { subscriptionPlans } from "@/lib/subscriptions";
import { FOREST, Note, PAPER, TornEdge, TornPhoto, condensed, roughMaskStyle, script, serif } from "@/components/story/primitives";
import { SubscribeButton } from "@/components/story/SubscribeButton";

export const metadata: Metadata = {
  title: "Weekly Microgreens Subscription Boxes | Mini Greens Company",
  alternates: { canonical: "/subscriptions" },
  description: "Weekly boxes of fresh microgreens and juices, harvested the morning they reach you.",
};

type HowStep = { n: string; icon: PhosphorIcon; title: string; kicker: string; body: string };

const HOW: HowStep[] = [
  {
    n: "01",
    icon: Basket,
    title: "Pick a Box",
    kicker: "Choose what fits your week",
    body: "Juices for busy mornings, microgreens for the kitchen, or a box for the whole team.",
  },
  {
    n: "02",
    icon: SunHorizon,
    title: "Cut at Dawn",
    kicker: "Harvested the morning it ships",
    body: "Nothing sits in storage. We cut, press and pack your order the same morning.",
  },
  {
    n: "03",
    icon: Truck,
    title: "At Your Door",
    kicker: "Free delivery, every week",
    body: "Delivered across Bangalore, still crisp, still alive, still tasting of the farm.",
  },
  {
    n: "04",
    icon: CalendarCheck,
    title: "Stay Flexible",
    kicker: "Skip, pause or cancel",
    body: "Travelling or overstocked? Skip a week in a tap. No lock-in, no hidden fees.",
  },
];

// Alternating tilt + mask seed so each plan card reads as its own torn sheet of paper.
const CARD_TILTS = [-0.8, 0.6, -0.4, 0.7, -0.6, 0.5];

export default function SubscriptionsPage() {
  const firstPopular = subscriptionPlans.find((p) => p.isPopular)?.id;

  return (
    <div style={{ backgroundColor: PAPER }}>
      {/* Hero */}
      <section className="relative isolate min-h-[600px] overflow-hidden lg:min-h-[700px]">
        <Image
          src="/images/story/subs-hero.webp"
          alt="A kraft box of fresh microgreen trays on a stone wall above misty green hills at sunrise"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[70%_center] lg:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f6f1e3]/90 via-[#f6f1e3]/60 to-transparent lg:hidden" />
        <div
          className="absolute inset-0 -z-10 hidden lg:block"
          style={{ background: "radial-gradient(ellipse 36% 52% at 26% 42%, rgba(249,244,231,0.7), transparent 72%)" }}
        />

        <Note
          lines={["Fresh greens,", "every single", "week."]}
          className="right-[7vw] top-[16%] -rotate-[12deg] text-[2rem] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] lg:text-[2.4rem]"
        />

        <div className="relative px-6 pb-40 pt-16 md:px-10 lg:pl-[12vw] lg:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#233021]">Chapter 3</p>
          <h1
            className={`${serif.className} mt-2 text-6xl font-bold leading-[0.95] lg:text-[5.75rem]`}
            style={{ ...condensed, color: FOREST }}
          >
            Good Greens,
            <br />
            On Repeat.
          </h1>
          <p className="mt-4 text-xl text-[#1f2a1c] lg:text-2xl">Harvested at dawn. At your door by breakfast.</p>
          <p className="mt-5 max-w-[27rem] text-[15px] leading-relaxed text-[#2f352c]">
            Choose a box that fits your kitchen and we&apos;ll grow, cut and deliver it every week.
            Skip a week whenever you like, and cancel any time. No lock-in, no hidden fees.
          </p>
          <a href="#how" className="group mt-8 inline-flex items-center gap-4">
            <span
              className="flex size-12 items-center justify-center rounded-full text-white transition-transform group-hover:translate-y-0.5"
              style={{ backgroundColor: FOREST }}
            >
              <ArrowDown size={20} weight="bold" />
            </span>
            <span className="text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] text-[#1f2a1c]">
              Find your box
              <br />
              in four steps
            </span>
          </a>
        </div>

        <TornEdge seed={13} className="-bottom-px" />
      </section>

      {/* How it works */}
      <section id="how" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 pb-8 pt-10 md:px-10 lg:pt-14">
        <div className="relative">
          {/* Dashed trail joining the four nodes (desktop). */}
          <svg
            aria-hidden
            viewBox="0 0 1000 60"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-[4%] top-0 hidden h-14 w-[92%] lg:block"
          >
            <path
              d="M0,28 C120,-6 220,62 333,28 C446,-6 553,62 666,28 C780,-6 880,62 1000,28"
              fill="none"
              stroke="#2c4a26"
              strokeOpacity="0.45"
              strokeWidth="1.4"
              strokeDasharray="5 7"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <ol className="relative grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {HOW.map(({ n, icon: Icon, title, kicker, body }) => (
              <li key={n}>
                <span
                  className="relative z-10 flex size-14 items-center justify-center rounded-full text-white shadow-md"
                  style={{ backgroundColor: FOREST, boxShadow: `0 0 0 8px ${PAPER}` }}
                >
                  <Icon size={24} weight="fill" />
                </span>
                <p className={`${serif.className} mt-6 text-4xl font-semibold leading-none text-[#3f6b36]`} style={condensed}>
                  {n}
                </p>
                <h2 className={`${serif.className} mt-3 text-[1.75rem] font-semibold leading-tight`} style={{ ...condensed, color: FOREST }}>
                  {title}
                </h2>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2b3327]">{kicker}</p>
                <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-[#3a4135]">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 pb-24 pt-20 md:px-10">
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#233021]">The boxes</p>
          <h2
            className={`${serif.className} mt-2 text-5xl font-bold leading-[0.95] lg:text-6xl`}
            style={{ ...condensed, color: FOREST }}
          >
            Choose Your Box
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#2f352c]">
            Every plan is delivered weekly and priced per week, with free delivery included.
          </p>
          <Note
            lines={["Every box", "cut the morning", "it ships."]}
            desktopOnly
            className="right-4 top-0 -rotate-[9deg] text-[#29321f]"
          />
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptionPlans.map((plan, i) => {
            const dark = plan.isPopular;
            return (
              <div
                key={plan.id}
                className="relative drop-shadow-[0_12px_18px_rgba(34,44,24,0.16)]"
                style={{ transform: `rotate(${CARD_TILTS[i % CARD_TILTS.length]}deg)` }}
              >
                {plan.id === firstPopular && (
                  <Note
                    lines={["Our", "favourite"]}
                    desktopOnly
                    className="-right-10 -top-20 z-10 rotate-[8deg] text-[#29321f]"
                  />
                )}
                <div
                  className={`flex h-full flex-col p-8 ${dark ? "text-white" : ""}`}
                  style={{ ...roughMaskStyle(71 + i * 13), backgroundColor: dark ? FOREST : "#faf8f0" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        dark ? "text-[#c9dcb3]" : "text-[#3f6b36]"
                      }`}
                    >
                      {plan.deliveryFrequency}
                    </p>
                    {dark && (
                      <span className="rounded-full bg-[#f1eee4] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1d3a1b]">
                        Most popular
                      </span>
                    )}
                  </div>
                  <h3
                    className={`${serif.className} mt-3 text-[2rem] font-semibold leading-tight`}
                    style={{ ...condensed, color: dark ? "#ffffff" : FOREST }}
                  >
                    {plan.name}
                  </h3>
                  <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-white/75" : "text-[#3a4135]"}`}>
                    {plan.description}
                  </p>

                  <p
                    className={`${serif.className} mt-6 text-5xl font-semibold leading-none`}
                    style={{ ...condensed, color: dark ? "#ffffff" : FOREST }}
                  >
                    ₹{plan.price}
                    <span className={`font-sans text-sm font-normal ${dark ? "text-white/60" : "text-[#3a4135]/70"}`}>
                      {" "}
                      / {plan.unit}
                    </span>
                  </p>

                  <ul
                    className={`mt-6 flex-1 space-y-2.5 border-t border-dashed pt-6 text-sm ${
                      dark ? "border-white/25 text-white/85" : "border-[#2c4a26]/25 text-[#3a4135]"
                    }`}
                  >
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check size={14} weight="bold" className={`mt-1 shrink-0 ${dark ? "text-[#c9dcb3]" : "text-[#3f6b36]"}`} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <p
                    className={`mt-6 text-[10px] font-semibold uppercase leading-relaxed tracking-[0.18em] ${
                      dark ? "text-white/55" : "text-[#2b3327]/60"
                    }`}
                  >
                    {plan.benefits.join(" · ")}
                  </p>

                  <SubscribeButton planId={plan.id} inverted={dark} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Build your own */}
      <section className="relative mx-auto max-w-6xl px-6 pb-32 md:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-x-6">
          <div className="relative lg:col-span-5">
            <TornPhoto
              src="/images/journal/grow-room.webp"
              alt="Shelves of microgreen trays growing under soft lights"
              seed={97}
              tilt={-1.5}
            />
            <Note
              lines={["Mix, match,", "make it yours."]}
              desktopOnly
              className="-bottom-20 -left-8 -rotate-[11deg] text-[#29321f]"
            />
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <div className="flex gap-5">
              <span
                className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full text-white shadow-md"
                style={{ backgroundColor: FOREST, boxShadow: `0 0 0 8px ${PAPER}` }}
              >
                <PencilSimple size={24} weight="fill" />
              </span>
              <div className="pt-1">
                <p className={`${serif.className} text-4xl font-semibold leading-none text-[#3f6b36]`} style={condensed}>
                  Or…
                </p>
                <h2
                  className={`${serif.className} mt-3 text-[2rem] font-semibold leading-tight`}
                  style={{ ...condensed, color: FOREST }}
                >
                  Build Your Own Box
                </h2>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2b3327]">
                  Your greens, your rhythm
                </p>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#3a4135]">
                  Don&apos;t see a fit? Pick your own products and quantities, and choose weekly or
                  monthly delivery.
                </p>
                <Link
                  href="/subscriptions/custom"
                  className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#2c4a26]"
                  style={{ backgroundColor: FOREST }}
                >
                  Build Your Own
                  <ArrowRight size={15} weight="bold" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing band */}
      <section className="relative isolate h-[420px] overflow-hidden lg:h-[520px]">
        <Image
          src="/images/home/farm-hands.webp"
          alt="Hands holding a freshly harvested clump of pea shoots in the greenhouse at golden hour"
          fill
          sizes="100vw"
          className="-z-10 object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <TornEdge seed={29} flip className="-top-[3px]" />

        <p
          className={`${script.className} absolute bottom-36 left-6 -rotate-[10deg] text-[1.7rem] leading-[1.15] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] md:bottom-14 md:left-12 md:text-[1.9rem] lg:text-[2.4rem]`}
        >
          Harvested at dawn
          <br />
          At your door
          <br />
          by breakfast
        </p>
        <ul className="absolute bottom-8 right-6 space-y-1.5 text-right text-xs font-semibold uppercase tracking-[0.28em] text-white md:bottom-14 md:right-12 lg:text-sm">
          <li>Skip any week</li>
          <li>Free delivery</li>
          <li>Cancel anytime</li>
        </ul>
      </section>
    </div>
  );
}
