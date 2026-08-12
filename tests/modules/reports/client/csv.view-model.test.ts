/**
 * Regras ÚNICAS do CSV dos relatórios (node:test, puro). Cada caso aqui é um defeito encontrado na auditoria
 * de 2026-08-10 nos 7 builders que existiam à mão — este arquivo é o que impede a volta de cada um.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  csvField,
  csvLine,
  csvHeaderLine,
  csvNumber,
  csvInteger,
  csvContent,
  CSV_BOM,
  CSV_EOL,
} from '#modules/reports/client/csv.view-model.ts'

/** Parser RFC-4180 mínimo (delimitador ';') — para provar o que uma planilha leria de volta. */
function parseCsvLine(line: string): readonly string[] {
  const out: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i] ?? ''
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ';') {
      out.push(field)
      field = ''
    } else field += c
  }
  out.push(field)
  return out
}

describe('csvField — escape RFC 4180', () => {
  it('envolve em aspas', () => {
    assert.equal(csvField('Alfa'), '"Alfa"')
  })

  it('DOBRA a aspa interna (o bug: o texto voltava alterado)', () => {
    assert.equal(csvField('Alfa "A Melhor" Ltda'), '"Alfa ""A Melhor"" Ltda"')
    assert.deepEqual(parseCsvLine(csvField('Alfa "A Melhor" Ltda')), ['Alfa "A Melhor" Ltda'])
  })

  it('aspa + ponto-e-vírgula juntos NÃO deslocam colunas (era o pior caso: 3 colunas viravam 4)', () => {
    const linha = csvLine(['CT-1', 'Consultoria "jan; fev" 2026', csvNumber(100000)])
    assert.equal(parseCsvLine(linha).length, 3)
    assert.deepEqual(parseCsvLine(linha), ['CT-1', 'Consultoria "jan; fev" 2026', '1000,00'])
  })

  it('preserva ; e quebra de linha dentro do campo', () => {
    assert.deepEqual(parseCsvLine(csvLine(['a;b'])), ['a;b'])
    assert.equal(csvField('linha1\nlinha2'), '"linha1\nlinha2"')
  })

  it('null/undefined viram campo VAZIO', () => {
    assert.equal(csvField(null), '""')
    assert.equal(csvField(undefined), '""')
  })
})

describe('csvNumber — dinheiro é NÚMERO, não texto', () => {
  it('centavos → vírgula decimal, sem símbolo e sem separador de milhar', () => {
    assert.equal(csvNumber(123456), '1234,56')
    assert.equal(csvNumber(0), '0,00')
    assert.equal(csvNumber(100000000), '1000000,00')
  })

  it('negativo mantém o sinal à frente (a planilha entende)', () => {
    assert.equal(csvNumber(-50000), '-500,00')
  })

  it('NÃO contém "R$" nem espaço não-quebrável — era o que fazia a célula virar TEXTO', () => {
    const v = csvNumber(123456)
    assert.ok(!v.includes('R$'))
    assert.ok(!v.includes(' '))
    assert.ok(/^-?\d+,\d{2}$/.test(v))
  })
})

describe('csvInteger — coluna numérica não recebe letra', () => {
  it('sem valor → VAZIO (era "N/A", que forçava a coluna a texto)', () => {
    assert.equal(csvInteger(null), '')
    assert.equal(csvInteger(undefined), '')
  })

  it('com valor → o número', () => {
    assert.equal(csvInteger(34), '34')
  })
})

describe('montagem do arquivo', () => {
  it('cabeçalho é escapado como os dados (era o único sem aspas)', () => {
    assert.equal(csvHeaderLine(['Nome', 'Total (R$)']), '"Nome";"Total (R$)"')
  })

  it('linhas separadas por CRLF', () => {
    assert.equal(csvContent('"H"', ['"a"', '"b"']), `"H"${CSV_EOL}"a"${CSV_EOL}"b"`)
  })

  it('o BOM é UM caractere (U+FEFF) — sem ele o Excel/Windows quebra os acentos', () => {
    assert.equal(CSV_BOM, '﻿')
    assert.equal(CSV_BOM.length, 1)
  })
})
