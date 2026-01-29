import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Multi-page build for popup and options
export default defineConfig({
  base: '',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: path.resolve(process.cwd(), 'src/popup/index.html'),
        options: path.resolve(process.cwd(), 'src/options/index.html'),
        overlay: path.resolve(process.cwd(), 'src/overlay/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src')
    }
  }
})
