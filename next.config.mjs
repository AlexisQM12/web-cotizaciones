/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    // Required for Firebase Auth signInWithPopup to work
                    { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
                    { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
                ],
            },
        ];
    },
    serverExternalPackages: ['@google-cloud/vision', 'pdf-parse', '@napi-rs/canvas', 'pdfjs-dist', 'tesseract.js']
};

export default nextConfig;
