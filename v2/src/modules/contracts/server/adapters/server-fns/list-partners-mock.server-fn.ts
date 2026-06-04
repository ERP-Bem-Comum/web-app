import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'

export const PartnerKindSchema = z.enum(['Supplier', 'Financier', 'Collaborator', 'ACT'])
export type PartnerKind = z.infer<typeof PartnerKindSchema>

export const PartnerMockSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  cnpj: z.string().trim().optional(),
  cpf: z.string().trim().optional(),
  email: z.email().optional(),
  telephone: z.string().trim().optional(),
  kind: PartnerKindSchema,
})
export type PartnerMock = z.infer<typeof PartnerMockSchema>

const ListPartnersInputSchema = z.object({
  query: z.string().trim().optional(),
  kind: PartnerKindSchema.optional(),
})

const MOCK_PARTNERS: readonly PartnerMock[] = [
  {
    id: 'p1',
    name: 'Empresa ABC Ltda',
    cnpj: '12.345.678/0001-90',
    email: 'contato@empresaabc.com.br',
    telephone: '(11) 3456-7890',
    kind: 'Supplier',
  },
  {
    id: 'p2',
    name: 'João Silva',
    cpf: '123.456.789-00',
    email: 'joao.silva@email.com',
    telephone: '(11) 98765-4321',
    kind: 'Collaborator',
  },
  {
    id: 'p3',
    name: 'Banco do Futuro SA',
    cnpj: '98.765.432/0001-10',
    email: 'relacionamento@bancofuturo.com.br',
    telephone: '(21) 3004-5678',
    kind: 'Financier',
  },
  {
    id: 'p4',
    name: 'Associação Comunitária Terra',
    cnpj: '11.222.333/0001-44',
    email: 'act@comunidadeterra.org.br',
    telephone: '(31) 3333-4444',
    kind: 'ACT',
  },
] as const

export type ListPartnersFnResult =
  | Readonly<{ ok: true; data: readonly PartnerMock[] }>
  | Readonly<{ ok: false; error: 'unauthorized' }>

export const listPartnersMockFn = createServerFn({ method: 'GET' })
  .inputValidator(ListPartnersInputSchema)
  .handler(async ({ data }): Promise<ListPartnersFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    let results = [...MOCK_PARTNERS]

    if (data.kind) {
      results = results.filter((p) => p.kind === data.kind)
    }

    if (data.query && data.query.length >= 2) {
      const q = data.query.toLowerCase()
      const rawQuery = data.query
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.cnpj?.includes(rawQuery) ?? false) ||
          (p.cpf?.includes(rawQuery) ?? false),
      )
    }

    return { ok: true, data: results }
  })
