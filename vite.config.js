import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  // Rewrite "/" to "/index.html" so public/index.html serves as the landing page
  plugins: [
    {
      name: 'serve-public-index',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            req.url = '/index.html'
          }
          next()
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'auth/login/index.html'),
        signup: resolve(__dirname, 'auth/signup/index.html'),
        callback: resolve(__dirname, 'auth/callback/index.html'),
        forgotPassword: resolve(__dirname, 'auth/forgot-password/index.html'),
        dashboard: resolve(__dirname, 'dashboard/index.html'),
        settings: resolve(__dirname, 'settings/index.html'),
        settingsBlocklist: resolve(__dirname, 'settings/blocklist/index.html'),
        settingsDetection: resolve(__dirname, 'settings/detection/index.html'),
        settingsDevices: resolve(__dirname, 'settings/devices/index.html'),
        sessions: resolve(__dirname, 'sessions/index.html'),
        sessionDetail: resolve(__dirname, 'sessions/detail/index.html'),
        account: resolve(__dirname, 'account/index.html'),
        accountSubscription: resolve(__dirname, 'account/subscription/index.html'),
        pricing: resolve(__dirname, 'pricing/index.html'),
        howToUse: resolve(__dirname, 'how-to-use/index.html'),
        download: resolve(__dirname, 'download/index.html'),
      },
    },
  },
})
