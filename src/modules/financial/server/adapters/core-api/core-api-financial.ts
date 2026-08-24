/**
 * Cliente HTTP do core-api para o Financeiro — chama `/api/v2/financial/documents`. NUNCA lança (tudo é
 * Result; `throw` só na borda do `resultFetch`). Server-only (adapters). Anti-corruption: delega a
 * tradução aos mappers PUROS (`financial.mappers.ts`) e o erro a `mapHttpError`. Espelha `core-api-users.ts`.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import { resultFetch, resultFetchBytes } from '#external/core-api/result-fetch.ts'
import type { FinancialClient } from '#modules/financial/server/application/financial.use-cases.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'
import type {
  DocumentListResponse,
  ListDocumentsInput,
  ListPayableTitlesInput,
  PayableTitleListResponse,
  PayableCountsInput,
  PayableCounts,
  RecentPayment,
} from '#modules/financial/server/domain/document.io.ts'
import type {
  PreviewRemittanceInput,
  RemittancePreview,
  GenerateRemittanceInput,
  GeneratedRemittance,
  RemittanceFile,
} from '#modules/financial/server/domain/remittance.io.ts'
import type { GenerateRemittanceFailure } from '#modules/financial/server/application/financial.use-cases.ts'
import { previewToModel, generatedToModel } from './remittance.mappers.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import {
  detailToModel,
  listToModel,
  payableTitlesToModel,
  payableCountsToModel,
  recentPaymentsToModel,
  dashboardCostCentersToModel,
  dashboardNoContractSuppliersToModel,
  timelineToModel,
  mapHttpError,
} from './financial.mappers.ts'

// #201: status PT→EN completo (a listagem por título cobre os 7 status, não só os da Fatia 1).
const STATUS_TO_BACKEND_FULL: Partial<Record<string, string>> = {
  Rascunho: 'Draft',
  Aberto: 'Open',
  Aprovado: 'Approved',
  Transmitido: 'Transmitted',
  Recusado: 'Refused',
  Pago: 'Paid',
  Conciliado: 'Reconciled',
}

// #536: filtros da contagem agregada (sem status/paginação — o backend devolve o breakdown completo).
const buildCountsQuery = (input: PayableCountsInput): string => {
  const p = new URLSearchParams()
  if (input.type !== undefined) p.set('documentType', input.type)
  if (input.supplierRef !== undefined) p.set('supplierRef', input.supplierRef)
  if (input.dueFrom !== undefined) p.set('dueFrom', input.dueFrom)
  if (input.dueTo !== undefined) p.set('dueTo', input.dueTo)
  return p.toString()
}

const buildTitlesQuery = (input: ListPayableTitlesInput): string => {
  const p = new URLSearchParams()
  const status = input.status === undefined ? undefined : STATUS_TO_BACKEND_FULL[input.status]
  if (status !== undefined) p.set('status', status)
  if (input.type !== undefined) p.set('documentType', input.type) // endpoint usa `documentType`
  if (input.supplierRef !== undefined) p.set('supplierRef', input.supplierRef)
  if (input.dueFrom !== undefined) p.set('dueFrom', input.dueFrom)
  if (input.dueTo !== undefined) p.set('dueTo', input.dueTo)
  p.set('page', String(input.page))
  p.set('pageSize', String(input.pageSize))
  return p.toString()
}

// Status do front (PT) → status do core-api (EN) para o filtro de lista (Fatia 1: Draft|Open|Approved).
const STATUS_TO_BACKEND: Partial<Record<string, string>> = {
  Rascunho: 'Draft',
  Aberto: 'Open',
  Aprovado: 'Approved',
}

const buildListQuery = (input: ListDocumentsInput): string => {
  const p = new URLSearchParams()
  const status = input.status === undefined ? undefined : STATUS_TO_BACKEND[input.status]
  if (status !== undefined) p.set('status', status)
  if (input.supplierRef !== undefined) p.set('supplierRef', input.supplierRef)
  if (input.type !== undefined) p.set('type', input.type)
  if (input.dueFrom !== undefined) p.set('dueFrom', input.dueFrom)
  if (input.dueTo !== undefined) p.set('dueTo', input.dueTo)
  if (input.issuedFrom !== undefined) p.set('issuedFrom', input.issuedFrom) // #163
  if (input.issuedTo !== undefined) p.set('issuedTo', input.issuedTo)
  p.set('page', String(input.page))
  p.set('pageSize', String(input.pageSize))
  return p.toString()
}

/** Teto do `pageSize` do core-api (`listPayablesQuerySchema`) — buscar tudo em menos idas. */
const MAX_CORE_API_PAGE_SIZE = 100
/** Teto de segurança do "carregar tudo" (specs/101): 20 páginas. Acima disso, resposta parcial. */
const MAX_ALL_TITLES = 2000

export const createCoreApiFinancialClient = (baseUrl: string): FinancialClient => {
  const docs = `${baseUrl}/documents`
  return {
    list: async (input, token): Promise<Result<DocumentListResponse, FinancialError>> => {
      const r = await resultFetch<unknown>(`${docs}?${buildListQuery(input)}`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return listToModel(r.value)
    },
    listPayableTitles: async (input, token): Promise<Result<PayableTitleListResponse, FinancialError>> => {
      const r = await resultFetch<unknown>(`${baseUrl}/payable-titles?${buildTitlesQuery(input)}`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return payableTitlesToModel(r.value)
    },
    // specs/101: TODOS os títulos do filtro, sem paginação de tela — o BFF pagina o core-api e devolve o
    // conjunto completo (§III: a fn entrega o caso de uso pronto; o client não compõe).
    //
    // Existe porque o `/payable-titles` não aceita busca textual (o `q` do #167 ficou no `/documents`, que
    // o grid abandonou no #201) e porque a REMESSA não pode enxergar só a página: título que ficou na
    // página 2 não pode sumir do lote em silêncio.
    //
    // Sequencial de propósito depois da 1ª página: em paralelo, N páginas viram N conexões simultâneas ao
    // core-api por operador. O ganho não compensa o pico — o caminho definitivo é o filtro no backend.
    listAllPayableTitles: async (input, token): Promise<Result<PayableTitleListResponse, FinancialError>> => {
      const first = await resultFetch<unknown>(
        `${baseUrl}/payable-titles?${buildTitlesQuery({ ...input, page: 1, pageSize: MAX_CORE_API_PAGE_SIZE })}`,
        { token },
      )
      if (isErr(first)) return err(mapHttpError(first.error))
      const head = payableTitlesToModel(first.value)
      if (isErr(head)) return head

      const { total } = head.value
      const items = [...head.value.items]
      // Teto duro: acima disto a tela deixaria de ser utilizável muito antes de o servidor reclamar, e a
      // resposta parcial é preferível a uma requisição que não termina. O `total` real segue na resposta,
      // então o client sabe que houve corte.
      const pages = Math.min(
        Math.ceil(total / MAX_CORE_API_PAGE_SIZE),
        Math.ceil(MAX_ALL_TITLES / MAX_CORE_API_PAGE_SIZE),
      )
      for (let page = 2; page <= pages; page++) {
        const r = await resultFetch<unknown>(
          `${baseUrl}/payable-titles?${buildTitlesQuery({ ...input, page, pageSize: MAX_CORE_API_PAGE_SIZE })}`,
          { token },
        )
        if (isErr(r)) return err(mapHttpError(r.error))
        const next = payableTitlesToModel(r.value)
        if (isErr(next)) return next
        items.push(...next.value.items)
      }

      return ok({ items, page: 1, pageSize: items.length, total })
    },
    // #536: contagem agregada por status (chips) — 1 request.
    getPayableCounts: async (input, token): Promise<Result<PayableCounts, FinancialError>> => {
      const r = await resultFetch<unknown>(`${baseUrl}/payable-titles/counts?${buildCountsQuery(input)}`, {
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return payableCountsToModel(r.value)
    },
    getRecentPayments: async (token): Promise<Result<readonly RecentPayment[], FinancialError>> => {
      const r = await resultFetch<unknown>(`${baseUrl}/dashboard/recent-payments`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return recentPaymentsToModel(r.value)
    },
    // #241/#237: KPI "Despesas por Centro de Custo" (cost-centers + variação M-1 vs M-2). Gate reference:read.
    getDashboardCostCenters: async (token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/dashboard/cost-centers`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return dashboardCostCentersToModel(r.value)
    },
    // #242: widget "Fornecedores sem Contrato" (top-5 por total pago). Gate reference:read.
    getDashboardNoContractSuppliers: async (token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/dashboard/no-contract-suppliers`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return dashboardNoContractSuppliersToModel(r.value)
    },
    // VAN (core-api#728): PRÉ-VOO do lote. Custom method AIP-136 — o literal `:preview` faz parte do path
    // (não é query param) e por isso NÃO é encodado. Leitura pura: apesar do POST, não consome NSA, não
    // prende título e não toca no bucket da VAN. O POST existe porque a seleção (até 200 ids) vai no corpo.
    previewRemittance: async (
      input: PreviewRemittanceInput,
      token,
    ): Promise<Result<RemittancePreview, FinancialError>> => {
      const r = await resultFetch<unknown>(`${baseUrl}/remittances:preview`, {
        method: 'POST',
        // ⚠️ `cedenteAccountId` é obrigatório desde o core-api#804 e o corpo lá é `.strict()`: sem ele o
        // pré-voo volta 400. É a mesma conta da geração — conferir e gerar respondem à mesma pergunta.
        body: { cedenteAccountId: input.cedenteAccountId, payableIds: input.payableIds },
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return previewToModel(r.value)
    },
    // VAN (core-api#728): GERA a remessa. ⚠️ ÚNICA chamada do módulo que MOVE DINHEIRO — grava em `saida/`,
    // e gravar ali é enfileirar pagamento no banco (ADR-0060). Consome NSA e prende os documentos.
    //
    // Diferente de todo o resto do módulo, o erro carrega a MENSAGEM do core-api junto da tag.
    // O `sendDomainError` de lá (OWASP API8) colapsa o slug interno num `code` público de 5 valores: quatro
    // recusas distintas — sem dados, forma não emitida, vencimentos misturados, conta sem convênio — chegam
    // todas como 422. A tag genérica ("não foi possível processar") não diz ao operador o que fazer, e o
    // texto PT-BR que o backend escreve diz. Ele é exibido como veio; a UI não o interpreta.
    generateRemittance: async (
      input: GenerateRemittanceInput,
      token,
    ): Promise<Result<GeneratedRemittance, GenerateRemittanceFailure>> => {
      const r = await resultFetch<unknown>(`${baseUrl}/remittances`, {
        method: 'POST',
        body: { cedenteAccountId: input.cedenteAccountId, payableIds: input.payableIds },
        token,
      })
      if (isErr(r)) {
        const detail = r.error.kind === 'http' ? parseErrorEnvelope(r.error.body) : null
        return err({ error: mapHttpError(r.error), message: detail?.error.message ?? null })
      }
      const model = generatedToModel(r.value)
      if (isErr(model)) return err({ error: model.error, message: null })
      return model
    },
    // VAN (specs/103): baixa o arquivo QUE FOI AO BANCO. **Homologação apenas** — em produção o core-api
    // nem registra a rota (404 por ausência, não 403), porque o arquivo carrega o cadastro bancário de
    // todos os favorecidos do lote. Serve o objeto do bucket, nunca uma regeração.
    //
    // `x-van-object-key` vem pedido explicitamente: o PREFIXO é diagnóstico, não decoração — `falhas/`
    // significa que o envio não completou, e quem for comparar bytes com o banco precisa saber disso antes.
    //
    // Erro com mensagem, como na geração: `remittance-file-not-found` (404) e `remittance-file-corrupted`
    // (503) chegam colapsados pelo `sendDomainError`, e só o texto PT-BR distingue "não está no bucket" de
    // "achei, mas não é o arquivo emitido" — que num arquivo de pagamento é a diferença que importa.
    downloadRemittanceFile: async (
      remittanceId,
      token,
    ): Promise<Result<RemittanceFile, GenerateRemittanceFailure>> => {
      const r = await resultFetchBytes(`${baseUrl}/remittances/${remittanceId}/file`, {
        token,
        readHeaders: ['x-van-object-key'],
      })
      if (isErr(r)) {
        const detail = r.error.kind === 'http' ? parseErrorEnvelope(r.error.body) : null
        return err({ error: mapHttpError(r.error), message: detail?.error.message ?? null })
      }
      return ok({
        base64: r.value.base64,
        // Nome de reserva só se o core-api omitir o `content-disposition`: o arquivo precisa chegar ao
        // disco com algum nome, e o do backend é o que o banco espera.
        fileName: r.value.fileName ?? `remessa-${remittanceId}.rem`,
        objectKey: r.value.headers['x-van-object-key'] ?? null,
      })
    },
    getById: async (id, token) => {
      const r = await resultFetch<unknown>(`${docs}/${id}`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    getTimeline: async (id, token) => {
      const r = await resultFetch<unknown>(`${docs}/${id}/timeline`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return timelineToModel(r.value)
    },
    getSourceFile: async (id, token) => {
      // #568: comprovante-fonte INLINE (bytes) COM o token — nunca alcançável pelo browser (CA4). O client
      // recebe base64 + mimeType e monta o blob/File. Erro (404 sem anexo, 403 RBAC) → FinancialError.
      const r = await resultFetchBytes(`${docs}/${id}/source-file`, { token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return ok({ base64: r.value.base64, mimeType: r.value.contentType })
    },
    create: async (input, token) => {
      // #577: com comprovante → rota atômica dedicada (`/with-source-file` cria o doc JÁ com o anexo, Draft
      // OU Open); sem comprovante → create normal. O corpo é o mesmo (o `sourceFile` viaja no spread).
      const url = input.sourceFile !== undefined ? `${docs}/with-source-file` : docs
      const r = await resultFetch<unknown>(url, {
        method: 'POST',
        body: { asDraft: false, ...input }, // input.asDraft (rascunho) tem precedência
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    adjust: async (input, token) => {
      const { id, ...body } = input
      const r = await resultFetch<unknown>(`${docs}/${id}`, { method: 'PATCH', body, token })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    approve: async (input, token) => {
      const r = await resultFetch<unknown>(`${docs}/${input.id}/approve`, {
        method: 'POST',
        body: { version: input.version },
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    // #270: vencimento de UM título isolado (não propaga pai↔filhos). Devolve o documento atualizado.
    updatePayableDueDate: async (input, token) => {
      const r = await resultFetch<unknown>(`${docs}/${input.documentId}/payables/${input.payableId}`, {
        method: 'PATCH',
        body: {
          version: input.version,
          dueDate: input.dueDate,
          // core-api ADR-0063: a escrita passou para o título, e o lock foi junto — a version do
          // documento não protege mais. Este é o CAS de verdade.
          expectedDueDate: input.expectedDueDate,
        },
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    undoApproval: async (input, token) => {
      const r = await resultFetch<unknown>(`${docs}/${input.id}/undo-approval`, {
        method: 'POST',
        body: { version: input.version },
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    cancel: async (input, token) => {
      // O core-api exige `version` no corpo do DELETE (optimistic lock); versão defasada → 409.
      const r = await resultFetch<unknown>(`${docs}/${input.id}`, {
        method: 'DELETE',
        body: { version: input.version },
        token,
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return ok(undefined)
    },
    registerManualPayment: async (input, token) => {
      // #224: baixa manual de UM título. `version` = do documento (optimistic lock do agregado).
      const r = await resultFetch<unknown>(
        `${docs}/${input.documentId}/payables/${input.payableId}/manual-payment`,
        {
          method: 'POST',
          body: {
            version: input.version,
            ...(input.paidAt !== undefined ? { paidAt: input.paidAt } : {}),
            ...(input.reason !== undefined ? { reason: input.reason } : {}),
          },
          token,
        },
      )
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
  }
}
