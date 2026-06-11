/**
 * Status `Cancelled`/`Cancelado` + slug 409 `ContractNotPending` (§1.7 — cancelamento).
 * node:test puro (imports `#`). Cobre:
 *  - statusApiToDomain('Cancelled') === 'Cancelado' (antes caía no fallback 'Finalizado').
 *  - statusDomainToApi('Cancelado') === 'Cancelled'.
 *  - SLUG_TO_ERROR 'ContractNotPending'/'contract-not-pending' → 'contract-not-pending'.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  statusApiToDomain,
  statusDomainToApi,
  SLUG_TO_ERROR,
} from '#modules/contracts/server/adapters/core-api/core-api-contracts.ts'

describe('status Cancelled ↔ Cancelado', () => {
  it('statusApiToDomain mapeia Cancelled → Cancelado', () => {
    assert.strictEqual(statusApiToDomain('Cancelled'), 'Cancelado')
  })

  it('statusApiToDomain mantém os demais status conhecidos', () => {
    assert.strictEqual(statusApiToDomain('Pending'), 'Pendente')
    assert.strictEqual(statusApiToDomain('Active'), 'Em Andamento')
    assert.strictEqual(statusApiToDomain('Expired'), 'Finalizado')
    assert.strictEqual(statusApiToDomain('Terminated'), 'Distrato')
  })

  it('statusApiToDomain degrada status desconhecido para Finalizado (terminal seguro)', () => {
    assert.strictEqual(statusApiToDomain('Voodoo'), 'Finalizado')
  })

  it('statusDomainToApi mapeia Cancelado → Cancelled', () => {
    assert.strictEqual(statusDomainToApi('Cancelado'), 'Cancelled')
  })
})

describe('SLUG_TO_ERROR — 409 ContractNotPending', () => {
  it('mapeia ContractNotPending → contract-not-pending', () => {
    assert.strictEqual(SLUG_TO_ERROR.ContractNotPending, 'contract-not-pending')
  })

  it('mapeia contract-not-pending → contract-not-pending', () => {
    assert.strictEqual(SLUG_TO_ERROR['contract-not-pending'], 'contract-not-pending')
  })
})
