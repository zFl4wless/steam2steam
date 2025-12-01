import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

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
        ...(!isVercel
            ? [
                  wayfinder({
                      formVariants: true,
                  }),
              ]
            : []),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
