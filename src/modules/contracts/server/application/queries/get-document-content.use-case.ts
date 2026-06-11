import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'

export type DocumentContentOutput = Readonly<{ bytes: Uint8Array; fileName: string; contentType: string }>

type Deps = Readonly<{
  client: Readonly<{
    getDocumentContent: (
      contractId: string,
      documentId: string,
      token: string,
    ) => Promise<Result<DocumentContentOutput, ContractsError>>
  }>
}>

export const createGetDocumentContent = (deps: Deps) =>
  async (contractId: string, documentId: string, token: string): Promise<Result<DocumentContentOutput, ContractsError>> => {
    const r = await deps.client.getDocumentContent(contractId, documentId, token)
    if (isErr(r)) return err(r.error)
    return ok(r.value)
  }
