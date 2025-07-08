import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media1.tenor.com',
        pathname: '/m/**',
      },
    ],
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
