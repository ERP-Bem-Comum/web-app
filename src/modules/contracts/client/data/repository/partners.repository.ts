/**
 * PartnersRepository — porta do client para a busca de parceiros do contract-create.
 *
 * Consome a `searchPartnersFn` (BFF), que chama o agregador `GET /api/v1/partners` do core-api
 * (lista unificada dos 4 tipos: suppliers/financiers/acts/collaborators) e devolve UMA lista pronta
 * (ADR-0010). O client só converte o Result do RPC e normaliza o `kind` para o tipo da UI.
 *
 * Nota: a busca devolve dados de LISTA (sem `bancaryInfo`/`pixInfo` — esses só vêm no detalhe de cada
 * recurso). E o `POST /contracts` ainda não aceita vínculo de parceiro, então a seleção é informativa.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'

export type PartnerKind = 'Supplier' | 'Financier' | 'Collaborator' | 'ACT'

export type PartnersError = 'unauthorized' | 'connectivity' | 'server'

export type PartnerSearchResult = Readonly<{
  id: string
  name: string
  cnpj?: string
  cpf?: string
  email?: string
  telephone?: string
  kind: 'Fornecedor' | 'Financiador' | 'Colaborador' | 'Acordo'
  bancaryInfo?: Readonly<{
    bank: string
    agency: string
    accountNumber: string
    dv: string
  }>
  pixInfo?: Readonly<{
    keyType: string
    key: string
  }>
}>

// Item entregue pela query.fn (já normalizado pelo BFF).
type SearchedPartner = Readonly<{
  id: string
  name: string
  document?: string
  email?: string
  telephone?: string
  kind: 'Fornecedor' | 'Financiador' | 'Colaborador' | 'ACT'
}>

type SearchPartnersFn = (opts: {
  data: { query?: string; kind?: PartnerKind }
}) => Promise<
  | Readonly<{ ok: true; data: readonly SearchedPartner[] }>
  | Readonly<{ ok: false; error: PartnersError }>
>

export type PartnersRepository = Readonly<{
  search: (query: string, kind?: PartnerKind) => Promise<Result<readonly PartnerSearchResult[], PartnersError>>
}>

const toClientPartner = (p: SearchedPartner): PartnerSearchResult => {
  // ACT = Acordo de Cooperação Técnica (PJ/CNPJ) — selecionável como contratado (#32 aceita type='act').
  const kind = p.kind === 'ACT' ? 'Acordo' : p.kind
  // Documento de PJ (Fornecedor/Financiador/Acordo) → cnpj; de PF (Colaborador) → cpf.
  const isPF = p.kind === 'Colaborador'
  return {
    id: p.id,
    name: p.name,
    cnpj: isPF ? undefined : p.document,
    cpf: isPF ? p.document : undefined,
    email: p.email,
    telephone: p.telephone,
    kind,
  }
}

export const createPartnersRepository = (deps: Readonly<{
  searchPartnersFn: SearchPartnersFn
}>): PartnersRepository => ({
  search: async (query, kind) => {
    const res = await deps.searchPartnersFn({ data: { query: query || undefined, kind } })
    if (!res.ok) return err(res.error)
    // Os 4 tipos (inclui Acordo/ACT) são selecionáveis como contratado — o create threada actId e o
    // #32 aceita contractor.type='act'.
    const items = res.data.map(toClientPartner)
    return ok(items)
  },
})
