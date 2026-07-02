import { useEffect, useRef, useState, type ReactNode } from 'react'

import type { PlanAction } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

import { wrap, trigger, menu, item, itemDanger } from './plan-actions-menu.css.ts'

export type PlanActionsMenuProps = Readonly<{
  actions: readonly PlanAction[]
  /** Rótulo i18n de cada ação (a page resolve via catálogo). */
  labelFor: (action: PlanAction) => string
  /** Rótulo acessível do gatilho "…" (i18n). */
  triggerLabel: string
  /**
   * Execução da ação. Nesta fatia (US1) é apresentação: a page passa um no-op/TODO — a lógica real
   * (aprovar/excluir/calibração/cenário) depende do backend (#113). Mantido no contrato para não
   * reescrever a view quando as mutations existirem.
   */
  onAction: (action: PlanAction) => void
}>

/**
 * Menu de ações "…" por linha (view BURRA). Abre/fecha localmente (UI-state efêmero) e fecha ao clicar
 * fora ou Esc. As ações e seus rótulos chegam prontos por props; a execução é delegada ao pai.
 */
export function PlanActionsMenu(props: PlanActionsMenuProps): ReactNode {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent): void => {
      if (ref.current !== null && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={wrap} ref={ref}>
      <button
        type="button"
        className={trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={props.triggerLabel}
        onClick={() => {
          setOpen((v) => !v)
        }}
      >
        …
      </button>
      {open ? (
        <ul className={menu} role="menu">
          {props.actions.map((action) => (
            <li key={action} role="none">
              <button
                type="button"
                role="menuitem"
                className={action === 'delete' ? itemDanger : item}
                onClick={() => {
                  setOpen(false)
                  props.onAction(action)
                }}
              >
                {props.labelFor(action)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
