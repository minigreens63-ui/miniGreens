import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CaretRight,
  CheckCircle,
  Drop,
  Leaf,
  Plant,
  Recycle,
  Star,
  StarHalf,
} from "@phosphor-icons/react/dist/ssr";
import { FOREST, Note, PAPER, TornEdge, condensed, roughMaskStyle, script, serif } from "@/components/story/primitives";
import { HomeProductCard } from "@/components/home/HomeProductCard";
import { Gallery } from "@/components/pdp/Gallery";
import { AddToCartPanel } from "@/components/pdp/AddToCartPanel";
import { StickyAddToCart } from "@/components/pdp/StickyAddToCart";
import { RatingSummary } from "@/components/pdp/RatingSummary";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { resolveProductGallery, resolveProductImage } from "@/lib/productImages";
import { displayName } from "@/lib/productCopy";
import { SHOW_RATINGS } from "@/lib/reviews";
import { SITE_URL } from "@/lib/site";
import { BRAND_CLAIM_SHORT } from "@/lib/brand";

type NutritionShape = {
  calories?: number;
  protein?: string;
  carbs?: string;
  fat?: string;
  fiber?: string;
  vitamins?: string[];
};

const SELECT =
  "slug, name, description, price, original_price, images, unit, weight, nutrition, benefits, ingredients, storage, consumption_tips, rating, review_count, tags, category_id";

export const revalidate = 60;

export async function generateStaticParams() {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.from("products").select("slug").eq("is_available", true);
  return (data ?? []).map((product) => ({ slug: product.slug }));
}

async function getProduct(slug: string) {
  const supabase = createSupabasePublicClient();
  const { data: product } = await supabase
    .from("products")
    .select(SELECT)
    .eq("slug", slug)
    .eq("is_available", true)
    .maybeSingle();
  if (!product) return null;

  const [{ data: category }, { data: related }] = await Promise.all([
    product.category_id
      ? supabase.from("categories").select("slug, name").eq("id", product.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("products")
      .select("slug, name, description, price, original_price, images, rating, review_count")
      .eq("is_available", true)
      .eq("category_id", product.category_id ?? "")
      .neq("slug", slug)
      .limit(4),
  ]);

  return { product, category, related: related ?? [] };
}

function metaDescription(name: string, description: string | null, unit: string | null): string {
  const base = description?.trim();
  const fallback = `Shop ${name}${unit ? ` (${unit})` : ""} — harvested to order and delivered fresh. Pesticide-free, grown in Bangalore.`;
  const text = base && base.length > 20 ? base : fallback;
  return text.length > 155 ? `${text.slice(0, 152).trimEnd()}…` : text;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: "Product not found | Mini Greens Company" };
  const { product } = data;
  const name = displayName(product.name);
  const description = metaDescription(name, product.description, product.unit);
  const url = `${SITE_URL}/shop/${product.slug}`;
  const image = resolveProductImage(product.slug, product.images);

  return {
    title: `${name} | Mini Greens Company`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: name,
      description,
      url,
      images: image ? [{ url: image, alt: name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex text-[#3f6b36]">
      {Array.from({ length: 5 }).map((_, i) => {
        if (rating >= i + 1) return <Star key={i} size={16} weight="fill" />;
        if (rating >= i + 0.5) return <StarHalf key={i} size={16} weight="fill" />;
        return <Star key={i} size={16} />;
      })}
    </span>
  );
}

function trustRow(categorySlug: string | undefined) {
  return [
    categorySlug === "tea-blends"
      ? { icon: Drop, label: "Caffeine-free" }
      : { icon: Plant, label: "Pesticide-free" },
    { icon: Leaf, label: "Harvested to order" },
    { icon: Recycle, label: "Plastic-free packaging" },
  ];
}

// Handwritten aside beside the product photo, per category.
const PHOTO_NOTES: Record<string, string[]> = {
  "tea-blends": ["Steep. Sip.", "Breathe."],
  microgreens: ["Cut the", "morning it", "ships."],
  juices: ["Pressed", "at dawn."],
};

function brewSteps(categorySlug: string | undefined, tips: string[]): string[] {
  if (tips && tips.length > 0) return tips;
  if (categorySlug === "tea-blends")
    return [
      "Steep one sachet in freshly boiled water for 3–4 minutes.",
      "Add a squeeze of lemon or a little honey to taste.",
      "Enjoy up to 3 cups a day, any time. It's naturally caffeine-free.",
    ];
  if (categorySlug === "juices")
    return [
      "Shake well before opening, then serve chilled.",
      "No added sugar, water or preservatives — best enjoyed the day it arrives.",
      "Refrigerate and finish within 2–3 days of delivery.",
    ];
  return [
    "Rinse gently in cold water and pat dry before use.",
    "Add raw to salads, sandwiches, bowls or juices.",
    "Keep refrigerated and use within 5–7 days for peak freshness.",
  ];
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();
  const { product, category, related } = data;

  const gallery = resolveProductGallery(product.slug, product.images);
  const primaryImage = resolveProductImage(product.slug, product.images);
  const nutrition = (product.nutrition ?? {}) as NutritionShape;
  const hasNutrition =
    (nutrition.calories ?? 0) > 5 ||
    [nutrition.protein, nutrition.carbs, nutrition.fat, nutrition.fiber].some(
      (v) => v && v !== "0g" && v !== "-" && v !== "\u2014",
    );
  const discountPct = product.original_price
    ? Math.round((1 - Number(product.price) / Number(product.original_price)) * 100)
    : null;
  const steps = brewSteps(category?.slug, product.consumption_tips ?? []);
  const trust = trustRow(category?.slug);
  const name = displayName(product.name);

  const photoNote = (category?.slug && PHOTO_NOTES[category.slug]) || ["Fresh from", "our farm."];
  const ritualTitle = category?.slug === "tea-blends" ? "The Daily Ritual" : "How to Enjoy";
  const hasIngredients = !!product.ingredients && product.ingredients.length > 0;
  const hasNutritionCard =
    hasNutrition || (nutrition.vitamins && nutrition.vitamins.length > 0) || !!product.storage || hasIngredients;

  const productUrl = `${SITE_URL}/shop/${product.slug}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: product.description ?? undefined,
    image: primaryImage ? [`${SITE_URL}${primaryImage}`] : undefined,
    sku: product.slug,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: Number(product.price),
      availability: "https://schema.org/InStock",
    },
    ...(product.review_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.review_count,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      ...(category
        ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${SITE_URL}/shop?category=${category.slug}` }]
        : []),
      { "@type": "ListItem", position: category ? 4 : 3, name, item: productUrl },
    ],
  };

  return (
    <div style={{ backgroundColor: PAPER }}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main>
        {/* Product */}
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-10">
          <nav className="mb-10 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2b3327]/60">
            <Link href="/" className="hover:text-[#1d3a1b]">
              Home
            </Link>
            <CaretRight size={10} />
            <Link href="/shop" className="hover:text-[#1d3a1b]">
              Shop
            </Link>
            {category && (
              <>
                <CaretRight size={10} />
                <Link href={`/shop?category=${category.slug}`} className="hover:text-[#1d3a1b]">
                  {category.name}
                </Link>
              </>
            )}
            <CaretRight size={10} />
            <span className="text-[#1d3a1b]">{name}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative">
              <Gallery images={gallery} name={name} />
              <Note
                lines={photoNote}
                desktopOnly
                className="-bottom-16 -left-6 z-10 -rotate-[11deg] text-[#29321f]"
              />
            </div>

            <div className="lg:pt-4">
              {category && (
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3f6b36]">
                  <Leaf size={14} weight="fill" />
                  {category.name}
                </p>
              )}
              <h1
                className={`${serif.className} mt-3 text-5xl font-bold leading-[0.95] lg:text-[4.25rem]`}
                style={{ ...condensed, color: FOREST }}
              >
                {name}
              </h1>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3f6b36]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3f6b36]">
                <Leaf size={12} weight="fill" />
                Grown in India · {BRAND_CLAIM_SHORT}
              </p>

              {SHOW_RATINGS && (
                <div className="mt-4 flex items-center gap-2 text-sm text-[#3a4135]">
                  <Stars rating={Number(product.rating) || 0} />
                  <span>
                    {Number(product.rating).toFixed(1)} · {product.review_count} reviews
                  </span>
                </div>
              )}

              <div className="mt-6 flex items-baseline gap-3">
                <span
                  className={`${serif.className} text-5xl font-semibold leading-none`}
                  style={{ ...condensed, color: FOREST }}
                >
                  ₹{Number(product.price)}
                </span>
                {product.original_price && (
                  <span className="text-lg text-[#3a4135]/60 line-through">
                    ₹{Number(product.original_price)}
                  </span>
                )}
                {discountPct && discountPct > 0 && (
                  <span className="rounded-full bg-[#1d3a1b] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    {discountPct}% off
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2b3327]/60">
                Inclusive of all taxes
                {product.weight ? ` · ${product.weight}` : ""}
                {product.unit ? ` · per ${product.unit}` : ""}
              </p>

              {product.description && (
                <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-[#3a4135]">{product.description}</p>
              )}

              {product.benefits && product.benefits.length > 0 && (
                <ul className="mt-6 space-y-2.5">
                  {product.benefits.map((b: string) => (
                    <li key={b} className="flex items-center gap-3 text-[15px] text-[#2b3327]">
                      <CheckCircle size={20} weight="fill" className="shrink-0 text-[#3f6b36]" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              <AddToCartPanel slug={product.slug} price={Number(product.price)} />

              <ul className="mt-8 grid grid-cols-3 gap-3">
                {trust.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex flex-col items-center gap-2.5 text-center">
                    <span
                      className="flex size-12 items-center justify-center rounded-full text-white shadow-md"
                      style={{ backgroundColor: FOREST }}
                    >
                      <Icon size={20} weight="fill" />
                    </span>
                    <span className="text-[10px] font-semibold uppercase leading-tight tracking-[0.14em] text-[#2b3327]">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Ritual + nutrition + reviews */}
        <section className="mx-auto max-w-7xl px-6 pb-24 md:px-10">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#233021]">In your kitchen</p>
              <h2
                className={`${serif.className} mt-2 text-5xl font-bold leading-[0.95]`}
                style={{ ...condensed, color: FOREST }}
              >
                {ritualTitle}
              </h2>

              <ol className="relative mt-10 space-y-10">
                {/* Dashed trail linking the step nodes. */}
                <span
                  aria-hidden
                  className="absolute bottom-7 left-7 top-7 -translate-x-1/2 border-l-[1.5px] border-dashed border-[#2c4a26]/45"
                />
                {steps.map((step, i) => (
                  <li key={step} className="relative flex gap-5">
                    <span
                      className={`${serif.className} relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white shadow-md`}
                      style={{ ...condensed, backgroundColor: FOREST, boxShadow: `0 0 0 8px ${PAPER}` }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="max-w-md pt-3.5 text-[15px] leading-relaxed text-[#3a4135]">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-12 lg:col-span-5 lg:col-start-8">
              {hasNutritionCard && (
                <div
                  className="drop-shadow-[0_12px_18px_rgba(34,44,24,0.14)]"
                  style={{ transform: "rotate(-0.6deg)" }}
                >
                  <div className="bg-[#faf8f0] p-8" style={roughMaskStyle(389)}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3f6b36]">
                      What&apos;s inside
                    </p>
                    <h2
                      className={`${serif.className} mt-2 text-[2rem] font-semibold leading-tight`}
                      style={{ ...condensed, color: FOREST }}
                    >
                      Nutrition
                    </h2>
                    {hasNutrition && (
                      <div className="mt-6 grid grid-cols-5 gap-2 border-y border-dashed border-[#2c4a26]/25 py-5">
                        {[
                          { label: "Kcal", value: String(nutrition.calories ?? "-") },
                          { label: "Protein", value: nutrition.protein ?? "-" },
                          { label: "Carbs", value: nutrition.carbs ?? "-" },
                          { label: "Fat", value: nutrition.fat ?? "-" },
                          { label: "Fiber", value: nutrition.fiber ?? "-" },
                        ].map((n) => (
                          <div key={n.label} className="text-center">
                            <p
                              className={`${serif.className} text-2xl font-semibold leading-none`}
                              style={{ ...condensed, color: FOREST }}
                            >
                              {n.value}
                            </p>
                            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2b3327]/70">
                              {n.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {nutrition.vitamins && nutrition.vitamins.length > 0 && (
                      <p className="mt-5 text-sm leading-relaxed text-[#3a4135]">
                        <span className="font-semibold text-[#1d3a1b]">Rich in: </span>
                        {nutrition.vitamins.join(", ")}
                      </p>
                    )}
                    {hasIngredients && (
                      <p className="mt-5 text-sm leading-relaxed text-[#3a4135]">
                        <span className="font-semibold text-[#1d3a1b]">Ingredients: </span>
                        {product.ingredients!.join(", ")}
                      </p>
                    )}
                    {product.storage && (
                      <p className="mt-3 text-sm leading-relaxed text-[#3a4135]">
                        <span className="font-semibold text-[#1d3a1b]">Storage: </span>
                        {product.storage}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {SHOW_RATINGS && (
                <RatingSummary rating={Number(product.rating) || 0} reviewCount={product.review_count ?? 0} />
              )}
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-28 md:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#233021]">From the same harvest</p>
            <h2
              className={`${serif.className} mt-2 text-5xl font-bold leading-[0.95]`}
              style={{ ...condensed, color: FOREST }}
            >
              You May Also Like
            </h2>
            <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((p) => (
                <HomeProductCard
                  key={p.slug}
                  product={{
                    slug: p.slug,
                    name: p.name,
                    description: p.description,
                    price: Number(p.price),
                    originalPrice: p.original_price != null ? Number(p.original_price) : null,
                    image: resolveProductImage(p.slug, p.images),
                    rating: p.rating,
                    reviewCount: p.review_count,
                    category: category?.slug ?? null,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Closing band */}
        <section className="relative isolate h-[380px] overflow-hidden lg:h-[460px]">
          <Image
            src="/images/story/shop-hero.webp"
            alt="Fresh microgreens and juices on a farm table above misty hills"
            fill
            sizes="100vw"
            className="-z-10 object-cover object-[75%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <TornEdge seed={57} flip className="-top-[3px]" />
          <p
            className={`${script.className} absolute bottom-32 left-6 -rotate-[10deg] text-[1.7rem] leading-[1.15] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] md:bottom-12 md:left-12 md:text-[1.9rem] lg:text-[2.4rem]`}
          >
            Grown in Wayanad
            <br />
            Cut to order
          </p>
          <ul className="absolute bottom-8 right-6 space-y-1.5 text-right text-xs font-semibold uppercase tracking-[0.28em] text-white md:bottom-12 md:right-12 lg:text-sm">
            <li>Farm fresh</li>
            <li>Harvested to order</li>
            <li>Plastic-free packaging</li>
          </ul>
        </section>
      </main>

      <StickyAddToCart slug={product.slug} name={name} price={Number(product.price)} image={primaryImage} />
    </div>
  );
}
