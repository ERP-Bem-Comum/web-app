/**
 * Server function: TODOS os documentos do filtro corrente, sem paginação de tela (CAS-43/44). Fronteira
 * RPC (§III) — o BFF pagina o `/documents` do core-api e devolve o conjunto pronto; o client não compõe.
 *
 * Por que existe: rascunho não gera título, então o chip "Rascunho" do grid title-centric lê do
 * `/documents?status=Draft`, que é PAGINADO. Com a página como fonte, o Exportar CSV desse chip saía só
 * com a página visível. Gêmea do `listAllPayableTitlesFn` (specs/101): mesma razão, mesmo desenho.
 *
 * RBAC `fiscal-document:read` no core-api (403 → 'forbidden'), igual à listagem paginada.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { ListDocumentsInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { DocumentListResponse } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type ListAllDocumentsFnResult =
  | Readonly<{ ok: true; data: DocumentListResponse }>
  | Readonly<{ ok: false; error: FinancialError }>

export const listAllDocumentsFn = createServerFn({ method: 'GET' })
  // Reusa o schema da listagem paginada: os FILTROS são os mesmos; `page`/`pageSize` são ignorados pelo
  // adapter (que varre com o teto do core-api).
  .inputValidator(ListDocumentsInputSchema)
  .handler(async ({ data }): Promise<ListAllDocumentsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().listAllDocuments(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
