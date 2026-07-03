import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Mirrors the CSP header in vercel.json as a meta-tag fallback for hosts that
// don't send headers. Only injected at build time: connect-src 'none' would
// block the HMR websocket in dev. frame-ancestors is omitted because browsers
// ignore it in meta tags (the vercel.json header still covers it).
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'self' data:; form-action 'none'; base-uri 'self'"

function injectCspMeta(): Plugin {
  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

export default defineConfig({
  plugins: [react(), injectCspMeta()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          openpgp: ['openpgp']
        }
      }
    }
  }
})
