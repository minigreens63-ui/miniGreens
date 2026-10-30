import Image from "next/image";
import Link from "next/link";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { ArrowRight, Fire, Leaf, SunHorizon, Wind } from "@phosphor-icons/react/dist/ssr";
import { getHomeProducts } from "@/lib/homeProducts";
import { BLEND_MOMENTS, BLEND_PROFILE, type BlendMoment } from "@/lib/blends";
import { displayName } from "@/lib/productCopy";
import { productImageFit } from "@/lib/productImages";
import { QuickAdd } from "@/components/home/QuickAdd";

const MOMENT_ICON: Record<BlendMoment["id"], PhosphorIcon> = {
  morning: SunHorizon,
  detox: Leaf,
  warm: Fire,
  cool: Wind,
};

export async function FindYourBlend() {
  const products = await getHomeProducts();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const moments = BLEND_MOMENTS.map((m) => ({
    ...m,
    blends: m.slugs.map((s) => bySlug.get(s)).filter((p) => p != null),
  })).filter((m) => m.blends.length > 0);

  if (moments.length === 0) return null;

  const blendCount = moments.reduce((n, m) => n + m.blends.length, 0);
  const fromPrice = Math.min(...moments.flatMap((m) => m.blends.map((b) => b.price)));

  return (
    <section className="bg-(--color-cream)">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
              {blendCount} microgreen tea blends · from ₹{fromPrice}
            </p>
            <h2 className="font-serif-display mt-2 text-3xl text-(--color-forest) sm:text-4xl">Find Your Blend</h2>
            <p className="mt-2 max-w-md text-sm text-(--color-forest)/70">
              Pick by the moment you drink it. Every blend is caffeine-free, 10 sachets a box.
            </p>
          </div>
          <Link
            href="/shop?category=tea-blends"
            className="flex items-center gap-1.5 text-[13px] font-semibold text-(--color-forest) hover:text-(--color-leaf)"
          >
            All Tea Bags <ArrowRight size={13} weight="bold" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {moments.map((m) => {
            const Icon = MOMENT_ICON[m.id];
            return (
              <div key={m.id} className="flex flex-col rounded-2xl bg-white p-5 shadow-[0_2px_14px_rgba(31,58,36,0.06)]">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-(--color-cream) text-(--color-forest)">
                    <Icon size={20} weight="light" />
                  </span>
                  <div>
                    <h3 className="font-serif-display text-xl leading-tight text-(--color-forest)">{m.title}</h3>
                    <p className="text-xs text-(--color-forest)/60">{m.blurb}</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {m.blends.map((b) => {
                    const name = displayName(b.name);
                    const profile = BLEND_PROFILE[b.slug];
                    return (
                      <li key={b.slug} className="flex items-center gap-3 rounded-xl bg-(--color-cream) p-2.5 pr-3">
                        <Link
                          href={`/shop/${b.slug}`}
                          className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-white"
                        >
                          {b.image && (
                            <Image src={b.image} alt={name} fill sizes="64px" className={productImageFit(b.image)} />
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/shop/${b.slug}`}
                            className="block truncate text-sm font-semibold text-(--color-forest) hover:text-(--color-leaf)"
                          >
                            {name}
                          </Link>
                          {profile && <p className="truncate text-xs text-(--color-forest)/60">{profile.notes}</p>}
                          <p className="mt-0.5 text-[13px] font-semibold text-(--color-forest)">₹{b.price}</p>
                        </div>
                        <QuickAdd slug={b.slug} name={name} variant="icon" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
