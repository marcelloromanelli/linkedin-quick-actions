import { defineConfig } from 'vite'
import path from 'path'

/**
 * Vite config for building the content script
 * Bundles TypeScript modules into a single IIFE for Chrome extension
 */
export default defineConfig({
  build: {
    outDir: '../dist/src/content',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(process.cwd(), '../src/content/index.ts'),
      name: 'LiqaContent',
      fileName: () => 'content.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // Wrap in IIFE to avoid polluting global scope
        extend: true,
        inlineDynamicImports: true,
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
})
