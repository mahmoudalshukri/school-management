/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
