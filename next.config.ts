import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['media1.tenor.com'],
  },
  // THIS OPTION WILL DISABLE CODE LINTING ERRORS AND WARNINGS
  //    (USE FOR DEV PURPOSES ONLY)
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  //
  //
  // THIS OPTION WILL DISABLE TYPE CHECKING ERRORS AND WARNINGS
  //    (USE FOR DEV PURPOSES ONLY)
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
};

export default nextConfig;
