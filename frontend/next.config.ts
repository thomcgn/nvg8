import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        const backend = process.env.BACKEND_URL || "http://backend:8080";
        return [
            {
                source: "/api/:path*",
                destination: `${backend}/:path*`,
            },
        ];
    },
};

export default nextConfig;
