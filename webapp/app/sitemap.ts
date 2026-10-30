import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";
import { JOURNAL_POSTS } from "@/lib/journal";

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/subscriptions", priority: 0.8, changeFrequency: "weekly" },
  { path: "/offers", priority: 0.6, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/women-who-grow", priority: 0.6, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/returns", priority: 0.2, changeFrequency: "yearly" },
  { path: "/shipping-policy", priority: 0.2, changeFrequency: "yearly" },
];

async function getProductSlugs() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_available", true);

  return data ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProductSlugs();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/shop/${product.slug}`,
    lastModified: product.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = JOURNAL_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...productEntries, ...blogEntries];
}
