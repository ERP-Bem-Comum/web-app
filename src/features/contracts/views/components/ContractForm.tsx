import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { createContract, updateContract } from '@/server/contracts'
import { usePartnerOptions } from '../hooks/use-partner-options'
import { useContractDraft } from '../hooks/use-contract-draft'
import {
  ContractClassification,
  ContractModel,
  ContractType,
  ContractStatus,
  Categoria,
  CentroDeCusto,
} from '../../domain/types'
import { ContractCreateInputSchema } from '../../domain/schemas'
import { maskMonetaryValue, unMaskMonetaryValue } from '@/utils/masks'
import { Search, Upload, Plus, Check, AlertCircle, ArrowLeft, UserPlus, FileText, X } from 'lucide-react'

type FormData = z.infer<typeof ContractCreateInputSchema>

interface Props {
  initialData?: any
  mode?: 'create' | 'edit'
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDateInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function defaultValues(): FormData {
  return {
    classification: ContractClassification.CONTRACT,
    contractModel: ContractModel.SERVICE,
    object: '',
    totalValue: 0,
    contractPeriod: { start: undefined as any, end: undefined as any },
    contractType: ContractType.SUPPLIER,
    supplierId: null,
    financierId: null,
    collaboratorId: null,
    budgetPlanId: null,
    programId: null,
    bancaryInfo: { bank: null, agency: null, accountNumber: null, dv: null },
    pixInfo: { key_type: null, key: null },
    observations: null,
    contractStatus: undefined,
    supplier: null,
    financier: null,
    collaborator: null,
    parentId: null,
    dataAssinatura: null,
    signedContractUrl: null,
    categorizacao: null,
    centroDeCusto: null,
    email: null,
    telephone: null,
  }
}

/* ── Modal de Finalização ── */
function SaveContractModal({
  open,
  onClose,
  onConfirm,
  formData,
  selectedPartner,
  isSubmitting,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (dataAssinatura: string | null, file: File | null) => void
  formData: FormData
  selectedPartner: any
  isSubmitting: boolean
}) {
  const [modalFile, setModalFile] = useState<File | null>(null)
  const [modalDate, setModalDate] = useState('')

  useEffect(() => {
    if (open) {
      setModalFile(null)
      setModalDate(formData.dataAssinatura || '')
    }
  }, [open, formData.dataAssinatura])

  if (!open) return null

  const statusLabel = modalFile && modalDate ? 'Em Andamento' : 'Pendente'
  const statusColor = modalFile && modalDate ? 'text-[#1f7d55] bg-[#e8f5ee]' : 'text-[#b08d2b] bg-[#faf5e6]'
  const missingDateWithFile = !!modalFile && !modalDate
  const partnerName = selectedPartner?.name || '—'
  const valorFmt = fmtBRL(formData.totalValue || 0)
  const startFmt = formData.contractPeriod?.start
    ? new Date(formData.contractPeriod.start).toLocaleDateString('pt-BR')
    : '—'
  const endFmt = formData.contractPeriod?.end
    ? new Date(formData.contractPeriod.end).toLocaleDateString('pt-BR')
    : '—'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[rgba(31,28,26,0.45)] backdrop-blur-[6px] transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[520px] bg-white rounded-xl shadow-[0_20px_60px_rgba(31,28,26,0.18)] border border-[#e5ded4] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5ded4] bg-[#faf7f2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e8eef5] flex items-center justify-center text-[#396496]">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[#1f1c1a]">Finalizar cadastro</h2>
              <p className="text-[11px] text-[#999187]">Revise os dados e anexe o documento assinado</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#736b61] hover:bg-[#e5ded4] hover:text-[#1f1c1a] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-[#e5ded4] bg-[#faf7f2]">
              <div className="text-[9px] font-bold text-[#999187] uppercase tracking-[0.04em] mb-1">Contratado</div>
              <div className="text-[12px] font-medium text-[#1f1c1a] truncate" title={partnerName}>{partnerName}</div>
            </div>
            <div className="p-3 rounded-lg border border-[#e5ded4] bg-[#faf7f2]">
              <div className="text-[9px] font-bold text-[#999187] uppercase tracking-[0.04em] mb-1">Valor</div>
              <div className="text-[12px] font-mono font-medium text-[#1f1c1a]">R$ {valorFmt}</div>
            </div>
            <div className="p-3 rounded-lg border border-[#e5ded4] bg-[#faf7f2]">
              <div className="text-[9px] font-bold text-[#999187] uppercase tracking-[0.04em] mb-1">Vigência</div>
              <div className="text-[12px] font-mono text-[#1f1c1a]">{startFmt} → {endFmt}</div>
            </div>
          </div>

          {/* Status preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[#e5ded4]">
            <span className="text-[11px] font-bold text-[#999187] uppercase tracking-[0.04em]">Status do contrato</span>
            <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusColor}`}>
              {statusLabel}
            </span>
          </div>

          {/* Data de assinatura */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#999187] uppercase tracking-[0.04em]">Data de Assinatura</label>
            <input
              type="date"
              autoComplete="off"
              placeholder=" "
              value={modalDate}
              onChange={(e) => setModalDate(e.target.value)}
              className={`w-full h-10 px-3 font-mono text-[13px] rounded-md border bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] [color-scheme:light] ${
                missingDateWithFile ? 'border-[#c93030] focus:border-[#c93030] bg-[#fff5f5]' : 'border-[#e5ded4]'
              }`}
            />
            {missingDateWithFile ? (
              <p className="text-[11.5px] text-[#c93030] flex items-center gap-1">
                <AlertCircle size={12} /> Ao anexar o contrato assinado, informe a data de assinatura.
              </p>
            ) : (
              <p className="text-[11px] text-[#999187]">Informe a data apenas se o contrato já foi assinado.</p>
            )}
          </div>

          {/* Upload */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#999187] uppercase tracking-[0.04em]">Documento Principal</label>
            <label className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-[#c7bfb2] bg-[#faf7f2] cursor-pointer hover:border-[#8bb0d6] hover:bg-[#e8eef5] transition-colors">
              <Upload size={22} className="text-[#736b61]" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[13px] font-medium text-[#1f1c1a] truncate">
                  {modalFile ? modalFile.name : 'Clique para escolher o arquivo'}
                </span>
                <span className="text-[11.5px] text-[#999187]">
                  {modalFile ? `${(modalFile.size / 1024 / 1024).toFixed(1)} MB` : 'PDF assinado · até 20MB'}
                </span>
              </div>
              <span className="ml-auto text-[11.5px] font-semibold text-[#396496] shrink-0">
                {modalFile ? 'Trocar' : 'Escolher'}
              </span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setModalFile(file)
                }}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#e5ded4] bg-[#faf7f2]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-[12px] font-semibold rounded-md border border-[#e5ded4] bg-white text-[#736b61] hover:bg-white hover:border-[#c7bfb2] transition-colors"
          >
            Voltar ao formulário
          </button>
          <button
            type="button"
            disabled={isSubmitting || missingDateWithFile}
            onClick={() => onConfirm(modalDate || null, modalFile)}
            className="h-9 px-5 text-[12px] font-semibold rounded-md bg-[#396496] text-white hover:bg-[#2d4f75] transition-all hover:shadow-[0_4px_10px_rgba(57,100,150,0.25)] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Check size={14} />
            {isSubmitting ? 'Salvando…' : 'Confirmar e salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ContractForm({ initialData, mode = 'create' }: Props) {
  const navigate = useNavigate()
  const { suppliers, financiers, collaborators, budgetPlans } = usePartnerOptions()
  const { loadDraft, clearDraft, startAutoSave, stopAutoSave } = useContractDraft()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [partnerSearch, setPartnerSearch] = useState('')
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [valorInput, setValorInput] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false)
  const partnerDropdownRef = useRef<HTMLDivElement>(null)

  const isEdit = mode === 'edit' && !!initialData

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
    reset,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(ContractCreateInputSchema),
    defaultValues: defaultValues(),
  })

  /* Restaurar rascunho ou initialData */
  useEffect(() => {
    if (isEdit) {
      reset({
        ...defaultValues(),
        ...initialData,
        contractPeriod: initialData.contractPeriod
          ? {
              start: new Date(initialData.contractPeriod.start),
              end: new Date(initialData.contractPeriod.end),
            }
          : { start: new Date(), end: new Date() },
      })
      setValorInput(initialData.totalValue ? maskMonetaryValue(initialData.totalValue) : '')
      return
    }
    // Modo create: sempre começa em branco, não carrega draft automaticamente
    reset(defaultValues())
    setValorInput('')
    setSelectedPartner(null)
    clearDraft()
  }, [isEdit, initialData, reset, clearDraft])

  /* Auto-save */
  useEffect(() => {
    if (isEdit) return
    startAutoSave(() => watch() as any)
    return () => stopAutoSave()
  }, [isEdit, startAutoSave, stopAutoSave, watch])

  /* Watch values for sidebar e validação */
  const formValues = watch()
  const classification = watch('classification')
  const contractType = watch('contractType')
  const totalValue = watch('totalValue') || 0
  const periodStart = watch('contractPeriod.start')
  const periodEnd = watch('contractPeriod.end')

  /* Validação de teto OS em tempo real */
  const isOvertopOS = classification === ContractClassification.SERVICE_ORDER && totalValue > 9999.99

  /* Partner selection */
  const allPartners = useMemo(() => {
    const s = (suppliers.data?.items || []).map((p: any) => ({ ...p, kind: 'Fornecedor' as const }))
    const f = (financiers.data?.items || []).map((p: any) => ({ ...p, kind: 'Financiador' as const }))
    const c = (collaborators.data?.items || []).map((p: any) => ({ ...p, kind: 'Colaborador' as const }))
    return [...s, ...f, ...c]
  }, [suppliers.data, financiers.data, collaborators.data])

  const filteredPartners = useMemo(() => {
    if (!isPartnerDropdownOpen) return []
    if (!partnerSearch.trim()) return allPartners.slice(0, 8)
    const term = partnerSearch.toLowerCase()
    return allPartners
      .filter((p: any) =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.cnpj || '').toLowerCase().includes(term) ||
        (p.cpf || '').toLowerCase().includes(term)
      )
      .slice(0, 8)
  }, [allPartners, partnerSearch, isPartnerDropdownOpen])

  /* Fechar dropdown ao clicar fora */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(event.target as Node)) {
        setIsPartnerDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPartner = useCallback(
    (partner: any) => {
      setSelectedPartner(partner)
      setPartnerSearch('')
      setIsPartnerDropdownOpen(false)
      if (partner.kind === 'Fornecedor') {
        setValue('contractType', ContractType.SUPPLIER)
        setValue('supplierId', partner.id)
        setValue('financierId', null)
        setValue('collaboratorId', null)
      } else if (partner.kind === 'Financiador') {
        setValue('contractType', ContractType.FINANCIER)
        setValue('financierId', partner.id)
        setValue('supplierId', null)
        setValue('collaboratorId', null)
      } else {
        setValue('contractType', ContractType.COLLABORATOR)
        setValue('collaboratorId', partner.id)
        setValue('supplierId', null)
        setValue('financierId', null)
      }
      setValue('email', partner.email || null)
      setValue('telephone', partner.telephone || null)
      if (partner.bancaryInfo) setValue('bancaryInfo', partner.bancaryInfo)
      if (partner.pixInfo) setValue('pixInfo', partner.pixInfo)
    },
    [setValue]
  )

  /* Checklist */
  const checklist = useMemo(() => {
    const checks = {
      contratado: !!selectedPartner || !!(formValues.supplierId || formValues.financierId || formValues.collaboratorId),
      contrato: !!formValues.object && !!formValues.contractType && !!formValues.contractModel,
      valor: (formValues.totalValue || 0) > 0,
      vigencia: !!formValues.contractPeriod?.start && !!formValues.contractPeriod?.end,
      programa: !!formValues.programId || !!formValues.budgetPlanId,
    }
    const done = Object.values(checks).filter(Boolean).length
    return { checks, done, total: 5 }
  }, [formValues, selectedPartner])

  /* Helper: converte File para data URL (base64) */
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  /* Submit real — chamado pelo modal */
  const handleConfirmSave = async (dataAssinatura: string | null, file: File | null) => {
    const data = getValues()

    if (isOvertopOS) {
      alert('Ordem de Serviço não pode ultrapassar R$ 9.999,99. Altere a classificação ou reduza o valor.')
      return
    }

    setIsSubmitting(true)
    try {
      const hasFile = !!file
      const hasDataAssinatura = !!dataAssinatura
      const status = hasFile && hasDataAssinatura ? ContractStatus.ACTIVE : ContractStatus.PENDING

      const signedContractUrl = file ? await fileToBase64(file) : null
      // eslint-disable-next-line no-console
      console.log('[ContractForm] signedContractUrl gerado:', signedContractUrl ? signedContractUrl.slice(0, 60) + '...' : null)

      const payload: any = {
        ...data,
        contractStatus: status,
        dataAssinatura,
        signedContractUrl,
      }

      if (isEdit) {
        await updateContract({ data: { id: initialData.id, ...payload } })
      } else {
        await createContract({ data: payload })
        clearDraft()
      }
      navigate({ to: '/contratos' })
    } catch (err: any) {
      alert('Erro ao salvar contrato: ' + (err?.message || 'Desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Render ── */
  return (
    <>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col flex-1 w-full min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-3 min-h-[56px] px-4 py-2.5 border-b border-[#e5ded4] bg-white shrink-0">
          <button
            type="button"
            onClick={() => navigate({ to: '/contratos' })}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#736b61] hover:bg-[#faf7f2] hover:text-[#1f1c1a] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-[17px] font-bold text-[#1f1c1a] tracking-tight">
            {isEdit ? 'Editar Contrato' : 'Novo Contrato'}
            <span className="ml-2.5 font-mono text-[13px] font-semibold text-[#736b61] tracking-normal">
              {classification === ContractClassification.SERVICE_ORDER ? 'OS' : 'CT'} 0000/2026
            </span>
          </h1>
        </header>

        <div className="flex flex-1 min-w-0 overflow-hidden">
          {/* Main form */}
          <main className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* ── Contratado ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-[#999187] uppercase tracking-[0.06em]">Contratado</h3>
                <button
                  type="button"
                  onClick={() => alert('Funcionalidade de cadastrar novo parceiro será implementada na integração.')}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#396496] hover:text-[#2d4f75] transition-colors hover:underline"
                >
                  <UserPlus size={13} />
                  Cadastrar novo
                </button>
              </div>

              {!selectedPartner && !formValues.supplierId && !formValues.financierId && !formValues.collaboratorId ? (
                <div className="relative" ref={partnerDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsPartnerDropdownOpen((prev) => !prev)}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md text-[#396496] hover:bg-[#e8eef5] hover:text-[#2d4f75] transition-colors z-10"
                    title="Buscar contratado"
                  >
                    <Search size={15} />
                  </button>
                  <input
                    type="text"
                    placeholder="Buscar por nome, CNPJ ou CPF"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    onFocus={() => setIsPartnerDropdownOpen(true)}
                    className="w-full h-10 pl-10 pr-3 rounded-md border border-[#e5ded4] bg-white text-[13px] text-[#332e29] placeholder:text-[#999187] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2]"
                  />
                  {isPartnerDropdownOpen && filteredPartners.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-[#e5ded4] rounded-md shadow-[0_8px_24px_rgba(31,28,26,0.12)] py-1.5 max-h-[320px] overflow-y-auto">
                      {filteredPartners.map((p: any, idx: number) => (
                        <button
                          key={p.id + p.kind}
                          type="button"
                          onClick={() => handleSelectPartner(p)}
                          className={`w-full text-left px-3.5 py-2.5 text-[13px] text-[#332e29] hover:bg-[#e8eef5] transition-colors flex items-center gap-3 ${idx > 0 ? 'border-t border-[#f0ebe4]' : ''}`}
                        >
                          <span className="inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-full bg-[#faf7f2] text-[#396496] text-[9px] font-bold uppercase tracking-wide border border-[#e5ded4]">
                            {p.kind.slice(0, 2)}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{p.name}</span>
                            <span className="font-mono text-[11px] text-[#999187]">{p.cnpj || p.cpf}</span>
                          </div>
                          <span className="ml-auto text-[10px] font-bold text-[#736b61] uppercase tracking-wide shrink-0">
                            {p.kind}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {isPartnerDropdownOpen && filteredPartners.length === 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-[#e5ded4] rounded-md shadow-[0_4px_12px_rgba(31,28,26,0.08)] py-3 px-3">
                      <p className="text-[12px] text-[#999187]">Nenhum contratado encontrado.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[#e5ded4] bg-[#faf7f2]">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#e8eef5] text-[#2d4f75] text-[10px] font-bold">
                    {(selectedPartner?.name || initialData?.supplier?.name || initialData?.financier?.name || initialData?.collaborator?.name || 'N')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join('')
                      .toUpperCase()}
                  </span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-medium text-[#1f1c1a]">
                        {selectedPartner?.name || initialData?.supplier?.name || initialData?.financier?.name || initialData?.collaborator?.name}
                      </span>
                      <span className="text-[10px] font-bold text-[#736b61] uppercase tracking-wide">
                        {selectedPartner?.kind || contractType}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#999187]">
                      {selectedPartner?.cnpj || selectedPartner?.cpf || initialData?.supplier?.cnpj || initialData?.financier?.cnpj || initialData?.collaborator?.cpf}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPartner(null)
                      setValue('supplierId', null)
                      setValue('financierId', null)
                      setValue('collaboratorId', null)
                      setValue('email', null)
                      setValue('telephone', null)
                    }}
                    className="ml-auto text-[11px] font-semibold text-[#396496] hover:text-[#2d4f75] hover:underline"
                  >
                    Trocar
                  </button>
                </div>
              )}
              {(errors.supplierId || errors.financierId || errors.collaboratorId) && (
                <p className="text-[11.5px] text-[#c93030] flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.supplierId?.message || errors.financierId?.message || errors.collaboratorId?.message}
                </p>
              )}
            </section>

            {/* ── Dados do Contrato ── */}
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold text-[#999187] uppercase tracking-[0.06em]">Dados do Contrato</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Classificação</label>
                  <select
                    {...register('classification')}
                    onChange={(e) => {
                      register('classification').onChange(e)
                      trigger('totalValue')
                    }}
                    className="w-full h-9 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] cursor-pointer"
                  >
                    {Object.values(ContractClassification).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Modelo</label>
                  <select
                    {...register('contractModel')}
                    className="w-full h-9 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] cursor-pointer"
                  >
                    {Object.values(ContractModel).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Tipo</label>
                  <select
                    {...register('contractType')}
                    className="w-full h-9 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] cursor-pointer"
                  >
                    {Object.values(ContractType).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Origem</label>
                  <div className="h-9 px-2 flex items-center text-[12.5px] text-[#736b61] rounded-md border border-[#e5ded4] bg-[#faf7f2]">
                    Manual
                  </div>
                </div>
              </div>

              {/* Objeto */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Objeto</label>
                <textarea
                  {...register('object')}
                  rows={3}
                  placeholder="Descreva o objeto do contrato (ex.: serviços de assessoria técnica...)"
                  className="w-full px-3 py-2 rounded-md border border-[#e5ded4] bg-white text-[12.5px] text-[#332e29] placeholder:text-[#999187] outline-none focus:border-[#8bb0d6] transition-colors resize-none hover:border-[#c7bfb2]"
                />
                {errors.object && (
                  <p className="text-[11.5px] text-[#c93030] flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.object.message}
                  </p>
                )}
              </div>

              {/* Valor + Período */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Valor Original</label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={valorInput}
                    onChange={(e) => setValorInput(e.target.value)}
                    onBlur={(e) => {
                      const val = unMaskMonetaryValue(e.target.value)
                      setValorInput(val > 0 ? maskMonetaryValue(val) : '')
                      setValue('totalValue', val)
                      trigger('totalValue')
                    }}
                    className={`w-full h-9 px-3 font-mono text-[12.5px] rounded-md border bg-white text-[#1f1c1a] placeholder:text-[#999187] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] ${
                      isOvertopOS ? 'border-[#c93030] focus:border-[#c93030] bg-[#fff5f5]' : 'border-[#e5ded4]'
                    }`}
                  />
                  {isOvertopOS && (
                    <p className="text-[11.5px] text-[#c93030] flex items-center gap-1">
                      <AlertCircle size={12} /> Ordem de Serviço limitada a R$ 9.999,99
                    </p>
                  )}
                  {errors.totalValue && !isOvertopOS && (
                    <p className="text-[11.5px] text-[#c93030]">{errors.totalValue.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Início</label>
                  <Controller
                    name="contractPeriod.start"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="date"
                        autoComplete="off"
                        placeholder=" "
                        value={formatDateInput(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        className="w-full h-9 px-2 font-mono text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] [color-scheme:light]"
                      />
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Fim</label>
                  <Controller
                    name="contractPeriod.end"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="date"
                        autoComplete="off"
                        placeholder=" "
                        value={formatDateInput(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        className="w-full h-9 px-2 font-mono text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] [color-scheme:light]"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Programa + Plano */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Programa</label>
                  <select
                    {...register('programId', { setValueAs: (v) => (v ? Number(v) : null) })}
                    className="w-full h-9 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] cursor-pointer"
                  >
                    <option value="">Selecionar programa…</option>
                    <option value={1}>Educação</option>
                    <option value={2}>Saúde</option>
                    <option value={3}>Assistência Social</option>
                    <option value={4}>Cultura</option>
                    <option value={5}>Esporte</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Plano Orçamentário</label>
                  <select
                    {...register('budgetPlanId', { setValueAs: (v) => (v ? Number(v) : null) })}
                    className="w-full h-9 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] cursor-pointer"
                  >
                    <option value="">Selecionar plano…</option>
                    {(budgetPlans.data?.items || []).map((bp: any) => (
                      <option key={bp.id} value={bp.id}>{bp.scenarioName} ({bp.year})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categoria + Centro de Custo (select simples) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Categoria</label>
                  <select
                    {...register('categorizacao', { setValueAs: (v) => (v || null) })}
                    className="w-full h-9 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] cursor-pointer"
                  >
                    <option value="">Selecionar categoria…</option>
                    {Object.values(Categoria).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Centro de Custo</label>
                  <select
                    {...register('centroDeCusto', { setValueAs: (v) => (v || null) })}
                    className="w-full h-9 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2] cursor-pointer"
                  >
                    <option value="">Selecionar centro de custo…</option>
                    {Object.values(CentroDeCusto).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* ── Contato ── */}
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold text-[#999187] uppercase tracking-[0.06em]">Contato</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">E-mail</label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="email@exemplo.com"
                    className="w-full h-9 px-3 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#332e29] placeholder:text-[#999187] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2]"
                  />
                  {errors.email && (
                    <p className="text-[11.5px] text-[#c93030]">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Telefone</label>
                  <input
                    type="tel"
                    {...register('telephone')}
                    placeholder="(00) 00000-0000"
                    className="w-full h-9 px-3 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#332e29] placeholder:text-[#999187] outline-none focus:border-[#8bb0d6] transition-colors hover:border-[#c7bfb2]"
                  />
                </div>
              </div>
            </section>

            {/* ── Dados Bancários ── */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-bold text-[#999187] uppercase tracking-[0.06em]">Dados Bancários</h3>
                <span className="text-[10px] text-[#999187]">
                  Dados herdados do cadastro do contratado (somente leitura)
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Banco</label>
                  <input
                    {...register('bancaryInfo.bank')}
                    placeholder="—"
                    disabled={true}
                    className="w-full h-9 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors disabled:bg-[#faf7f2] disabled:text-[#999187] hover:border-[#c7bfb2]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Agência · DV</label>
                  <input
                    {...register('bancaryInfo.agency')}
                    placeholder="0000-0"
                    disabled={true}
                    className="w-full h-9 px-2 font-mono text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors disabled:bg-[#faf7f2] disabled:text-[#999187] hover:border-[#c7bfb2]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Conta</label>
                  <input
                    {...register('bancaryInfo.accountNumber')}
                    placeholder="0000000"
                    disabled={true}
                    className="w-full h-9 px-2 font-mono text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors disabled:bg-[#faf7f2] disabled:text-[#999187] hover:border-[#c7bfb2]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">DV</label>
                  <input
                    {...register('bancaryInfo.dv')}
                    placeholder="0"
                    disabled={true}
                    className="w-full h-9 px-2 font-mono text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors disabled:bg-[#faf7f2] disabled:text-[#999187] hover:border-[#c7bfb2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Tipo de chave PIX</label>
                  <select
                    {...register('pixInfo.key_type')}
                    disabled={true}
                    className="w-full h-9 px-2 text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors disabled:bg-[#faf7f2] disabled:text-[#999187] hover:border-[#c7bfb2] cursor-pointer"
                  >
                    <option value="">—</option>
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="TELEFONE">Telefone</option>
                    <option value="ALEATORIA">Chave Aleatória</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Chave PIX</label>
                  <input
                    {...register('pixInfo.key')}
                    placeholder="—"
                    disabled={true}
                    className="w-full h-9 px-2 font-mono text-[12.5px] rounded-md border border-[#e5ded4] bg-white text-[#4d4740] outline-none focus:border-[#8bb0d6] transition-colors disabled:bg-[#faf7f2] disabled:text-[#999187] hover:border-[#c7bfb2]"
                  />
                </div>
              </div>
              {errors.bancaryInfo && (
                <p className="text-[11.5px] text-[#c93030] flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.bancaryInfo.message}
                </p>
              )}
            </section>

            {/* ── Observações ── */}
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold text-[#999187] uppercase tracking-[0.06em]">Observações</h3>
              <textarea
                {...register('observations')}
                rows={4}
                placeholder="Informações complementares sobre o contrato..."
                className="w-full px-3 py-2 rounded-md border border-[#e5ded4] bg-white text-[12.5px] text-[#332e29] placeholder:text-[#999187] outline-none focus:border-[#8bb0d6] transition-colors resize-none hover:border-[#c7bfb2]"
              />
            </section>
          </main>

          {/* ── Sidebar ── */}
          <aside className="w-[280px] shrink-0 border-l border-[#e5ded4] bg-white overflow-y-auto hidden lg:flex flex-col">
            {/* Valor preview */}
            <div className="p-5 border-b border-[#e5ded4]">
              <div className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em] mb-1">Valor do Contrato</div>
              <div className={`font-mono ${totalValue === 0 ? 'text-[#999187]' : 'text-[#1f1c1a]'}`}>
                <span className="text-[13px] font-medium">R$</span>
                <span className="text-[24px] font-bold tracking-tight ml-1">
                  {totalValue === 0 ? '0' : fmtBRL(totalValue).split(',')[0]}
                </span>
                <span className="text-[13px] font-medium">,{totalValue === 0 ? '00' : fmtBRL(totalValue).split(',')[1]}</span>
              </div>
            </div>

            {/* Vigência preview */}
            <div className="p-5 border-b border-[#e5ded4]">
              <div className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em] mb-2">Vigência</div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Início</span>
                  <span className={`font-mono text-[12.5px] ${periodStart ? 'text-[#1f1c1a]' : 'text-[#999187]'}`}>
                    {periodStart ? new Date(periodStart).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
                <span className="text-[#999187] text-[11px]">→</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em]">Fim</span>
                  <span className={`font-mono text-[12.5px] ${periodEnd ? 'text-[#1f1c1a]' : 'text-[#999187]'}`}>
                    {periodEnd ? new Date(periodEnd).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="p-5 flex-1">
              <div className="text-[9.5px] font-bold text-[#999187] uppercase tracking-[0.04em] mb-3">Pendências</div>
              <div className="space-y-2">
                {([
                  { key: 'contratado', label: 'Contratado selecionado' },
                  { key: 'contrato', label: 'Tipo, Modelo e Objeto preenchidos' },
                  { key: 'valor', label: 'Valor original informado' },
                  { key: 'vigencia', label: 'Início e fim da vigência' },
                  { key: 'programa', label: 'Programa e plano orçamentário' },
                ] as const).map((item) => {
                  const ok = checklist.checks[item.key as keyof typeof checklist.checks]
                  return (
                    <div key={item.key} className={`flex items-center gap-2 text-[11.5px] transition-colors ${ok ? 'text-[#1f7d55]' : 'text-[#999187]'}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-[#1f7d55]' : 'bg-[#e5ded4]'}`}>
                        {ok && <Check size={10} className="text-white" />}
                      </span>
                      <span className={ok ? 'font-medium' : ''}>{item.label}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-[#e5ded4] flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#999187] uppercase tracking-[0.04em]">Concluído</span>
                <span className="font-mono text-[11px] font-bold text-[#1f1c1a]">
                  {checklist.done} / {checklist.total}
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottombar — mesmo padrão do grid */}
        <footer className="fixed bottom-0 left-0 right-0 flex items-center gap-[14px] px-6 min-h-[56px] bg-[rgba(245,243,240,0.98)] backdrop-blur-[12px] border-t border-[#e5ded4] z-[100] shadow-[0_-2px_12px_rgba(31,28,26,0.06)]">
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: '/contratos' })}
              className="h-9 px-4 text-[12px] font-semibold rounded-md border border-[#e5ded4] bg-white text-[#736b61] hover:bg-[#faf7f2] hover:border-[#c7bfb2] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting || isOvertopOS}
              onClick={async () => {
                const valid = await trigger()
                if (!valid) return
                setShowSaveModal(true)
              }}
              className="h-9 px-4 text-[12px] font-semibold rounded-md bg-[#396496] text-white hover:bg-[#2d4f75] transition-all hover:shadow-[0_4px_10px_rgba(57,100,150,0.25)] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Plus size={14} />
              {isSubmitting ? 'Salvando…' : 'Salvar contrato'}
            </button>
          </div>
        </footer>
      </form>

      {/* Modal de finalização */}
      <SaveContractModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleConfirmSave}
        formData={formValues}
        selectedPartner={selectedPartner}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
