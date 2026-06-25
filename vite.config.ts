import { defineConfig } from 'vite'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
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
    // vanilla-extract: extrai .css.ts → CSS estático no build (zero-runtime, SSR-safe).
    // Vem ANTES do tanstackStart/react para transformar os .css.ts primeiro.
    vanillaExtractPlugin(),
    // Bootstrap movido p/ src/app/ (organização visual): aponta o router entry e o
    // routeTree gerado p/ lá. `routesDirectory` segue default ('routes' → src/routes).
    // Chaves confirmadas no schema do start-plugin-core (router.entry / router.generatedRouteTree).
    tanstackStart({
      router: {
        entry: 'app/router.tsx',
        generatedRouteTree: 'app/routeTree.gen.ts',
      },
    }),
    // preset 'node-server' (default do Nitro) → emite .output/server/index.mjs que escuta sozinho.
    // `plugins`: startup plugin de boot fail-fast da env (FR-002/ADR-0020) — roda antes do listen e
    // aborta o boot (exit ≠ 0) se a config for inválida. Registro explícito (Nitro 3 não faz autoscan).
    nitro({ plugins: ['./src/server/plugins/boot-env.ts'] }),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
})
