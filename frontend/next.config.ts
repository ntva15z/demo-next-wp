import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: process.env.WORDPRESS_HOSTNAME || "localhost",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
