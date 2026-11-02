import Link from "next/link";
import { ArrowRight, Cake, Gift, MapPin } from "@phosphor-icons/react/dist/ssr";

// Surfaces the gift-at-checkout option (see /checkout's "Send this as a gift"
// toggle) so customers know it exists before they're already at checkout.

export function GiftOrdersBanner() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <div className="flex flex-col items-start gap-6 rounded-3xl border border-black/[0.07] bg-(--color-cream) p-7 shadow-[0_2px_14px_rgba(31,58,36,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--color-forest) text-white">
              <Gift size={22} weight="light" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--color-leaf)">
                A nice little service
              </p>
              <h2 className="font-serif-display mt-1 text-2xl text-(--color-forest) sm:text-3xl">
                Send It As A Gift
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-(--color-forest)/75">
                Mark any order as a gift at checkout, add the occasion, and we&apos;ll deliver
                straight to them, no address juggling on your end.
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <li className="flex items-center gap-1.5 text-xs font-medium text-(--color-forest)/70">
                  <Cake size={16} weight="light" />
                  Especially loved for birthdays
                </li>
                <li className="flex items-center gap-1.5 text-xs font-medium text-(--color-forest)/70">
                  <MapPin size={16} weight="light" />
                  Delivered to them, not you
                </li>
              </ul>
            </div>
          </div>

          <Link
            href="/shop"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-(--color-forest) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--color-leaf)"
          >
            Shop a Gift
            <ArrowRight size={15} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  );
}
