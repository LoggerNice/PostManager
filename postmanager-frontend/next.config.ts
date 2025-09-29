import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    devIndicators: false,
    
    // Настройка проксирования для статических файлов
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://172.17.118.38:3045/:path*'
            },
            {
                // Проксирование загрузки файлов
                source: '/uploads/:path*',
                destination: 'http://172.17.118.38:3045/uploads/:path*'
            }
        ];
    },
    
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
