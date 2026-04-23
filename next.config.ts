// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Otimização de chunks
    webpack: (config, { dev, isServer }) => {
        if (!dev && !isServer) {
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    default: false,
                    vendors: false,
                    framework: {
                        name: 'framework',
                        chunks: 'all',
                        test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
                        priority: 40,
                        enforce: true,
                    },
                    lib: {
                        test: /[\\/]node_modules[\\/]/,
                        name(module: any) {
                            const packageName = module.context.match(
                                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                            )?.[1];
                            return `npm.${packageName?.replace('@', '')}`;
                        },
                        priority: 30,
                        minChunks: 1,
                        reuseExistingChunk: true,
                    },
                },
            };
        }
        return config;
    },

    // Otimização de imports
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            'date-fns',
            'recharts',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
        ],
    },
};

export default nextConfig;