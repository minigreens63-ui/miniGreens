import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeHero } from "@/components/home/HomeHero";
import { Bestsellers, BestsellersSkeleton } from "@/components/home/Bestsellers";
import { FindYourBlend } from "@/components/home/FindYourBlend";
import { FarmStory } from "@/components/home/FarmStory";
import { SignatureProduct } from "@/components/home/SignatureProduct";
import { TrustPromise } from "@/components/home/TrustPromise";
import { JoinSection } from "@/components/home/JoinSection";
import { StickyShopBar } from "@/components/home/StickyShopBar";
import { SubscriptionTeaser } from "@/components/SubscriptionTeaser";
import { SITE_URL } from "@/lib/site";
import { BRAND_CLAIM_SHORT, BRAND_OG_IMAGE } from "@/lib/brand";

export const revalidate = 60;

const TITLE = `Mini Greens Company | ${BRAND_CLAIM_SHORT}: Microgreen Tea Blends`;
const DESCRIPTION =
  `${BRAND_CLAIM_SHORT}. Shop caffeine-free microgreen tea blends, brewed fresh and delivered to your door. Pesticide-free, plastic-free, grown in Bangalore.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: BRAND_OG_IMAGE, width: 1200, height: 630, alt: BRAND_CLAIM_SHORT }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [BRAND_OG_IMAGE],
  },
};

export default function Home() {
  return (
    <div className="bg-(--color-cream)">
      <HomeHero />
      <Suspense fallback={<BestsellersSkeleton />}>
        <Bestsellers />
      </Suspense>
      <Suspense fallback={<div className="min-h-[560px] bg-white" />}>
        <FindYourBlend />
      </Suspense>
      <SubscriptionTeaser />
      <Suspense fallback={<div className="min-h-[520px] bg-(--color-cream)" />}>
        <SignatureProduct />
      </Suspense>
      <FarmStory />
      <TrustPromise />
      <JoinSection />
      <StickyShopBar />
    </div>
  );
}
