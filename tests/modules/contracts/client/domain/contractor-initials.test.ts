import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { contractorInitials } from '../../../../../src/modules/contracts/client/domain/format.ts'

describe('contractorInitials', () => {
  it('usa a primeira + ÚLTIMA inicial do nome (ex.: Harry Potter → HP, João da Silva → JS)', () => {
    assert.equal(contractorInitials('Maria Aparecida Costa'), 'MC')
    assert.equal(contractorInitials('João Silva Souza'), 'JS')
    assert.equal(contractorInitials('Harry Potter'), 'HP')
    assert.equal(contractorInitials('João da Silva'), 'JS')
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
