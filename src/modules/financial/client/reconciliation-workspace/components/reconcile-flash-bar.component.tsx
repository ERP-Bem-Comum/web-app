/**
 * ReconcileFlashBar — barra de confirmação TRANSIENTE do fluxo contínuo de conciliação. Aparece no topo
 * ao conciliar (a sugestão logo abaixo já mostra o próximo match) e some sozinha em ~3s; o timer PAUSA
 * enquanto o mouse está sobre a barra (dá tempo de clicar "Desfazer"). View burra — recebe tudo por props;
 * remonta a cada nova conciliação via `key` (timer reinicia). Espelha o mock da P.O.
 */
import { useEffect, useRef, useState } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CheckCircleIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'

const t = createTranslator(ptBR)
const DOT = '·'
const DISMISS_MS = 3000

export type ReconcileFlashBarProps = Readonly<{
  tituloLabel: string // documento/fornecedor do título (ex.: "NFS-e 2024-0537") ou "" (gap #172)
  tituloValue: string // valor do título em BRL (ex.: "R$ 234,00") ou ""
  byUser: string // nome do usuário ou "" → "você"
  canUndo: boolean
  undoing: boolean
  onUndo: () => void
  onDismiss: () => void
}>

export function ReconcileFlashBar({
  tituloLabel,
  tituloValue,
  byUser,
  canUndo,
  undoing,
  onUndo,
  onDismiss,
}: ReconcileFlashBarProps) {
  const [paused, setPaused] = useState(false)
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss // sincroniza sem reiniciar o timer (não escreve ref durante o render)
  })
  useEffect(() => {
    if (paused) return
    const id = window.setTimeout(() => {
      onDismissRef.current()
    }, DISMISS_MS)
    return () => {
      window.clearTimeout(id)
    }
  }, [paused])

  return (
    <div
      className={s.flashBar}
      role="status"
      onMouseEnter={() => {
        setPaused(true)
      }}
      onMouseLeave={() => {
        setPaused(false)
      }}
    >
      <span className={s.flashText}>
        <CheckCircleIcon />
        {tituloLabel !== '' ? (
          <>
            {t('financial.recon.flash.prefixWith')} <strong className={s.flashTitulo}>{tituloLabel}</strong>
            {tituloValue !== '' ? (
              <>
                {' '}
                {DOT} <strong className={s.flashTitulo}>{tituloValue}</strong>
              </>
            ) : null}
          </>
        ) : tituloValue !== '' ? (
          <>
            {t('financial.recon.flash.prefix')} {t('financial.recon.flash.comTituloDe')}{' '}
            <strong className={s.flashTitulo}>{tituloValue}</strong>
          </>
        ) : (
          t('financial.recon.flash.prefix')
        )}{' '}
        <span className={s.flashMeta}>
          {DOT} {t('financial.recon.flash.now')} {DOT} {t('financial.recon.flash.by')}{' '}
          {byUser !== '' ? byUser : t('financial.recon.flash.you')}
        </span>
      </span>
      <button
        type="button"
        className={s.flashUndo}
        disabled={!canUndo || undoing}
        aria-disabled={!canUndo}
        onClick={onUndo}
      >
        {t('financial.recon.undo.button')}
      </button>
    </div>
  )
}
