import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.nerdwallet.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
