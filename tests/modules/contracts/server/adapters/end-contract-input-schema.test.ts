/**
 * EndContractInputSchema (distrato #32) — validação de forma na borda da server fn.
 * TDD: motivo/data efetiva obrigatórios; fileName sem separador de path; fileBase64 não-vazio.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { EndContractInputSchema } from '#modules/contracts/server/adapters/contracts.schemas.ts'

const valid = {
  contractId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  fileBase64: 'JVBERi0=',
  fileName: 'distrato.pdf',
  terminatedAt: '2026-06-01',
  reason: 'Rescisão amigável.',
}

describe('EndContractInputSchema', () => {
  it('input válido → success', () => {
    assert.equal(EndContractInputSchema.safeParse(valid).success, true)
  })

  it('reason vazio → falha', () => {
    assert.equal(EndContractInputSchema.safeParse({ ...valid, reason: '' }).success, false)
  })

  it('terminatedAt vazio → falha', () => {
    assert.equal(EndContractInputSchema.safeParse({ ...valid, terminatedAt: '' }).success, false)
  })

  it('fileBase64 vazio → falha', () => {
    assert.equal(EndContractInputSchema.safeParse({ ...valid, fileBase64: '' }).success, false)
  })

  it('fileName com separador de caminho → falha', () => {
    assert.equal(EndContractInputSchema.safeParse({ ...valid, fileName: 'a/b.pdf' }).success, false)
  })

  it('contractId não-uuid → falha', () => {
    assert.equal(EndContractInputSchema.safeParse({ ...valid, contractId: 'x' }).success, false)
  })
})
