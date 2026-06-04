/**
 * PartnersRepository — porta do client para o BFF (server functions mock).
 * Converte Result do RPC para Result do client.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  PartnerMock,
  PartnerKind,
} from '#modules/contracts/server/adapters/server-fns/list-partners-mock.server-fn.ts'

export type PartnersError = 'unauthorized'

export type PartnerSearchResult = Readonly<{
  id: string
  name: string
  cnpj?: string
  cpf?: string
  email?: string
  telephone?: string
  kind: 'Fornecedor' | 'Financiador' | 'Colaborador'
}>

type ListPartnersMockFn = (opts: {
  data: { query?: string; kind?: PartnerKind }
}) => Promise<
  | Readonly<{ ok: true; data: readonly PartnerMock[] }>
  | Readonly<{ ok: false; error: PartnersError }>
>

export type PartnersRepository = Readonly<{
  search: (query: string, kind?: PartnerKind) => Promise<Result<readonly PartnerSearchResult[], PartnersError>>
}>

const toClientPartner = (p: PartnerMock): PartnerSearchResult => ({
  id: p.id,
  name: p.name,
  cnpj: p.cnpj,
  cpf: p.cpf,
  email: p.email,
  telephone: p.telephone,
  kind: p.kind === 'Supplier' ? 'Fornecedor'
    : p.kind === 'Financier' ? 'Financiador'
    : p.kind === 'Collaborator' ? 'Colaborador'
    : 'Fornecedor',
})

export const createPartnersRepository = (deps: Readonly<{
  listPartnersMockFn: ListPartnersMockFn
}>): PartnersRepository => ({
  search: async (query, kind) => {
    const res = await deps.listPartnersMockFn({ data: { query: query || undefined, kind } })
    return res.ok ? ok(res.data.map(toClientPartner)) : err(res.error)
  },
})
