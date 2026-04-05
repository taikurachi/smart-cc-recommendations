import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "promo.bankofamerica.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.nerdwallet.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.usbank.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.bankofamerica.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
