import type { ReactNode } from 'react'
import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { useContractCreateBinding } from '../contract-create.binding.ts'
import { useContractFormController } from '../components/contract-form.controller.ts'
import type { SelectedPartner } from '../components/contract-form.controller.ts'
import { ContractForm } from '../components/contract-form.component.tsx'
import {
  screen,
  modalOverlay,
  modalContent,
  modalHeader,
  modalHeaderIcon,
  modalHeaderText,
  modalTitle,
  modalSubtitle,
  modalClose,
  modalBody,
  modalFooter,
  modalStatusRow,
  modalStatusLabel,
  summaryGrid,
  summaryCard,
  summaryCardLabel,
  summaryCardValue,
  statusBadge,
  statusBadgePending,
  statusBadgeActive,
  statusDot,
  sectionTitle,
  field,
  fieldLabel,
  input,
  inputError,
  fieldHint,
  fieldHintError,
  uploadZone,
  uploadZoneActive,
  uploadIconWrap,
  uploadFileInfo,
  uploadFileName,
  uploadFileSize,
  uploadAction,
  buttonPrimary,
  buttonSecondary,
  errorAlert,
} from './contract-create.css.ts'

const t = createTranslator(ptBR)

function formatCurrencyCents(cents: number): string {
  if (!cents || cents <= 0) return 'R$ 0,00'
  const val = cents / 100
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

export function ContractCreatePage(): ReactNode {
  const navigate = useNavigate()
  const { createCommand } = useContractCreateBinding()
  const form = useContractFormController()

  /* Busca de parceiros (mock — integrar com API real depois) */
  const [partnerQuery, setPartnerQuery] = useState('')
  const [partnerOpen, setPartnerOpen] = useState(false)
  const [partnerLoading] = useState(false)
  const [partnerResults, setPartnerResults] = useState<readonly SelectedPartner[]>([])

  const handlePartnerQueryChange = useCallback((q: string) => {
    setPartnerQuery(q)
    if (q.length >= 2) {
      // Mock de busca — substituir por chamada real ao módulo de parceiros
      const mock: readonly SelectedPartner[] = [
        { id: '1', name: 'Empresa ABC Ltda', cnpj: '12.345.678/0001-90', kind: 'Fornecedor' as const },
        { id: '2', name: 'João Silva', cpf: '123.456.789-00', kind: 'Colaborador' as const },
      ].filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.cnpj?.includes(q) ?? false) || (p.cpf?.includes(q) ?? false))
      setPartnerResults(mock)
    } else {
      setPartnerResults([])
    }
  }, [])

  /* Modal de finalização */
  const [showModal, setShowModal] = useState(false)
  const [signatureDate, setSignatureDate] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const openModal = useCallback(() => { setShowModal(true) }, [])
  const closeModal = useCallback(() => { setShowModal(false) }, [])

  const handleConfirm = useCallback(() => {
    if (form.isOvertopOS || form.checklist.done < form.checklist.total) {
      form.triggerValidation()
      closeModal()
      return
    }
    const payload = form.submit()
    createCommand.execute(payload)
    closeModal()
  }, [form, createCommand, closeModal])

  const handleCancel = useCallback(() => {
    navigate({ to: '/contratos' }).catch(() => { /* noop */ })
  }, [navigate])

  const handleCreateNewPartner = useCallback(() => {
    window.open('/parceiros/criar', '_blank')
  }, [])

  /* Upload handlers */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file.type === 'application/pdf') {
      setUploadedFile(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file?.type === 'application/pdf') {
      setUploadedFile(file)
    }
  }, [])

  /* Status preview: arquivo anexado → Em Andamento; sem arquivo → Pendente */
  const statusLabel = uploadedFile !== null ? t('contracts.status.Em Andamento') : t('contracts.status.Pendente')
  const statusStyle = uploadedFile !== null ? statusBadgeActive : statusBadgePending

  return (
    <div className={screen}>
      <ContractForm
        state={form.state}
        onUpdate={form.update}
        onSubmit={form.submit}
        submitting={createCommand.running}
        errorText={createCommand.errorTag === null ? null : t(createCommand.errorTag)}
        selectedPartner={form.selectedPartner}
        onSelectPartner={form.setSelectedPartner}
        onRemovePartner={() => { form.setSelectedPartner(null); setPartnerQuery('') }}
        checklist={form.checklist}
        isOvertopOS={form.isOvertopOS}
        validationAttempted={form.validationAttempted}
        onCancel={handleCancel}
        onOpenModal={openModal}
        partnerSearchQuery={partnerQuery}
        onPartnerSearchQueryChange={handlePartnerQueryChange}
        partnerSearchResults={partnerResults}
        partnerSearchLoading={partnerLoading}
        partnerSearchOpen={partnerOpen}
        onPartnerSearchOpen={() => { setPartnerOpen(true) }}
        onPartnerSearchClose={() => { setPartnerOpen(false) }}
        onCreateNewPartner={handleCreateNewPartner}
      />

      {/* Modal de finalização */}
      {showModal && (
        <div className={modalOverlay} onClick={closeModal}>
          <div className={modalContent} onClick={(e) => { e.stopPropagation() }}>
            {/* Header */}
            <div className={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div className={modalHeaderIcon}>📄</div>
                <div className={modalHeaderText}>
                  <h2 className={modalTitle}>Finalizar cadastro</h2>
                  <span className={modalSubtitle}>Revise os dados e anexe o documento assinado</span>
                </div>
              </div>
              <button type="button" className={modalClose} onClick={closeModal} aria-label="Fechar">×</button>
            </div>

            {/* Body */}
            <div className={modalBody}>
              {/* Resumo */}
              <div>
                <div className={sectionTitle}>{t('contracts.create.modal.summary')}</div>
                <div className={summaryGrid}>
                  <div className={summaryCard}>
                    <div className={summaryCardLabel}>Contratado</div>
                    <div className={summaryCardValue} title={form.selectedPartner?.name ?? '—'}>
                      {form.selectedPartner?.name ?? '—'}
                    </div>
                  </div>
                  <div className={summaryCard}>
                    <div className={summaryCardLabel}>Valor</div>
                    <div className={summaryCardValue}>{formatCurrencyCents(form.state.originalValueCents)}</div>
                  </div>
                  <div className={summaryCard}>
                    <div className={summaryCardLabel}>Vigência</div>
                    <div className={summaryCardValue}>
                      {formatDateBR(form.state.originalPeriodStart)} → {formatDateBR(form.state.originalPeriodEnd)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status preview */}
              <div className={modalStatusRow}>
                <span className={modalStatusLabel}>Status do contrato</span>
                <span className={`${statusBadge} ${statusStyle}`} style={{ marginLeft: 'auto' }}>
                  <span className={statusDot}>●</span>
                  {statusLabel}
                </span>
              </div>

              {/* Data de Assinatura */}
              <div className={field}>
                <label className={fieldLabel}>Data de Assinatura</label>
                <input
                  className={`${input} ${uploadedFile && !signatureDate ? inputError : ''}`}
                  type="date"
                  value={signatureDate}
                  onChange={(e) => { setSignatureDate(e.target.value) }}
                />
                {uploadedFile && !signatureDate ? (
                  <div className={fieldHintError}>
                    <span>⚠</span>
                    Ao anexar o contrato assinado, informe a data de assinatura.
                  </div>
                ) : (
                  <div className={fieldHint}>Informe a data de assinatura do contrato.</div>
                )}
              </div>

              {/* Upload PDF */}
              <div className={field}>
                <label className={fieldLabel}>Documento Principal</label>
                <div
                  className={`${uploadZone} ${isDragOver ? uploadZoneActive : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    id="contract-upload"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="contract-upload" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', cursor: 'pointer' }}>
                    <div className={uploadIconWrap}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div className={uploadFileInfo}>
                      <div className={uploadFileName}>
                        {uploadedFile ? uploadedFile.name : 'Clique para escolher o arquivo'}
                      </div>
                      <div className={uploadFileSize}>
                        {uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB` : 'PDF assinado · até 20MB'}
                      </div>
                    </div>
                    <div className={uploadAction}>{uploadedFile ? 'Trocar' : 'Escolher'}</div>
                  </label>
                </div>
              </div>

              {createCommand.errorTag && (
                <div className={errorAlert} role="alert">
                  {t(createCommand.errorTag)}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={modalFooter}>
              <button type="button" className={buttonSecondary} onClick={closeModal}>
                Voltar ao formulário
              </button>
              <button
                type="button"
                className={buttonPrimary}
                disabled={createCommand.running || form.isOvertopOS || (uploadedFile !== null && signatureDate === '')}
                onClick={handleConfirm}
              >
                {createCommand.running ? t('common.loading') : 'Confirmar e salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sucesso após criação */}
      {createCommand.result && (
        <div className={modalOverlay}>
          <div className={modalContent}>
            <div className={modalHeader}>
              <h2 className={modalTitle}>{t('contracts.create.modal.title')}</h2>
            </div>
            <p style={{ marginBottom: '1.5rem', color: '#4d4740' }}>
              {t('contracts.create.modal.subtitle').replace('{{code}}', createCommand.result.sequentialNumber)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a
                href={`/contratos/${createCommand.result.id}`}
                className={buttonPrimary}
                style={{ textDecoration: 'none' }}
              >
                {t('contracts.create.modal.button')}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
