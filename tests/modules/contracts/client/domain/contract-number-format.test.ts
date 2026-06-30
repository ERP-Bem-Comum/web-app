import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { formatContractNumber } from '../../../../../src/modules/contracts/client/domain/format.ts'

// T003 (019): prefixo CT/OS conforme a classificação real do backend (#32) — não mais "CT" fixo.
describe('formatContractNumber — classificação CT/OS', () => {
  it('Contrato → prefixo CT, sequencial com 4 dígitos', () => {
    assert.equal(formatContractNumber('1/2026', 'Contract'), 'CT 0001/2026')
    assert.equal(formatContractNumber('941/2026', 'Contract'), 'CT 0941/2026')
  })

  it('Ordem de Serviço → prefixo OS', () => {
    assert.equal(formatContractNumber('12/2026', 'ServiceOrder'), 'OS 0012/2026')
    // tolera o valor cru CT/OS vindo de outras camadas
    assert.equal(formatContractNumber('7/2026', 'OS'), 'OS 0007/2026')
  })

  it('sem classificação → default CT (não quebra)', () => {
    assert.equal(formatContractNumber('5/2026'), 'CT 0005/2026')
  })

  it('formato legado com hífen continua suportado', () => {
    assert.equal(formatContractNumber('CT-2026-0007'), 'CT 0007/2026')
  })
})
