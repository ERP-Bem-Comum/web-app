/**
 * StatusActions ("Mudar Status") — view BURRA (§XI). Dropdown de ação em massa sobre a seleção, fiel ao
 * mock (Aprovar / Voltar p/ edição / Enviar p/ aprovação / Marcar como pago).
 *
 * ⚠️ CHROME honesto por ora: `approve`/`undo-approval` já existem e o `version` agora vem na listagem
 * (012/#47) — ou seja, "Aprovar" e "Voltar p/ edição" em massa já são VIÁVEIS (falta só fiar a mutation
 * em lote + tratamento de 409); `submit` (Rascunho→Aberto) não tem rota (core-api#91); `pay`/`transmit`/
 * `reconcile` não existem (roadmap #58/#59/#60, epic #64). Itens desabilitados com tooltip por enquanto.
 */
import type { ReactNode } from 'react'

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

const OPTIONS = [
  { key: 'approve', labelTag: 'financial.list.status.approve', hintTag: 'financial.list.status.approveHint' },
  { key: 'reopen', labelTag: 'financial.list.status.reopen', hintTag: 'financial.list.status.reopenHint' },
  { key: 'submit', labelTag: 'financial.list.status.submit', hintTag: 'financial.list.status.submitHint' },
  { key: 'pay', labelTag: 'financial.list.status.pay', hintTag: 'financial.list.status.payHint' },
] as const

export function StatusActions(): ReactNode {
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
        {OPTIONS.map((o, i) => (
          <button
            key={o.key}
            type="button"
            className={`${menuItem} ${menuItemDisabled}${i > 0 ? ` ${menuItemBorder}` : ''}`}
            disabled
            title={t('financial.list.status.soon')}
          >
            <span className={itemCol}>
              {t(o.labelTag)}
              <span className={itemHint}>{t(o.hintTag)}</span>
            </span>
          </button>
        ))}
      </div>
    </details>
  )
}
