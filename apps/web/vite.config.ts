import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

/* https://vite.dev/config/ */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: {
    alias: {
      '@cliptap/shared': resolve(__dirname, '../../packages/shared/src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@adapters': resolve(__dirname, 'src/adapters'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@constants': resolve(__dirname, 'src/constants'),
      '@database': resolve(__dirname, 'src/database'),
      '@providers': resolve(__dirname, 'src/providers'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@src': resolve(__dirname, 'src'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    fs: {
      allow: [resolve(__dirname, '../..')],
    },
  },
  build: {
    /* チャンクサイズ警告の閾値を調整（アプリコードは許容） */
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        en: resolve(__dirname, 'en/index.html'),
        app: resolve(__dirname, 'app.html'),
      },
      output: {
        manualChunks: {
          /* React関連 */
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          /* Firebase関連 */
          'vendor-firebase': ['firebase/app', 'firebase/auth'],
          /* i18n関連 */
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          /* SQL.js（大きいのでスプリット） */
          'vendor-sql': ['sql.js'],
          /* UI関連 */
          'vendor-ui': ['@headlessui/react'],
        },
      },
    },
  },
})
