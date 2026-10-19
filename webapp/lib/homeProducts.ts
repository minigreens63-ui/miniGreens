import { cache } from "react";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { resolveProductImage } from "@/lib/productImages";

export type HomeProduct = {
  slug: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  image: string | null;
  rating: number | null;
  reviewCount: number | null;
  category: string | null;
  categoryName?: string | null;
};

/**
 * All available products for the homepage sections, featured first then by rating.
 * Wrapped in `cache` so Bestsellers and FindYourBlend share one round-trip per request.
 */
export const getHomeCatalog = cache(async (): Promise<{
  categories: { slug: string; name: string }[];
  products: HomeProduct[];
}> => {
  const supabase = createSupabasePublicClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    // Admin-managed: hidden categories (and their products) stay off the homepage.
    supabase
      .from("categories")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("products")
      .select("slug, name, description, price, original_price, images, category_id, rating, review_count")
      .eq("is_available", true)
      .order("is_featured", { ascending: false })
      .order("rating", { ascending: false, nullsFirst: false }),
  ]);

  const catById = new Map((categories ?? []).map((c) => [c.id, c]));
  const visible = (products ?? []).filter((p) => !p.category_id || catById.has(p.category_id));
  const mapped = visible.map((p) => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    originalPrice: p.original_price != null ? Number(p.original_price) : null,
    image: resolveProductImage(p.slug, p.images),
    rating: p.rating != null ? Number(p.rating) : null,
    reviewCount: p.review_count,
    category: catById.get(p.category_id ?? "")?.slug ?? null,
    categoryName: catById.get(p.category_id ?? "")?.name ?? null,
  }));
  return { categories: categories ?? [], products: mapped };
});

export async function getHomeProducts(): Promise<HomeProduct[]> {
  return (await getHomeCatalog()).products;
}
