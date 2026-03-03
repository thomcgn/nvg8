import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites(){
    const backend = process.env.BACKEND_URL ?? "http://localhost:8080";
    return [
      {
        source: "/api:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  }
};

export default nextConfig;
