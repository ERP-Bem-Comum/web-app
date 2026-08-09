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

// ─────────────────────────────────────────────────────────────────────────────
// Cobertura dos demais gabaritos. Até aqui só a DANFSe v1 era exercida — e foi por isso que a ausência da
// Descrição no FILU-SP passou despercebida: não havia teste para falhar. Fixtures SINTÉTICAS, montadas a
// partir das âncoras declaradas em cada gabarito (não são PDFs reais).

// DANFSe v2.0 (Fortaleza) — rótulos em MAIÚSCULAS, valores na linha de baixo tokenizados por "R$".
const danfseV2Rows: readonly (readonly { str: string; x: number }[])[] = [
  [{ str: 'DANFSe v2.0', x: 0 }],
  [
    { str: 'NÚMERO DA NFS-e', x: 0 },
    { str: 'COMPETÊNCIA', x: 200 },
    { str: 'DATA DE EMISSÃO', x: 400 },
  ],
  [
    { str: '123', x: 0 },
    { str: '01/08/2026', x: 200 },
    { str: '05/08/2026', x: 400 },
  ],
  [
    { str: 'NÚMERO DA DPS', x: 0 },
    { str: 'SÉRIE DA DPS', x: 200 },
  ],
  [
    { str: '9', x: 0 },
    { str: '2', x: 200 },
  ],
  [{ str: '98765432109876543210987654321098765432109876543210', x: 0 }],
  [
    { str: 'EMITENTE DA NFS-e', x: 0 },
    { str: 'CNPJ / CPF / NIF', x: 200 },
  ],
  [{ str: '11.222.333/0001-44', x: 200 }],
  [
    { str: 'TOMADOR DO SERVIÇO', x: 0 },
    { str: 'CNPJ / CPF / NIF', x: 200 },
  ],
  [{ str: '30.275.386/0001-05', x: 200 }],
  [{ str: 'Descrição do Serviço', x: 0 }],
  [{ str: 'Consultoria técnica referente ao mês', x: 0 }],
  [{ str: 'de julho de 2026.', x: 0 }],
  [{ str: 'Tributação Municipal', x: 0 }],
  [{ str: 'VALOR DA OPERAÇÃO', x: 0 }],
  [{ str: 'R$ 10.000,00', x: 0 }],
  [
    { str: 'BC ISSQN', x: 0 },
    { str: 'Alíquota Aplicada', x: 150 },
    { str: 'Retenção do ISSQN', x: 300 },
    { str: 'ISSQN Apurado', x: 450 },
  ],
  [
    { str: 'R$ 10.000,00', x: 0 },
    { str: '2,00%', x: 150 },
    { str: 'Não Retido', x: 300 },
    { str: 'R$ 200,00', x: 450 },
  ],
  [
    { str: 'IRPF', x: 0 },
    { str: 'Contribuição Previdenciária - Retida', x: 150 },
    { str: 'Contribuições Sociais - Retidas', x: 400 },
  ],
  [
    { str: 'R$ 150,00', x: 0 },
    { str: '-', x: 150 },
    { str: 'R$ 465,00', x: 400 },
  ],
]

describe('readPdfLines — DANFSe v2.0 (Fortaleza) por gabarito', () => {
  it('detecta o v2 e lê identificação, valor e retenções', () => {
    const r = readPdfLines(groupLines(itemsFromRows(danfseV2Rows)))
    assert.ok(r !== null)
    assert.equal(r.kind, 'NFS-e')
    assert.equal(r.category, 'service')
    assert.equal(r.number, '123')
    assert.equal(r.series, '2')
    assert.equal(r.competence, '08/2026')
    assert.equal(r.issueDate, '2026-08-05')
    assert.equal(r.grossValue, 10000)
    assert.equal(r.supplier.taxId, '11.222.333/0001-44')
    assert.equal(r.retentions.irrf, 150)
    assert.equal(r.retentions.inss, 0)
    assert.equal(r.retentions.csll, 465)
  })

  it('ISSQN "Não Retido" → iss ZERO, mesmo com ISSQN Apurado preenchido', () => {
    // O apurado (R$ 200,00) é quanto o prestador deve, não quanto foi retido de nós. Confundir os dois
    // inventaria uma retenção que não existe.
    const r = readPdfLines(groupLines(itemsFromRows(danfseV2Rows)))
    assert.ok(r !== null)
    assert.equal(r.retentions.iss, 0)
  })

  it('lê a Descrição do Serviço e a colapsa numa linha só', () => {
    const r = readPdfLines(groupLines(itemsFromRows(danfseV2Rows)))
    assert.ok(r !== null)
    assert.equal(r.description, 'Consultoria técnica referente ao mês de julho de 2026.')
  })

  it('sem o bloco da Reforma Tributária, IBS/CBS ficam zerados (não quebram)', () => {
    const r = readPdfLines(groupLines(itemsFromRows(danfseV2Rows)))
    assert.ok(r !== null)
    assert.equal(r.reformaTributaria.cbs, 0)
    assert.equal(r.reformaTributaria.ibsMunicipal, 0)
    assert.equal(r.reformaTributaria.ibsEstadual, 0)
  })
})

// FILU — DANFSe da Prefeitura de São Paulo. Valores SEM "R$" → o gabarito usa regex posicional.
const filuSpRows: readonly (readonly { str: string; x: number }[])[] = [
  [{ str: 'PREFEITURA DO MUNICÍPIO DE SÃO PAULO', x: 0 }],
  [{ str: 'NFS-e', x: 0 }],
  [
    { str: 'Número da Nota', x: 0 },
    { str: 'Data e Hora de Emissão', x: 200 },
    { str: 'Código de Verificação', x: 400 },
  ],
  [
    { str: '00123456', x: 0 },
    { str: '12/07/2026', x: 200 },
    { str: 'ABCD-1234', x: 400 },
  ],
  [{ str: 'Discriminação dos Serviços', x: 0 }],
  [{ str: 'Prestação de serviços de manutenção predial', x: 0 }],
  [{ str: 'referente ao mês de julho/2026.', x: 0 }],
  [{ str: 'VALOR TOTAL DO SERVIÇO = R$ 8.000,00', x: 0 }],
  [
    { str: 'INSS (R$)', x: 0 },
    { str: 'IRRF (R$)', x: 100 },
    { str: 'CSLL (R$)', x: 200 },
    { str: 'COFINS (R$)', x: 300 },
    { str: 'PIS/PASEP (R$)', x: 400 },
    { str: 'IPI (R$)', x: 500 },
  ],
  [
    { str: '0,00', x: 0 },
    { str: '120,00', x: 100 },
    { str: '72,00', x: 200 },
    { str: '240,00', x: 300 },
    { str: '52,00', x: 400 },
    { str: '0,00', x: 500 },
  ],
  [
    { str: 'Base de Cálculo (R$)', x: 0 },
    { str: 'Alíquota (%)', x: 200 },
    { str: 'Valor do ISS (R$)', x: 350 },
  ],
  [
    { str: '8.000,00', x: 0 },
    { str: '2,00', x: 200 },
    { str: '160,00', x: 350 },
    { str: '160,00', x: 450 },
  ],
]

describe('readPdfLines — FILU / NFS-e São Paulo por gabarito', () => {
  it('detecta o FILU e lê identificação, valor e retenções federais (valores SEM "R$")', () => {
    const r = readPdfLines(groupLines(itemsFromRows(filuSpRows)))
    assert.ok(r !== null)
    assert.equal(r.kind, 'NFS-e')
    assert.equal(r.category, 'service')
    assert.equal(r.number, '123456')
    assert.equal(r.issueDate, '2026-07-12')
    assert.equal(r.competence, '07/2026')
    assert.equal(r.grossValue, 8000)
    assert.equal(r.retentions.inss, 0)
    assert.equal(r.retentions.irrf, 120)
    assert.equal(r.retentions.csll, 72)
    assert.equal(r.retentions.cofins, 240)
    assert.equal(r.retentions.pis, 52)
  })

  it('ISS do modelo SP é zerado por posProcessar (só confiável via XML)', () => {
    const r = readPdfLines(groupLines(itemsFromRows(filuSpRows)))
    assert.ok(r !== null)
    assert.equal(r.retentions.iss, 0)
  })

  it('não extrai o CNPJ do emitente → sem auto-seleção de fornecedor por este gabarito', () => {
    const r = readPdfLines(groupLines(itemsFromRows(filuSpRows)))
    assert.ok(r !== null)
    assert.equal(r.supplier.taxId, null)
  })

  // O FILU não declara o campo `descricao` (o rótulo aqui é "Discriminação dos Serviços", e o layout é
  // outro: valores sem "R$", tabelas posicionais). Fora de escopo por decisão da P.O. em 09/08/2026 — novos
  // modelos de gabarito entram em breve e o de São Paulo será revisto nessa leva.
  // Teste de CARACTERIZAÇÃO: fixa o estado atual e falha de propósito quando o campo for adicionado,
  // para quem mexer trocar o `null` pelo texto lido em vez de descobrir a mudança por acaso.
  it('não lê a descrição hoje (fora de escopo — ver leva de novos gabaritos)', () => {
    const r = readPdfLines(groupLines(itemsFromRows(filuSpRows)))
    assert.ok(r !== null)
    assert.equal(r.description, null)
  })
})

// DANFE (NF-e de produto). Fixture mínima de propósito: o layout numérico do bloco "Cálculo do Imposto"
// tem posições que eu não consigo confirmar sem um PDF real, e fixar um palpite aqui viraria uma verdade
// falsa. O que este teste garante é o roteamento — que a NF-e de produto NÃO cai num gabarito de serviço.
const danfeRows: readonly (readonly { str: string; x: number }[])[] = [
  [{ str: 'DANFE', x: 0 }],
  [{ str: 'DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA', x: 0 }],
  [
    { str: 'Nº 000123456', x: 0 },
    { str: 'Série: 1', x: 200 },
  ],
  [
    { str: 'Data emissão', x: 0 },
    { str: '20/07/2026', x: 200 },
  ],
]

describe('readPdfLines — DANFE (NF-e de produto) por gabarito', () => {
  it('classifica como PRODUTO e não como serviço', () => {
    const r = readPdfLines(groupLines(itemsFromRows(danfeRows)))
    assert.ok(r !== null)
    assert.equal(r.kind, 'NF-e')
    assert.equal(r.category, 'product')
    assert.equal(r.number, '123456')
    assert.equal(r.series, '1')
    assert.equal(r.issueDate, '2026-07-20')
  })

  it('produto tem bloco de impostos próprio (ICMS/IPI), serviço não', () => {
    const r = readPdfLines(groupLines(itemsFromRows(danfeRows)))
    assert.ok(r !== null)
    assert.ok(r.productTaxes !== null)
    const servico = readPdfLines(groupLines(itemsFromRows(danfseV2Rows)))
    assert.ok(servico !== null)
    assert.equal(servico.productTaxes, null)
  })

  // Diferente do FILU, aqui a ausência é CORRETA: nota de produto não tem "descrição do serviço" — o
  // equivalente seria a lista de itens, que é outra decisão de produto.
  it('sem descrição de serviço — esperado numa nota de produto', () => {
    const r = readPdfLines(groupLines(itemsFromRows(danfeRows)))
    assert.ok(r !== null)
    assert.equal(r.description, null)
  })
})
