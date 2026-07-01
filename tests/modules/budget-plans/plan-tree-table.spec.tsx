/**
 * Testes DOM (Vitest + jsdom) da tabela em árvore de Planejamento (view burra §1.1): chevron que expande
 * versões-filhas, badge de status + trilha de auditoria, e menu "…" por linha. Espelha o comportamento;
 * os dados chegam como `PlanRow` já derivado pelo ViewModel puro.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'

import { PlanTreeTable } from '#modules/budget-plans/client/planejamento/components/plan-tree-table.component.tsx'
import { toPlanRow } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'
import type { BudgetPlanNode } from '#modules/budget-plans/client/data/model/budget-plan.model.ts'

afterEach(() => {
  cleanup()
})

const node = (over: Partial<BudgetPlanNode>): BudgetPlanNode => ({
  id: 1,
  year: 2026,
  programName: 'Ensino de Tempo Integral',
  programAbbreviation: 'ETI',
  version: 1.0,
  scenarioName: null,
  status: 'APROVADO',
  totalInCents: 0,
  updatedByName: 'Administrador',
  updatedAt: '2026-06-30T22:06:00Z',
  networkKind: 'ESTADO',
  partnersCount: 0,
  children: [],
  ...over,
})

const labels = {
  plan: 'Plano Orçamentário',
  total: 'Total',
  partners: 'Parceiros',
  status: 'Status',
  actionsHeader: 'Ações',
  actionsTrigger: 'Ações do plano',
  expand: 'Expandir versões',
  collapse: 'Recolher versões',
} as const

const actionLabelFor = (a: string): string => `ação:${a}`

function renderTable(
  rows: ReturnType<typeof toPlanRow>[],
  overrides?: Partial<Parameters<typeof PlanTreeTable>[0]>,
) {
  return render(
    <PlanTreeTable
      rows={rows}
      labels={labels}
      emptyLabel="Nenhum plano"
      actionLabelFor={actionLabelFor}
      onOpenPlan={() => undefined}
      onAction={() => undefined}
      {...overrides}
    />,
  )
}

describe('PlanTreeTable', () => {
  it('empty: mostra o emptyLabel', () => {
    renderTable([])
    expect(screen.getByText('Nenhum plano')).toBeTruthy()
  })

  it('renderiza nome, total BRL, parceiros, badge de status e trilha de auditoria', () => {
    renderTable([toPlanRow(node({ totalInCents: 3_243_872, partnersCount: 1 }))])
    expect(screen.getByRole('button', { name: '2026 ETI 1.0' })).toBeTruthy()
    expect(screen.getByText(/R\$\s?32\.438,72/)).toBeTruthy()
    expect(screen.getByText('1 estados')).toBeTruthy()
    expect(screen.getByText('Aprovado')).toBeTruthy()
    expect(screen.getByText('Administrador alteração 30/06/2026 22:06')).toBeTruthy()
  })

  it('chevron: versões-filhas ficam ocultas até expandir', () => {
    const tree = node({
      status: 'APROVADO',
      children: [node({ id: 2, version: 1.2, status: 'RASCUNHO', totalInCents: 100 })],
    })
    renderTable([toPlanRow(tree)])

    // filho oculto inicialmente
    expect(screen.queryByRole('button', { name: '2026 ETI 1.2' })).toBeNull()

    const chevron = screen.getByRole('button', { name: 'Expandir versões' })
    fireEvent.click(chevron)

    // agora aparece + badge Rascunho da filha
    expect(screen.getByRole('button', { name: '2026 ETI 1.2' })).toBeTruthy()
    expect(screen.getByText('Rascunho')).toBeTruthy()
  })

  it('menu "…": abre e lista as ações; onAction recebe id + ação', () => {
    const onAction = vi.fn()
    renderTable([toPlanRow(node({ id: 7 }))], { onAction })

    fireEvent.click(screen.getByRole('button', { name: 'Ações do plano' }))
    const menu = screen.getByRole('menu')
    // raiz aprovada tem "Aprovar Plano" (approve) entre as ações
    fireEvent.click(within(menu).getByText('ação:approve'))
    expect(onAction).toHaveBeenCalledWith(7, 'approve')
  })

  it('clique no nome chama onOpenPlan com o id', () => {
    const onOpenPlan = vi.fn()
    renderTable([toPlanRow(node({ id: 42 }))], { onOpenPlan })
    fireEvent.click(screen.getByRole('button', { name: '2026 ETI 1.0' }))
    expect(onOpenPlan).toHaveBeenCalledWith(42)
  })
})
