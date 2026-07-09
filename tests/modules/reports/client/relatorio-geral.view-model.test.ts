/**
 * ViewModel do "Relatório Geral" — unidades PURAS (node:test, sem DOM). Cobre:
 * (1) paginação PURA (`totalPages` / `pageSlice`) — ceil, mínimo 1, clamp defensivo;
 * (2) `buildCsv` — cabeçalho das 15 colunas, uma linha por movimento, nullable → campo VAZIO (não "—"),
 *     valor em BRL;
 * (3) o placeholder — tamanho, mistura de tipos, datas já formatadas "DD/MM/AAAA" (nunca "Invalid Date").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  loadRelatorioGeral,
  total,
  buildCsv,
  CSV_HEADER,
  totalPages,
  pageSlice,
  formatBRL,
  PER_PAGE_DEFAULT,
  cellText,
  type LedgerRow,
} from '#modules/reports/client/relatorio-geral.view-model.ts'

// Fixture pequena e determinística (3 linhas; a 2ª exercita vários campos nullable).
const FIX: readonly LedgerRow[] = [
  {
    data: '02/01/2026',
    vencimento: '10/01/2026',
    tipo: 'Pagamento',
    numeroContrato: 'CT-1',
    codigo: 'PAG-1',
    parcela: '1/12',
    apontamento: null,
    fornecedor: 'Fornecedor A',
    financiador: null,
    colaborador: null,
    centroCusto: 'CC1',
    categoria: 'Cat1',
    subcategoria: 'Sub1',
    pixBancario: 'PIX',
    valorCents: 120000,
  },
  {
    data: '08/01/2026',
    vencimento: null,
    tipo: 'Cartão',
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
  {
    data: '18/01/2026',
    vencimento: '18/01/2026',
    tipo: 'Recebimento',
    numeroContrato: null,
    codigo: 'REC-1',
    parcela: null,
    apontamento: null,
    fornecedor: null,
    financiador: 'Financiador Z',
    colaborador: null,
    centroCusto: 'CC1',
    categoria: 'Cat3',
    subcategoria: 'Sub3',
    pixBancario: 'Bancário',
    valorCents: 1200000,
  },
]

describe('totalPages / pageSlice — paginação PURA', () => {
  it('totalPages: ceil(total/perPage), no mínimo 1', () => {
    assert.equal(totalPages(24, 10), 3)
    assert.equal(totalPages(20, 10), 2)
    assert.equal(totalPages(0, 10), 1) // lista vazia = 1 página vazia
    assert.equal(totalPages(5, 25), 1)
    assert.equal(totalPages(10, 0), 1) // perPage inválido → 1
  })

  it('PER_PAGE_DEFAULT é 10 (uma das opções do BrandPaginator)', () => {
    assert.equal(PER_PAGE_DEFAULT, 10)
  })

  it('pageSlice fatia a página corrente (1-based) e clampa (defensivo)', () => {
    const p1 = pageSlice(FIX, 1, 2)
    const p2 = pageSlice(FIX, 2, 2)
    assert.equal(p1.length, 2)
    assert.equal(p2.length, 1) // 3 = 2 + 1
    assert.equal(p1[0]?.codigo, 'PAG-1')
    // clamp: página muito alta → última página; página 0 → primeira.
    assert.equal(pageSlice(FIX, 99, 2).length, 1)
    assert.equal(pageSlice(FIX, 0, 2)[0]?.codigo, 'PAG-1')
  })
})

describe('buildCsv — 15 colunas, nullable → campo VAZIO', () => {
  const csv = buildCsv(FIX)
  const lines = csv.split('\r\n')

  it('cabeçalho exato das 15 colunas do legado', () => {
    assert.equal(
      lines[0],
      'Data;Vencimento;Tipo;Nº Contrato;Código;Parcela;Apontamento;Fornecedor;Financiador;Colaborador;Centro de Custo;Categoria;Subcategoria;PIX/Bancário;Valor',
    )
  })

  it('uma linha por movimento + o cabeçalho', () => {
    assert.equal(lines.length, 1 + FIX.length)
  })

  it('linha 1 (Pagamento) com todos os campos preenchidos + valor BRL', () => {
    assert.equal(
      lines[1],
      `"02/01/2026";"10/01/2026";"Pagamento";"CT-1";"PAG-1";"1/12";"";"Fornecedor A";"";"";"CC1";"Cat1";"Sub1";"PIX";"${formatBRL(120000)}"`,
    )
  })

  it('nullable vira campo VAZIO no CSV (não "—") — ver a linha 2 (Cartão)', () => {
    // vencimento/contrato/parcela/apontamento/fornecedor/financiador/pix são null → "" entre aspas.
    assert.equal(
      lines[2],
      `"08/01/2026";"";"Cartão";"";"CTX-1";"";"";"";"";"Colab X";"CC2";"Cat2";"Sub2";"";"${formatBRL(4500)}"`,
    )
    assert.ok(!(lines[2]?.includes('—') ?? false), 'o traço "—" é só de EXIBIÇÃO; não vai ao CSV')
  })
})

describe('buildCsv — export segue as colunas VISÍVEIS (seletor de colunas, WYSIWYG)', () => {
  it('só as colunas passadas, na ordem, com o cabeçalho correspondente', () => {
    const lines = buildCsv(FIX, ['data', 'tipo', 'valor']).split('\r\n')
    assert.equal(lines[0], 'Data;Tipo;Valor')
    assert.equal(lines[1], `"02/01/2026";"Pagamento";"${formatBRL(120000)}"`)
  })

  it('lista de colunas VAZIA → volta às 15 (guarda defensiva)', () => {
    assert.equal(buildCsv(FIX, []).split('\r\n')[0], CSV_HEADER)
  })
})

describe('cellText — acessor de célula por coluna', () => {
  it('valor vem formatado em BRL; campo ausente → null; campo presente → o cru', () => {
    const row = FIX[1] // Cartão (vários nullable)
    if (row === undefined) throw new Error('fixture ausente')
    assert.equal(cellText(row, 'valor'), formatBRL(row.valorCents))
    assert.equal(cellText(row, 'vencimento'), null) // nullable ausente
    assert.equal(cellText(row, 'tipo'), 'Cartão')
  })
})

describe('placeholder — fonte da tela (front-first)', () => {
  it('tem várias linhas MISTAS (contagem estável)', () => {
    const rows = loadRelatorioGeral()
    assert.ok(rows.length >= 20)
    assert.equal(total(), rows.length)
  })

  it('mistura tipos (saídas reais-like + entradas placeholder)', () => {
    const tipos = new Set(loadRelatorioGeral().map((r) => r.tipo))
    assert.ok(tipos.has('Pagamento'))
    assert.ok(tipos.has('Recebimento')) // entrada placeholder
    assert.ok(tipos.has('Cartão'))
  })

  it('datas já formatadas "DD/MM/AAAA" — nunca "Invalid Date"', () => {
    for (const r of loadRelatorioGeral()) {
      assert.match(r.data, /^\d{2}\/\d{2}\/\d{4}$/)
      if (r.vencimento !== null) assert.match(r.vencimento, /^\d{2}\/\d{2}\/\d{4}$/)
    }
  })

  it('linhas de Recebimento trazem financiador (placeholder até o A-Receber) e não fornecedor', () => {
    for (const r of loadRelatorioGeral()) {
      if (r.tipo === 'Recebimento') {
        assert.notEqual(r.financiador, null)
        assert.equal(r.fornecedor, null)
      }
    }
  })
})
