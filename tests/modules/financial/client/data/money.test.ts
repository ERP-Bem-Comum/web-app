/**
 * money — reais↔centavos + formatação BRL (puro, node:test). Importa a fonte por caminho relativo
 * (convenção dos testes puros; os `#alias` da fonte resolvem via package.json "imports").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  centsToBRL,
  reaisToCents,
  sumCents,
  maskMoneyBRL,
} from '../../../../../src/modules/financial/client/data/money.ts'
import { isOk, isErr } from '../../../../../src/shared/primitives/result.ts'

describe('centsToBRL', () => {
  it('formata string de centavos em BRL', () => {
    assert.equal(centsToBRL('150050'), 'R$ 1.500,50')
    assert.equal(centsToBRL('793500'), 'R$ 7.935,00')
    assert.equal(centsToBRL(0), 'R$ 0,00')
  })

  it('degrada vazio/inválido para R$ 0,00', () => {
    assert.equal(centsToBRL(''), 'R$ 0,00')
    assert.equal(centsToBRL('abc'), 'R$ 0,00')
  })
})

describe('reaisToCents', () => {
  it('aceita máscara e converte para centavos', () => {
    for (const raw of ['R$ 1.500,50', '1.500,50', '1500,50']) {
      const r = reaisToCents(raw)
      assert.equal(isOk(r) && r.value, '150050')
    }
  })

  it('inteiro sem decimal vira centavos', () => {
    const r = reaisToCents('1500')
    assert.equal(isOk(r) && r.value, '150000')
  })

  it('rejeita entrada inválida', () => {
    for (const raw of ['', 'abc', '1,2,3', 'R$']) {
      assert.equal(isErr(reaisToCents(raw)), true)
    }
  })
})

describe('maskMoneyBRL (entrada decimal → BRL)', () => {
  it('agrupa milhar e prefixa R$ mantendo o valor em reais', () => {
    assert.equal(maskMoneyBRL('540'), 'R$ 540')
    assert.equal(maskMoneyBRL('1234'), 'R$ 1.234')
    assert.equal(maskMoneyBRL('1234,56'), 'R$ 1.234,56')
  })
  it('limita a 2 casas decimais e descarta lixo', () => {
    assert.equal(maskMoneyBRL('1234,567'), 'R$ 1.234,56')
    assert.equal(maskMoneyBRL('R$ 1.234,56'), 'R$ 1.234,56') // idempotente
  })
  it('vazio → "" (deixa o placeholder)', () => {
    assert.equal(maskMoneyBRL(''), '')
    assert.equal(maskMoneyBRL('R$ '), '')
  })
  it('o resultado volta intacto por reaisToCents (entrada = valor em reais)', () => {
    const r = reaisToCents(maskMoneyBRL('540'))
    assert.equal(isOk(r) && r.value, '54000') // R$ 540,00
  })
})

describe('sumCents', () => {
  it('soma centavos (CSRF = PIS+COFINS+CSLL)', () => {
    // 65,00 + 300,00 + 100,00 = 465,00
    assert.equal(sumCents('6500', '30000', '10000'), '46500')
  })

  it('trata indefinido/vazio como zero', () => {
    assert.equal(sumCents('1000', undefined, ''), '1000')
    assert.equal(sumCents(), '0')
  })
})
