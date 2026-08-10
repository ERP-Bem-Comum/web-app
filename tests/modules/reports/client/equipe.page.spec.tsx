/**
 * EquipePage + EquipeTable + EquipeDetailModal (Vitest/jsdom) — tela do relatório "Equipe ABC" LIGADA À FONTE
 * REAL (#114, endpoint LGPD-safe, via `reportsRepository.getTeam` MOCKADO):
 *   0. troca placeholder→real: as linhas vêm do repository mockado (não das constantes placeholder).
 *   1. loading → ready; paginação (36 membros sintéticos → 4 páginas de 10).
 *   2. linha clicável abre o modal de detalhe (9 rótulos enxutos LGPD).
 *   3. gráficos demográficos (Gênero/Idade/Raça-cor) → empty-state honesto "Dado não disponível".
 *   4. empty ([] do backend) e erro (tag i18n).
 * Fixtures SINTÉTICAS (LGPD): nada de PII real. `useNavigate` mockado.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ok, err } from '#shared/primitives/result.ts'
import type { TeamMember } from '#modules/reports/client/data/model/team-report.model.ts'
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'

const navigateSpy = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateSpy,
}))

vi.mock('#modules/reports/client/data/repository/reports.repository.instance.ts', () => ({
  reportsRepository: {
    getTeam: vi.fn(),
    getTeamDemographics: vi.fn(),
    getSuppliersWithoutContract: vi.fn(),
    getPaymentPosition: vi.fn(),
  },
}))

import { EquipePage } from '#modules/reports/client/page/equipe.page.tsx'

const mockedGetTeam = vi.mocked(reportsRepository.getTeam)

const ROLES = ['Analista', 'Coordenador', 'Gerente'] as const

// 36 colaboradores SINTÉTICOS (nomes fictícios, sem PII) → 4 páginas de 10.
const TEAM: readonly TeamMember[] = Array.from({ length: 36 }, (_v, i) => ({
  id: `tm-${String(i)}`,
  name: `Colaborador Sintético ${String(i).padStart(2, '0')}`,
  program: i % 3 === 0 ? null : `Programa ${String(i % 3)}`,
  role: ROLES[i % ROLES.length] ?? 'Analista',
  employmentRelationship: i % 2 === 0 ? 'CLT' : 'PJ',
  startOfContract: `${String(2019 + (i % 7))}-01-15`,
  // Códigos REAIS do core-api (`RegistrationStatus`) — a tela traduz para "Cadastrado"/"Pré-cadastro".
  registrationStatus: i % 3 === 0 ? 'PreRegistration' : 'Complete',
  active: i % 5 !== 0,
  education: i % 4 === 0 ? null : 'ENSINO_SUPERIOR',
  experienceInPublicSector: i % 2 === 0 ? true : null,
  genderIdentity: i % 3 === 0 ? 'MULHER_CIS' : 'HOMEM_CIS',
  race: i % 4 === 0 ? 'INDIGENA' : 'PARDO',
  age: 25 + (i % 30),
}))

function renderPage(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: Readonly<{ children: ReactNode }>): ReactNode => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  render(<EquipePage />, { wrapper })
}

/** Renderiza e aguarda a tabela real (paginador) aparecer. */
async function renderReady(): Promise<void> {
  mockedGetTeam.mockResolvedValue(ok(TEAM))
  renderPage()
  await screen.findByText('Anterior')
}

/** Primeira linha clicável da tabela (aria-label "Ver detalhes de …"). */
function firstRow(): HTMLElement {
  const rows = screen.getAllByRole('button', { name: /Ver detalhes de/ })
  const row = rows[0]
  if (row === undefined) throw new Error('nenhuma linha clicável encontrada')
  return row
}

beforeEach(() => {
  navigateSpy.mockReset()
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('EquipePage — fonte real (loading/ready)', () => {
  it('mostra o carregamento enquanto a query não resolve', () => {
    mockedGetTeam.mockReturnValue(new Promise(() => undefined))
    renderPage()
    expect(screen.getByText('Carregando a equipe…')).toBeTruthy()
  })

  it('resolve com os dados REAIS do repository (não do placeholder)', async () => {
    await renderReady()
    expect(mockedGetTeam).toHaveBeenCalledTimes(1)
    // Nome sintético do fixture (não um nome do placeholder legado).
    expect(screen.getByText('Colaborador Sintético 00')).toBeTruthy()
  })
})

describe('EquipePage — paginação', () => {
  it('renderiza o BrandPaginator (Página 1 de 4)', async () => {
    await renderReady()
    expect(screen.getByText('Anterior')).toBeTruthy()
    expect(screen.getByText('Próxima')).toBeTruthy()
    expect(screen.getByText(/Página\s*1\s*de\s*4/)).toBeTruthy()
  })

  it('mostra só a fatia da página (10 linhas na 1ª página)', async () => {
    await renderReady()
    const rows = screen.getAllByRole('button', { name: /Ver detalhes de/ })
    expect(rows.length).toBe(10)
  })

  it('"Anterior" começa desabilitado; "Próxima" avança a fatia', async () => {
    await renderReady()
    expect(screen.getByText('Anterior').hasAttribute('disabled')).toBe(true)
    const before = firstRow().getAttribute('aria-label')
    fireEvent.click(screen.getByText('Próxima'))
    const after = firstRow().getAttribute('aria-label')
    expect(after).not.toBe(before)
  })

  it('trocar "itens por página" volta para a 1ª página e reslice', async () => {
    await renderReady()
    fireEvent.click(screen.getByText('Próxima'))
    fireEvent.change(screen.getByLabelText('Itens por página'), { target: { value: '25' } })
    expect(screen.getAllByRole('button', { name: /Ver detalhes de/ }).length).toBe(25)
    expect(screen.getByText('Anterior').hasAttribute('disabled')).toBe(true)
  })
})

describe('EquipePage — demografia sem o endpoint agregado', () => {
  /**
   * Sem o `/reports/team/demographics` (falha/403) a tela NÃO fica cega: Gênero e Raça/cor continuam sendo
   * contados das linhas, com os rótulos do catálogo do front. Não é dado novo cruzando fronteira — é a
   * mesma coluna que a tabela ao lado já mostra.
   *
   * Idade é a exceção: "30 a 39" é rótulo que só a API tem, então sem catálogo o card fica no empty-state
   * em vez de escrever `DE_30_A_39` na tela.
   */
  it('Gênero e Raça/cor ainda contam das linhas; Idade cai no empty-state', async () => {
    await renderReady() // `getTeamDemographics` sem mock → query falha → catálogo vazio
    const chips = Array.from(document.querySelectorAll('li')).map((n) => n.textContent ?? '')
    expect(chips.some((c) => c.startsWith('Mulher cisgênero'))).toBe(true)
    expect(screen.getAllByText('Dado não disponível').length).toBeGreaterThanOrEqual(1)
  })
})

/**
 * Os 3 filtros que ficaram inertes até a P.O. apontar em tela (09/08): Status, Situação Cadastral e Idade.
 * Os dois primeiros são lista FECHADA (existem mesmo sem ninguém no recorte); Idade é por FAIXA, com as
 * categorias vindo da MESMA resposta que desenha o gráfico — é isso que impede filtro e gráfico de divergir.
 */
describe('EquipePage — filtros Status / Situação Cadastral / Idade', () => {
  const AGE_RANGES = [
    { id: 'ATE_29', label: 'Até 29', count: 4 },
    { id: 'DE_30_A_39', label: '30 a 39', count: 10 },
    { id: 'DE_40_A_49', label: '40 a 49', count: 12 },
    { id: 'DE_50_A_59', label: '50 a 59', count: 10 },
    { id: 'MAIS_60', label: '60+', count: 0 },
    { id: 'NA', label: 'N/A', count: 0 },
  ] as const

  async function renderComDemografia(): Promise<void> {
    mockedGetTeam.mockResolvedValue(ok(TEAM))
    vi.mocked(reportsRepository.getTeamDemographics).mockResolvedValue(
      ok({ totalActive: 36, gender: [], ageRange: AGE_RANGES, race: [] }),
    )
    renderPage()
    await screen.findByText('Anterior')
  }

  const optionsOf = (label: string): readonly string[] =>
    Array.from(screen.getByLabelText(label).querySelectorAll('option')).map((o) => o.textContent ?? '')

  it('Status oferece Ativo/Inativo com os rótulos do módulo Colaboradores', async () => {
    await renderComDemografia()
    expect(optionsOf('Status')).toEqual(['Todos', 'Ativo', 'Inativo'])
  })

  it('Situação Cadastral oferece Cadastrado/Pré-cadastro', async () => {
    await renderComDemografia()
    expect(optionsOf('Situação Cadastral')).toEqual(['Todos', 'Cadastrado', 'Pré-cadastro'])
  })

  it('Idade oferece as MESMAS faixas do gráfico (rótulos vindos da API)', async () => {
    await renderComDemografia()
    expect(optionsOf('Idade')).toEqual(['Todos', 'Até 29', '30 a 39', '40 a 49', '50 a 59', '60+', 'N/A'])
  })

  it('filtrar por Status=Inativo recorta a tabela (fixture: 1 em cada 5 inativo)', async () => {
    await renderComDemografia()
    const antes = screen.getAllByRole('button', { name: /Ver detalhes de/ }).length
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'INATIVO' } })
    fireEvent.click(screen.getByText('Filtrar'))
    const depois = screen.getAllByRole('button', { name: /Ver detalhes de/ })
    // 36 membros, `active: i % 5 !== 0` → 8 inativos; todos cabem na 1ª página de 10.
    expect(depois.length).toBe(8)
    expect(depois.length).toBeLessThan(antes)
  })

  it('filtrar por faixa etária usa o corte por pessoa (idade 25..54 na fixture)', async () => {
    await renderComDemografia()
    fireEvent.change(screen.getByLabelText('Idade'), { target: { value: 'MAIS_60' } })
    fireEvent.click(screen.getByText('Filtrar'))
    // Ninguém com 60+ na fixture → tabela vazia, sem quebrar a tela.
    expect(screen.queryAllByRole('button', { name: /Ver detalhes de/ }).length).toBe(0)
  })
})

/**
 * Gênero: os nomes saíram de CIMA das fatias (se sobrepunham com muitas identidades) e viraram legenda no
 * card. O que o teste protege é o que a P.O. viu quebrado: nome de categoria desenhado dentro do SVG.
 */
describe('EquipePage — legenda do gráfico de Gênero', () => {
  // Catálogo de categorias; as contagens da tela vêm das LINHAS (fixture: 12 MULHER_CIS, 24 HOMEM_CIS).
  const GENDER = [
    { id: 'MULHER_CIS', label: 'Mulher cis', count: 0 },
    { id: 'HOMEM_CIS', label: 'Homem cis', count: 0 },
    { id: 'TRAVESTI', label: 'Travesti', count: 0 },
  ] as const

  async function renderComGenero(): Promise<void> {
    mockedGetTeam.mockResolvedValue(ok(TEAM))
    vi.mocked(reportsRepository.getTeamDemographics).mockResolvedValue(
      ok({ totalActive: 36, gender: GENDER, ageRange: [], race: [] }),
    )
    renderPage()
    await screen.findByText('Anterior')
  }

  it('mostra nome e contagem de cada identidade presente na legenda', async () => {
    await renderComGenero()
    // Busca nos <li> da legenda: o nome da identidade também existe como <option> do filtro de Gênero.
    const chips = Array.from(document.querySelectorAll('li')).map((n) => n.textContent ?? '')
    expect(chips).toContain('Mulher cisgênero12')
    expect(chips).toContain('Homem cisgênero24')
    // Identidade sem ninguém não vira chip (o gráfico desenha quem tem gente).
    expect(chips.some((c) => c.startsWith('Travesti'))).toBe(false)
  })

  it('nenhum nome de categoria é desenhado DENTRO do SVG (era o que se sobrepunha)', async () => {
    await renderComGenero()
    const textosNoSvg = Array.from(document.querySelectorAll('svg text')).map((n) => n.textContent ?? '')
    for (const nome of ['Mulher cisgênero', 'Homem cisgênero']) {
      expect(textosNoSvg).not.toContain(nome)
    }
  })

  it('usa o rótulo do catálogo do front, não o da API, quando conhece o código', async () => {
    mockedGetTeam.mockResolvedValue(ok(TEAM))
    vi.mocked(reportsRepository.getTeamDemographics).mockResolvedValue(
      // A API ainda manda a redação antiga; a tela tem que mostrar a que o cliente pediu.
      ok({
        totalActive: 1,
        gender: [{ id: 'MULHER_CIS', label: 'Mulher cis', count: 1 }],
        ageRange: [],
        race: [],
      }),
    )
    renderPage()
    await screen.findByText('Anterior')
    const chips = Array.from(document.querySelectorAll('li')).map((n) => n.textContent ?? '')
    expect(chips.some((c) => c.startsWith('Mulher cisgênero'))).toBe(true)
    expect(chips.some((c) => c.startsWith('Mulher cis') && !c.startsWith('Mulher cisgênero'))).toBe(false)
  })
})

/**
 * O bug que a P.O. achou em tela (09/08): os 3 gráficos demográficos liam a AGREGAÇÃO do backend, que não
 * conhece os filtros — filtrar "Situação Cadastral = Cadastrado" recortava a tabela e o gráfico continuava
 * contando quem estava em pré-cadastro.
 */
describe('EquipePage — os gráficos demográficos respeitam os filtros aplicados', () => {
  async function renderComCatalogo(): Promise<void> {
    mockedGetTeam.mockResolvedValue(ok(TEAM))
    vi.mocked(reportsRepository.getTeamDemographics).mockResolvedValue(
      ok({
        totalActive: 36,
        // Catálogo (ordem/rótulo canônicos). As CONTAGENS daqui são de propósito absurdas: se a tela ainda
        // as estivesse usando em vez de contar as linhas, o teste quebra.
        gender: [
          { id: 'MULHER_CIS', label: 'Mulher cis', count: 999 },
          { id: 'HOMEM_CIS', label: 'Homem cis', count: 999 },
        ],
        ageRange: [],
        race: [],
      }),
    )
    renderPage()
    await screen.findByText('Anterior')
  }

  const chipDe = (nome: string): string =>
    Array.from(document.querySelectorAll('li'))
      .map((n) => n.textContent ?? '')
      .find((c) => c.startsWith(nome)) ?? ''

  it('sem filtro: conta as linhas, não os números da agregação', async () => {
    await renderComCatalogo()
    // Fixture: `genderIdentity` = MULHER_CIS quando i % 3 === 0 → 12 de 36; os outros 24 são HOMEM_CIS.
    expect(chipDe('Mulher cisgênero')).toBe('Mulher cisgênero12')
    expect(chipDe('Homem cisgênero')).toBe('Homem cisgênero24')
  })

  it('com filtro aplicado: o gráfico recorta junto com a tabela', async () => {
    await renderComCatalogo()
    fireEvent.change(screen.getByLabelText('Identidade de Gênero'), { target: { value: 'MULHER_CIS' } })
    fireEvent.click(screen.getByText('Filtrar'))
    expect(chipDe('Mulher cisgênero')).toBe('Mulher cisgênero12')
    // Quem foi filtrado fora some do gráfico — antes continuava lá, com a contagem da agregação.
    expect(chipDe('Homem cisgênero')).toBe('')
  })
})

describe('EquipePage — modal de detalhe (linha clicável)', () => {
  it('clicar numa linha abre o modal com os 9 rótulos enxutos', async () => {
    await renderReady()
    fireEvent.click(firstRow())
    const dialog = screen.getByRole('dialog')
    const scope = within(dialog)
    expect(scope.getByText('Detalhes do colaborador')).toBeTruthy()
    for (const label of [
      'Nome',
      'Idade',
      'Área de atuação',
      'Função',
      'Vínculo',
      'Identidade de gênero',
      'Raça/cor',
      'Escolaridade',
      'Ano de contrato',
    ]) {
      expect(scope.getByText(label)).toBeTruthy()
    }
    expect(scope.getByText('Fechar')).toBeTruthy()
    expect(scope.getByText('Editar')).toBeTruthy()
  })

  it('NÃO vaza campo sensível (LGPD) no modal', async () => {
    await renderReady()
    fireEvent.click(firstRow())
    const html = screen.getByRole('dialog').textContent?.toLowerCase() ?? ''
    for (const forbidden of [
      'cpf',
      'remunera',
      'salário',
      'salario',
      'telefone',
      'e-mail',
      'endereço',
      'alergia',
      'biografia',
    ]) {
      expect(html.includes(forbidden)).toBe(false)
    }
  })

  it('"Fechar" fecha o modal', async () => {
    await renderReady()
    fireEvent.click(firstRow())
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Fechar'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('"Editar" navega ao módulo Colaboradores', async () => {
    await renderReady()
    fireEvent.click(firstRow())
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Editar'))
    expect(navigateSpy).toHaveBeenCalledWith({ to: '/parceiros/colaboradores' })
  })
})

describe('EquipePage — aplicar filtros (client-side) + resumo', () => {
  it('mudar a busca NÃO filtra; "Filtrar" aplica (tabela encolhe) e o resumo aparece sob o título', async () => {
    await renderReady()
    // Início: 10 linhas (1ª de 4 páginas), sem subtítulo de filtro.
    expect(screen.getAllByRole('button', { name: /Ver detalhes de/ }).length).toBe(10)
    expect(screen.queryByText(/Busca:/)).toBeNull()

    // Abre os filtros e digita a busca (DRAFT — ainda não filtra).
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    fireEvent.change(screen.getByLabelText('Pesquise'), { target: { value: 'Sintético 05' } })
    expect(screen.getAllByRole('button', { name: /Ver detalhes de/ }).length).toBe(10)

    // "Filtrar" aplica → só o colaborador 05 casa; subtítulo reflete o aplicado.
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    const rows = screen.getAllByRole('button', { name: /Ver detalhes de/ })
    expect(rows.length).toBe(1)
    expect(screen.getByText('Colaborador Sintético 05')).toBeTruthy()
    expect(screen.getByText('Busca: Sintético 05')).toBeTruthy()
  })

  it('filtro por Vínculo recorta a tabela e volta para a 1ª página', async () => {
    await renderReady()
    fireEvent.click(screen.getByText('Próxima')) // vai p/ a página 2
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    // Vínculo tem 2 valores (CLT/PJ); aplicar PJ recorta o dataset.
    fireEvent.change(screen.getByLabelText('Vínculo Empregatício'), { target: { value: 'PJ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    // Volta p/ a 1ª página (Anterior desabilitado) e o subtítulo mostra o vínculo aplicado.
    expect(screen.getByText('Anterior').hasAttribute('disabled')).toBe(true)
    expect(screen.getByText('Vínculo Empregatício: PJ')).toBeTruthy()
  })
})

describe('EquipePage — empty & erro', () => {
  it('backend devolve [] → tabela vazia (empty-state)', async () => {
    mockedGetTeam.mockResolvedValue(ok([]))
    renderPage()
    const empties = await screen.findAllByText('Nenhum colaborador para exibir.')
    expect(empties.length).toBeGreaterThan(0)
    expect(screen.queryAllByRole('button', { name: /Ver detalhes de/ }).length).toBe(0)
  })

  it('erro do BFF → painel de erro com a tag i18n', async () => {
    mockedGetTeam.mockResolvedValue(err('server'))
    renderPage()
    await screen.findByText('Não foi possível carregar o relatório.')
    expect(screen.getByText('Erro ao carregar o relatório. Tente novamente em instantes.')).toBeTruthy()
  })
})
