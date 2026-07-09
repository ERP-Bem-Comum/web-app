/**
 * Teste do serializador PURO do Consolidado ABC → CSV (DoD do #053). Critério de aceite:
 * `consolidatedAbcToCsv(placeholderSource())` === a amostra oficial do handbook, BYTE-A-BYTE.
 * Cobre: header, linha de GRUPO do Centro de Custo, linha de Categoria, linha TOTAL e a formatação BRL
 * (com o espaço não-quebrável U+00A0 que o Intl e o handbook usam).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

import { consolidatedAbcToCsv } from '#modules/budget-plans/server/domain/consolidado-abc.serializer.ts'
import { consolidadoAbcPlaceholderSource } from '#modules/budget-plans/server/adapters/consolidado-abc.placeholder-source.ts'

// Fixture de teste sob path controlado (não é entrada do usuário) — a amostra oficial do handbook.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const expectedCsv = readFileSync(new URL('./fixtures/consolidado-abc.expected.csv', import.meta.url), 'utf8')

const NBSP = ' ' // espaço não-quebrável — o que o Intl pt-BR emite após "R$" (igual ao handbook)

describe('consolidatedAbcToCsv', () => {
  const csv = consolidatedAbcToCsv(consolidadoAbcPlaceholderSource())
  const lines = csv.split('\n')

  it('bate BYTE-A-BYTE com a amostra oficial do handbook', () => {
    assert.equal(csv, expectedCsv)
  })

  it('não usa CRLF nem newline final (LF, como a amostra real)', () => {
    assert.equal(csv.includes('\r'), false)
    assert.equal(csv.endsWith('\n'), false)
  })

  it('header tem as 16 colunas (3 + 12 meses + Total)', () => {
    assert.equal(
      lines[0],
      '"Centro de Custo","Categoria","Subcategoria","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro","Total"',
    )
  })

  it('linha de GRUPO do Centro de Custo: nome + meses vazios + total do CC', () => {
    assert.equal(
      lines[1],
      `"CONSULTORIA ESTRATÉGICA","","","","","","","","","","","","","","","R$${NBSP}10.645.530,00"`,
    )
  })

  it('linha de Categoria: Categoria + 12 meses em BRL + total', () => {
    assert.equal(
      lines[2],
      `"","1. CONSULTORIA ESTRATÉGICA (PARC)","","R$${NBSP}856.229,00","R$${NBSP}856.229,00","R$${NBSP}893.559,20","R$${NBSP}893.279,20","R$${NBSP}893.279,20","R$${NBSP}893.279,20","R$${NBSP}893.279,20","R$${NBSP}893.279,20","R$${NBSP}893.279,20","R$${NBSP}893.279,20","R$${NBSP}893.279,20","R$${NBSP}893.279,20","R$${NBSP}10.645.530,00"`,
    )
  })

  it('linha TOTAL: soma coluna-a-coluna + total geral', () => {
    const total = lines[lines.length - 1]
    assert.equal(
      total,
      `"TOTAL","","","R$${NBSP}1.461.846,43","R$${NBSP}1.782.775,31","R$${NBSP}3.884.725,98","R$${NBSP}1.894.282,30","R$${NBSP}1.894.012,43","R$${NBSP}4.011.421,56","R$${NBSP}1.763.528,43","R$${NBSP}1.850.923,79","R$${NBSP}1.971.168,41","R$${NBSP}1.649.445,68","R$${NBSP}1.952.176,41","R$${NBSP}1.708.381,30","R$${NBSP}25.824.688,03"`,
    )
  })

  it('formata centavos como BRL com NBSP (R$ 0,00 nos meses zerados)', () => {
    assert.equal(csv.includes(`"R$${NBSP}0,00"`), true)
  })

  it('emite 16 linhas (header + 7 CC × 2 linhas + TOTAL)', () => {
    assert.equal(lines.length, 16)
  })
})
