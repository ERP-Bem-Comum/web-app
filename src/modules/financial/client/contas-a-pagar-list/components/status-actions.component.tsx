/**
 * StatusActions ("Mudar Status") — view BURRA (§XI). Dropdown de ação em massa sobre a seleção, fiel ao
 * mock (Aprovar / Voltar p/ edição / Enviar p/ aprovação / Marcar como pago).
 *
 * ⚠️ CHROME honesto por ora: `approve`/`undo-approval` já existem e o `version` agora vem na listagem
 * (012/#47) — ou seja, "Aprovar" e "Voltar p/ edição" em massa já são VIÁVEIS (falta só fiar a mutation
 * em lote + tratamento de 409); `submit` (Rascunho→Aberto) não tem rota (core-api#91); `pay`/`transmit`/
 * `reconcile` não existem (roadmap #58/#59/#60, epic #64). Itens desabilitados com tooltip por enquanto.
 */
import type { MouseEvent, ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CalendarCheckIcon } from '#shared/ui/icons/index.ts'

import {
  wrapper,
  trigger,
  menu,
  menuItem,
  menuItemBorder,
  menuItemDisabled,
  itemCol,
  itemHint,
} from './export-dropdown.css.ts'

const t = createTranslator(ptBR)

const closeDetails = (e: MouseEvent<HTMLButtonElement>): void => {
  const d = e.currentTarget.closest('details')
  if (d) d.open = false
}

export type StatusActionsProps = Readonly<{
  // Aprovar (Aberto→Aprovado) e Voltar p/ edição (Aprovado→Aberto) — habilitados conforme a seleção.
  canApprove: boolean
  canReopen: boolean
  running: boolean
  onApprove: () => void
  onReopen: () => void
}>

export function StatusActions(props: StatusActionsProps): ReactNode {
  const { canApprove, canReopen, running } = props
  return (
    <details className={wrapper}>
      <summary
        style={{ listStyle: 'none', cursor: 'pointer' }}
        aria-label={t('financial.list.status.change')}
      >
        <span className={trigger}>
          <CalendarCheckIcon />
          {t('financial.list.status.change')}
        </span>
      </summary>

      <div className={menu}>
        {/* Aprovar — Aberto→Aprovado (em massa) */}
        <button
          type="button"
          className={`${menuItem}${canApprove && !running ? '' : ` ${menuItemDisabled}`}`}
          disabled={!canApprove || running}
          title={canApprove ? undefined : t('financial.list.status.needOpen')}
          onClick={(e) => {
            props.onApprove()
            closeDetails(e)
          }}
        >
          <span className={itemCol}>
            {t('financial.list.status.approve')}
            <span className={itemHint}>{t('financial.list.status.approveHint')}</span>
          </span>
        </button>

        {/* Voltar para edição — Aprovado→Aberto (undo) */}
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder}${canReopen && !running ? '' : ` ${menuItemDisabled}`}`}
          disabled={!canReopen || running}
          title={canReopen ? undefined : t('financial.list.status.needApproved')}
          onClick={(e) => {
            props.onReopen()
            closeDetails(e)
          }}
        >
          <span className={itemCol}>
            {t('financial.list.status.reopen')}
            <span className={itemHint}>{t('financial.list.status.reopenHint')}</span>
          </span>
        </button>

        {/* Enviar p/ aprovação (submit) e Marcar como pago — sem rota no backend (chrome). */}
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder} ${menuItemDisabled}`}
          disabled
          title={t('financial.list.status.soon')}
        >
          <span className={itemCol}>
            {t('financial.list.status.submit')}
            <span className={itemHint}>{t('financial.list.status.submitHint')}</span>
          </span>
        </button>
        <button
          type="button"
          className={`${menuItem} ${menuItemBorder} ${menuItemDisabled}`}
          disabled
          title={t('financial.list.status.soon')}
        >
          <span className={itemCol}>
            {t('financial.list.status.pay')}
            <span className={itemHint}>{t('financial.list.status.payHint')}</span>
          </span>
        </button>
      </div>
    </details>
  )
}
