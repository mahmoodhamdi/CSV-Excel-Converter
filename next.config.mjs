import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Webpack configuration for Web Workers
  webpack: (config, { isServer }) => {
    // Enable Web Worker support
    if (!isServer) {
      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        loader: 'worker-loader',
        options: {
          filename: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      });
    }

    // Ensure proper handling of worker files
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },

  // Experimental features for performance
  experimental: {
    // Enable optimized package imports for better tree-shaking
    optimizePackageImports: ['xlsx', 'papaparse', 'lucide-react'],
  },
};

export default withNextIntl(nextConfig);
