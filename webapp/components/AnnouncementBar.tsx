import { ArrowsClockwise, Cake, Coffee, Plant } from "@phosphor-icons/react/dist/ssr";
import { BRAND_CLAIM_SHORT } from "@/lib/brand";

export function AnnouncementBar() {
  return (
    <div className="relative z-30 bg-(--color-forest) text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-6 py-2 text-xs font-medium tracking-wide sm:justify-between md:px-10">
        <p className="flex items-center gap-2">
          <Plant size={14} weight="fill" className="text-[#9cc56b]" />
          {BRAND_CLAIM_SHORT}. Farm fresh, delivered across Bengaluru.
        </p>
        <div className="hidden items-center gap-6 sm:flex">
          <p className="flex items-center gap-1.5">
            <Coffee size={14} weight="fill" className="text-(--color-sun)" />
            Naturally caffeine-free microgreen teas
          </p>
          <p className="flex items-center gap-1.5">
            <ArrowsClockwise size={14} weight="bold" className="text-(--color-sun)" />
            Subscriptions: skip or cancel anytime
          </p>
          <p className="flex items-center gap-1.5">
            <Cake size={14} weight="fill" className="text-(--color-sun)" />
            Sending a gift? Birthday orders available at checkout
          </p>
        </div>
      </div>
    </div>
  );
}
