import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { contractorInitials } from '../../../../../src/modules/contracts/client/domain/format.ts'

describe('contractorInitials', () => {
  it('usa a primeira + segunda inicial do nome (não a última)', () => {
    assert.equal(contractorInitials('Maria Aparecida Costa'), 'MA')
    assert.equal(contractorInitials('João Silva Souza'), 'JS')
  })

  it('nome de uma só palavra → duas primeiras letras', () => {
    assert.equal(contractorInitials('Construtora'), 'CO')
  })

  it('normaliza espaços e caixa', () => {
    assert.equal(contractorInitials('  ana  beatriz  '), 'AB')
  })

  it('vazio → string vazia', () => {
    assert.equal(contractorInitials('   '), '')
    assert.equal(contractorInitials(''), '')
  })
})
