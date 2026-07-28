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
  registrationStatus: 'Ativo',
  active: i % 5 !== 0,
  education: i % 4 === 0 ? null : 'Ensino Superior',
  experienceInPublicSector: i % 2 === 0 ? true : null,
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

describe('EquipePage — gráficos demográficos em empty-state honesto', () => {
  it('Gênero/Idade/Raça-cor exibem "Dado não disponível" (endpoint LGPD-safe)', async () => {
    await renderReady()
    // Os 3 gráficos demográficos recebem dataset vazio → 3 rótulos de indisponível.
    expect(screen.getAllByText('Dado não disponível').length).toBeGreaterThanOrEqual(3)
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
