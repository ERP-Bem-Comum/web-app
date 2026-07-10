/**
 * PlanActionsMenu (Vitest/jsdom) — feature 060. Cobre que as ações COM endpoint disparam `onAction`, enquanto
 * as SEM endpoint (share/planned-vs-actual/delete) aparecem VISÍVEIS porém `disabled` com tooltip (não somem).
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

    for (const disabled of ['share', 'planned-vs-actual', 'delete'] as const) {
      const item = screen.getByRole('menuitem', { name: disabled })
      expect(item.hasAttribute('disabled')).toBe(true)
      expect(item.getAttribute('title')).toBe('Depende do backend')
    }
    for (const enabled of ['approve', 'start-calibration', 'create-scenery', 'export-csv'] as const) {
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
