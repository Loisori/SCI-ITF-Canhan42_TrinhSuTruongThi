import type { NextConfig } from "next";

const nextConfig: NextConfig = {
images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'googleusercontent.com', // Thêm cái này vì các ảnh demo trước đó của bạn dùng domain này
      },
    ],
  },
};

export default nextConfig;
