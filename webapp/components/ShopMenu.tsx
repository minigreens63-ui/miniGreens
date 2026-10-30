"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { VISIBLE_CATEGORY_SLUGS } from "@/lib/categories";

type ShopItem = { label: string; href: string; note: string };

// Hand-written menu copy for the original ranges; categories added in the admin panel use
// their own name and description.
const MENU_COPY: Record<string, { label: string; note: string }> = {
  "tea-blends": { label: "Teas", note: "Microgreen tea bags" },
  microgreens: { label: "Microgreens", note: "Fresh-cut trays" },
  juices: { label: "Juices", note: "Cold-pressed" },
};

function useShopItems(): ShopItem[] {
  const [items, setItems] = useState<ShopItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    createSupabaseBrowserClient()
      .from("categories")
      .select("slug, name, description")
      .eq("is_active", true)
      .order("sort_order")
      .order("name")
      .then(({ data }) => {
        if (cancelled || !data) return;
        setItems(
          data
            .filter((c) => VISIBLE_CATEGORY_SLUGS.includes(c.slug))
            .map((c) => ({
            label: MENU_COPY[c.slug]?.label ?? c.name,
            note: MENU_COPY[c.slug]?.note ?? c.description ?? "",
            href: `/shop?category=${c.slug}`,
          })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return items;
}

export function ShopMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinned = useRef(false);
  const shopItems = useShopItems();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onShop = pathname === "/shop";
  const activeCategory = onShop ? searchParams.get("category") : null;

  useEffect(() => {
    setOpen(false);
    pinned.current = false;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        pinned.current = false;
      }
    }
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        pinned.current = false;
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }
  function scheduleClose() {
    if (pinned.current) return;
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            pinned.current = next;
            return next;
          });
        }}
        className={`flex items-center gap-1 transition-colors hover:text-(--color-leaf) ${
          onShop ? "text-(--color-forest)" : ""
        }`}
      >
        Shop
        <CaretDown
          size={12}
          weight="bold"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-3 w-56 overflow-hidden rounded-xl border border-black/[0.07] bg-white p-1.5 shadow-xl shadow-black/10"
        >
          {shopItems.map((item) => {
            const isActive = activeCategory === item.href.split("category=")[1];
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={`flex flex-col rounded-lg px-3 py-2 transition-colors hover:bg-(--color-cream) ${
                  isActive ? "bg-(--color-cream) text-(--color-forest)" : "text-(--color-forest)/70"
                }`}
              >
                <span className="text-sm font-medium text-(--color-forest)">{item.label}</span>
                {item.note && <span className="line-clamp-1 text-xs text-(--color-forest)/70">{item.note}</span>}
              </Link>
            );
          })}

          <div className="my-1.5 h-px bg-black/[0.07]" />

          <Link
            href="/shop"
            role="menuitem"
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-(--color-cream) ${
              onShop && !activeCategory ? "bg-(--color-cream) text-(--color-forest)" : "text-(--color-forest)/70"
            }`}
          >
            All products
          </Link>
        </div>
      )}
    </div>
  );
}
