/**
 * Import-menu (US2) — view burra. Botão "Importar" abre um DROPDOWN de formato (OFX/CSV reais; PDF/OCR
 * desabilitado/anunciado, #145). A escolha define o `accept` do seletor de arquivo e dispara o picker; o
 * formato enviado é derivado do nome do arquivo no binding. Mostra o resumo pós-import e o erro (tag i18n).
 * Estado de abertura é UI-local (sem data-hooks); recebe a ação de import por props.
 */
import { useState, useRef } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { ChevronDownIcon, UploadIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { BankStatementImport } from '../reconciliation-workspace.view-model.ts'

const t = createTranslator(ptBR)

export type ImportMenuProps = Readonly<{
  importing: boolean
  summary: BankStatementImport | null
  errorTag: string | null
  onPickFile: (file: File) => void
}>

const FORMATS: readonly { ic: string; lblTag: string; accept: string }[] = [
  { ic: 'OFX', lblTag: 'financial.recon.import.ofxLabel', accept: '.ofx' },
  { ic: 'CSV', lblTag: 'financial.recon.import.csvLabel', accept: '.csv' },
]

export function ImportMenu({ importing, summary, errorTag, onPickFile }: ImportMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)

  // Define o filtro do seletor conforme o formato escolhido e abre o picker (imperativo → sem timing de state).
  const pick = (accept: string): void => {
    setOpen(false)
    const el = inputRef.current
    if (el !== null) {
      el.accept = accept
      el.click()
    }
  }

  return (
    <div className={s.ddWrap}>
      <button
        type="button"
        className={s.btnPrimary}
        disabled={importing}
        aria-disabled={importing}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v)
        }}
      >
        <UploadIcon />
        {t('financial.recon.import')}
        <ChevronDownIcon />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className={s.ddBackdrop}
            aria-label={t('financial.recon.import')}
            onClick={() => {
              setOpen(false)
            }}
          />
          <div className={s.importMenu} role="menu">
            <div className={s.ddGroup}>{t('financial.recon.import.group')}</div>
            {FORMATS.map((f) => (
              <button
                key={f.ic}
                type="button"
                role="menuitem"
                className={s.ddItem.on}
                onClick={() => {
                  pick(f.accept)
                }}
              >
                <span className={s.ddItemIc} aria-hidden>
                  {f.ic}
                </span>
                <span className={s.ddItemLbl}>{t(f.lblTag)}</span>
              </button>
            ))}
            {/* PDF/OCR — chrome honesto até o backend (#145). */}
            <button
              type="button"
              role="menuitem"
              className={s.ddItem.off}
              disabled
              aria-disabled="true"
              title={t('financial.recon.import.pdfUnavailable')}
            >
              <span className={s.ddItemIc} aria-hidden>
                PDF
              </span>
              <span className={s.ddItemLbl}>{t('financial.recon.import.pdfLabel')}</span>
              <span className={s.ddItemHint}>{t('financial.recon.import.pdfHint')}</span>
            </button>
          </div>
        </>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept=".ofx,.csv"
        hidden
        aria-label={t('financial.recon.import')}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPickFile(file)
          e.target.value = '' // permite reimportar o mesmo arquivo (dedup vem do backend)
        }}
      />

      {summary !== null ? (
        <span className={s.summaryNote}>
          {t('financial.recon.import.summary')
            .replace('{imported}', String(summary.imported))
            .replace('{dups}', String(summary.duplicatesDiscarded))
            .replace('{start}', summary.period.start)
            .replace('{end}', summary.period.end)}
        </span>
      ) : null}
      {errorTag !== null ? <span className={s.errorText}>{t(errorTag)}</span> : null}
    </div>
  )
}
