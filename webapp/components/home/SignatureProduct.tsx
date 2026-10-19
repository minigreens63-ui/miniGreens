import Image from "next/image";
import Link from "next/link";
import { Coffee, Heart, Leaf, Repeat, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { AddToCartButton } from "@/components/home/AddToCartButton";
import { ScriptNote } from "@/components/home/ScriptNote";

const SLUG = "green-detox-bag";

const PERKS = [
  { Icon: Leaf, label: "Supports natural detox" },
  { Icon: Coffee, label: "Caffeine-free" },
  { Icon: Sparkle, label: "Rich in antioxidants" },
  { Icon: Heart, label: "Tastes amazing" },
];

export async function SignatureProduct() {
  const supabase = createSupabasePublicClient();
  const { data: product } = await supabase
    .from("products")
    .select("price, is_available")
    .eq("slug", SLUG)
    .maybeSingle();

  const price = product ? Number(product.price) : null;
  const available = product?.is_available !== false;

  return (
    <section className="relative overflow-hidden bg-(--color-cream)">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_72%_55%,#ffffff_0%,#fbfaf3_45%,transparent_75%)]"
      />
      <div className="absolute bottom-0 right-[2%] top-10 hidden w-[52%] sm:block">
        <Image
          src="/images/tea/blends/green-detox.webp"
          alt="Green Detox Microgreen Tea tube"
          fill
          sizes="52vw"
          className="object-contain object-bottom drop-shadow-[0_24px_30px_rgba(31,58,36,0.18)]"
        />
      </div>

      <div className="absolute left-[44%] top-[20%] z-10 hidden size-32 -rotate-6 items-center justify-center rounded-full border-[3px] border-(--color-forest)/20 bg-(--color-forest) p-3 text-center text-xs font-semibold uppercase leading-snug tracking-wide text-white shadow-lg lg:flex">
        <span className="flex size-full items-center justify-center rounded-full border border-white/30 px-2">
          A cleaner tomorrow in every sip
        </span>
      </div>

      <ScriptNote
        lines={["Plants", "not pills"]}
        arrow="down"
        className="absolute right-[5%] top-10 hidden lg:block"
      />

      <div className="relative mx-auto flex min-h-0 max-w-7xl flex-col justify-center px-6 py-12 sm:min-h-[520px] sm:py-16 md:px-10">
        <div className="relative mx-auto mb-6 aspect-square w-full max-w-[220px] sm:hidden">
          <Image
            src="/images/tea/blends/green-detox.webp"
            alt="Green Detox Microgreen Tea tube"
            fill
            sizes="220px"
            className="object-contain drop-shadow-[0_16px_20px_rgba(31,58,36,0.18)]"
          />
        </div>
        <div className="max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
            Our signature product
          </p>
          <h2 className="font-serif-display mt-3 text-4xl leading-[1.08] text-(--color-forest) sm:text-[44px]">
            Green Detox
            <br />
            Microgreen Tea
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-(--color-forest)/75">
            Broccoli and arugula microgreens with refreshing mint and coriander. Fresh, with a
            gentle spicy kick, for a daily wellness ritual that actually tastes good.
          </p>
          <p className="mt-2 text-xs font-medium text-(--color-forest)/60">15 sachets · Naturally caffeine-free</p>
          {price != null && (
            <p className="font-display mt-5 text-2xl font-semibold text-(--color-forest)">₹{price}</p>
          )}

          <div className="mt-5">
            {available ? (
              <>
                <AddToCartButton slug={SLUG} />
                <Link
                  href={`/subscriptions/custom?frequency=weekly&product=${SLUG}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-(--color-forest) underline-offset-4 hover:text-(--color-leaf) hover:underline"
                >
                  <Repeat size={14} weight="bold" />
                  Or get it delivered every week
                </Link>
              </>
            ) : (
              <p className="text-sm font-semibold text-(--color-forest)/60">Currently out of stock</p>
            )}
          </div>

          <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3">
            {PERKS.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-xs text-(--color-forest)/80">
                <Icon size={18} weight="light" className="shrink-0 text-(--color-forest)" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
