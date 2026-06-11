/**
 * end-contract.use-case (distrato #32) — orquestração PURA: upload(signed_termination) → end.
 * TDD: ordem obrigatória, idempotência em document-conflict, abort em outro erro de upload,
 * threading de terminatedAt/reason. Espelha attach-signed-document.use-case (upload → activate).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createEndContract } from '#modules/contracts/server/application/commands/end-contract.use-case.ts'
import { ok, err, isOk, isErr, type Result } from '#shared/primitives/result.ts'
import type { Contract } from '#modules/contracts/server/domain/contracts.types.ts'
import type { ContractsError } from '#modules/contracts/server/domain/contracts.types.ts'
import { mockContract } from '../../fixtures/contract.fixture.ts'

// O use-case só repassa o Contract devolvido pelo client; o shape não importa aqui. O fixture é o
// model do client (estruturalmente equivalente) — cast justificado para satisfazer o tipo do domínio.
const fakeContract = mockContract() as unknown as Contract

type Call = Readonly<{ name: string; args: readonly unknown[] }>

const makeClient = (over: Partial<{
  upload: Result<void, ContractsError>
  end: Result<Contract, ContractsError>
}> = {}) => {
  const calls: Call[] = []
  const client = {
    uploadTerminationDocument: (
      contractId: string,
      input: Readonly<{ bytes: Uint8Array; fileName: string }>,
      token: string,
    ): Promise<Result<void, ContractsError>> => {
      calls.push({ name: 'upload', args: [contractId, input.fileName, token] })
      return Promise.resolve(over.upload ?? ok(undefined))
    },
    endContract: (
      contractId: string,
      terminatedAt: string,
      reason: string,
      token: string,
    ): Promise<Result<Contract, ContractsError>> => {
      calls.push({ name: 'end', args: [contractId, terminatedAt, reason, token] })
      return Promise.resolve(over.end ?? ok(fakeContract))
    },
  }
  return { client, calls }
}

const command = {
  contractId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
  fileName: 'distrato.pdf',
  terminatedAt: '2026-06-01',
  reason: 'Rescisão amigável conforme cláusula 12.',
}

describe('createEndContract (distrato)', () => {
  it('upload ok → chama end com (contractId, terminatedAt, reason) e devolve o resultado', async () => {
    const { client, calls } = makeClient()
    const r = await createEndContract({ client })(command, 'tok')
    assert.equal(isOk(r), true)
    assert.deepEqual(calls.map((c) => c.name), ['upload', 'end'])
    assert.deepEqual(calls[1]?.args, ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06-01', 'Rescisão amigável conforme cláusula 12.', 'tok'])
  })

  it('document-conflict no upload → idempotente: segue para o end', async () => {
    const { client, calls } = makeClient({ upload: err('document-conflict') })
    const r = await createEndContract({ client })(command, 'tok')
    assert.equal(isOk(r), true)
    assert.deepEqual(calls.map((c) => c.name), ['upload', 'end'])
  })

  it('outro erro de upload → aborta, NÃO chama end', async () => {
    const { client, calls } = makeClient({ upload: err('storage-unavailable') })
    const r = await createEndContract({ client })(command, 'tok')
    assert.equal(isErr(r) && r.error === 'storage-unavailable', true)
    assert.deepEqual(calls.map((c) => c.name), ['upload'])
  })

  it('erro do end (terminate-no-document) é propagado', async () => {
    const { client } = makeClient({ end: err('terminate-no-document') })
    const r = await createEndContract({ client })(command, 'tok')
    assert.equal(isErr(r) && r.error === 'terminate-no-document', true)
  })
})
