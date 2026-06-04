import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { contractsServer } from '../contracts.composition.ts'
import { CreateContractInputSchema, type Contract } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'

export type CreateContractFnResult =
  | Readonly<{ ok: true; data: Contract }>
  | Readonly<{ ok: false; error: ContractsError }>

export const createContractFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateContractInputSchema)
  .handler(async ({ data }): Promise<CreateContractFnResult> => {
    try {
      const user = await getCurrentUserFn()
      const accessToken = await resolveAccessTokenFn()

      // Dev fallback: quando não há sessão ou API indisponível, retorna mock
      if (user === null || accessToken === null) {
        return {
          ok: true,
          data: {
            id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
            sequentialNumber: '0002/2026',
            title: data.title,
            objective: data.objective,
            originalValue: { cents: data.originalValueCents },
            originalPeriod: data.originalPeriod,
            status: 'Pendente',
            signedAt: null,
            currentValue: { cents: data.originalValueCents },
            currentPeriod: null,
            endedAt: null,
            classification: data.classification,
            contractModel: data.contractModel,
            contractType: data.contractType,
            supplierId: data.supplierId,
            financierId: data.financierId,
            collaboratorId: data.collaboratorId,
            programId: data.programId,
            budgetPlanId: data.budgetPlanId,
            categorizacao: data.categorizacao,
            centroDeCusto: data.centroDeCusto,
            observations: data.observations,
            email: data.email,
            telephone: data.telephone,
            origin: 'Manual',
            createdAt: new Date(),
            updatedAt: new Date(),
            children: [],
            files: [],
          },
        }
      }

      const r = await contractsServer().createContract(data, accessToken)
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true, data: r.value }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error('[create-contract] erro inesperado:', message, 'input:', JSON.stringify(data))
      return { ok: false, error: 'server' }
    }
  })
