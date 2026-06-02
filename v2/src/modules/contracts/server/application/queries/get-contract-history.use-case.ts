import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

export type ContractHistoryEvent = Readonly<{
  eventId: string
  contractId: string
  kind: string
  description: string
  occurredAt: string
  userName?: string
  metadata?: Record<string, string | number | boolean | null>
}>

type Deps = Readonly<{
  client: Readonly<{
    getHistory: (id: string, token: string) => Promise<Result<unknown, ContractsError>>
  }>
}>

export const createGetContractHistory = (deps: Deps) =>
  async (id: string, token: string): Promise<Result<readonly ContractHistoryEvent[], ContractsError>> => {
    const r = await deps.client.getHistory(id, token)
    if (isErr(r)) return err(r.error)
    return ok((r.value as { events: ContractHistoryEvent[] }).events)
  }
