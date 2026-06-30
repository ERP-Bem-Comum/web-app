/**
 * Nitro startup plugin — BOOT FAIL-FAST da config (FR-002 / ADR-0020, feature 035).
 *
 * Roda UMA vez no init do `nitroApp`, ANTES do `listen()` (o `initNitroPlugins` é síncrono e RE-LANÇA o
 * throw). Logo, se a env for inválida, o boot é ABORTADO com exit ≠ 0 — o container não sobe "quebrado"
 * para falhar só no 1º request (o factory do `createStart` roda em request-time e engole o throw como 500).
 *
 * Server-only (fora do bundle client → mantém §IX). Não roda no `vite build` (sem prerender aqui).
 * Registrado explicitamente em `vite.config.ts` → `nitro({ plugins: ['./src/server/plugins/boot-env.ts'] })`
 * (Nitro 3: `serverDir` não é varrido por autoscan, e o srcDir do Start ≠ serverDir do Nitro).
 */
import { definePlugin } from 'nitro'

import { loadEnvOrThrow } from '#external/config/env.config.ts'

export default definePlugin(() => {
  loadEnvOrThrow()
})
