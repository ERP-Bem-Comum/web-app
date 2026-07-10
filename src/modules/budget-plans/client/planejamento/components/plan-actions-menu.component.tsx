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
   * Ações VISÍVEIS porém desabilitadas (sem endpoint no backend — feature 060). Ficam com `disabled` + tooltip
   * `disabledTitle`, jamais somem (regra da P.O.). `null`/ausente ⇒ nenhuma desabilitada.
   */
  isDisabled?: (action: PlanAction) => boolean
  /** Tooltip (i18n) do item desabilitado, POR AÇÃO — explica o motivo (sem endpoint × status do plano). */
  disabledTitle?: (action: PlanAction) => string | undefined
  /** Ação em andamento (mostra pendência no item). `null` ⇒ ociosa. */
  pendingAction?: PlanAction | null
  /** Execução da ação real (approve/start-calibration/create-scenery/export-csv). */
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
        {/* Kebab (3 pontos verticais) como SVG — espelha o mock e evita glifo dependente de fonte. */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open ? (
        <ul className={menu} role="menu">
          {props.actions.map((action) => {
            const disabled = props.isDisabled?.(action) === true || props.pendingAction === action
            return (
              <li key={action} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={action === 'delete' ? itemDanger : item}
                  disabled={disabled}
                  title={props.isDisabled?.(action) === true ? props.disabledTitle?.(action) : undefined}
                  onClick={() => {
                    setOpen(false)
                    props.onAction(action)
                  }}
                >
                  {props.labelFor(action)}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
