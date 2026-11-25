import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import type { Connect, Plugin } from "vite";

const BASE = "/keuka/";

/**
 * The app answers at `/keuka` itself, without the trailing slash, in `npm run
 * dev` and `npm run preview` (vercel.json does the same live). Vite only
 * serves the base WITH its slash, so `/keuka` is passed to it as `/keuka/`
 * without changing the address in the browser; `/` redirects to `/keuka`.
 */
function serveBaseWithoutSlash(): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, res, next) => {
    const [path, query] = (req.url ?? "").split("?");
    const suffix = query ? `?${query}` : "";
    if (path === "/") {
      res.writeHead(302, { Location: BASE.slice(0, -1) + suffix });
      res.end();
      return;
    }
    if (path === BASE.slice(0, -1)) req.url = BASE + suffix;
    next();
  };
  return {
    name: "serve-base-without-slash",
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  };
}

export default defineConfig({
  // Every route and asset is served under /keuka/ (e.g. /keuka/login).
  base: BASE,
  // Build into dist/keuka so the files sit at the same path the app is served
  // from; vercel.json serves dist/ as the site root.
  build: { outDir: "dist/keuka" },
  plugins: [
    serveBaseWithoutSlash(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: 'Keuka',
        short_name: 'Keuka',
        description:
          'Local-first cocoa trading operations and financial management',
        theme_color: '#1f2a1f',
        background_color: '#f7f5f0',
        display: 'standalone',
        start_url: '/keuka/',
        scope: '/keuka/',

        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: '/keuka/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico,jpg}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
