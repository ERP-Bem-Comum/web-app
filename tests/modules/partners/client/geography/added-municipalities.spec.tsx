/**
 * US1 (024) — painel "Municípios Parceiros Adicionados" (cross-state). Testa o CONTRATO de render do
 * painel: itens de múltiplas UFs com label `{nome} ({uf})` (formato produzido pelo binding), modo remove,
 * e o estado vazio (`added-empty`). O `TerritoryColumn` é o componente burro que a page usa para o painel.
 *
 * Deferido (justificativa): o teste de render do BINDING completo (useGeographyBinding) exigiria mockar o
 * singleton `geographyRepository` + `useCurrentUser` + QueryClientProvider — frágil no jsdom e sem
 * precedente no módulo (nenhum spec de partners usa vi.mock de singleton). A lógica nova do binding é:
 * (a) mapeamento/ordenação → coberto por node:test (added-municipalities.mapper.test.ts); (b) derivação
 * do GeoPanel + filtro por busca → espelha EXATAMENTE `statesAdded` (já em produção, mesmos helpers
 * `panelFrom`/`matches`). Aqui validamos o que o usuário vê no painel.
 */
import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { TerritoryColumn, type ColumnItem } from '#modules/partners/client/geography/components/territory-column.component.tsx'

afterEach(cleanup)

// Itens já mapeados pelo binding: cross-state, label "{nome} ({uf})", ordenados UF→nome, added:true.
const added: readonly ColumnItem[] = [
  { key: '2700300', label: 'Arapiraca (AL)', added: true },
  { key: '2312908', label: 'Sobral (CE)', added: true },
]

const base = {
  title: 'Municípios Parceiros Adicionados',
  searchId: 'geo-muni-added-search',
  searchValue: '',
  searchPlaceholder: 'Procurar',
  onSearch: vi.fn(),
  columnLabel: 'Município',
  actionLabel: 'Remover',
  mode: 'remove' as const,
  addedLabel: 'Adicionado',
  addAria: 'Adicionar',
  removeAria: 'Remover',
  disabled: false,
  loadingLabel: 'Carregando…',
}

describe('Painel Municípios Adicionados (cross-state)', () => {
  it('lista municípios de múltiplas UFs com label "{nome} ({uf})"', () => {
    render(<TerritoryColumn {...base} emptyLabel="Nenhum município parceiro adicionado." state={{ status: 'ready', items: added }} onAction={vi.fn()} />)
    expect(screen.getByText('Arapiraca (AL)')).toBeTruthy()
    expect(screen.getByText('Sobral (CE)')).toBeTruthy()
    // ambos em modo remove → botão remover por item
    expect(screen.getAllByRole('button', { name: 'Remover' }).length).toBe(2)
  })

  it('estado vazio mostra a mensagem cross-state (não "neste estado")', () => {
    render(<TerritoryColumn {...base} emptyLabel="Nenhum município parceiro adicionado." state={{ status: 'ready', items: [] }} onAction={vi.fn()} />)
    expect(screen.getByText('Nenhum município parceiro adicionado.')).toBeTruthy()
  })

  it('erro de carga exibe a mensagem (sem derrubar o painel)', () => {
    render(<TerritoryColumn {...base} emptyLabel="vazio" state={{ status: 'error', message: 'Algo deu errado.' }} onAction={vi.fn()} />)
    expect(screen.getByText('Algo deu errado.')).toBeTruthy()
  })
})
