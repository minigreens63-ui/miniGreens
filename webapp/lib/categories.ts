// Categories (which exist, their order, whether they're shown) are managed in the admin
// panel and read from the `categories` table (`sort_order`, `is_active`). Only the optional
// hero copy below is keyed by slug; categories without an entry fall back to a heading built
// from the category's own name and description (see `categoryCopy`).

// For now the webapp only showcases tea blends — raw microgreens, juices and anything else
// stay hidden here even if active in the admin panel. Add a slug back to re-enable it.
export const VISIBLE_CATEGORY_SLUGS = ["tea-blends"];

// Per-category shop hero copy. Falls back to the "everything" heading.
export const SHOP_COPY: Record<
  string,
  { eyebrow: string; title: string; accent: string; blurb: string }
> = {
  "tea-blends": {
    eyebrow: "Microgreen Teas",
    title: "Real Greens.",
    accent: "By the Cup.",
    blurb:
      "Functional microgreen tea blends, brewed fresh and naturally caffeine-free. 10 sachets a box.",
  },
  microgreens: {
    eyebrow: "Microgreens",
    title: "Every Tray We Grow,",
    accent: "Cut To Order",
    blurb:
      "Nothing sits in a warehouse. Pick your greens, choose a slot, and we harvest the morning your box goes out.",
  },
  juices: {
    eyebrow: "Cold-Pressed Juices",
    title: "Pressed That Morning,",
    accent: "Nothing Added",
    blurb: "Raw cold-pressed juice with a microgreen boost. No sugar, no water, no concentrate.",
  },
};

export const SHOP_COPY_DEFAULT = {
  eyebrow: "Microgreen Teas",
  title: "Real Greens.",
  accent: "By the Cup.",
  blurb:
    "Functional microgreen tea blends, brewed fresh and naturally caffeine-free. 10 sachets a box.",
};

/** Hero copy for a category: the curated entry if there is one, else built from the DB row. */
export function categoryCopy(cat: { slug: string; name: string; description: string | null } | null) {
  if (!cat) return SHOP_COPY_DEFAULT;
  return (
    SHOP_COPY[cat.slug] ?? {
      eyebrow: "Shop",
      title: cat.name,
      accent: "",
      blurb: cat.description ?? SHOP_COPY_DEFAULT.blurb,
    }
  );
}
