/**
 * ViewModel do relatório "Equipe ABC" — unidades PURAS (node:test, sem DOM). Cobre as 5 agregações dos
 * gráficos (gênero / raça-cor / faixa etária incl. N/A / ano de contrato / função), o build do CSV enxuto
 * (cabeçalho + linha), o tamanho do placeholder e a GARANTIA LGPD: o tipo `TeamMemberRow` não carrega campos
 * sensíveis (cpf/email/telefone/endereço/remuneração/alergias/biografia).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  byAnoContrato,
  byFuncao,
  buildCsv,
  formatSharePercent,
  total,
  loadTeam,
  teamFilterOptions,
  applyTeamFilters,
  EMPTY_TEAM_FILTERS,
  totalPages,
  pageSlice,
  PER_PAGE_DEFAULT,
  ANOS,
  faixaEtariaIdOf,
  countByTemplate,
  categoryKeyOf,
} from '../../../../src/modules/reports/client/equipe.view-model.ts'
// Os enums canônicos: o teste compara contra a MESMA fonte que a tela usa (se a lista mudar no domínio de
// Colaboradores, o filtro acompanha sozinho — é justamente o que estas asserções garantem).
import {
  GENDER_IDENTITIES,
  RACES,
  EDUCATION_LEVELS,
  EMPLOYMENT_RELATIONSHIPS,
  OCCUPATION_AREAS,
} from '../../../../src/modules/partners/client/data/model/collaborator.model.ts'
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
    status: 'ATIVO',
    situacaoCadastral: 'Complete',
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
    status: 'ATIVO',
    situacaoCadastral: 'Complete',
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
    status: 'ATIVO',
    situacaoCadastral: 'Complete',
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
    status: 'ATIVO',
    situacaoCadastral: 'Complete',
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
    status: 'ATIVO',
    situacaoCadastral: 'Complete',
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
    status: 'ATIVO',
    situacaoCadastral: 'Complete',
  },
]

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

  // Guard de LGPD: a allowlist é o CONTRATO da linha — só o recorte de exibição/filtro entra. Ampliar esta
  // lista é uma decisão consciente, não um ajuste mecânico: nada de cpf/email/telefone/endereço/
  // remuneração/alergias/biografia, que é o que este teste existe para barrar. `status` e
  // `situacaoCadastral` são estado operacional do vínculo (não PII) e alimentam 2 dos filtros da tela.
  it('cada linha carrega SOMENTE as 11 chaves de exibição/filtro — nenhum campo sensível', () => {
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
      'status',
      'situacaoCadastral',
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

  it('as agregações não-demográficas sobre o placeholder somam consistentemente', () => {
    const rows = loadTeam()
    const n = rows.length
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

describe('teamFilterOptions', () => {
  // Fixture com duplicatas, sentinelas ("—"/"N/A"/""), ano 0 (não-parseável) e fora de ordem.
  const mk = (over: Partial<TeamMemberRow>): TeamMemberRow => ({
    nome: 'x',
    idade: null,
    programa: '—',
    funcao: '—',
    vinculo: '—',
    genero: '—',
    racaCor: '—',
    escolaridade: '—',
    anoContrato: 0,
    status: 'ATIVO',
    situacaoCadastral: 'Complete',
    ...over,
  })
  const ROWS: readonly TeamMemberRow[] = [
    mk({
      escolaridade: 'Superior',
      vinculo: 'CLT',
      programa: 'Beta',
      funcao: 'Coordenador',
      anoContrato: 2021,
      status: 'ATIVO',
      situacaoCadastral: 'Complete',
    }),
    mk({ escolaridade: 'Médio', vinculo: 'PJ', programa: 'Alfa', funcao: 'Analista', anoContrato: 2023 }),
    mk({ escolaridade: 'Superior', vinculo: 'CLT', programa: 'Alfa', funcao: 'Analista', anoContrato: 2021 }),
    mk({ escolaridade: '—', vinculo: '', programa: 'N/A', funcao: '—', anoContrato: 0 }), // tudo sentinela → pulado
  ]

  it('derivadas do dado (funcao): distintas, sem sentinela/vazio, alfabético pt-BR', () => {
    assert.deepStrictEqual(teamFilterOptions(ROWS).funcao, ['Analista', 'Coordenador'])
  })

  it('anoContrato: anos válidos únicos em DESC (pula 0)', () => {
    assert.deepStrictEqual(teamFilterOptions(ROWS).anoContrato, ['2023', '2021'])
  })

  // As listas FECHADAS vêm do domínio de Colaboradores, não do recorte carregado: um valor sem ninguém hoje
  // ainda aparece (senão a pessoa conclui que "PJ não existe" por não haver PJ contratado). É o oposto das
  // derivadas acima — e foi a cópia local desatualizada que fez este relatório apagar identidades.
  it('fechadas: vêm dos enums canônicos, mesmo sem nenhuma linha correspondente', () => {
    const o = teamFilterOptions([mk({})])
    assert.deepStrictEqual(o.vinculo, EMPLOYMENT_RELATIONSHIPS)
    assert.deepStrictEqual(o.escolaridade, EDUCATION_LEVELS)
    assert.deepStrictEqual(o.programa, OCCUPATION_AREAS)
    assert.deepStrictEqual(o.genero, GENDER_IDENTITIES)
    assert.deepStrictEqual(o.racaCor, RACES)
    assert.ok(o.racaCor.includes('INDIGENA'), 'INDIGENA nunca pode sumir da lista')
    assert.deepStrictEqual(o.status, ['ATIVO', 'INATIVO'])
    assert.deepStrictEqual(o.situacaoCadastral, ['Complete', 'PreRegistration'])
  })

  it('linha toda-sentinela não contribui com nenhuma opção DERIVADA', () => {
    const o = teamFilterOptions([mk({})])
    assert.deepStrictEqual(o.funcao, [])
    assert.deepStrictEqual(o.anoContrato, [])
  })
})

describe('countByTemplate (contagem dos gráficos a partir das linhas)', () => {
  const mk = (genero: string): TeamMemberRow => ({
    nome: 'x',
    idade: null,
    programa: '—',
    funcao: '—',
    vinculo: '',
    genero,
    racaCor: '—',
    escolaridade: '—',
    anoContrato: 0,
    status: 'ATIVO',
    situacaoCadastral: 'Complete',
  })

  it('conta sobre o template e mantém a ordem dele, inclusive as categorias zeradas', () => {
    const r = countByTemplate(
      [mk('MULHER_CIS'), mk('MULHER_CIS')],
      ['HOMEM_CIS', 'MULHER_CIS'],
      (x) => x.genero,
    )
    assert.deepStrictEqual(r, [
      { id: 'HOMEM_CIS', count: 0 },
      { id: 'MULHER_CIS', count: 2 },
    ])
  })

  it('categoria fora do template é ACRESCENTADA — a soma sempre fecha com o total de linhas', () => {
    const rows = [mk('MULHER_CIS'), mk('TRAVESTI'), mk('TRAVESTI')]
    const r = countByTemplate(rows, ['MULHER_CIS'], (x) => x.genero)
    assert.deepStrictEqual(r, [
      { id: 'MULHER_CIS', count: 1 },
      { id: 'TRAVESTI', count: 2 },
    ])
    assert.strictEqual(
      r.reduce((s, c) => s + c.count, 0),
      rows.length,
    )
  })

  it('a sentinela de "não informado" vira a categoria NA do backend', () => {
    const r = countByTemplate([mk('—')], ['NA'], (x) => categoryKeyOf(x.genero))
    assert.deepStrictEqual(r, [{ id: 'NA', count: 1 }])
  })
})

describe('faixaEtariaIdOf (mesmos cortes do gráfico Idade do core-api)', () => {
  it('mapeia as 5 faixas + NA nas bordas', () => {
    assert.strictEqual(faixaEtariaIdOf(null), 'NA')
    assert.strictEqual(faixaEtariaIdOf(0), 'ATE_29')
    assert.strictEqual(faixaEtariaIdOf(29), 'ATE_29')
    assert.strictEqual(faixaEtariaIdOf(30), 'DE_30_A_39')
    assert.strictEqual(faixaEtariaIdOf(39), 'DE_30_A_39')
    assert.strictEqual(faixaEtariaIdOf(40), 'DE_40_A_49')
    assert.strictEqual(faixaEtariaIdOf(49), 'DE_40_A_49')
    assert.strictEqual(faixaEtariaIdOf(50), 'DE_50_A_59')
    assert.strictEqual(faixaEtariaIdOf(59), 'DE_50_A_59')
    assert.strictEqual(faixaEtariaIdOf(60), 'MAIS_60')
    assert.strictEqual(faixaEtariaIdOf(103), 'MAIS_60')
  })
})

describe('applyTeamFilters (client-side)', () => {
  const mk = (over: Partial<TeamMemberRow>): TeamMemberRow => ({
    nome: 'x',
    idade: null,
    programa: 'Alfa',
    funcao: 'Analista',
    vinculo: 'CLT',
    genero: '—',
    racaCor: '—',
    escolaridade: 'Superior',
    anoContrato: 2021,
    status: 'ATIVO',
    situacaoCadastral: 'Complete',
    ...over,
  })
  const ROWS: readonly TeamMemberRow[] = [
    mk({
      nome: 'Ana Souza',
      escolaridade: 'Superior',
      programa: 'Alfa',
      anoContrato: 2021,
      status: 'ATIVO',
      situacaoCadastral: 'Complete',
      funcao: 'Coordenador',
    }),
    mk({ nome: 'Bruno Lima', escolaridade: 'Médio', programa: 'Beta', anoContrato: 2023, vinculo: 'PJ' }),
    mk({ nome: 'Cecília Ávila', escolaridade: 'Superior', programa: 'Alfa', anoContrato: 2023 }),
  ]

  it('sem filtro (EMPTY) → não recorta', () => {
    assert.strictEqual(applyTeamFilters(ROWS, EMPTY_TEAM_FILTERS).length, 3)
  })

  it('por escolaridade', () => {
    const r = applyTeamFilters(ROWS, { ...EMPTY_TEAM_FILTERS, escolaridade: 'Superior' })
    assert.deepStrictEqual(
      r.map((x) => x.nome),
      ['Ana Souza', 'Cecília Ávila'],
    )
  })

  it('por ano de contrato (compara como número)', () => {
    const r = applyTeamFilters(ROWS, { ...EMPTY_TEAM_FILTERS, anoContrato: '2023' })
    assert.deepStrictEqual(
      r.map((x) => x.nome),
      ['Bruno Lima', 'Cecília Ávila'],
    )
  })

  it('por programa', () => {
    assert.strictEqual(applyTeamFilters(ROWS, { ...EMPTY_TEAM_FILTERS, programa: 'Beta' }).length, 1)
  })

  it('busca por nome é insensível a caixa e acento', () => {
    // "cecilia" (sem acento, minúsculo) casa "Cecília Ávila".
    const r = applyTeamFilters(ROWS, { ...EMPTY_TEAM_FILTERS, search: 'cecilia' })
    assert.deepStrictEqual(
      r.map((x) => x.nome),
      ['Cecília Ávila'],
    )
  })

  it('combinação AND (escolaridade + ano)', () => {
    const r = applyTeamFilters(ROWS, { ...EMPTY_TEAM_FILTERS, escolaridade: 'Superior', anoContrato: '2023' })
    assert.deepStrictEqual(
      r.map((x) => x.nome),
      ['Cecília Ávila'],
    )
  })

  it('sem match → vazio (não quebra)', () => {
    assert.strictEqual(applyTeamFilters(ROWS, { ...EMPTY_TEAM_FILTERS, programa: 'Inexistente' }).length, 0)
  })
})
