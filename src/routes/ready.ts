/**
 * Readiness probe (`/ready`) — server route SEM component (server-only; o dispatch do Start não exige
 * component). Diferente de `/health` (liveness, page route que não toca o backend): readiness responde
 * **200** só se a config carrega (loadEnvOrThrow) E o core-api responde; senão **503** → o LB/orquestrador
 * tira a instância de rota (ERP-INFRA observability baseline; FR-019/ADR-0019).
 *
 * Captura o throw do `loadEnvOrThrow` para virar 503 (readiness deve RESPONDER, não crashar — o crash de
 * boot por env inválida é o `boot-env` Nitro plugin). `cache-control: no-store`: por-request, nunca cacheável.
 */
import { createFileRoute } from '@tanstack/react-router'

import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'

const PROBE_TIMEOUT_MS = 2000

/**
 * Probe do core-api: GET numa rota REAL sob `/api/v2` (password-policy — pública, sem token, barata),
 * NÃO o `/health` do host. Assim o readiness pega um `CORE_API_URL` com PATH errado (ex.: sem `/api` →
 * 404), não só "host no ar" — o ponto cego do incidente 2026-06-25. Timeout curto.
 */
async function probeCoreApi(coreApiUrl: string): Promise<boolean> {
  const ac = new AbortController()
  const timer = setTimeout(() => { ac.abort(); }, PROBE_TIMEOUT_MS)
  try {
    const res = await fetch(`${coreApiBase(coreApiUrl, 'v2')}/auth/password-policy`, {
      method: 'GET',
      signal: ac.signal,
      headers: { accept: 'application/json' },
    })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export const Route = createFileRoute('/ready')({
  server: {
    handlers: {
      GET: async () => {
        const checks = { config: false, coreApi: false }
        let coreApiUrl: string | undefined
        try {
          coreApiUrl = loadEnvOrThrow().CORE_API_URL
          checks.config = true
        } catch {
          checks.config = false
        }
        if (coreApiUrl) checks.coreApi = await probeCoreApi(coreApiUrl)

        const ready = checks.config && checks.coreApi
        return new Response(JSON.stringify({ status: ready ? 'ready' : 'unready', checks }), {
          status: ready ? 200 : 503,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        })
      },
    },
  },
})
