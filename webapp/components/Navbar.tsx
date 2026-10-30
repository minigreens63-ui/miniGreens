"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { List, MagnifyingGlass, Package, ShoppingCart, SignOut, Tag, User, X } from "@phosphor-icons/react";
import { usePreorder } from "@/context/PreorderContext";
import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@/context/AuthContext";
import { ShopMenu } from "@/components/ShopMenu";
import { Logo } from "@/components/Logo";

const LINKS = [
  { label: "Subscriptions", href: "/subscriptions" },
  { label: "Our Story", href: "/about" },
  { label: "Journal", href: "/blog" },
  { label: "Women Who Grow", href: "/women-who-grow" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const router = useRouter();
  const { subscription } = usePreorder();
  const { user, signOut } = useAuth();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const openCart = useCartStore((s) => s.openCart);
  const activeCount = cartCount + (subscription ? 1 : 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const accountHref = user ? "/account" : "/login";
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Home hero runs up underneath the header; stay see-through until the user
  // scrolls (or opens the mobile menu) so the hero imagery shows on the right.
  const overlay = pathname === "/" && !scrolled && !menuOpen;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    setSearchOpen(false);
    if (query) router.push(`/shop?search=${encodeURIComponent(query)}`);
  }

  const iconBtn =
    "hidden size-9 items-center justify-center rounded-full transition-colors hover:bg-(--color-cream) sm:flex";

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-colors duration-300 ${
        overlay ? "border-transparent bg-transparent" : "border-black/5 bg-white/95 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-(--nav-h) max-w-7xl items-center justify-between gap-6 px-6 md:px-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex size-9 items-center justify-center rounded-full text-(--color-forest) transition-colors hover:bg-(--color-cream) lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <List size={20} />}
          </button>
          <Link href="/" className="flex items-center">
            <Logo width={86} color="#000000" accentColor="#000000" />
          </Link>
        </div>

        <nav className="hidden flex-1 items-center gap-5 whitespace-nowrap pl-4 text-[13px] xl:gap-8 xl:pl-6 font-medium text-(--color-forest) lg:flex">
          <Suspense fallback={<span>Shop</span>}>
            <ShopMenu />
          </Suspense>
          {LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="transition-colors hover:text-(--color-leaf)">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-(--color-forest)">
          {searchOpen ? (
            <form onSubmit={submitSearch} className="hidden items-center sm:flex">
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch(e)}
                onBlur={() => !searchQuery && setSearchOpen(false)}
                placeholder="Search products..."
                className="h-9 w-44 rounded-full border border-black/10 bg-white px-4 text-sm outline-none focus:border-(--color-forest)"
              />
            </form>
          ) : (
            <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)} className={iconBtn}>
              <MagnifyingGlass size={18} />
            </button>
          )}
          <Link href={accountHref} aria-label="Account" className={iconBtn}>
            <User size={18} />
          </Link>
          <Link href="/orders" aria-label="My orders" className={iconBtn}>
            <Package size={18} />
          </Link>
          <Link href="/offers" aria-label="My offers" className={iconBtn}>
            <Tag size={18} />
          </Link>
          {user && (
            <button type="button" onClick={signOut} aria-label="Log out" title="Log out" className={iconBtn}>
              <SignOut size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={openCart}
            aria-label="View your cart"
            className="relative flex size-9 items-center justify-center rounded-full transition-colors hover:bg-(--color-cream)"
          >
            <ShoppingCart size={18} />
            {activeCount > 0 && (
              <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-(--color-sun) text-[10px] font-bold text-(--color-forest)">
                {activeCount}
              </span>
            )}
          </button>
          <Link
            href="/subscriptions"
            className="ml-3 hidden rounded-full border border-(--color-forest)/25 bg-white/90 px-5 py-2 text-[13px] font-semibold text-(--color-forest) transition-colors hover:border-(--color-forest) hover:bg-(--color-forest) hover:text-white md:inline-flex"
          >
            Subscribe
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-black/[0.07] bg-white px-6 py-4 lg:hidden">
          <form
            onSubmit={(e) => {
              submitSearch(e);
              setMenuOpen(false);
            }}
            role="search"
            className="mb-3 flex items-center gap-2 rounded-full border border-black/10 px-4 sm:hidden"
          >
            <MagnifyingGlass size={16} className="shrink-0 text-(--color-forest)/60" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-11 w-full bg-transparent text-sm outline-none"
            />
          </form>
          <ul className="flex flex-col gap-1 text-sm font-medium text-(--color-forest)">
            <li>
              <Link
                href="/shop"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-(--color-cream)"
              >
                Shop
              </Link>
            </li>
            {LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-(--color-cream)"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex gap-2 border-t border-black/[0.07] pt-3">
              <Link
                href={accountHref}
                onClick={() => setMenuOpen(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-black/[0.07] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
              >
                <User size={15} /> Account
              </Link>
              <Link
                href="/orders"
                onClick={() => setMenuOpen(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-black/[0.07] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
              >
                <Package size={15} /> Orders
              </Link>
              <Link
                href="/offers"
                onClick={() => setMenuOpen(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-black/[0.07] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
              >
                <Tag size={15} /> Offers
              </Link>
            </li>
            {user && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void signOut();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-black/[0.07] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                >
                  <SignOut size={15} /> Log out
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
