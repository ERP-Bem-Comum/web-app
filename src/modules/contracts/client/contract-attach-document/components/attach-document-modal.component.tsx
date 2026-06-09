/**
 * AttachDocumentModal — VIEW BURRA (§XI): modal do documento do contrato. Réplica do modal de finalização
 * do incluir contrato: resumo dos dados + preview de status. Dois modos por `contract.status`:
 *  - Pendente  → editável: upload do PDF + data de assinatura obrigatória → onSubmit (efetiva).
 *  - demais    → somente leitura: espelha data de assinatura + documento já anexado.
 * `useState` só para interação local (arquivo, data, drag-over). Strings via i18n.
 */
import type { ReactNode, DragEvent, ChangeEvent } from 'react'
import { useId, useState } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { UploadIcon } from '#shared/ui/icons/index.ts'
import type { Contract } from '#modules/contracts/public-api/index.ts'
import * as s from './attach-document-modal.css.ts'

const t = createTranslator(ptBR)

export interface AttachDocumentModalProps {
  readonly open: boolean
  readonly contract: Contract
  readonly onClose: () => void
  readonly onSubmit: (args: Readonly<{ file: File; signedAt: string }>) => void
  readonly submitting: boolean
  readonly errorTag: string | null
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatDate(date: Date | null | undefined): string {
  // YYYY-MM-DD vem como meia-noite UTC; formatar em UTC evita recuar 1 dia em BRT.
  return date ? date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'
}

export function AttachDocumentModal({ open, contract, onClose, onSubmit, submitting, errorTag }: AttachDocumentModalProps): ReactNode {
  const [file, setFile] = useState<File | null>(null)
  const [signedAt, setSignedAt] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputId = useId()
  const titleId = useId()

  // Early-return: ao fechar, o <dialog> desmonta e o estado transiente do upload zera sozinho.
  if (!open) return null

  const isPending = contract.status === 'Pendente'
  const contractNumber = `${contract.classification === 'Contract' ? 'CT' : 'OS'} ${contract.sequentialNumber}`
  const existingDoc = contract.files[0]
  const partnerName = contract.supplier?.name ?? contract.financier?.name ?? contract.collaborator?.name ?? '—'
  const period = contract.currentPeriod ?? contract.originalPeriod
  // Preview de status: Pendente vira "Em Andamento" ao anexar (como no modal de finalização do create).
  const previewActive = isPending ? file !== null : true
  const statusLabel = isPending ? (file !== null ? 'Em Andamento' : 'Pendente') : contract.status

  const pickFile = (f: File | undefined): void => {
    if (f?.type === 'application/pdf') setFile(f)
  }
  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0])
  }
  const handleSelect = (e: ChangeEvent<HTMLInputElement>): void => { pickFile(e.target.files?.[0]) }

  const canSubmit = file !== null && signedAt !== '' && !submitting

  return (
    <dialog
      className={s.dialog}
      aria-labelledby={titleId}
      // showModal() entrega ESC + focus-trap + inert (A4). ref-callback abre ao montar; try/catch p/ jsdom.
      ref={(el) => {
        if (el !== null && !el.open) {
          // jsdom não implementa showModal() → fallback abre o dialog (open) p/ o conteúdo ficar acessível.
          try { el.showModal() } catch { el.open = true }
        }
      }}
      onCancel={(e) => { e.preventDefault(); onClose() }}
      onClick={(e) => { if (e.currentTarget === e.target) onClose() }}
    >
      <div className={s.content}>
        <div className={s.header}>
          <div>
            <div className={s.title} id={titleId}>
              {isPending ? t('contracts.attach.title') : t('contracts.attach.title-view')}
              {!isPending && <span className={s.titleNum}>{contractNumber}</span>}
            </div>
            <div className={s.subtitle}>
              {isPending ? t('contracts.attach.subtitle') : 'Documento anexado e contrato efetivado.'}
            </div>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label={t('contracts.attach.cancel')}>×</button>
        </div>

        <div className={s.body}>
          {/* Resumo dos dados do contrato (espelha o cadastro) */}
          <div className={s.summaryGrid}>
            <div className={s.summaryCard}>
              <span className={s.summaryLabel}>Contratado</span>
              <span className={s.summaryValue} title={partnerName}>{partnerName}</span>
            </div>
            <div className={s.summaryCard}>
              <span className={s.summaryLabel}>Valor</span>
              <span className={s.summaryValue}>{formatCurrency(contract.originalValue.cents)}</span>
            </div>
            <div className={s.summaryCard}>
              <span className={s.summaryLabel}>Vigência</span>
              <span className={s.summaryValue}>{formatDate(period.start)} → {formatDate(period.end)}</span>
            </div>
          </div>

          <div className={s.statusRow}>
            <span className={s.statusRowLabel}>Status do contrato</span>
            <span className={`${s.statusBadge} ${previewActive ? s.statusBadgeActive : s.statusBadgePending}`}>
              <span style={{ fontSize: '0.5rem', lineHeight: 1 }}>●</span>
              {statusLabel}
            </span>
          </div>

          {/* Data de assinatura */}
          <div className={s.field}>
            <label className={s.label} htmlFor={`${inputId}-date`}>{t('contracts.attach.dateLabel')}</label>
            {isPending ? (
              <>
                <input
                  id={`${inputId}-date`}
                  className={s.input}
                  type="date"
                  value={signedAt}
                  onChange={(e) => { setSignedAt(e.target.value) }}
                />
                <span className={s.hint}>{t('contracts.attach.dateHint')}</span>
              </>
            ) : (
              <div className={s.input}><span>{formatDate(contract.signedAt)}</span></div>
            )}
          </div>

          {/* Documento */}
          <div className={s.field}>
            <label className={s.label} htmlFor={`${inputId}-file`}>{t('contracts.attach.fileLabel')}</label>
            {isPending ? (
              <div
                className={`${s.uploadZone} ${dragOver ? s.uploadZoneActive : ''}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => { setDragOver(false) }}
              >
                <input id={`${inputId}-file`} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleSelect} />
                <label htmlFor={`${inputId}-file`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', cursor: 'pointer' }}>
                  <UploadIcon />
                  <div className={s.uploadInfo}>
                    <span className={s.uploadName}>{file !== null ? file.name : t('contracts.attach.fileHint')}</span>
                    <span className={s.uploadMeta}>{file !== null ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'PDF · ≤ 20 MB'}</span>
                  </div>
                </label>
              </div>
            ) : (
              <div className={s.attachedFile}>
                <UploadIcon />
                <div className={s.uploadInfo}>
                  <span className={s.uploadName}>{existingDoc?.name ?? 'Documento assinado'}</span>
                  <span className={s.uploadMeta}>anexado</span>
                </div>
              </div>
            )}
          </div>

          {errorTag !== null && (<div className={s.errorAlert} role="alert">{t(errorTag)}</div>)}
        </div>

        <div className={s.footer}>
          {isPending ? (
            <>
              <button type="button" className={s.buttonSecondary} onClick={onClose}>{t('contracts.attach.cancel')}</button>
              <button
                type="button"
                className={s.buttonPrimary}
                disabled={!canSubmit}
                onClick={() => { if (file !== null) onSubmit({ file, signedAt }) }}
              >
                {submitting ? t('common.loading') : t('contracts.attach.submit')}
              </button>
            </>
          ) : (
            <button type="button" className={s.buttonSecondary} onClick={onClose}>Fechar</button>
          )}
        </div>
      </div>
    </dialog>
  )
}
