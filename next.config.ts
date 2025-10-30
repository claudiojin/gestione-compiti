import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    unoptimized: true,  // 禁用图片优化
  },
  trailingSlash: true,  // 添加尾部斜杠
};

export default nextConfig;
