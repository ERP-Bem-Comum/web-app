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
  bancaryInfo: z.object({
    bank: z.string().trim(),
    agency: z.string().trim(),
    accountNumber: z.string().trim(),
    dv: z.string().trim(),
  }).optional(),
  pixInfo: z.object({
    keyType: z.string().trim(),
    key: z.string().trim(),
  }).optional(),
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
    bancaryInfo: { bank: '001', agency: '1234', accountNumber: '56789', dv: '0' },
    pixInfo: { keyType: 'CNPJ', key: '12.345.678/0001-90' },
  },
  {
    id: 'p2',
    name: 'João Silva',
    cpf: '123.456.789-00',
    email: 'joao.silva@email.com',
    telephone: '(11) 98765-4321',
    kind: 'Collaborator',
    bancaryInfo: { bank: '104', agency: '4321', accountNumber: '98765', dv: '1' },
    pixInfo: { keyType: 'CPF', key: '123.456.789-00' },
  },
  {
    id: 'p3',
    name: 'Banco do Futuro SA',
    cnpj: '98.765.432/0001-10',
    email: 'relacionamento@bancofuturo.com.br',
    telephone: '(21) 3004-5678',
    kind: 'Financier',
    bancaryInfo: { bank: '341', agency: '9999', accountNumber: '11111', dv: '9' },
    pixInfo: { keyType: 'CNPJ', key: '98.765.432/0001-10' },
  },
  {
    id: 'p4',
    name: 'Associação Comunitária Terra',
    cnpj: '11.222.333/0001-44',
    email: 'act@comunidadeterra.org.br',
    telephone: '(31) 3333-4444',
    kind: 'ACT',
    bancaryInfo: { bank: '237', agency: '5555', accountNumber: '22222', dv: '2' },
    pixInfo: { keyType: 'CNPJ', key: '11.222.333/0001-44' },
  },
] as const

export type ListPartnersFnResult =
  | Readonly<{ ok: true; data: readonly PartnerMock[] }>
  | Readonly<{ ok: false; error: 'unauthorized' }>

export const listPartnersMockFn = createServerFn({ method: 'GET' })
  .inputValidator(ListPartnersInputSchema)
  .handler(async ({ data }): Promise<ListPartnersFnResult> => {
    // Dev-only mock: autenticação desabilitada para facilitar testes locais
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
