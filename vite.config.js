import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ── Local-vs-live API routing ────────────────────────────────────────────
// Single source of truth for "which backend does each sub-app hit while
// running `npm run dev`." Only takes effect when VITE_API_BASE_URL is a
// relative path (see .env.local) — the prod-pointed default in .env is an
// absolute URL, so axios talks to production directly and never reaches
// this dev-server proxy at all.
//
// To test a service locally: point its entry at its local port (that
// service must actually be running there). To leave a service on
// production: point it at LIVE_ORIGIN — the request still passes through
// this proxy (so relative paths resolve), but gets forwarded untouched to
// prod's own IIS, which does its own routing from there.
//
// Add an entry here for any src/api/*.js prefix you need while testing
// locally — anything not listed 404s against the Vite dev server instead of
// reaching either backend.
const LIVE_ORIGIN = 'https://apis.qbits.africa'

const API_ROUTES = {
  '/EDMSApi': LIVE_ORIGIN,
  //'/EDMSApi': 'https://localhost:7092', // local test — only works while that ASP.NET Core instance is actually running
  '/IAmAPI': LIVE_ORIGIN,
  '/WorkflowsAPI': LIVE_ORIGIN,
  '/ProcurementAPI': LIVE_ORIGIN,
  '/CommunicationAPI': LIVE_ORIGIN,
}

const apiProxy = Object.fromEntries(
  Object.entries(API_ROUTES).map(([prefix, target]) => {
    const isLocal = target !== LIVE_ORIGIN
    return [
      prefix,
      {
        target,
        changeOrigin: true,
        // Local dev processes have no IIS PathBase — they only know their
        // own bare routes, so the sub-app prefix has to be stripped before
        // forwarding. Production's own IIS needs that same prefix intact to
        // route the request to the right sub-app internally, so it's left
        // alone for anything pointed at LIVE_ORIGIN.
        ...(isLocal ? { rewrite: (path) => path.replace(new RegExp(`^${prefix}`), '') } : {}),
        // Local https targets use the ASP.NET Core dev cert (self-signed) —
        // Node doesn't trust it, so skip verification for local-only targets.
        ...(isLocal && target.startsWith('https') ? { secure: false } : {}),
      },
    ]
  })
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Mirrors the /ai-gateway rewrite in vercel.json — keeps
      // VITE_AI_GATEWAY_BASE_URL=/ai-gateway working under `npm run dev` too.
      '/ai-gateway': {
        target: 'http://45.150.191.156:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai-gateway/, ''),
      },
      ...apiProxy,
    },
  },
})
