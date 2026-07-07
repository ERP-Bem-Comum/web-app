/**
 * INTERINO BFF composite p/ core-api#172/#265 — I/O das duas fontes de enriquecimento da Conciliação.
 * Monta a `EnrichmentSource` (fetchers) que a composição injeta no cliente de conciliação:
 *   - títulos:   GET /api/v2/financial/payable-titles  (TODOS os status, todas as páginas, pageSize ≤ 100)
 *               — SEM filtro de status: o mapa precisa cobrir tanto os Pago (painel/sugestões) quanto os
 *               Reconciled (detalhe da conciliação já feita); filtrar por Paid deixaria o modal de detalhe
 *               sem título (o título conciliado vira status Reconciled).
 *   - parceiros: GET /api/v1/partners                  (agregador ADR-0027 dos 4 tipos, via
 *                partners/public-api) — resolve o favorecido de QUALQUER tipo (não só suppliers), mesma
 *                fonte que o financeiro usa no picker/grid; schema tolerante (não quebra por drift).
 *
 * NUNCA lança (Result). Best-effort no chamador: falha vira `err` e o `buildEnrichmentMaps` degrada p/ null.
 * REMOVER quando o core-api enriquecer os contratos nativos.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import { payableTitlesToModel } from './financial.mappers.ts'
import { listAllPartners } from '#modules/partners/public-api/index.ts'
import type { PayableTitleListResponse } from '#modules/financial/server/domain/document.io.ts'
import type { EnrichmentSource } from './reconciliation-enrichment.ts'

// pageSize ≤ 100 (gotcha do core-api): busca TODAS as páginas de títulos UMA vez (sem N+1 por linha).
const TITLES_PAGE_SIZE = 100

// SEM `status=Paid`: cobre todos os status (Pago p/ painel/sugestões + Reconciled p/ o detalhe já conciliado).
const fetchAllTitles = async (
  financialBaseUrl: string,
  token: string,
): Promise<Result<readonly PayableTitleListResponse[], 'server'>> => {
  const pages: PayableTitleListResponse[] = []
  let page = 1
  // 1ª página revela o total; iteramos até cobrir todos os itens.
  for (;;) {
    const r = await resultFetch<unknown>(
      `${financialBaseUrl}/payable-titles?page=${String(page)}&pageSize=${String(TITLES_PAGE_SIZE)}`,
      { token },
    )
    if (isErr(r)) return err('server')
    const model = payableTitlesToModel(r.value)
    if (isErr(model)) return err('server')
    pages.push(model.value)
    const seen = page * TITLES_PAGE_SIZE
    if (seen >= model.value.total || model.value.items.length === 0) break
    page += 1
  }
  return ok(pages)
}

// Fábrica da fonte (por token): as duas leituras são chamadas UMA vez por build de mapa → sem N+1.
// `listAllPartners` lê a base v1 internamente (agregador) → não precisa receber a base de parceiros aqui.
export const createReconciliationEnrichmentSource =
  (financialBaseUrl: string) =>
  (token: string): EnrichmentSource => ({
    fetchTitles: () => fetchAllTitles(financialBaseUrl, token),
    fetchPartners: () => listAllPartners(token),
  })
