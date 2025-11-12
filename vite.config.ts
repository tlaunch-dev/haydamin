import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

// Read version from package.json for cache versioning
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = packageJson.version

// https://vitejs.dev/config/
export default defineConfig({
  // Build optimizations
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'framer-motion': ['framer-motion'],
          // UI libraries
          'ui-vendor': ['lucide-react', 'browser-image-compression', 'react-easy-crop'],
        },
      },
    },
    // Target modern browsers for smaller output
    target: 'es2020',
    // Source maps for production debugging (optional, can disable for smaller size)
    sourcemap: false,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt', // Changed from 'autoUpdate' to prompt user for updates
      includeAssets: ['cedar.svg', 'favicon.ico'],
      manifest: {
        name: 'Hayda Min - هيدا مين؟',
        short_name: 'Hayda Min',
        description: 'Family recognition app for individuals with dementia',
        theme_color: '#5F8575', // Sage - matches style guide Primary Accent
        background_color: '#FAF7F5', // Oat - matches style guide Background
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: '64x64 192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/maskable-icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // CRITICAL: Force new service worker to activate immediately
        skipWaiting: true,
        clientsClaim: true,
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,gif,webp,woff,woff2}'],
        // Clean up old caches on activation
        cleanupOutdatedCaches: true,
        // Runtime caching strategies
        runtimeCaching: [
          // Firebase Auth endpoints - NEVER cache, always hit network
          {
            urlPattern: /^https:\/\/(identitytoolkit|securetoken)\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          // Firebase Storage (images/videos) - serve cached, update in background
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: `firebase-storage-v${version}`,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
          // NOTE: Firestore is NOT cached here - Firebase SDK handles its own
          // offline persistence via IndexedDB (see firebase.ts enableIndexedDbPersistence)
          // Service worker caching would conflict with Firebase's intelligent cache
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
})
