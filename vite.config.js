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
      },
    },
  },
})
