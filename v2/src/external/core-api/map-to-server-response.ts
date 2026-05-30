/**
 * map-to-server-response — HttpError → Response, PRESERVANDO o status do upstream.
 * Usado por server functions: o status do core-api chega ao client, que o reconverte
 * em AppError (via map-to-app-error). `switch` exaustivo com guarda `never`.
 * Fonte: handbook/arquiteture.md §2 + specs/001-v2-foundation/contracts/error-envelope.md.
 */
import type { HttpError } from '#shared/http/http-error.types.ts'

const JSON_HEADERS = { 'content-type': 'application/json' } as const

const serializeBody = (b: unknown): string =>
  b === null || b === undefined ? '' : typeof b === 'string' ? b : JSON.stringify(b)

export const mapToServerResponse = (error: HttpError): Response => {
  switch (error.kind) {
    case 'http':
      return new Response(serializeBody(error.body), { status: error.status, headers: JSON_HEADERS })
    case 'network':
    case 'timeout':
      return new Response(JSON.stringify({ kind: 'connectivity' }), { status: 504, headers: JSON_HEADERS })
    case 'parse':
      return new Response(JSON.stringify({ kind: 'bad-gateway' }), { status: 502, headers: JSON_HEADERS })
    case 'aborted':
      return new Response(null, { status: 499 })
    default: {
      const exhaustive: never = error
      return exhaustive
    }
  }
}
