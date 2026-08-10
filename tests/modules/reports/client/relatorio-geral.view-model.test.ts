/**
 * ViewModel do "Relatório Geral" — unidades PURAS (node:test, sem DOM). Cobre:
 * (1) `ledgerRowFromGeneral` — mapeia o DTO real (#442) → linha de exibição (data≡vencimento, tipo "A pagar",
 *     parcela/apontamento null, PIX/bancário formatado);
 * (2) `formatIsoDateBR` / `formatPixBancario`;
 * (3) `totalPages` — paginação (o `total` é server-side; aqui só a derivação);
 * (4) `buildCsv` — cabeçalho das 15 colunas + WYSIWYG (colunas visíveis), nullable → campo VAZIO, valor BRL.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  ledgerRowFromGeneral,
  formatIsoDateBR,
  formatPixBancario,
  buildCsv,
  CSV_HEADER,
  totalPages,
  formatBRL,
  monthGroupKey,
  monthGroupLabel,
  PER_PAGE_DEFAULT,
  cellText,
  contentCharsByColumn,
  type LedgerRow,
} from '#modules/reports/client/relatorio-geral.view-model.ts'
import type { GeneralReportRow } from '#modules/reports/client/data/model/general-report.model.ts'

const baseRow: GeneralReportRow = {
  payableId: 'p1',
  documentId: 'd1',
  code: 'PAG-1',
  dueDate: '2026-01-10',
  payeeKind: 'supplier',
  supplierName: 'Fornecedor A',
  financierName: null,
  collaboratorName: null,
  costCenterName: 'CC1',
  categoryName: 'Cat1',
  subcategoryName: 'Sub1',
  valueCents: 120000,
  contractNumber: 'CT-1',
  pixKey: { keyType: 'cnpj', key: '12.345.678/0001-90' },
  bankAccount: null,
}

describe('ledgerRowFromGeneral — DTO real (#442) → linha de exibição', () => {
  it('mapeia os campos + formata data (DD/MM/AAAA); data ≡ vencimento (o #442 só tem dueDate)', () => {
    const r = ledgerRowFromGeneral(baseRow)
    assert.equal(r.data, '10/01/2026')
    assert.equal(r.vencimento, '10/01/2026')
    assert.equal(r.tipo, 'A pagar')
    assert.equal(r.numeroContrato, 'CT-1')
    assert.equal(r.codigo, 'PAG-1')
    assert.equal(r.fornecedor, 'Fornecedor A')
    assert.equal(r.centroCusto, 'CC1')
    assert.equal(r.valorCents, 120000)
  })

  it('parcela e apontamento são null (sem fonte no #442)', () => {
    const r = ledgerRowFromGeneral(baseRow)
    assert.equal(r.parcela, null)
    assert.equal(r.apontamento, null)
  })

  it('PIX tem precedência; sem PIX cai no bancário; sem ambos → null', () => {
    assert.equal(ledgerRowFromGeneral(baseRow).pixBancario, 'PIX · 12.345.678/0001-90')
    const bank = ledgerRowFromGeneral({
      ...baseRow,
      pixKey: null,
      bankAccount: { bank: 'Banco X', agency: '0001', accountNumber: '12345', checkDigit: '6' },
    })
    assert.equal(bank.pixBancario, 'Banco X · Ag 0001 · Cc 12345-6')
    assert.equal(ledgerRowFromGeneral({ ...baseRow, pixKey: null, bankAccount: null }).pixBancario, null)
  })

  it('nomes null viram null (a View mostra "—")', () => {
    const r = ledgerRowFromGeneral({ ...baseRow, supplierName: null, costCenterName: null })
    assert.equal(r.fornecedor, null)
    assert.equal(r.centroCusto, null)
  })
})

describe('formatIsoDateBR — YYYY-MM-DD → DD/MM/AAAA (sem Date)', () => {
  it('formata; aceita sufixo de hora; malformado → a própria string', () => {
    assert.equal(formatIsoDateBR('2026-01-10'), '10/01/2026')
    assert.equal(formatIsoDateBR('2026-12-31T00:00:00Z'), '31/12/2026')
    assert.equal(formatIsoDateBR('lixo'), 'lixo')
  })
})

describe('monthGroupKey / monthGroupLabel — separador de mês (sem Date)', () => {
  it('chave "MM/AAAA" e rótulo "Mês / Ano" por índice; malformado → a própria string', () => {
    assert.equal(monthGroupKey('10/01/2026'), '01/2026')
    assert.equal(monthGroupLabel('10/01/2026'), 'Janeiro / 2026')
    assert.equal(monthGroupLabel('05/12/2026'), 'Dezembro / 2026')
    assert.equal(monthGroupLabel('lixo'), 'lixo')
  })
})

describe('formatPixBancario', () => {
  it('PIX → "PIX · <chave>"; bancário → "<banco> · Ag .. · Cc ..-.."; nenhum → null', () => {
    assert.equal(formatPixBancario(baseRow), 'PIX · 12.345.678/0001-90')
    assert.equal(formatPixBancario({ ...baseRow, pixKey: null, bankAccount: null }), null)
  })
})

describe('totalPages — paginação (server-side; só a derivação)', () => {
  it('ceil(total/perPage), no mínimo 1', () => {
    assert.equal(totalPages(24, 10), 3)
    assert.equal(totalPages(20, 10), 2)
    assert.equal(totalPages(0, 10), 1)
    assert.equal(totalPages(5, 25), 1)
    assert.equal(totalPages(10, 0), 1)
  })
  it('PER_PAGE_DEFAULT é 10', () => {
    assert.equal(PER_PAGE_DEFAULT, 10)
  })
})

// Fixture de exibição p/ o CSV/cellText (LedgerRow já mapeada).
const FIX: readonly LedgerRow[] = [
  {
    data: '02/01/2026',
    vencimento: '10/01/2026',
    tipo: 'A pagar',
    numeroContrato: 'CT-1',
    codigo: 'PAG-1',
    parcela: null,
    apontamento: null,
    fornecedor: 'Fornecedor A',
    financiador: null,
    colaborador: null,
    centroCusto: 'CC1',
    categoria: 'Cat1',
    subcategoria: 'Sub1',
    pixBancario: 'PIX · 123',
    valorCents: 120000,
  },
  {
    data: '08/01/2026',
    vencimento: null,
    tipo: 'A pagar',
    numeroContrato: null,
    codigo: 'CTX-1',
    parcela: null,
    apontamento: null,
    fornecedor: null,
    financiador: null,
    colaborador: 'Colab X',
    centroCusto: 'CC2',
    categoria: 'Cat2',
    subcategoria: 'Sub2',
    pixBancario: null,
    valorCents: 4500,
  },
]

describe('buildCsv — 15 colunas, nullable → campo VAZIO', () => {
  const lines = buildCsv(FIX).split('\r\n')

  it('cabeçalho exato das 15 colunas na ORDEM do legado (Contrato → … → Data → Valor)', () => {
    assert.equal(
      lines[0],
      'Nº Contrato;Tipo;Código;Vencimento;Parcela;Apontamento;Fornecedor;Financiador;Colaborador;Centro de Custo;Categoria;Subcategoria;PIX/Bancário;Data;Valor',
    )
  })

  it('uma linha por movimento + o cabeçalho', () => {
    assert.equal(lines.length, 1 + FIX.length)
  })

  it('nullable vira campo VAZIO no CSV (não "—") — linha 2 (na ordem do legado)', () => {
    assert.equal(
      lines[2],
      `"";"A pagar";"CTX-1";"";"";"";"";"";"Colab X";"CC2";"Cat2";"Sub2";"";"08/01/2026";"${formatBRL(4500)}"`,
    )
    assert.ok(!(lines[2]?.includes('—') ?? false), 'o traço "—" é só de EXIBIÇÃO; não vai ao CSV')
  })
})

describe('buildCsv — export segue as colunas VISÍVEIS (WYSIWYG)', () => {
  it('só as colunas passadas, na ordem, com o cabeçalho correspondente', () => {
    const lines = buildCsv(FIX, ['data', 'tipo', 'valor']).split('\r\n')
    assert.equal(lines[0], 'Data;Tipo;Valor')
    assert.equal(lines[1], `"02/01/2026";"A pagar";"${formatBRL(120000)}"`)
  })
  it('lista de colunas VAZIA → volta às 15 (guarda defensiva)', () => {
    assert.equal(buildCsv(FIX, []).split('\r\n')[0], CSV_HEADER)
  })
})

describe('cellText — acessor de célula por coluna', () => {
  it('valor formatado em BRL; ausente → null; presente → o cru', () => {
    const row = FIX[1]
    if (row === undefined) throw new Error('fixture ausente')
    assert.equal(cellText(row, 'valor'), formatBRL(row.valorCents))
    assert.equal(cellText(row, 'vencimento'), null)
    assert.equal(cellText(row, 'tipo'), 'A pagar')
  })
})

describe('contentCharsByColumn — maior conteúdo por coluna (dimensiona a track)', () => {
  it('conta o maior texto; célula nula conta como o traço (naLen)', () => {
    const rowA = ledgerRowFromGeneral({ ...baseRow, supplierName: 'Curto' })
    const rowB = ledgerRowFromGeneral({ ...baseRow, supplierName: 'Fornecedor Bem Mais Longo LTDA' })
    const lenB = (cellText(rowB, 'fornecedor') ?? '').length
    const counts = contentCharsByColumn([rowA, rowB], ['fornecedor', 'financiador'], 1)
    assert.equal(counts.fornecedor, lenB) // o MAIOR entre as linhas
    assert.ok(lenB > 20)
    assert.equal(counts.financiador, 1) // null nas duas → naLen ("—")
  })
  it('sem linhas → 0', () => {
    assert.equal(contentCharsByColumn([], ['fornecedor'], 1).fornecedor, 0)
  })
})
