/**
 * attachAmendmentDocument — anexa o documento assinado a um aditivo Pendente e o homologa (→ efeito).
 * Ordem obrigatória (core-api): upload do signed_amendment → homologate (parsePendingWithDocument).
 * Idempotência: se o documento já existir (`document-conflict`), segue para a homologação.
 */
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'

type Deps = Readonly<{
  client: Readonly<{
    uploadAmendmentDocument: (
      contractId: string,
      amendmentId: string,
      input: Readonly<{ bytes: Uint8Array; fileName: string }>,
      token: string,
    ) => Promise<Result<void, ContractsError>>
    homologateAmendment: (contractId: string, amendmentId: string, homologatedBy: string, token: string) => Promise<Result<Contract, ContractsError>>
  }>
}>

export type AttachAmendmentDocumentCommand = Readonly<{
  contractId: string
  amendmentId: string
  bytes: Uint8Array
  fileName: string
  homologatedBy: string
}>

export const createAttachAmendmentDocument = (deps: Deps) =>
  async (input: AttachAmendmentDocumentCommand, token: string): Promise<Result<Contract, ContractsError>> => {
    const up = await deps.client.uploadAmendmentDocument(
      input.contractId,
      input.amendmentId,
      { bytes: input.bytes, fileName: input.fileName },
      token,
    )
    if (isErr(up) && up.error !== 'document-conflict') return err(up.error)
    return deps.client.homologateAmendment(input.contractId, input.amendmentId, input.homologatedBy, token)
  }
