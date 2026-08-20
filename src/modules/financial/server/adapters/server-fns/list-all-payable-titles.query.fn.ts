/**
 * Server function: TODOS os títulos do filtro corrente, sem paginação de tela (specs/101). Fronteira RPC
 * (§III) — o BFF pagina o `/payable-titles` do core-api e devolve o conjunto pronto; o client não compõe.
 *
 * Por que existe:
 *  - a **busca textual** do grid é client-side e só enxergava a página carregada. O `q` server-side do
 *    #167 ficou no `GET /documents`, endpoint que o grid abandonou no #201 ao virar title-centric;
 *  - e, sobretudo, a **remessa**: título que ficou na página 2 não pode sumir do lote em silêncio.
 *
 * É interino por construção. Quando o `/payable-titles` aceitar `q` (+ `issuedFrom/To`), o filtro volta
 * para o servidor e esta fn sai — o custo de varrer as páginas some junto.
 *
 * RBAC `financial:read` no core-api (403 → 'forbidden'), igual à listagem paginada.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { ListPayableTitlesInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { PayableTitleListResponse } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type ListAllPayableTitlesFnResult =
  | Readonly<{ ok: true; data: PayableTitleListResponse }>
  | Readonly<{ ok: false; error: FinancialError }>

export const listAllPayableTitlesFn = createServerFn({ method: 'GET' })
  // Reusa o schema da listagem paginada: os FILTROS são os mesmos. `page`/`pageSize` chegam e são
  // ignorados pelo adapter (que varre com o teto do core-api) — manter um schema só evita que os dois
  // caminhos aceitem recortes diferentes e passem a discordar sobre o que é "o filtro corrente".
  .inputValidator(ListPayableTitlesInputSchema)
  .handler(async ({ data }): Promise<ListAllPayableTitlesFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().listAllPayableTitles(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
