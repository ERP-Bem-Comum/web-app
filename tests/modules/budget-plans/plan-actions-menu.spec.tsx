/**
 * PlanActionsMenu (Vitest/jsdom) — feature 060. Cobre que as ações COM endpoint disparam `onAction`, enquanto
 * as SEM endpoint (share/planned-vs-actual) aparecem VISÍVEIS porém `disabled` com tooltip (não somem).
 *
 * O `delete` saiu do grupo "sem endpoint" na feature 076 (o `DELETE /:id` existe — core-api #453). Aqui o menu
 * é renderizado SEM status, então ele aparece habilitado; as recusas dele (aprovado · tem cenário) dependem do
 * contexto da linha e são cobertas no teste PURO (`plan-actions-enablement.test.ts`), não nesta view burra.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import {
  PLAN_ACTIONS,
  type PlanAction,
} from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'
import { isActionEnabled } from '#modules/budget-plans/client/planejamento/plan-actions.view-model.ts'
import { PlanActionsMenu } from '#modules/budget-plans/client/planejamento/components/plan-actions-menu.component.tsx'

afterEach(cleanup)

const renderMenu = (onAction: (action: PlanAction) => void = () => undefined) =>
  render(
    <PlanActionsMenu
      actions={PLAN_ACTIONS}
      labelFor={(a) => a}
      triggerLabel="Mais ações"
      isDisabled={(a) => !isActionEnabled(a)}
      disabledTitle={() => 'Depende do backend'}
      onAction={onAction}
    />,
  )

describe('PlanActionsMenu (feature 060)', () => {
  it('itens sem endpoint ficam disabled com tooltip; com endpoint, habilitados', () => {
    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }))

    for (const disabled of ['share', 'planned-vs-actual'] as const) {
      const item = screen.getByRole('menuitem', { name: disabled })
      expect(item.hasAttribute('disabled')).toBe(true)
      expect(item.getAttribute('title')).toBe('Depende do backend')
    }
    for (const enabled of [
      'approve',
      'start-calibration',
      'create-scenery',
      'export-csv',
      'delete',
    ] as const) {
      expect(screen.getByRole('menuitem', { name: enabled }).hasAttribute('disabled')).toBe(false)
    }
  })

  it('clicar num item habilitado dispara onAction com a ação', () => {
    const calls: string[] = []
    renderMenu((a) => calls.push(a as unknown as string))
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'approve' }))
    expect(calls).toEqual(['approve'])
  })
})
