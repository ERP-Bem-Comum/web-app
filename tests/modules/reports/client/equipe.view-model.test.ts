/**
 * ViewModel do relatório "Equipe ABC" — unidades PURAS (node:test, sem DOM). Cobre as 5 agregações dos
 * gráficos (gênero / raça-cor / faixa etária incl. N/A / ano de contrato / função), o build do CSV enxuto
 * (cabeçalho + linha), o tamanho do placeholder e a GARANTIA LGPD: o tipo `TeamMemberRow` não carrega campos
 * sensíveis (cpf/email/telefone/endereço/remuneração/alergias/biografia).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  byGenero,
  byRacaCor,
  byFaixaEtaria,
  byAnoContrato,
  byFuncao,
  buildCsv,
  formatSharePercent,
  total,
  loadTeam,
  totalPages,
  pageSlice,
  PER_PAGE_DEFAULT,
  GENERO_ORDER,
  RACA_ORDER,
  FAIXA_ETARIA_LABELS,
  ANOS,
} from '../../../../src/modules/reports/client/equipe.view-model.ts'
import {
  EQUIPE_PLACEHOLDER,
  type TeamMemberRow,
} from '../../../../src/modules/reports/client/data/equipe.placeholder.ts'

// Fixture pequena e determinística (6 colaboradores, com idade null e um ano fora do range).
const FIX: readonly TeamMemberRow[] = [
  {
    nome: 'A',
    idade: 22,
    programa: 'DDI',
    funcao: 'Analista',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'Branco',
    escolaridade: 'Superior Completo',
    anoContrato: 2019,
  },
  {
    nome: 'B',
    idade: 35,
    programa: 'EPV',
    funcao: 'Analista',
    vinculo: 'PJ',
    genero: 'Homem Cis',
    racaCor: 'Pardo',
    escolaridade: 'Mestrado',
    anoContrato: 2020,
  },
  {
    nome: 'C',
    idade: 45,
    programa: 'PARC',
    funcao: 'Coordenador',
    vinculo: 'CLT',
    genero: 'Homem Cis',
    racaCor: 'Preto',
    escolaridade: 'Pós-graduação',
    anoContrato: 2020,
  },
  {
    nome: 'D',
    idade: 55,
    programa: 'DDI',
    funcao: 'Coordenador',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'Branco',
    escolaridade: 'N/A',
    anoContrato: 2021,
  },
  {
    nome: 'E',
    idade: 66,
    programa: 'EPV',
    funcao: 'Gerente',
    vinculo: 'PJ',
    genero: 'Prefiro não responder',
    racaCor: 'Amarelo',
    escolaridade: 'Superior Completo',
    anoContrato: 2025,
  },
  {
    nome: 'F',
    idade: null,
    programa: 'PARC',
    funcao: 'Analista',
    vinculo: 'CLT',
    genero: 'Mulher Cis',
    racaCor: 'N/A',
    escolaridade: 'N/A',
    anoContrato: 2018,
  },
]

describe('byGenero — donut (3 fatias na ordem canônica)', () => {
  const slices = byGenero(FIX)

  it('mantém a ordem canônica e todas as 3 categorias', () => {
    assert.deepStrictEqual(
      slices.map((s) => s.label),
      [...GENERO_ORDER],
    )
  })

  it('conta corretamente (Mulher Cis 3, Homem Cis 2, Prefiro não responder 1)', () => {
    const byLabel = new Map(slices.map((s) => [s.label, s.count]))
    assert.strictEqual(byLabel.get('Mulher Cis'), 3)
    assert.strictEqual(byLabel.get('Homem Cis'), 2)
    assert.strictEqual(byLabel.get('Prefiro não responder'), 1)
  })

  it('a soma das fatias = total de colaboradores', () => {
    assert.strictEqual(
      slices.reduce((s, x) => s + x.count, 0),
      FIX.length,
    )
  })
})

describe('byRacaCor — barras verticais (6 categorias na ordem canônica)', () => {
  const bars = byRacaCor(FIX)

  it('produz as 6 categorias na ordem canônica', () => {
    assert.deepStrictEqual(
      bars.map((b) => b.label),
      [...RACA_ORDER],
    )
  })

  it('conta N/A 1, Branco 2, Preto 1, Pardo 1, Amarelo 1, Prefiro não revelar 0', () => {
    const byLabel = new Map(bars.map((b) => [b.label, b.count]))
    assert.strictEqual(byLabel.get('N/A'), 1)
    assert.strictEqual(byLabel.get('Branco'), 2)
    assert.strictEqual(byLabel.get('Preto'), 1)
    assert.strictEqual(byLabel.get('Pardo'), 1)
    assert.strictEqual(byLabel.get('Amarelo'), 1)
    assert.strictEqual(byLabel.get('Prefiro não revelar'), 0)
  })
})

describe('byFaixaEtaria — barras horizontais (buckets incl. N/A)', () => {
  const bars = byFaixaEtaria(FIX)

  it('produz os 6 buckets na ordem canônica', () => {
    assert.deepStrictEqual(
      bars.map((b) => b.label),
      [...FAIXA_ETARIA_LABELS],
    )
  })

  it('bucketiza idade (22→Até 29, 35→30 a 39, 45→40 a 49, 55→50 a 59, 66→60+, null→N/A)', () => {
    const byLabel = new Map(bars.map((b) => [b.label, b.count]))
    assert.strictEqual(byLabel.get('Até 29'), 1)
    assert.strictEqual(byLabel.get('30 a 39'), 1)
    assert.strictEqual(byLabel.get('40 a 49'), 1)
    assert.strictEqual(byLabel.get('50 a 59'), 1)
    assert.strictEqual(byLabel.get('60+'), 1)
    assert.strictEqual(byLabel.get('N/A'), 1)
  })

  it('idade null cai SEMPRE no bucket N/A (sem throw, sem NaN)', () => {
    const nullRow: TeamMemberRow = {
      nome: 'X',
      idade: null,
      programa: 'DDI',
      funcao: 'Analista',
      vinculo: 'CLT',
      genero: 'Mulher Cis',
      racaCor: 'N/A',
      escolaridade: 'N/A',
      anoContrato: 2020,
    }
    const onlyNull = byFaixaEtaria([nullRow])
    const na = onlyNull.find((b) => b.label === 'N/A')
    assert.strictEqual(na?.count, 1)
  })
})

describe('byAnoContrato — linha (2019..2025)', () => {
  const points = byAnoContrato(FIX)

  it('cobre exatamente os anos 2019..2025', () => {
    assert.deepStrictEqual(
      points.map((p) => p.year),
      [...ANOS],
    )
  })

  it('conta por ano (2019:1, 2020:2, 2021:1, 2025:1; 2022-2024:0)', () => {
    const byYear = new Map(points.map((p) => [p.year, p.count]))
    assert.strictEqual(byYear.get(2019), 1)
    assert.strictEqual(byYear.get(2020), 2)
    assert.strictEqual(byYear.get(2021), 1)
    assert.strictEqual(byYear.get(2022), 0)
    assert.strictEqual(byYear.get(2023), 0)
    assert.strictEqual(byYear.get(2024), 0)
    assert.strictEqual(byYear.get(2025), 1)
  })

  it('ano fora do range (2018) é IGNORADO — não vira coluna nem estoura', () => {
    const soma = points.reduce((s, p) => s + p.count, 0)
    // 6 linhas, 1 delas com ano 2018 (fora) → 5 contabilizadas.
    assert.strictEqual(soma, 5)
  })
})

describe('byFuncao — barras horizontais (ordem decrescente de contagem)', () => {
  const bars = byFuncao(FIX)

  it('uma barra por função distinta, DESC por contagem', () => {
    assert.strictEqual(bars.length, 3)
    assert.strictEqual(bars[0]?.label, 'Analista') // 3
    assert.strictEqual(bars[0]?.count, 3)
    assert.strictEqual(bars[1]?.count, 2) // Coordenador
    assert.strictEqual(bars[2]?.count, 1) // Gerente
    // ordenação DESC monotônica.
    assert.ok((bars[0]?.count ?? 0) >= (bars[1]?.count ?? 0))
    assert.ok((bars[1]?.count ?? 0) >= (bars[2]?.count ?? 0))
  })
})

describe('formatSharePercent — % pt-BR com guard ÷0', () => {
  it('inteiro sem casas, fracionário 1 casa, ÷0 → 0%', () => {
    assert.strictEqual(formatSharePercent(1, 4), '25%')
    assert.strictEqual(formatSharePercent(8, 36), '22,2%')
    assert.strictEqual(formatSharePercent(0, 10), '0%')
    assert.strictEqual(formatSharePercent(5, 0), '0%')
  })
})

describe('buildCsv — colunas enxutas (LGPD)', () => {
  const csv = buildCsv(FIX)
  const lines = csv.split('\r\n')

  it('cabeçalho exato das 8 colunas de exibição', () => {
    assert.strictEqual(
      lines[0],
      'Nome;Idade;Área de atuação;Função;Vínculo;Identidade de gênero;Raça/cor;Escolaridade',
    )
  })

  it('uma linha por colaborador + o cabeçalho', () => {
    assert.strictEqual(lines.length, 1 + FIX.length)
  })

  it('primeira linha = colaborador A com os campos enxutos', () => {
    assert.strictEqual(lines[1], '"A";"22";"DDI";"Analista";"CLT";"Mulher Cis";"Branco";"Superior Completo"')
  })

  it('idade null vira "N/A" no CSV', () => {
    // colaborador F (idade null) é a última linha.
    assert.ok(lines[6]?.includes('"N/A"'))
  })

  it('NÃO vaza nenhum campo sensível (LGPD) no CSV', () => {
    const lower = csv.toLowerCase()
    for (const forbidden of [
      'cpf',
      'remunera',
      'salário',
      'salario',
      'e-mail',
      'telefone',
      'endereço',
      'alergia',
      'biografia',
    ]) {
      assert.ok(!lower.includes(forbidden), `CSV não deve conter "${forbidden}"`)
    }
  })
})

describe('totalPages / pageSlice — paginação PURA da tabela', () => {
  it('totalPages: ceil(total/perPage), no mínimo 1', () => {
    assert.strictEqual(totalPages(36, 10), 4)
    assert.strictEqual(totalPages(30, 10), 3)
    assert.strictEqual(totalPages(0, 10), 1) // lista vazia = 1 página vazia
    assert.strictEqual(totalPages(5, 25), 1)
    assert.strictEqual(totalPages(10, 0), 1) // perPage inválido → 1
  })

  it('PER_PAGE_DEFAULT é 10', () => {
    assert.strictEqual(PER_PAGE_DEFAULT, 10)
  })

  it('pageSlice fatia a página corrente (1-based)', () => {
    const p1 = pageSlice(EQUIPE_PLACEHOLDER, 1, 10)
    const p2 = pageSlice(EQUIPE_PLACEHOLDER, 2, 10)
    const p4 = pageSlice(EQUIPE_PLACEHOLDER, 4, 10)
    assert.strictEqual(p1.length, 10)
    assert.strictEqual(p2.length, 10)
    assert.strictEqual(p4.length, 6) // 36 = 3*10 + 6
    assert.strictEqual(p1[0]?.nome, EQUIPE_PLACEHOLDER[0]?.nome)
    assert.strictEqual(p2[0]?.nome, EQUIPE_PLACEHOLDER[10]?.nome)
  })

  it('pageSlice clampa a página ao intervalo válido (defensivo)', () => {
    const over = pageSlice(EQUIPE_PLACEHOLDER, 99, 10)
    // clamp para a última página (4) → 6 itens.
    assert.strictEqual(over.length, 6)
    const under = pageSlice(EQUIPE_PLACEHOLDER, 0, 10)
    assert.strictEqual(under[0]?.nome, EQUIPE_PLACEHOLDER[0]?.nome)
  })
})

describe('placeholder sintético (LGPD)', () => {
  it('tem 36 colaboradores', () => {
    assert.strictEqual(EQUIPE_PLACEHOLDER.length, 36)
    assert.strictEqual(total(), 36)
    assert.strictEqual(loadTeam().length, 36)
  })

  it('cada linha carrega SOMENTE as 9 chaves de exibição — nenhum campo sensível', () => {
    const allowed = new Set([
      'nome',
      'idade',
      'programa',
      'funcao',
      'vinculo',
      'genero',
      'racaCor',
      'escolaridade',
      'anoContrato',
    ])
    for (const row of EQUIPE_PLACEHOLDER) {
      for (const key of Object.keys(row)) {
        assert.ok(allowed.has(key), `campo inesperado no placeholder: "${key}"`)
      }
    }
  })

  it('idade é number|null (algumas linhas N/A) e ano de contrato está em 2019..2025', () => {
    let temNull = false
    for (const row of EQUIPE_PLACEHOLDER) {
      assert.ok(row.idade === null || typeof row.idade === 'number')
      if (row.idade === null) temNull = true
      assert.ok(row.anoContrato >= 2019 && row.anoContrato <= 2025)
    }
    assert.ok(temNull, 'deve haver ao menos uma idade N/A (null)')
  })

  it('as 5 agregações sobre o placeholder somam consistentemente', () => {
    const rows = loadTeam()
    const n = rows.length
    assert.strictEqual(
      byGenero(rows).reduce((s, x) => s + x.count, 0),
      n,
    )
    assert.strictEqual(
      byRacaCor(rows).reduce((s, x) => s + x.count, 0),
      n,
    )
    assert.strictEqual(
      byFaixaEtaria(rows).reduce((s, x) => s + x.count, 0),
      n,
    )
    assert.strictEqual(
      byFuncao(rows).reduce((s, x) => s + x.count, 0),
      n,
    )
    // ano: todos os anos do placeholder estão em 2019..2025 → soma = n.
    assert.strictEqual(
      byAnoContrato(rows).reduce((s, x) => s + x.count, 0),
      n,
    )
  })
})
