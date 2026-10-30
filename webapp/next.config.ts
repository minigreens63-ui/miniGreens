import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    // Lets next/image load product/category photos uploaded to Supabase Storage
    // (public URLs look like https://<project>.supabase.co/storage/v1/object/public/...).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xdjpwulpkuykxrxqalrh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
