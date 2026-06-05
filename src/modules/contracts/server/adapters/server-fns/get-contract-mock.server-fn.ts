import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

const GetContractMockInputSchema = z.object({ id: z.string().trim() })

export type GetContractMockFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

export const MOCK_CONTRACT: Contract = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  sequentialNumber: '0001/2026',
  title: 'Prestação de Serviços de Consultoria em TI',
  objective: 'Consultoria especializada em arquitetura de software, desenvolvimento de sistemas e suporte técnico para o ERP Bem Comum.',
  originalValue: { cents: 150_000_00 },
  originalPeriod: { start: new Date('2026-01-15'), end: new Date('2026-12-31') },
  status: 'Em Andamento',
  signedAt: new Date('2026-01-20'),
  currentValue: { cents: 165_000_00 },
  currentPeriod: { start: new Date('2026-01-15'), end: new Date('2027-03-31') },
  endedAt: null,
  classification: 'Contract',
  contractModel: 'Service',
  contractType: 'Supplier',
  supplierId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  supplier: {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Empresa ABC Ltda',
    document: '12.345.678/0001-90',
    email: 'contato@empresaabc.com.br',
    telephone: '(11) 3456-7890',
  },
  programId: 1,
  program: { id: 1, name: 'Educação Básica' },
  budgetPlanId: 1,
  budgetPlan: { id: 1, scenarioName: 'Plano Anual 2026', year: 2026, version: 1 },
  categorizacao: 'Operacional',
  centroDeCusto: 'Serviços Gerais',
  observations: 'Contrato de primeira assinatura. Revisão anual prevista para dezembro.',
  email: 'contato@empresaabc.com.br',
  telephone: '(11) 3456-7890',
  origin: 'Manual',
  createdAt: new Date('2026-01-10'),
  updatedAt: new Date('2026-01-20'),
  children: [
    {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      amendmentNumber: '001',
      type: 'valor',
      description: 'Reajuste de 10% por índice de mercado',
      impactValueCents: 15_000_00,
      newEndDate: new Date('2027-03-31'),
      startDate: new Date('2026-06-01'),
      status: 'Homologado',
      signedAt: new Date('2026-06-05'),
      signedContractUrl: 'https://example.com/aditivo-001.pdf',
      createdAt: new Date('2026-05-20'),
    },
    {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      amendmentNumber: '002',
      type: 'prazo',
      description: 'Prorrogação de vigência por mais 3 meses',
      impactValueCents: 0,
      newEndDate: new Date('2027-06-30'),
      startDate: new Date('2027-03-01'),
      status: 'Pendente',
      signedAt: undefined,
      signedContractUrl: undefined,
      createdAt: new Date('2026-11-10'),
    },
  ],
  files: [
    {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      name: 'contrato-base-001.pdf',
      url: 'https://example.com/contrato-base-001.pdf',
      size: 2_450_000,
      uploadedAt: new Date('2026-01-20'),
      uploadedBy: 'admin@bemcomum.dev',
    },
  ],
} as const

export const getContractMockFn = createServerFn({ method: 'GET' })
  .inputValidator(GetContractMockInputSchema)
  .handler(async ({ data }): Promise<GetContractMockFnResult> => {
    // Dev-only mock: autenticação desabilitada para facilitar testes locais
    // Sempre retorna o mock independente do ID (para dev/teste)
    return { ok: true, data: { ...MOCK_CONTRACT, id: data.id } }
  })
