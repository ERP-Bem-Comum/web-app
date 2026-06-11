import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { formatMask, unmask } from '../../../../../src/shared/ui/atoms/input/input.mask.ts'

describe('input.mask', () => {
  it('Agência: 4 dígitos + DV opcional (5º)', () => {
    assert.equal(formatMask('agency', '12'), '12') // progressivo
    assert.equal(formatMask('agency', '1234'), '1234') // 4 dígitos, sem DV
    assert.equal(formatMask('agency', '12345'), '1234-5') // 5º dígito = DV
    assert.equal(formatMask('agency', '1234-5'), '1234-5') // idempotente
    assert.equal(formatMask('agency', '123456789'), '1234-5') // trunca além de 5
  })

  it('CPF: progressivo e completo', () => {
    assert.equal(formatMask('cpf', '390'), '390')
    assert.equal(formatMask('cpf', '39053344705'), '390.533.447-05')
    // idempotente (entrada já mascarada)
    assert.equal(formatMask('cpf', '390.533.447-05'), '390.533.447-05')
    // trunca além de 11 dígitos
    assert.equal(formatMask('cpf', '3905334470599'), '390.533.447-05')
  })

  it('CNPJ: completo e idempotente', () => {
    assert.equal(formatMask('cnpj', '11444777000161'), '11.444.777/0001-61')
    assert.equal(formatMask('cnpj', '11.444.777/0001-61'), '11.444.777/0001-61')
  })

  it('cpf-cnpj: escolhe pelo tamanho', () => {
    assert.equal(formatMask('cpf-cnpj', '39053344705'), '390.533.447-05')
    assert.equal(formatMask('cpf-cnpj', '11444777000161'), '11.444.777/0001-61')
  })

  it('telefone: 11 dígitos (celular) e 10 dígitos (fixo)', () => {
    assert.equal(formatMask('phone', '11999998888'), '(11) 99999-8888')
    assert.equal(formatMask('phone', '1133334444'), '(11) 3333-4444')
    assert.equal(formatMask('phone', '11'), '(11')
  })

  it('unmask: extrai só os dígitos', () => {
    assert.equal(unmask('390.533.447-05'), '39053344705')
    assert.equal(unmask('(11) 99999-8888'), '11999998888')
    assert.equal(unmask(''), '')
  })
})
