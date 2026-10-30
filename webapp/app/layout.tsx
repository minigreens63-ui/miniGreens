import type { Metadata, Viewport } from "next";
import { Poppins, Inter, Playfair_Display, Caveat } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { PreorderProvider } from "@/context/PreorderContext";
import { AuthProvider } from "@/context/AuthContext";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { BRAND_CLAIM_SHORT, BRAND_OG_IMAGE } from "@/lib/brand";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const DEFAULT_TITLE = `Mini Greens Company | ${BRAND_CLAIM_SHORT}`;
const DEFAULT_DESCRIPTION =
  `${BRAND_CLAIM_SHORT}. Handpicked microgreen tea blends grown with care, delivered fresh to your doorstep.`;
const DEFAULT_OG_IMAGE = BRAND_OG_IMAGE;

export const viewport: Viewport = { themeColor: "#ffffff" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

// No dedicated logo image file exists yet (the header/footer logo is an inline SVG
// component) — add `logo` here once a static brand-mark asset is exported to /public.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable} ${playfair.variable} ${caveat.variable} h-full`}>
      <body className="h-full bg-(--color-bg) antialiased">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AuthProvider>
          <PreorderProvider>
            <AnnouncementBar />
            <Navbar />
            {children}
            <Footer />
          </PreorderProvider>
        </AuthProvider>
        <CartDrawer />
      </body>
    </html>
  );
}
