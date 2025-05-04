/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
  },
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL +
        (process.env.NODE_ENV === "production"
          ? "?connection_limit=5&pool_timeout=15"
          : ""),
    },
  },
};

export default nextConfig;
