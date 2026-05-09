import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "googleusercontent.com", // Thêm cái này vì các ảnh demo trước đó của bạn dùng domain này
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',    // Thêm domain này cho Avatar mặc định
        pathname: '/api/**',           // Cụ thể hóa đường dẫn API của họ
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Thêm chính xác dòng này
        pathname: '/**',                // Cho phép tất cả các đường dẫn sau domain
      },
    ],
  },
};

export default withNextIntl(nextConfig);
