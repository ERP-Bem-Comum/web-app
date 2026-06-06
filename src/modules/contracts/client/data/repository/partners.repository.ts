/**
 * PartnersRepository — porta do client para a busca de parceiros do contract-create.
 *
 * Consome a `searchPartnersFn` (BFF), que orquestra o fan-out dos 4 recursos do core-api
 * (suppliers/financiers/acts/collaborators) e devolve UMA lista pronta (ADR-0010). O client só
 * converte o Result do RPC e normaliza o `kind` para o tipo da UI.
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
  kind: 'Fornecedor' | 'Financiador' | 'Colaborador'
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
  // ACT não tem campo próprio no formulário (SelectedPartner só cobre 3 tipos) → exibe como Fornecedor
  // até o formulário/POST de contrato suportarem ACT.
  const kind = p.kind === 'ACT' ? 'Fornecedor' : p.kind
  // Documento de PJ (Fornecedor/Financiador/ACT) → cnpj; de PF (Colaborador) → cpf.
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
    return res.ok ? ok(res.data.map(toClientPartner)) : err(res.error)
  },
})
