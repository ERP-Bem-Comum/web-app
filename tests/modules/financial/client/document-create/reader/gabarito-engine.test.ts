/**
 * gabarito-engine + read-pdf-lines (puro, node:test) — conversores, agrupamento de linhas, detecção de gabarito
 * e extração por âncora (regex + coluna). Fixtures de camada de texto SINTÉTICAS (fabricadas), sem dado real.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  convert,
  groupLines,
  type TextItem,
} from '../../../../../../src/modules/financial/client/document-create/reader/pdf/gabarito-engine.ts'
import { readPdfLines } from '../../../../../../src/modules/financial/client/document-create/reader/pdf/read-pdf-lines.ts'

/** Constrói `TextItem[]` a partir de linhas (topo→base): cada célula = {str, x}; y decresce por linha. */
const itemsFromRows = (rows: readonly (readonly { str: string; x: number }[])[]): TextItem[] =>
  rows.flatMap((cells, r) => cells.map((c) => ({ str: c.str, x: c.x, y: 1000 - r * 20, width: 10, page: 1 })))

// DANFSe v1.0 sintética: rótulos numa linha, valores na linha imediatamente abaixo (várias colunas).
const danfseRows: readonly (readonly { str: string; x: number }[])[] = [
  [{ str: 'DANFSe v1.0', x: 0 }],
  [
    { str: 'Número da NFS-e', x: 0 },
    { str: 'Competência da NFS-e', x: 200 },
    { str: 'Data e Hora da emissão da NFS-e', x: 400 },
  ],
  [
    { str: '42', x: 0 },
    { str: '15/07/2026', x: 200 },
    { str: '15/07/2026', x: 400 },
    { str: '10:00:00', x: 480 },
  ],
  [
    { str: 'Número da DPS', x: 0 },
    { str: 'Série da DPS', x: 200 },
  ],
  [
    { str: '7', x: 0 },
    { str: '1', x: 200 },
  ],
  [{ str: '12345678901234567890123456789012345678901234567890', x: 0 }],
  // EMITENTE (prestador) antes do TOMADOR — o gabarito deve pegar o CNPJ do EMITENTE, não o do tomador.
  [
    { str: 'EMITENTE DA NFS-e', x: 0 },
    { str: 'CNPJ / CPF / NIF', x: 200 },
  ],
  [{ str: '64.894.238/0001-90', x: 200 }],
  [
    { str: 'TOMADOR DO SERVIÇO', x: 0 },
    { str: 'CNPJ / CPF / NIF', x: 200 },
  ],
  [{ str: '30.275.386/0001-05', x: 200 }],
  // Descrição do Serviço: rótulo, texto (multi-linha) e a seção seguinte "Tributação" como fronteira.
  [{ str: 'Descrição do Serviço', x: 0 }],
  [{ str: 'Serviços prestados conforme', x: 0 }],
  [{ str: 'Contrato de Prestação 035/2026.', x: 0 }],
  [{ str: 'Tributação Municipal', x: 0 }],
  [
    { str: 'Valor do Serviço', x: 0 },
    { str: 'Desconto Condicionado', x: 150 },
    { str: 'Desconto Incondicionado', x: 300 },
    { str: 'ISSQN Retido', x: 450 },
  ],
  [
    { str: 'R$ 4.000,00', x: 0 },
    { str: '-', x: 150 },
    { str: '-', x: 300 },
    { str: '-', x: 450 },
  ],
  [
    { str: 'IRRF', x: 0 },
    { str: 'Contribuição Previdenciária - Retida', x: 150 },
    { str: 'Contribuições Sociais - Retidas', x: 400 },
  ],
  [
    { str: 'R$ 150,00', x: 0 },
    { str: '-', x: 150 },
    { str: 'R$ 465,00', x: 400 },
  ],
]

describe('convert — conversores de valor', () => {
  it('moeda: "R$ 1.234,56" → 1234.56; "-" → 0; vazio → null', () => {
    assert.equal(convert('R$ 1.234,56', 'moeda'), 1234.56)
    assert.equal(convert('-', 'moeda'), 0)
    assert.equal(convert('', 'moeda'), null)
  })
  it('data: "13/05/2026" → "2026-05-13"', () => {
    assert.equal(convert('13/05/2026', 'data'), '2026-05-13')
  })
  it('competencia: "13/07/2026" → "07/2026"; "05/2026" → "05/2026"', () => {
    assert.equal(convert('13/07/2026', 'competencia'), '07/2026')
    assert.equal(convert('05/2026', 'competencia'), '05/2026')
  })
  it('inteiro: "Nº 042" → 42', () => {
    assert.equal(convert('Nº 042', 'inteiro'), 42)
  })
})

describe('groupLines — agrupamento por y', () => {
  it('agrupa itens da mesma linha e ordena por x, topo→base', () => {
    const lines = groupLines(itemsFromRows(danfseRows))
    assert.equal(lines[0]?.text, 'DANFSe v1.0')
    assert.ok((lines[1]?.text ?? '').startsWith('Número da NFS-e'))
  })
})

describe('readPdfLines — DANFSe v1.0 por gabarito', () => {
  it('detecta o gabarito e mapeia número/competência/emissão/valor/retenções', () => {
    const r = readPdfLines(groupLines(itemsFromRows(danfseRows)))
    assert.ok(r !== null)
    assert.equal(r.kind, 'NFS-e')
    assert.equal(r.category, 'service')
    assert.equal(r.number, '42')
    assert.equal(r.series, '1')
    assert.equal(r.competence, '07/2026')
    assert.equal(r.issueDate, '2026-07-15')
    assert.equal(r.grossValue, 4000)
    assert.equal(r.accessKey, '12345678901234567890123456789012345678901234567890')
    assert.equal(r.retentions.iss, 0) // ISSQN Retido = "-"
    assert.equal(r.retentions.irrf, 150)
    assert.equal(r.retentions.inss, 0)
    // v1 agrega PIS+COFINS+CSLL em "Contribuições Sociais - Retidas" → mapeado para csll.
    assert.equal(r.retentions.csll, 465)
    // CNPJ do EMITENTE (não o do tomador) → habilita a auto-seleção do fornecedor.
    assert.equal(r.supplier.taxId, '64.894.238/0001-90')
    // Descrição do Serviço: bloco multi-linha colapsado numa linha (até a fronteira "Tributação").
    assert.equal(r.description, 'Serviços prestados conforme Contrato de Prestação 035/2026.')
  })

  it('sem gabarito reconhecido → null (degradação graciosa)', () => {
    const r = readPdfLines(groupLines(itemsFromRows([[{ str: 'documento qualquer', x: 0 }]])))
    assert.equal(r, null)
  })
})
