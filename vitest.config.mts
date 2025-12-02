import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./test/setup.ts'],
        pool: 'threads',
        fileParallelism: false,
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
});
