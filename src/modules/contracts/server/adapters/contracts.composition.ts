/**
 * Composition root do server/contracts. Monta use-cases com deps reais.
 * Env é lido DENTRO da função (nunca em escopo de módulo).
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiContractsClient } from './core-api/core-api-contracts.ts'
import { createListContracts } from '../application/queries/list-contracts.use-case.ts'
import { createGetContract } from '../application/queries/get-contract.use-case.ts'
import { createCreateContract } from '../application/commands/create-contract.use-case.ts'
import { createUpdateContract } from '../application/commands/update-contract.use-case.ts'
import { createCreateAmendment } from '../application/commands/create-amendment.use-case.ts'
import { createGetContractHistory } from '../application/queries/get-contract-history.use-case.ts'
import { createAttachSignedDocument } from '../application/commands/attach-signed-document.use-case.ts'
import { createAttachAmendmentDocument } from '../application/commands/attach-amendment-document.use-case.ts'
import { createEndContract } from '../application/commands/end-contract.use-case.ts'
import { createCancelContract } from '../application/commands/cancel-contract.use-case.ts'
import { createGetDocumentContent } from '../application/queries/get-document-content.use-case.ts'

type ContractsServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiContractsClient(coreApiBase(env.CORE_API_URL, 'v2'))

  return {
    listContracts: createListContracts({ client }),
    getContract: createGetContract({ client }),
    createContract: createCreateContract({ client }),
    updateContract: createUpdateContract({ client }),
    createAmendment: createCreateAmendment({ client }),
    getContractHistory: createGetContractHistory({ client }),
    attachSignedDocument: createAttachSignedDocument({ client }),
    attachAmendmentDocument: createAttachAmendmentDocument({ client }),
    endContract: createEndContract({ client }),
    cancelContract: createCancelContract({ client }),
    getDocumentContent: createGetDocumentContent({ client }),
  }
}

let cached: ContractsServer | undefined
export const contractsServer = (): ContractsServer => (cached ??= build())
