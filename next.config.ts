import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 開発時のみwarning、本番ビルド時はignore
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 型チェックは別途実行するため、ビルド時はスキップ
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
