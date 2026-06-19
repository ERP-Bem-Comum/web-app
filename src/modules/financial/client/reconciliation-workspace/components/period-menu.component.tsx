/**
 * PeriodMenu — view burra: botão Período + dropdown de presets (Hoje/Ontem/Últimos 7 dias/Este mês/Mês
 * passado/Este trimestre/Personalizado), fiel ao mock. Display-only até o backend filtrar por intervalo
 * (#173) — selecionar atualiza só o rótulo. Recebe o binding por props; sem data-hooks.
 */
import { Fragment } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CalendarDaysIcon, ChevronDownIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { HeaderMenusBinding } from '../header-menus.binding.ts'

const t = createTranslator(ptBR)

export type PeriodMenuProps = Readonly<{ menus: HeaderMenusBinding }>

export function PeriodMenu({ menus }: PeriodMenuProps) {
  const current = menus.periodOptions.find((o) => o.preset === menus.period)
  return (
    <div className={s.ddWrap}>
      <button
        type="button"
        className={s.periodBtn}
        aria-haspopup="menu"
        aria-expanded={menus.periodOpen}
        onClick={menus.togglePeriod}
      >
        <CalendarDaysIcon />
        <span className={s.periodLbl}>{t('financial.recon.period')}</span>
        <span className={s.periodValue}>{current !== undefined ? t(current.labelTag) : ''}</span>
        <span className={menus.periodOpen ? s.periodChevOpen : s.periodChev}>
          <ChevronDownIcon />
        </span>
      </button>

      {menus.periodOpen ? (
        <>
          <button
            type="button"
            className={s.ddBackdrop}
            aria-label={t('financial.recon.period')}
            onClick={menus.closeAll}
          />
          <div className={s.periodMenu} role="menu">
            {menus.periodOptions.map((o) => (
              <Fragment key={o.preset}>
                {o.preset === 'month' || o.preset === 'custom' ? <div className={s.pmDivider} /> : null}
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={o.preset === menus.period}
                  className={o.preset === menus.period ? s.periodItem.on : s.periodItem.off}
                  onClick={() => {
                    menus.selectPeriod(o.preset)
                  }}
                >
                  <span>{t(o.labelTag)}</span>
                  <span className={o.preset === menus.period ? s.periodOptMeta.on : s.periodOptMeta.off}>
                    {o.preset === 'custom' ? t('financial.recon.period.customMeta') : o.meta}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
