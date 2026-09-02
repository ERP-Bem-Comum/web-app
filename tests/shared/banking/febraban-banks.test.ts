/**
 * Tabela de bancos (código de compensação FEBRABAN) — a fonte única do seletor de banco do produto.
 *
 * O que estes testes protegem, em ordem de gravidade: (1) que os 12 códigos que a Conciliação já usava
 * continuem resolvendo — uma conta-cedente cadastrada antes desta mudança guarda um deles, e sumir da
 * tabela transformaria a conta num banco em branco na tela; (2) que todo código seja 3 dígitos e único,
 * porque é isso que o CNAB 240 grava em posição fixa; (3) que `toBankCode` NUNCA adivinhe por nome —
 * converter "Banco Santander" no código errado é pagamento recusado, e o certo é devolver `null` e
 * deixar a pessoa escolher.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  FEBRABAN_BANKS,
  FREQUENT_BANKS,
  bankNameByCode,
  bankLabel,
  toBankCode,
} from '#shared/banking/febraban-banks.ts'

/** A lista curada que a Conciliação usava antes da tabela completa (#206). */
const LEGACY_CURATED = ['001', '033', '077', '104', '212', '237', '260', '336', '341', '422', '748', '756']

describe('febraban-banks · tabela', () => {
  it('não regride: os 12 códigos da lista curada antiga continuam na tabela', () => {
    for (const code of LEGACY_CURATED) {
      assert.notEqual(bankNameByCode(code), undefined, `código ${code} sumiu da tabela`)
    }
  })

  it('todo código tem exatamente 3 dígitos (o CNAB grava em posição fixa)', () => {
    for (const b of FEBRABAN_BANKS) assert.match(b.code, /^\d{3}$/, `código inválido: ${b.code}`)
  })

  it('não há código repetido', () => {
    const codes = FEBRABAN_BANKS.map((b) => b.code)
    assert.equal(new Set(codes).size, codes.length)
  })

  it('todo banco tem nome não vazio', () => {
    for (const b of FEBRABAN_BANKS) assert.notEqual(b.name.trim(), '', `banco ${b.code} sem nome`)
  })

  it('está ordenada por código (o type-ahead do <select> depende disso)', () => {
    const codes = FEBRABAN_BANKS.map((b) => b.code)
    assert.deepEqual(
      [...codes].sort((a, b) => a.localeCompare(b)),
      codes,
    )
  })

  it('o grupo "Mais usados" é exatamente a lista curada antiga', () => {
    assert.deepEqual(
      FREQUENT_BANKS.map((b) => b.code).sort((a, b) => a.localeCompare(b)),
      LEGACY_CURATED,
    )
  })

  it('os frequentes usam o nome COMERCIAL, não o reduzido do Bacen', () => {
    assert.equal(bankNameByCode('260'), 'Nubank')
    assert.equal(bankNameByCode('237'), 'Bradesco')
  })

  it('a tabela é grande o bastante para não ser a lista curada disfarçada', () => {
    assert.ok(FEBRABAN_BANKS.length > 300, `tabela com apenas ${String(FEBRABAN_BANKS.length)} bancos`)
  })
})

describe('febraban-banks · toBankCode (cadastro legado)', () => {
  it('código puro passa igual', () => {
    assert.equal(toBankCode('237'), '237')
  })

  it('completa zeros à esquerda', () => {
    assert.equal(toBankCode('1'), '001')
    assert.equal(toBankCode('33'), '033')
  })

  it('descarta zeros sobrando', () => {
    assert.equal(toBankCode('0237'), '237')
  })

  it('aceita "código - nome", que é como muito cadastro antigo foi digitado', () => {
    assert.equal(toBankCode('237 - Bradesco'), '237')
    assert.equal(toBankCode('341 Itaú'), '341')
  })

  it('ignora espaço em volta', () => {
    assert.equal(toBankCode('  104  '), '104')
  })

  it('NÃO adivinha por nome — devolve null para o operador escolher', () => {
    assert.equal(toBankCode('Bradesco'), null)
    assert.equal(toBankCode('Banco Santander'), null)
    assert.equal(toBankCode(''), null)
  })

  it('código de 3 dígitos que não existe na tabela é null, não invenção', () => {
    assert.equal(toBankCode('999'), null)
  })

  it('não confunde número de conta com banco: "12345" não vira "123"', () => {
    assert.equal(toBankCode('12345'), null)
  })
})

describe('febraban-banks · bankLabel', () => {
  it('formata "código · nome"', () => {
    assert.equal(bankLabel('237'), '237 · Bradesco')
  })

  it('código desconhecido volta cru, sem esconder o valor legado', () => {
    assert.equal(bankLabel('Bradesco S.A.'), 'Bradesco S.A.')
  })
})
