// Live catalogue data (products + categories) from Supabase, exposed as react-query
// hooks. Replaces the hard-coded arrays in `src/mock/index.ts` for every
// browse/detail screen. See TASK_PLAN.md T1.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import type { Product, Category, NutritionInfo } from '../types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];

// ─── Bundled imagery fallback ────────────────────────────────────────────────
// DB `products.images` / `categories.image` are empty in the current seed, so the
// app keeps its bundled artwork keyed by slug until real Storage URLs exist.

const LOCAL_IMAGE_BY_SLUG: Record<string, number> = {
  'strawberry-banana-glow': require('../assets/strawberry-banana.png'),
  'mango-fresh': require('../assets/Mango Fresh.png'),
  'choco-chill': require('../assets/choco-chill.png'),
  'papaya-glow': require('../assets/papaya-glow.png'),
  'mint-melon-smoothie': require('../assets/mint-melon.png'),
  'carrot-lemon-radish-microgreens-juice': require('../assets/carrot-lemon-juice.png'),
  'cucumber-splash': require('../assets/cucumber-splash.png'),
  'apple-sprout': require('../assets/apple-sprout.png'),
  'sweet-lime-spark': require('../assets/sweet-lime.png'),
  'watermelon-fresh': require('../assets/watermelon-fresh.png'),
  'pink-radish': require('../assets/redraddish.png'),
  'white-radish': require('../assets/whiteraddish.png'),
  'wheatgrass': require('../assets/wheatgrass.png'),
  'beetroot': require('../assets/beetroot.png'),
  'pak-choi': require('../assets/bokchoy.png'),
  'sunflower': require('../assets/sunflowershoots.png'),
  'mustard': require('../assets/mustard-dark.png'),
  'fenugreek': require('../assets/fenugreek.png'),
  'broccoli': require('../assets/broccoli.png'),
  'arugula': require('../assets/arugula.png'),
  'turnip': require('../assets/turnip.png'),
  'red-amaranth': require('../assets/red-amaranth.png'),
  'red-cabbage': require('../assets/redcabbage.png'),

  // Tea blends: lifestyle photography (with background) of the tube artwork.
  'green-vitality-bag': require('../../assets/tea-blends/green-vitality.png'),
  'green-lemon-bag': require('../../assets/tea-blends/green-lemon.png'),
  'green-detox-bag': require('../../assets/tea-blends/green-detox.png'),
  'green-masala-bag': require('../../assets/tea-blends/green-masala.png'),
  'mint-green-bag': require('../../assets/tea-blends/mint-green.png'),
  'green-apple-bag': require('../../assets/tea-blends/green-apple.png'),
  'ginger-green-bag': require('../../assets/tea-blends/ginger-green.png'),
  'green-hibiscus-bag': require('../../assets/tea-blends/green-hibiscus.png'),
};

const LOCAL_CATEGORY_IMAGE_BY_SLUG: Record<string, number> = {
  // Light-UI category art (pale-green studio shots), assets/ at repo root.
  'smoothies': require('../../assets/cat-smoothies.png'),
  'juices': require('../../assets/cat-juices.png'),
  'bowls': require('../../assets/cat-bowls.png'),
  'microgreens': require('../../assets/cat-microgreens.png'),
  'tea-blends': require('../../assets/cat-tea-blends.png'),
};

// Returns null (never a fake "placeholder" image string) when there's no real
// artwork — consumers render a PlaceholderImage (colour + initial, real native
// View/Text) instead. A generated `data:image/svg+xml` string used to be
// returned here, but React Native's native Image component cannot decode SVG
// at all, so every "placeholder" silently rendered blank on iOS/Android.
function productImage(row: Pick<ProductRow, 'slug' | 'images' | 'name'>): any {
  if (LOCAL_IMAGE_BY_SLUG[row.slug]) return LOCAL_IMAGE_BY_SLUG[row.slug];
  if (row.images && row.images.length > 0) return row.images[0];
  return null;
}

function categoryImage(row: Pick<CategoryRow, 'slug' | 'image' | 'name'>): any {
  if (LOCAL_CATEGORY_IMAGE_BY_SLUG[row.slug]) return LOCAL_CATEGORY_IMAGE_BY_SLUG[row.slug];
  if (row.image) return row.image;
  return null;
}

const DEFAULT_NUTRITION: NutritionInfo = {
  calories: 0,
  protein: '—',
  carbs: '—',
  fat: '—',
  fiber: '—',
  vitamins: [],
};

function toNutrition(raw: ProductRow['nutrition']): NutritionInfo {
  if (!raw || typeof raw !== 'object') return DEFAULT_NUTRITION;
  const n = raw as Record<string, unknown>;
  return {
    calories: typeof n.calories === 'number' ? n.calories : Number(n.calories) || 0,
    protein: (n.protein as string) ?? '—',
    carbs: (n.carbs as string) ?? '—',
    fat: (n.fat as string) ?? '—',
    fiber: (n.fiber as string) ?? '—',
    vitamins: Array.isArray(n.vitamins) ? (n.vitamins as string[]) : [],
  };
}

// ─── Mappers: DB row → UI domain type ───────────────────────────────────────

export function dbProductToUi(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    categoryId: row.category_id ?? '',
    images: [productImage(row)],
    unit: row.unit ?? '',
    weight: row.weight ?? '',
    nutrition: toNutrition(row.nutrition),
    benefits: row.benefits ?? [],
    ingredients: row.ingredients ?? undefined,
    storage: row.storage ?? '',
    consumptionTips: row.consumption_tips ?? [],
    isFeatured: row.is_featured,
    isSeasonal: row.is_seasonal,
    isBestSeller: row.is_best_seller,
    isPreorder: row.is_preorder,
    isAvailable: row.is_available,
    stock: row.stock,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

export function dbCategoryToUi(row: CategoryRow, productCount = 0): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    image: categoryImage(row),
    icon: row.icon ?? 'leaf',
    productCount,
    color: row.color ?? '#6f8f4a',
  };
}

// ─── Query hooks ────────────────────────────────────────────────────────────

export interface ProductFilter {
  featured?: boolean;
  seasonal?: boolean;
  bestSeller?: boolean;
  categoryId?: string;
  categorySlug?: string;
}

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProductRow[]).map(dbProductToUi);
}

export function useProducts(filter?: ProductFilter) {
  const query = useQuery({ queryKey: ['products'], queryFn: fetchProducts });

  let items = query.data ?? [];
  if (filter?.featured) items = items.filter((p) => p.isFeatured);
  if (filter?.seasonal) items = items.filter((p) => p.isSeasonal);
  if (filter?.bestSeller) items = items.filter((p) => p.isBestSeller);
  if (filter?.categoryId) items = items.filter((p) => p.categoryId === filter.categoryId);

  return { ...query, products: items };
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: !!slug,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug!)
        .maybeSingle();
      if (error) throw error;
      return data ? dbProductToUi(data as ProductRow) : null;
    },
  });
}

export function useCategories() {
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const [{ data: cats, error: catErr }, { data: prods, error: prodErr }] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order').order('name'),
        supabase.from('products').select('category_id').eq('is_available', true),
      ]);
      if (catErr) throw catErr;
      if (prodErr) throw prodErr;
      const counts = new Map<string, number>();
      for (const p of prods ?? []) {
        if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
      }
      return (cats as CategoryRow[]).map((c) => dbCategoryToUi(c, counts.get(c.id) ?? 0));
    },
  });
  return { ...query, categories: query.data ?? [] };
}

export function useCategory(slug: string | undefined) {
  const { categories, ...rest } = useCategories();
  return { ...rest, category: categories.find((c) => c.slug === slug) ?? null };
}
