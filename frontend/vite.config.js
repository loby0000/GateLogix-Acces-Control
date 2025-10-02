import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'print-cloud-link',
      configureServer(server) {
        const cloudUrl = process.env.VITE_API_URL || 'https://frontend-736887951555.europe-west1.run.app'
        const print = () => console.log(`   ➜  Cloud:   ${cloudUrl}`)
        if (server.httpServer?.listening) {
          print()
        } else {
          server.httpServer?.once('listening', print)
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: false,
    cors: true,
    hmr: true,
    watch: {
      usePolling: true
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    open: false
  }
})
