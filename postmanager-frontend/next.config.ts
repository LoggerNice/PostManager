import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    devIndicators: false,
    
    // Настройка headers для CORS
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*'
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization'
                    }
                ]
            }
        ];
    }
};

export default nextConfig;
