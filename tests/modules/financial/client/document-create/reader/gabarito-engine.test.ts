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

// DANFSe v2.0 (Fortaleza, modelo NOVO): a linearização do pdf.js põe o VALOR da descrição na linha
// IMEDIATAMENTE ACIMA do rótulo "Descrição do Serviço", e a seção "TRIBUTAÇÃO MUNICIPAL (ISSQN)" logo
// ABAIXO do rótulo. A âncora antiga (rótulo → linha de baixo) capturava o bloco de tributação.
const danfseV2Rows: readonly (readonly { str: string; x: number }[])[] = [
  [{ str: 'DANFSe v2.0', x: 0 }],
  [{ str: 'NÚMERO DA NFS-E', x: 0 }],
  [{ str: '331 01/07/2026 01/07/2026', x: 0 }],
  [
    {
      str: 'SERVIÇO PRESTADO Código de Tributação Código da NBS Local da Prestação/Sigla UF/País',
      x: 0,
    },
  ],
  [{ str: 'CONSULTORIA FINANCEIRA A EMPRESAS/CONSULTORIA FINANCEIRA A EMPRESAS', x: 0 }],
  [{ str: 'Descrição do Serviço', x: 0 }],
  [{ str: 'TRIBUTAÇÃO MUNICIPAL (ISSQN) Tipo de Tributação do ISSQN', x: 0 }],
]

describe('readPdfLines — DANFSe v2.0 (Fortaleza, modelo novo): descrição vem ACIMA do rótulo', () => {
  it('captura a descrição real (a linha antes de "Descrição do Serviço"), não o bloco de tributação', () => {
    const r = readPdfLines(groupLines(itemsFromRows(danfseV2Rows)))
    assert.equal(r?.kind, 'NFS-e')
    assert.equal(r?.description, 'CONSULTORIA FINANCEIRA A EMPRESAS/CONSULTORIA FINANCEIRA A EMPRESAS')
  })
})

// DANFSe v2.0 — layout NACIONAL (Emissor Nacional; ex.: Sorocaba). Mesmo cabeçalho "DANFSe v2.0" do de
// Fortaleza, modelo diferente: "IRRF" (não "IRPF"), descrição ABAIXO do rótulo e, ACIMA dele, a descrição do
// código de tributação. Valores alinhados (x) ao rótulo — colunas em 12/156/301/446, como no PDF real.
const danfseV2NacionalRows: readonly (readonly { str: string; x: number }[])[] = [
  [
    { str: 'DANFSe v2.0', x: 270 },
    { str: 'Município: CIDADE - SP', x: 446 },
  ],
  [{ str: 'CHAVE DE ACESSO DA NFS-e', x: 12 }],
  [{ str: '12345678901234567890123456789012345678901234567890', x: 12 }],
  [
    { str: 'NÚMERO DA NFS-e', x: 12 },
    { str: 'COMPETÊNCIA DA NFS-e', x: 156 },
    { str: 'DATA E HORA DA EMISSÃO DA NFS-e', x: 301 },
  ],
  [
    { str: '77', x: 12 },
    { str: '01/08/2026', x: 156 },
    { str: '03/08/2026 09:00:00', x: 301 },
  ],
  [
    { str: 'NÚMERO DA DPS', x: 12 },
    { str: 'SÉRIE DA DPS', x: 156 },
  ],
  [
    { str: '77', x: 12 },
    { str: '1', x: 156 },
  ],
  [{ str: 'EMITENTE DA NFS-e', x: 12 }],
  [
    { str: 'PRESTADOR / FORNECEDOR', x: 12 },
    { str: 'CNPJ / CPF / NIF', x: 156 },
  ],
  [{ str: '64.894.238/0001-90', x: 156 }],
  [
    { str: 'TOMADOR / ADQUIRENTE', x: 12 },
    { str: 'CNPJ / CPF / NIF', x: 156 },
  ],
  [{ str: '30.275.386/0001-05', x: 156 }],
  [
    { str: 'SERVIÇO PRESTADO', x: 12 },
    { str: 'Código de Tributação Nacional/Municipal', x: 156 },
  ],
  [{ str: '01.05.01 / 002', x: 156 }],
  [{ str: 'DESCRIÇÃO DO CÓDIGO DE TRIBUTAÇÃO MUNICIPAL', x: 12 }],
  [{ str: 'Descrição do Serviço', x: 12 }],
  [{ str: 'Suporte técnico mensal', x: 12 }],
  [{ str: 'conforme contrato 012/2026.', x: 12 }],
  [
    { str: 'TRIBUTAÇÃO MUNICIPAL (ISSQN)', x: 12 },
    { str: 'Tipo de Tributação do ISSQN', x: 156 },
  ],
  [
    { str: 'BC ISSQN', x: 12 },
    { str: 'Alíquota Aplicada', x: 156 },
    { str: 'Retenção do ISSQN', x: 301 },
    { str: 'ISSQN Apurado', x: 446 },
  ],
  [
    { str: 'R$ 2.000,00', x: 12 },
    { str: '5,00 %', x: 156 },
    { str: 'Retido', x: 301 },
    { str: 'R$ 100,00', x: 446 },
  ],
  [
    { str: 'TRIBUTAÇÃO FEDERAL (EXCETO CBS)', x: 12 },
    { str: 'IRRF', x: 156 },
    { str: 'Contribuição Previdenciária - Retida', x: 301 },
    { str: 'Contribuições Sociais - Retidas', x: 446 },
  ],
  [
    { str: 'R$ 30,00', x: 156 },
    { str: '-', x: 301 },
    { str: 'R$ 93,00', x: 446 },
  ],
  // PIS/COFINS "Débito Apuração Própria" — tributo do prestador, NÃO retenção.
  [
    { str: 'PIS - Débito Apuração Própria', x: 12 },
    { str: 'COFINS - Débito Apuração Própria', x: 156 },
  ],
  [
    { str: 'R$ 13,00', x: 12 },
    { str: 'R$ 60,00', x: 156 },
  ],
  // IBS/CBS com alíquota PREENCHIDA: "0,10 %" não é token de coluna — a leitura por posição não desloca.
  [
    { str: 'Alíq. Efetiva Municipal - IBS', x: 12 },
    { str: 'Valor Apurado Municipal - IBS', x: 156 },
    { str: 'Alíq. Efetiva Estadual - IBS', x: 301 },
    { str: 'Valor Apurado Estadual - IBS', x: 446 },
  ],
  [
    { str: '0,10 %', x: 12 },
    { str: 'R$ 2,00', x: 156 },
    { str: '0,00 %', x: 301 },
    { str: 'R$ 0,00', x: 446 },
  ],
  [
    { str: 'Valor Total Apurado - IBS', x: 12 },
    { str: 'Alíquota - CBS', x: 156 },
    { str: 'Alíquota Efetiva - CBS', x: 301 },
    { str: 'Valor Total Apurado - CBS', x: 446 },
  ],
  [
    { str: 'R$ 2,00', x: 12 },
    { str: '0,90 %', x: 156 },
    { str: '0,90 %', x: 301 },
    { str: 'R$ 18,00', x: 446 },
  ],
  [
    { str: 'VALOR TOTAL DA NFS-e', x: 12 },
    { str: 'VALOR DA OPERAÇÃO / SERVIÇO', x: 156 },
    { str: 'Desconto Incondicionado', x: 301 },
    { str: 'Desconto Condicionado', x: 446 },
  ],
  [
    { str: 'R$ 2.000,00', x: 156 },
    { str: '-', x: 301 },
    { str: '-', x: 446 },
  ],
]

describe('readPdfLines — DANFSe v2.0 layout NACIONAL (modelo diferente do de Fortaleza)', () => {
  const r = readPdfLines(groupLines(itemsFromRows(danfseV2NacionalRows)))

  it('identifica o modelo e lê identificação, fornecedor e valor', () => {
    assert.ok(r !== null)
    assert.equal(r.kind, 'NFS-e')
    assert.equal(r.number, '77')
    assert.equal(r.series, '1')
    assert.equal(r.competence, '08/2026')
    assert.equal(r.issueDate, '2026-08-03')
    assert.equal(r.grossValue, 2000)
    assert.equal(r.accessKey, '12345678901234567890123456789012345678901234567890')
    assert.equal(r.supplier.taxId, '64.894.238/0001-90')
  })

  it('descrição = texto ABAIXO do rótulo, não a descrição do código de tributação (linha acima)', () => {
    assert.equal(r?.description, 'Suporte técnico mensal conforme contrato 012/2026.')
  })

  it('retenções pelo rótulo IRRF; PIS/COFINS de apuração própria não entram', () => {
    assert.deepEqual(r?.retentions, { iss: 100, irrf: 30, inss: 0, pis: 0, cofins: 0, csll: 93 })
  })

  it('IBS/CBS lidos pela posição: alíquota preenchida não desloca o valor', () => {
    assert.deepEqual(r?.reformaTributaria, { cbs: 18, ibsMunicipal: 2, ibsEstadual: 0 })
  })

  it('descrição vazia (rótulo seguido da seção TRIBUTAÇÃO) → null, não o bloco de tributação', () => {
    const semDescricao = danfseV2NacionalRows.filter(
      (row) => !['Suporte técnico mensal', 'conforme contrato 012/2026.'].includes(row[0]?.str ?? ''),
    )
    const v = readPdfLines(groupLines(itemsFromRows(semDescricao)))
    assert.equal(v?.description, null)
  })
})
