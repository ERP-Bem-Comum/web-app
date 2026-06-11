import { useEffect, useId, useRef, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import {
  dialog,
  title as titleClass,
  summary,
  failList,
  failItem,
  actions,
  closeButton,
} from './import-report-modal.css.ts'

const t = createTranslator(ptBR)

export type ImportReportData = Readonly<{
  created: number
  failed: readonly Readonly<{ line: number; error: string }>[]
}>

export type ImportReportModalProps = Readonly<{
  open: boolean
  report: ImportReportData | null
  errorTag: string | null
  onClose: () => void
}>

export function ImportReportModal(props: ImportReportModalProps): ReactNode {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (el === null) return
    if (props.open && !el.open) el.showModal()
    else if (!props.open && el.open) el.close()
  }, [props.open])

  return (
    <dialog
      ref={ref}
      className={dialog}
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); props.onClose() }}
      onClick={(e) => { if (e.target === ref.current) props.onClose() }}
    >
      <h2 id={titleId} className={titleClass}>{t('partners.collaborators.import.report.title')}</h2>

      {props.errorTag !== null ? (
        <p className={summary}>{t(props.errorTag)}</p>
      ) : props.report !== null ? (
        <>
          <p className={summary}>
            {t('partners.collaborators.import.report.created').replace('{n}', String(props.report.created))}
            {props.report.failed.length > 0
              ? ` · ${t('partners.collaborators.import.report.failed').replace('{n}', String(props.report.failed.length))}`
              : ''}
          </p>
          {props.report.failed.length > 0 ? (
            <ul className={failList}>
              {props.report.failed.map((f) => (
                <li key={f.line} className={failItem}>
                  {t('partners.collaborators.import.report.line').replace('{n}', String(f.line))}: {f.error}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      <div className={actions}>
        <button type="button" className={closeButton} onClick={props.onClose}>
          {t('partners.collaborators.import.report.close')}
        </button>
      </div>
    </dialog>
  )
}
