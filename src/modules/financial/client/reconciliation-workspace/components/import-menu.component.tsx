/**
 * Import-menu (US2) — view burra. Botão "Importar" que abre o seletor de arquivo (OFX/CSV); PDF/OCR fica
 * desabilitado/anunciado (#145). Mostra o resumo pós-import ("{N} importadas · {M} duplicadas · período")
 * e o erro (tag i18n). Sem data-hooks: recebe tudo por props do binding de importação.
 */
import { useRef } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { UploadIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { BankStatementImport } from '../reconciliation-workspace.view-model.ts'

const t = createTranslator(ptBR)

export type ImportMenuProps = Readonly<{
  importing: boolean
  summary: BankStatementImport | null
  errorTag: string | null
  onPickFile: (file: File) => void
}>

export function ImportMenu({ importing, summary, errorTag, onPickFile }: ImportMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <button
        type="button"
        className={s.btnPrimary}
        disabled={importing}
        aria-disabled={importing}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon />
        {t('financial.recon.import')}
      </button>
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
      <span className={s.noticeChrome} title={t('financial.recon.import.pdfUnavailable')}>
        {t('financial.recon.import.pdfChip')}
      </span>
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
    </>
  )
}
