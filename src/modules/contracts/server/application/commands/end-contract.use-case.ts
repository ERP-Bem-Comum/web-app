/**
 * endContract — distrato (#32): encerra o contrato (status Terminated/Distrato).
 * Ordem OBRIGATÓRIA (core-api): (1) upload do PDF como `signed_termination` → (2) POST /end
 * { kind:'Terminate', terminatedAt, reason }. Espelha attach-signed-document (upload → activate).
 * Idempotência: upload por documento já existente (`document-conflict`) NÃO aborta o encerramento;
 * qualquer outro erro de upload aborta e o contrato segue Ativo.
 */
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'

type Deps = Readonly<{
  client: Readonly<{
    uploadTerminationDocument: (
      contractId: string,
      input: Readonly<{ bytes: Uint8Array; fileName: string }>,
      token: string,
    ) => Promise<Result<void, ContractsError>>
    endContract: (
      contractId: string,
      terminatedAt: string,
      reason: string,
      token: string,
    ) => Promise<Result<Contract, ContractsError>>
  }>
}>

export type EndContractCommand = Readonly<{
  contractId: string
  bytes: Uint8Array
  fileName: string
  // Data efetiva (YYYY-MM-DD, não-futura) + motivo — exigidos pelo /end Terminate do #32.
  terminatedAt: string
  reason: string
}>

export const createEndContract = (deps: Deps) =>
  async (input: EndContractCommand, token: string): Promise<Result<Contract, ContractsError>> => {
    const up = await deps.client.uploadTerminationDocument(
      input.contractId,
      { bytes: input.bytes, fileName: input.fileName },
      token,
    )
    if (isErr(up) && up.error !== 'document-conflict') return err(up.error)
    return deps.client.endContract(input.contractId, input.terminatedAt, input.reason, token)
  }
