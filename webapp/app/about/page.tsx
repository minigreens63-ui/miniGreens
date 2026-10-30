import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { ArrowDown, Handshake, Plant, RocketLaunch, Truck } from "@phosphor-icons/react/dist/ssr";
import { StoryPath } from "@/components/story/StoryPath";
import { TeamSection } from "@/components/story/TeamSection";
import { FOREST, Note, PAPER, TornEdge, TornPhoto as StoryPhoto, condensed, script, serif } from "@/components/story/primitives";
import { BRAND_CLAIM } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Our Story: India's First Microgreens Brand | Mini Greens Company",
  alternates: { canonical: "/about" },
  description:
    "A small seed, a big why: how Mini Greens Company grew from one personal search for real, fresh nutrition in Bangalore.",
};

type Step = {
  n: string;
  icon: PhosphorIcon;
  title: string;
  kicker: string;
  body: string;
  image: string;
  alt: string;
  note: string[];
  side: "left" | "right";
  textCol: string;
  seed: number;
  tilt: number;
};

const STEPS: Step[] = [
  {
    n: "01",
    icon: Plant,
    title: "Spot the Gap",
    kicker: "Prep: ongoing frustration",
    body: "Searching for accessible nutrition led to microgreens and a fascination with modern, efficient agriculture. (Turns out “grow your own food” scales better than “meal-prep on Sunday” ever did.)",
    image: "/images/story/step-01-desk.webp",
    alt: "A mug reading Good Food Brighter Days on a work desk beside a laptop and a tray of microgreens",
    note: ["Busy days", "Left little room", "for real nutrition."],
    side: "left",
    textCol: "lg:col-start-6",
    seed: 11,
    tilt: -1.5,
  },
  {
    n: "02",
    icon: Handshake,
    title: "Add Co-Founder",
    kicker: "Cook: until vision forms",
    body: "Anand Lal S S, Founder and CEO, partnered with co-founder Keerthi Krishnakumar Nair to found Mini Greens Company: fresh microgreens for modern life.",
    image: "/images/story/step-02-cofounders.webp",
    alt: "The two Mini Greens Company co-founders standing side by side in a bright room with plants, one in a white and gold saree, the other in a black Mini Greens hoodie",
    note: ["Two minds.", "One greener", "tomorrow."],
    side: "right",
    textCol: "lg:col-start-4",
    seed: 23,
    tilt: 1.5,
  },
  {
    n: "03",
    icon: Truck,
    title: "Simmer & Serve",
    kicker: "Cook: low and steady, citywide",
    body: "Began supplying microgreens across Bangalore, partnering with platforms like Organic Mandya to reach customers.",
    image: "/images/story/step-03-box.webp",
    alt: "A kraft Mini Greens box packed with trays of fresh pea shoots",
    note: ["From our farm", "to your table."],
    side: "left",
    textCol: "lg:col-start-6",
    seed: 37,
    tilt: -1,
  },
  {
    n: "04",
    icon: RocketLaunch,
    title: "Plate the Vision",
    kicker: "Serve: to the whole city, and beyond",
    body: "Building an agricultural innovation brand, expanding into juices, salads, pet products, and hydroponics.",
    image: "/images/story/step-04-bowl.webp",
    alt: "A dark bowl piled with purple and green microgreens",
    note: ["More greens.", "Brighter tomorrows."],
    side: "right",
    textCol: "lg:col-start-3",
    seed: 51,
    tilt: 2,
  },
];

function MistPatch({ src, position, className }: { src: string; position: string; className: string }) {
  const fade = "radial-gradient(ellipse at center, black 28%, transparent 70%)";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute hidden lg:block ${className}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: "1500px auto",
        backgroundPosition: position,
        opacity: 0.32,
        filter: "saturate(0.5) contrast(0.85) brightness(1.1)",
        maskImage: fade,
        WebkitMaskImage: fade,
      }}
    />
  );
}

function TornPhoto({ step }: { step: Step }) {
  return <StoryPhoto src={step.image} alt={step.alt} seed={step.seed} tilt={step.tilt} />;
}

function StepRow({ step }: { step: Step }) {
  const Icon = step.icon;
  const imageLeft = step.side === "left";
  const noteClass = imageLeft
    ? "-bottom-24 -left-10 -rotate-[11deg]"
    : "-right-24 -top-20 -rotate-[10deg]";

  return (
    <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-x-6">
      <div
        className={`relative lg:row-start-1 ${
          imageLeft ? "lg:col-span-5 lg:col-start-1" : "lg:col-span-4 lg:col-start-9"
        }`}
      >
        <TornPhoto step={step} />
        <Note lines={step.note} desktopOnly className={`text-[#29321f] ${noteClass}`} />
      </div>

      <div className={`lg:row-start-1 ${imageLeft ? "lg:col-span-6" : "lg:col-span-5"} ${step.textCol}`}>
        <div className="flex gap-5">
          <span
            data-story-node
            className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full text-white shadow-md"
            style={{ backgroundColor: FOREST, boxShadow: `0 0 0 8px ${PAPER}` }}
          >
            <Icon size={24} weight="fill" />
          </span>
          <div className="pt-1">
            <p className={`${serif.className} text-4xl font-semibold leading-none text-[#3f6b36]`} style={condensed}>
              {step.n}
            </p>
            <h2
              className={`${serif.className} mt-3 text-[2rem] font-semibold leading-tight`}
              style={{ ...condensed, color: FOREST }}
            >
              {step.title}
            </h2>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2b3327]">{step.kicker}</p>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#3a4135]">{step.body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stack({ children }: { children: ReactNode }) {
  return <div className="space-y-24 lg:space-y-16">{children}</div>;
}

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: PAPER }}>
      {/* Hero */}
      <section className="relative isolate min-h-[640px] overflow-hidden lg:min-h-[760px]">
        <Image
          src="/images/story/story-hero.webp"
          alt="A young man with a backpack sitting on a rocky outcrop, looking over misty hills toward a city at sunrise"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[72%_center] lg:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f6f1e3]/90 via-[#f6f1e3]/55 to-transparent lg:hidden" />
        <div
          className="absolute inset-0 -z-10 hidden lg:block"
          style={{ background: "radial-gradient(ellipse 34% 50% at 31% 44%, rgba(249,244,231,0.6), transparent 72%)" }}
        />

        <Note
          lines={["It started", "with a", "personal", "search..."]}
          className="left-[2.2vw] top-[30%] -rotate-[14deg] text-[1.9rem] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] lg:text-[2.2rem]"
        />
        <svg
          aria-hidden
          viewBox="0 0 120 20"
          className="pointer-events-none absolute left-[3vw] top-[57%] hidden w-28 -rotate-[14deg] md:block"
        >
          <path d="M2 14 C 40 6, 80 4, 118 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <Note
          lines={["Better food", "A brighter you"]}
          className="right-[5vw] top-[24%] -rotate-[13deg] text-[2rem] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] lg:text-[2.6rem]"
        />

        <div className="relative px-6 pb-40 pt-16 md:px-10 lg:pl-[17vw] lg:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#233021]">Chapter 2</p>
          <h1
            className={`${serif.className} mt-2 text-6xl font-bold leading-[0.95] lg:text-[5.75rem]`}
            style={{ ...condensed, color: FOREST }}
          >
            Our Story
          </h1>
          <p className="mt-4 text-xl text-[#1f2a1c] lg:text-2xl">A small seed. A big why.</p>
          <p className="mt-5 max-w-[27rem] text-[15px] leading-relaxed text-[#2f352c]">
            Mini Greens was born from a simple personal struggle: the search for real,
            fresh nutrition in a busy city life. What started as a curiosity about
            microgreens grew into a mission to make fresh, healthy food a part of everyday
            living in Bangalore and beyond. Today, Mini Greens is proud to be {BRAND_CLAIM}.
          </p>
          <a href="#journey" className="group mt-8 inline-flex items-center gap-4">
            <span
              className="flex size-12 items-center justify-center rounded-full text-white transition-transform group-hover:translate-y-0.5"
              style={{ backgroundColor: FOREST }}
            >
              <ArrowDown size={20} weight="bold" />
            </span>
            <span className="text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] text-[#1f2a1c]">
              Our journey
              <br />
              in four steps
            </span>
          </a>
        </div>

        <TornEdge seed={7} className="-bottom-px" />
      </section>

      {/* Journey */}
      <section
        id="journey"
        className="relative scroll-mt-24 overflow-hidden"
        style={{ backgroundColor: PAPER }}
      >
        <MistPatch src="/images/story/story-hero.webp" position="32% 72%" className="-right-24 top-[4%] h-[340px] w-[560px]" />
        <MistPatch src="/images/story/story-footer.webp" position="100% 46%" className="-left-28 top-[30%] h-[320px] w-[520px]" />
        <MistPatch src="/images/story/story-hero.webp" position="34% 80%" className="-right-28 top-[56%] h-[320px] w-[520px]" />
        <MistPatch src="/images/story/story-footer.webp" position="50% 52%" className="-left-24 bottom-[2%] h-[320px] w-[600px]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-32 pt-10 md:px-10 lg:pt-16">
          <StoryPath />
          <Stack>
            {STEPS.map((step) => (
              <StepRow key={step.n} step={step} />
            ))}
          </Stack>
        </div>
      </section>

      <TeamSection />

      {/* Closing band */}
      <section className="relative isolate h-[420px] overflow-hidden lg:h-[560px]">
        <Image
          src="/images/story/story-footer.webp"
          alt="Forested hills rolling toward the Bangalore skyline in morning haze"
          fill
          sizes="100vw"
          className="-z-10 object-cover object-bottom"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <TornEdge seed={21} flip className="-top-px" />

        <p
          className={`${script.className} absolute bottom-36 left-6 -rotate-[12deg] text-[1.7rem] leading-[1.15] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] md:bottom-14 md:left-12 md:text-[1.9rem] lg:text-[2.4rem]`}
        >
          A healthier
          <br />
          Bangalore
          <br />
          A greener future
        </p>
        <ul className="absolute bottom-8 right-6 space-y-1.5 md:bottom-14 text-right text-xs font-semibold uppercase tracking-[0.28em] text-white md:right-12 lg:text-sm">
          <li>Fresh food</li>
          <li>Healthy people</li>
          <li>Thriving cities</li>
        </ul>
      </section>
    </div>
  );
}
