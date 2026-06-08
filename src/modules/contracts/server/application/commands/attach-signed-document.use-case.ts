/**
 * attachSignedDocument — orquestra a efetivação do contrato pela inclusão do documento assinado.
 * Ordem OBRIGATÓRIA (core-api): (1) upload do PDF assinado → (2) activate (Pendente → Em Andamento).
 * Idempotência (R4): se o upload falhar por documento já existente (`document-conflict`), seguimos para
 * a ativação mesmo assim; qualquer outro erro de upload aborta e o contrato permanece Pendente.
 */
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'

type Deps = Readonly<{
  client: Readonly<{
    uploadDocument: (
      contractId: string,
      input: Readonly<{ bytes: Uint8Array; fileName: string }>,
      token: string,
    ) => Promise<Result<void, ContractsError>>
    activate: (contractId: string, signedAtIso: string, token: string) => Promise<Result<Contract, ContractsError>>
  }>
}>

export type AttachSignedDocumentCommand = Readonly<{
  contractId: string
  bytes: Uint8Array
  fileName: string
  signedAt: Date
}>

export const createAttachSignedDocument = (deps: Deps) =>
  async (input: AttachSignedDocumentCommand, token: string): Promise<Result<Contract, ContractsError>> => {
    const uploaded = await deps.client.uploadDocument(
      input.contractId,
      { bytes: input.bytes, fileName: input.fileName },
      token,
    )
    if (isErr(uploaded) && uploaded.error !== 'document-conflict') return err(uploaded.error)
    // Date-only (YYYY-MM-DD) — formato validado contra o core-api e convenção do BFF (datas via slice(0,10)).
    const signedAtDate = input.signedAt.toISOString().slice(0, 10)
    return deps.client.activate(input.contractId, signedAtDate, token)
  }
