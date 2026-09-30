/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["@headlessui/react"],
  },
  transpilePackages: ["@headlessui/react"],
};

export default nextConfig;