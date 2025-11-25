import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

// Check if we're on Vercel by checking for VERCEL environment variable
const isVercel = process.env.VERCEL === '1';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        // Only use wayfinder when NOT on Vercel (requires PHP)
        ...(!isVercel ? [wayfinder({
            formVariants: true,
        })] : []),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
