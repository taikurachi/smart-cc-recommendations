import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.nerdwallet.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "promo.bankofamerica.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
