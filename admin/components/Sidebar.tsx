"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  ClipboardText,
  Truck,
  Package,
  Users,
  CreditCard,
  ChartBar,
  Leaf,
  List,
  X,
  SignOut,
  Handshake,
  Tag,
  Stack,
  ShieldCheck,
} from "@phosphor-icons/react";
import { logout } from "@/app/dashboard/login/actions";

const navLinks = [
  { href: "/dashboard", label: "Overview", icon: SquaresFour, active: true },
  { href: "/dashboard/orders", label: "Orders", icon: ClipboardText, active: true },
  { href: "/dashboard/delivery", label: "Delivery Queue", icon: Truck, active: true },
  { href: "/dashboard/partners", label: "Partners", icon: Handshake, active: true },
  { href: "/dashboard/products", label: "Products", icon: Package, active: true },
  { href: "/dashboard/categories", label: "Categories", icon: Stack, active: true },
  { href: "/dashboard/discounts", label: "Discounts", icon: Tag, active: true },
  { href: "/dashboard/customers", label: "Customers", icon: Users, active: true },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: CreditCard, active: true },
  { href: "/dashboard/reports", label: "Reports", icon: ChartBar, active: true },
];

const comingSoon: { label: string; icon: typeof Users }[] = [];

export default function Sidebar({ email, isSuperAdmin }: { email: string; isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = email ? email.slice(0, 2).toUpperCase() : "AD";
  const links = isSuperAdmin
    ? [...navLinks, { href: "/dashboard/admins", label: "Admins", icon: ShieldCheck, active: true }]
    : navLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Wordmark */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0A2416" }}>
          <Leaf size={16} weight="fill" color="#CAEF61" />
        </div>
        <span className="text-base font-semibold tracking-tight" style={{ color: "#0A2416" }}>
          MiniGreens
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest uppercase text-slate-400">
          Main
        </p>
        {links.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                ${isActive
                  ? "bg-emerald-50 text-[#0A2416]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              style={isActive ? { borderLeft: "3px solid #CAEF61", paddingLeft: "calc(0.75rem - 3px)" } : {}}
            >
              <Icon
                size={18}
                weight={isActive ? "fill" : "regular"}
                style={{ color: isActive ? "#3D7A52" : undefined }}
              />
              {label}
            </Link>
          );
        })}

        {comingSoon.length > 0 && (
          <div className="pt-4">
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest uppercase text-slate-400">
              Coming Soon
            </p>
            {comingSoon.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 pointer-events-none opacity-40 select-none"
              >
                <Icon size={18} />
                {label}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Admin avatar */}
      <div className="px-4 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: "#0A2416", color: "#CAEF61" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate">Admin</p>
            <p className="text-xs text-slate-400 truncate">{email || "Not signed in"}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors flex-shrink-0"
            >
              <SignOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full border-r border-slate-200 bg-white z-30"
        style={{ width: 240 }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm active:scale-[0.97] transition-transform"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <List size={18} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />
          <aside
            className="md:hidden fixed left-0 top-0 h-full bg-white z-50 shadow-xl animate-slide-in-right"
            style={{ width: 240 }}
          >
            <button
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X size={14} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
