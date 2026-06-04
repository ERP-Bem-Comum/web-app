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
  summaryGrid,
  summaryCard,
  summaryCardLabel,
  summaryCardValue,
  statusBadge,
  statusBadgePending,
  statusBadgeActive,
  sectionTitle,
  field,
  fieldLabel,
  input,
  uploadZone,
  uploadZoneActive,
  uploadText,
  uploadHint,
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

  /* Status preview */
  const today = new Date()
  const startDate = form.state.originalPeriodStart ? new Date(form.state.originalPeriodStart) : null
  const statusLabel = startDate && startDate <= today ? t('contracts.status.Em Andamento') : t('contracts.status.Pendente')
  const statusStyle = startDate && startDate <= today ? statusBadgeActive : statusBadgePending

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
            <div className={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className={modalHeaderIcon}>📄</div>
                <div className={modalHeaderText}>
                  <h2 className={modalTitle}>{t('contracts.create.modal.finalizeTitle')}</h2>
                  <span className={modalSubtitle}>{t('contracts.create.modal.finalizeSubtitle')}</span>
                </div>
              </div>
              <button type="button" className={modalClose} onClick={closeModal} aria-label="Fechar">×</button>
            </div>

            {/* Resumo */}
            <div style={{ marginBottom: '1.5rem' }}>
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

            {/* Status Preview */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className={sectionTitle}>{t('contracts.create.modal.statusPreview')}</div>
              <div className={`${statusBadge} ${statusStyle}`}>
                <span>●</span>
                {statusLabel}
              </div>
            </div>

            {/* Data de Assinatura */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.modal.signatureDate')}</label>
                <input
                  className={input}
                  type="date"
                  value={signatureDate}
                  onChange={(e) => { setSignatureDate(e.target.value) }}
                />
              </div>
            </div>

            {/* Upload PDF */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.modal.uploadDocument')}</label>
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
                  <label htmlFor="contract-upload" style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <div className={uploadText}>
                      {uploadedFile ? uploadedFile.name : 'Arraste o PDF aqui ou clique para selecionar'}
                    </div>
                    <div className={uploadHint}>{t('contracts.create.modal.uploadHint')}</div>
                  </label>
                </div>
              </div>
            </div>

            {createCommand.errorTag && (
              <div className={errorAlert} role="alert" style={{ marginBottom: '1rem' }}>
                {t(createCommand.errorTag)}
              </div>
            )}

            {/* Botões do modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className={buttonSecondary} onClick={closeModal}>
                {t('contracts.create.modal.backButton')}
              </button>
              <button
                type="button"
                className={buttonPrimary}
                disabled={createCommand.running || form.isOvertopOS}
                onClick={handleConfirm}
              >
                {createCommand.running ? t('common.loading') : t('contracts.create.modal.confirmButton')}
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
