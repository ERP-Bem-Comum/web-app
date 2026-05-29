import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3000, // dev server (vite dev) apenas; produção usa env PORT (default 3000)
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart(),
    // preset 'node-server' (default do Nitro) → emite .output/server/index.mjs que escuta sozinho
    nitro(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
})
