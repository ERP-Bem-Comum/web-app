import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Calendar,
  DollarSign,
  List,
  MoreHorizontal,
  AlertCircle,
  Upload,
  Trash2,
  Eye,
  FileText,
} from 'lucide-react'
import { AditiveCreateInputSchema, AditiveTypeSchema } from '../../domain/schemas'
import { createAditive, updateAditive, updateContractStatusAndDoc } from '@/server/contracts'
import { contractKeys } from '../../adapters/queries'
import { maskMonetaryValue, unMaskMonetaryValue } from '@/utils/masks'

function formatDateInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Schema frontend: mais permissivo — resumo opcional, tipo inicia em branco, datas tipadas como Date
const AditiveModalSchema = z.object({
  parentId: z.number(),
  aditivoType: AditiveTypeSchema.optional(),
  object: z.string().optional(),
  totalValue: z.number().optional(),
  contractPeriod: z
    .object({
      start: z.date().optional(),
      end: z.date().optional(),
    })
    .optional(),
  dataAssinatura: z.string().optional(),
  signedContractUrl: z.string().nullish(),
  observations: z.string().nullish(),
  aditivoStatus: z.string().optional(),
})

type FormData = z.infer<typeof AditiveModalSchema>

interface Props {
  mode: 'novo' | 'selado' | 'editar'
  docData?: any
  docNumber?: string
  contractId: number
  onClose: () => void
  onDelete?: () => void
}

/* ═══════════════════════════════════════════════════════════
   Tema de cores por tipo de aditivo
   ═══════════════════════════════════════════════════════════ */
const THEME: Record<
  string,
  {
    bg: string
    bgHover: string
    bgLight: string
    border: string
    text: string
    textDeep: string
    shadow: string
    button: string
    buttonHover: string
  }
> = {
  prazo: {
    bg: 'rgb(232,245,250)',
    bgHover: 'rgb(199,229,242)',
    bgLight: 'rgb(232,245,250)',
    border: 'rgb(140,199,222)',
    text: 'rgb(41,140,171)',
    textDeep: 'rgb(26,112,140)',
    shadow: 'rgba(41,140,171,0.10)',
    button: 'rgb(41,140,171)',
    buttonHover: 'rgb(26,112,140)',
  },
  valor: {
    bg: 'rgba(51,178,102,0.10)',
    bgHover: 'rgba(51,178,102,0.18)',
    bgLight: 'rgba(51,178,102,0.07)',
    border: 'rgb(51,178,102)',
    text: 'rgb(51,178,102)',
    textDeep: 'rgb(28,121,67)',
    shadow: 'rgba(51,178,102,0.10)',
    button: 'rgb(51,178,102)',
    buttonHover: 'rgb(28,121,67)',
  },
  escopo: {
    bg: 'rgba(217,119,6,0.10)',
    bgHover: 'rgba(217,119,6,0.18)',
    bgLight: 'rgba(217,119,6,0.07)',
    border: 'rgb(217,119,6)',
    text: 'rgb(217,119,6)',
    textDeep: 'rgb(154,84,2)',
    shadow: 'rgba(217,119,6,0.10)',
    button: 'rgb(217,119,6)',
    buttonHover: 'rgb(154,84,2)',
  },
  distrato: {
    bg: 'rgba(229,77,64,0.10)',
    bgHover: 'rgba(229,77,64,0.18)',
    bgLight: 'rgba(229,77,64,0.07)',
    border: 'rgb(229,77,64)',
    text: 'rgb(229,77,64)',
    textDeep: 'rgb(168,47,36)',
    shadow: 'rgba(229,77,64,0.10)',
    button: 'rgb(229,77,64)',
    buttonHover: 'rgb(168,47,36)',
  },
  outro: {
    bg: 'rgb(250,247,242)',
    bgHover: 'rgb(242,237,229)',
    bgLight: 'rgb(250,247,242)',
    border: 'rgb(199,191,178)',
    text: 'rgb(115,107,97)',
    textDeep: 'rgb(77,71,64)',
    shadow: 'rgba(115,107,97,0.10)',
    button: 'rgb(115,107,97)',
    buttonHover: 'rgb(77,71,64)',
  },
}

function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.getTime())
}

function fmtDateShort(d: string | Date | null): string {
  if (!d) return ''
  const date = new Date(d)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export function AditiveModal({ mode, docData, docNumber, contractId, onClose, onDelete }: Props) {
  const isNovo = mode === 'novo'
  const isSelado = mode === 'selado'
  const isEditar = mode === 'editar'
  const isReadOnly = isSelado

  const qc = useQueryClient()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isBaseContract = docData?.tipo === 'base'

  // Derive readonly values for selado/editar mode
  const num = isNovo
    ? 'AD --/---/2026'
    : isBaseContract
      ? docNumber || docData?.contractCode || '—'
      : docNumber || docData?.contractCode || docData?.num || '—'

  const [file, setFile] = useState<File | null>(null)
  const [impactoTipo, setImpactoTipo] = useState<'acrescimo' | 'supressao'>('acrescimo')
  const [valorInput, setValorInput] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Cleanup object URL para evitar memory leak
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(AditiveModalSchema),
    defaultValues: {
      parentId: contractId,
      aditivoType: undefined,
      object: '',
      totalValue: undefined,
      contractPeriod: { start: undefined, end: undefined },
      dataAssinatura: '',
      signedContractUrl: null,
      observations: null,
    },
  })

  const tipo = watch('aditivoType')
  const dataAssinatura = watch('dataAssinatura')
  const contractPeriodStart = watch('contractPeriod.start')
  const contractPeriodEnd = watch('contractPeriod.end')

  // Preenche formulário com dados do aditivo no modo editar ou selado
  useEffect(() => {
    if ((isEditar || isSelado) && docData) {
      if (docData.aditivoType) setValue('aditivoType', docData.aditivoType)
      if (docData.object) setValue('object', docData.object)
      if (docData.totalValue !== undefined && docData.totalValue !== null) {
        const val = Number(docData.totalValue)
        setValue('totalValue', Math.abs(val))
        setImpactoTipo(val < 0 ? 'supressao' : 'acrescimo')
        setValorInput(maskMonetaryValue(Math.abs(val)))
      }
      if (docData.contractPeriod?.end) {
        const endDate = new Date(docData.contractPeriod.end)
        setValue('contractPeriod.end', endDate)
      }
      if (docData.dataAssinatura) setValue('dataAssinatura', docData.dataAssinatura)
      if (docData.observations) setValue('observations', docData.observations)
      if (isEditar) {
        if (docData.signedContractUrl) {
          setFile({ name: docData.signedContractUrl.split('/').pop() || 'documento.pdf' } as File)
        } else {
          setFile(null)
        }
      }
    }
  }, [isEditar, isSelado, docData, setValue])

  const theme = useMemo(() => (tipo ? THEME[tipo] : THEME.outro), [tipo])

  const [resumoWarning, setResumoWarning] = useState(false)

  /* Helper: converte File para data URL (base64) */
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const onSubmit = async (data: FormData) => {
    if (isReadOnly) return

    clearErrors('dataAssinatura')
    const hasSignedDoc = !!file
    const hasAssinatura = !!data.dataAssinatura && String(data.dataAssinatura).trim() !== ''

    // ═══════════════════════════════════════════════════════════
    // FLUXO CONTRATO BASE (homologação)
    // ═══════════════════════════════════════════════════════════
    if (isBaseContract) {
      if (!hasSignedDoc) {
        setSubmitError('Anexe o documento assinado para homologar o contrato')
        return
      }
      if (!hasAssinatura) {
        setError('dataAssinatura', {
          type: 'manual',
          message: 'Data de assinatura é obrigatória para homologação',
        })
        return
      }

      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const signedContractUrl = await fileToBase64(file!)
        await updateContractStatusAndDoc({
          data: {
            id: isBaseContract ? contractId : docData.id,
            signedContractUrl,
            dataAssinatura: data.dataAssinatura!,
            contractStatus: 'Em andamento',
          },
        })
        window.location.reload()
      } catch (err: any) {
        console.error('[AditiveModal] Erro homologação:', err)
        let msg = 'Erro ao homologar contrato'
        if (err?.message) msg = err.message
        else if (err?.data?.message) msg = err.data.message
        setSubmitError(msg)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // ═══════════════════════════════════════════════════════════
    // FLUXO ADITIVO NORMAL
    // ═══════════════════════════════════════════════════════════

    // 1. Tipo é obrigatório
    if (!data.aditivoType) {
      setError('aditivoType', { type: 'manual', message: 'Selecione o tipo do aditivo' })
      return
    }

    // 2. Validação cruzada: arquivo anexado → data de assinatura obrigatória
    if (hasSignedDoc && !hasAssinatura) {
      setError('dataAssinatura', {
        type: 'manual',
        message: 'Data de assinatura é obrigatória quando o documento é anexado',
      })
      return
    }

    // Aviso visual se resumo vazio — não bloqueia
    if (!data.object || String(data.object).trim() === '') {
      setResumoWarning(true)
    } else {
      setResumoWarning(false)
    }

    // Construir payload limpo — só envia campos realmente preenchidos
    const resumoLimpo = data.object ? String(data.object).trim() : ''
    const payload: any = {
      parentId: data.parentId,
      aditivoType: data.aditivoType,
      object: resumoLimpo || '—',
    }

    // Valor (com impacto aplicado)
    if (data.aditivoType === 'valor' && data.totalValue) {
      payload.totalValue =
        impactoTipo === 'supressao' ? -Math.abs(data.totalValue) : Math.abs(data.totalValue)
    }

    // Prazo: só envia contractPeriod se houver data fim válida
    if (data.aditivoType === 'prazo' && isValidDate(data.contractPeriod?.end)) {
      payload.contractPeriod = { end: data.contractPeriod.end }
    }

    // Data de assinatura (se preenchida)
    if (hasAssinatura) {
      payload.dataAssinatura = data.dataAssinatura
    }

    // Observações (se preenchidas)
    if (data.observations) {
      payload.observations = data.observations
    }

    // Regra de status:
    // - Arquivo + data de assinatura → Homologado
    // - Sem arquivo ou sem data → Pendente
    if (hasSignedDoc && hasAssinatura) {
      payload.aditivoStatus = 'Homologado'
    } else {
      payload.aditivoStatus = 'Pendente'
    }

    // Se há arquivo selecionado, converte para data URL (base64)
    if (file) {
      payload.signedContractUrl = await fileToBase64(file)
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      console.log('[AditiveModal] Payload:', payload)

      if (isEditar && docData?.id) {
        // Atualiza aditivo existente
        const result = await updateAditive({ data: { id: docData.id, ...payload } })
        console.log('[AditiveModal] Atualizado:', result)
      } else {
        // Cria novo aditivo
        const result = await createAditive({ data: payload })
        console.log('[AditiveModal] Criado:', result)
      }
      // Invalida cache para atualizar a lista de contratos/aditivos
      qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) })
      qc.invalidateQueries({ queryKey: contractKeys.lists() })
      onClose()
    } catch (err: any) {
      console.error('[AditiveModal] Erro:', err)
      let msg = 'Erro desconhecido ao salvar aditivo'
      if (err?.message) msg = err.message
      else if (err?.data?.message) msg = err.data.message
      else if (typeof err === 'string') msg = err
      else if (err?.statusText) msg = `HTTP ${err.status}: ${err.statusText}`
      else msg = JSON.stringify(err).slice(0, 200)
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const tipos = [
    { key: 'prazo', label: 'Prazo', desc: 'Prorrogação de vigência', Icon: Calendar },
    { key: 'valor', label: 'Valor', desc: 'Acréscimo ou supressão', Icon: DollarSign },
    { key: 'escopo', label: 'Escopo', desc: 'Sem impacto financeiro', Icon: List },
    { key: 'outro', label: 'Outro', desc: 'Reajuste, reequilíbrio…', Icon: MoreHorizontal },
    { key: 'distrato', label: 'Distrato', desc: 'Rescisão contratual', Icon: AlertCircle },
  ] as const

  const hasFile = isReadOnly && (docData?.fileName || docData?.signedContractUrl)
  const fileName = isReadOnly ? docData?.fileName || 'documento_assinado.pdf' : null
  const fileSize = isReadOnly ? docData?.fileSize || '—' : null

  // Status preview para modo novo/editar
  // Aditivo: só aparece quando tipo está selecionado
  // Base: sempre aparece (não depende de tipo)
  const statusPreview = useMemo(() => {
    if (isReadOnly) return null
    if (!isBaseContract && !tipo) return null
    const hasSignedDoc = !!file
    const hasAssinatura = !!dataAssinatura && String(dataAssinatura).trim() !== ''
    if (hasSignedDoc && hasAssinatura) {
      return {
        label: 'Homologado',
        color: 'rgb(28,121,67)',
        bg: 'rgba(51,178,102,0.10)',
        dot: 'rgb(51,178,102)',
      }
    }
    return {
      label: 'Pendente',
      color: 'rgb(154,84,2)',
      bg: 'rgba(217,119,6,0.07)',
      dot: 'rgb(217,119,6)',
    }
  }, [isReadOnly, isBaseContract, tipo, file, dataAssinatura])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(31,28,26,0.42)] backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full bg-white rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.20)] overflow-hidden flex flex-row max-h-[calc(100vh-80px)] transition-all duration-300 ease-out ${
          showPreview ? 'max-w-[1160px]' : 'max-w-[560px]'
        }`}
      >
        {/* ═════ Left Panel ═════ */}
        <div className="w-[560px] shrink-0 flex flex-col overflow-hidden">
          {/* Header */}
        <div className="flex items-center justify-between px-[22px] py-[18px] pb-[14px] border-b border-[rgb(229,222,212)] shrink-0">
          <div className="flex items-baseline gap-2.5">
            <h3
              className="text-[17px] font-bold text-[rgb(31,28,26)]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {isBaseContract
                ? 'Homologar Contrato'
                : isNovo
                  ? 'Novo Aditivo'
                  : isEditar
                    ? 'Editar Aditivo'
                    : 'Documento'}
            </h3>
            <span
              className="font-mono text-[10.5px] font-medium px-2 py-[3px] rounded"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                color: theme.textDeep,
                background: theme.bg,
              }}
            >
              {num}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-[rgb(153,145,135)] hover:bg-[rgb(242,237,229)] hover:text-[rgb(51,46,41)] transition-colors text-[14px]"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.error('[AditiveModal] Formulário inválido:', errors)
          })}
        >
          {/* Body */}
          <div className="px-[22px] py-[18px] pb-[22px] overflow-y-auto flex-1 space-y-5">
            {/* Status preview (modo novo/editar) */}
            {!isReadOnly && statusPreview && (
              <div
                className="flex items-center gap-2 p-2.5 rounded-[6px] border"
                style={{ background: statusPreview.bg, borderColor: statusPreview.dot + '40' }}
              >
                <span
                  className="w-[6px] h-[6px] rounded-full"
                  style={{ background: statusPreview.dot }}
                />
                <span className="text-[11px] font-semibold" style={{ color: statusPreview.color }}>
                  Status: {statusPreview.label}
                </span>
                <span className="ml-auto text-[10px] text-[rgb(153,145,135)]">
                  {statusPreview.label === 'Pendente'
                    ? isBaseContract
                      ? 'Anexe o documento + data para homologar o contrato'
                      : 'Adicione o documento assinado + data para homologar'
                    : isBaseContract
                      ? 'Documento completo — contrato será homologado'
                      : 'Documento completo — será homologado ao salvar'}
                </span>
              </div>
            )}

            {/* Tipo — oculto para contrato base */}
            {!isBaseContract && (
            <div>
              <div className="text-[9.5px] font-bold text-[rgb(153,145,135)] uppercase tracking-[0.04em] mb-2">
                Tipo
              </div>
              <div className="grid grid-cols-5 gap-2">
                {tipos.map((t) => {
                  const IconComp = t.Icon
                  const isActive = tipo === t.key
                  const tTheme = THEME[t.key]
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        if (!isReadOnly) setValue('aditivoType', t.key)
                      }}
                      className={`flex flex-col items-start gap-1 p-2.5 rounded-lg border transition-all text-left ${
                        isActive
                          ? ''
                          : isReadOnly
                            ? 'border-[rgb(229,222,212)] bg-white cursor-default'
                            : 'border-[rgb(229,222,212)] bg-white hover:border-[rgb(199,191,178)] hover:bg-[rgb(250,247,242)]'
                      }`}
                      style={
                        isActive
                          ? {
                              borderColor: tTheme.border,
                              background: tTheme.bg,
                              boxShadow: `0 0 0 3px ${tTheme.shadow}`,
                            }
                          : undefined
                      }
                    >
                      <span style={{ color: isActive ? tTheme.text : 'rgb(115,107,97)' }}>
                        <IconComp size={16} />
                      </span>
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: isActive ? tTheme.textDeep : 'rgb(31,28,26)' }}
                      >
                        {t.label}
                      </span>
                      <span className="text-[9px] text-[rgb(115,107,97)] leading-tight">
                        {t.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
              {errors.aditivoType && (
                <span className="text-[11px] text-[rgb(168,47,36)] mt-1">
                  {errors.aditivoType.message}
                </span>
              )}

              {/* Conditional: Prazo */}
              {tipo === 'prazo' && (
                <div className="mt-3">
                  <div className="text-[9.5px] font-bold text-[rgb(153,145,135)] uppercase tracking-[0.04em] mb-1.5">
                    Nova Data Fim
                  </div>
                  {isReadOnly ? (
                    <div className="flex items-center rounded-[6px] px-3 py-2 min-h-[34px] bg-[rgb(250,247,242)] border border-[rgb(229,222,212)]">
                      <span className="font-mono text-[12px] text-[rgb(51,46,41)]">
                        {fmtDateShort(docData?.contractPeriod?.end || docData?.novaDataFim)}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="flex items-center bg-white border rounded-[6px] px-3 py-2 min-h-[34px] transition-colors focus-within:border-[var(--focus-border)]"
                      style={{ '--focus-border': theme.border } as React.CSSProperties}
                    >
                      <input
                        type="date"
                        autoComplete="off"
                        placeholder=" "
                        value={formatDateInput(contractPeriodEnd)}
                        onChange={(e) =>
                          setValue(
                            'contractPeriod.end',
                            e.target.value ? new Date(e.target.value) : undefined,
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault()
                        }}
                        className="flex-1 bg-transparent outline-none font-mono text-[12px] text-[rgb(51,46,41)] [color-scheme:light]"
                        style={{ color: theme.textDeep }}
                      />
                    </div>
                  )}
                  {errors.contractPeriod?.end && (
                    <span className="text-[11px] text-[rgb(168,47,36)] mt-1">
                      {errors.contractPeriod.end.message}
                    </span>
                  )}
                </div>
              )}

              {/* Conditional: Valor */}
              {tipo === 'valor' && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[9.5px] font-bold text-[rgb(153,145,135)] uppercase tracking-[0.04em] mb-1.5">
                      Impacto
                    </div>
                    <div
                      className={`flex rounded-[6px] border border-[rgb(229,222,212)] overflow-hidden ${isReadOnly ? 'pointer-events-none' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isNovo) setImpactoTipo('acrescimo')
                        }}
                        className="flex-1 py-2 text-[11px] font-medium transition-colors"
                        style={
                          impactoTipo === 'acrescimo'
                            ? { background: theme.bg, color: theme.textDeep }
                            : { background: 'white', color: 'rgb(115,107,97)' }
                        }
                      >
                        Acréscimo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isNovo) setImpactoTipo('supressao')
                        }}
                        className="flex-1 py-2 text-[11px] font-medium transition-colors"
                        style={
                          impactoTipo === 'supressao'
                            ? { background: theme.bg, color: theme.textDeep }
                            : { background: 'white', color: 'rgb(115,107,97)' }
                        }
                      >
                        Supressão
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9.5px] font-bold text-[rgb(153,145,135)] uppercase tracking-[0.04em] mb-1.5">
                      Valor
                    </div>
                    {isReadOnly ? (
                      <div className="flex items-center rounded-[6px] px-3 py-2 min-h-[34px] bg-[rgb(250,247,242)] border border-[rgb(229,222,212)]">
                        <span className="font-mono text-[12px]" style={{ color: theme.textDeep }}>
                          {docData?.impactoValor || maskMonetaryValue(docData?.totalValue || 0)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center bg-white border border-[rgb(229,222,212)] rounded-[6px] px-3 py-2 min-h-[34px]">
                        <input
                          type="text"
                          placeholder="R$ 0,00"
                          value={valorInput}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d,]/g, '')
                            const formatted = raw ? `R$ ${raw}` : ''
                            setValorInput(formatted)
                          }}
                          onBlur={() => {
                            const val = unMaskMonetaryValue(valorInput)
                            setValue('totalValue', val > 0 ? val : undefined)
                            setValorInput(val > 0 ? maskMonetaryValue(val) : '')
                          }}
                          className="flex-1 bg-transparent outline-none font-mono text-[12px]"
                          style={{ color: theme.textDeep }}
                        />
                      </div>
                    )}
                    {errors.totalValue && (
                      <span className="text-[11px] text-[rgb(168,47,36)] mt-1">
                        {errors.totalValue.message}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Datas */}
            <div>
              <div className="text-[9.5px] font-bold text-[rgb(153,145,135)] uppercase tracking-[0.04em] mb-2">
                Datas
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9.5px] font-bold text-[rgb(153,145,135)] uppercase tracking-[0.04em] mb-1.5 flex items-center gap-1">
                    Data da Assinatura
                    {!!file && !dataAssinatura && (
                      <span className="text-[rgb(229,77,64)]">*</span>
                    )}
                  </div>
                  {isReadOnly ? (
                    <div className="flex items-center rounded-[6px] px-3 py-2 min-h-[34px] bg-[rgb(250,247,242)] border border-[rgb(229,222,212)]">
                      <span className="font-mono text-[12px] text-[rgb(51,46,41)]">
                        {fmtDateShort(
                          docData?.dataAssinatura || docData?.assinatura || docData?.createdAt,
                        )}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center bg-white border rounded-[6px] px-3 py-2 min-h-[34px] transition-colors ${
                        !!file && !dataAssinatura
                          ? 'border-[rgb(229,77,64)]'
                          : 'border-[rgb(229,222,212)]'
                      }`}
                    >
                      <input
                        type="date"
                        autoComplete="off"
                        placeholder=" "
                        value={dataAssinatura || ''}
                        onChange={(e) => {
                          setValue('dataAssinatura', e.target.value || '')
                          if (e.target.value) clearErrors('dataAssinatura')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault()
                        }}
                        className="flex-1 bg-transparent outline-none font-mono text-[12px] text-[rgb(51,46,41)] [color-scheme:light]"
                      />
                    </div>
                  )}
                  {!!file && !dataAssinatura && !isReadOnly && (
                    <span className="text-[10.5px] text-[rgb(229,77,64)] mt-1 flex items-center gap-1">
                      <AlertCircle size={10} /> Documento anexado — preencha a data de assinatura
                    </span>
                  )}
                  {errors.dataAssinatura && (
                    <span className="text-[11px] text-[rgb(168,47,36)] mt-1">
                      {errors.dataAssinatura.message}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-[9.5px] font-bold text-[rgb(153,145,135)] uppercase tracking-[0.04em] mb-1.5">
                    Início do Efeito
                  </div>
                  {isReadOnly ? (
                    <div className="flex items-center rounded-[6px] px-3 py-2 min-h-[34px] bg-[rgb(250,247,242)] border border-[rgb(229,222,212)]">
                      <span className="font-mono text-[12px] text-[rgb(51,46,41)]">
                        {fmtDateShort(
                          docData?.contractPeriod?.start || docData?.inicio || docData?.createdAt,
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-white border border-[rgb(229,222,212)] rounded-[6px] px-3 py-2 min-h-[34px]">
                      <input
                        type="date"
                        autoComplete="off"
                        placeholder=" "
                        value={formatDateInput(contractPeriodStart)}
                        onChange={(e) =>
                          setValue(
                            'contractPeriod.start',
                            e.target.value ? new Date(e.target.value) : undefined,
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault()
                        }}
                        className="flex-1 bg-transparent outline-none font-mono text-[12px] text-[rgb(51,46,41)]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumo — oculto para contrato base */}
            {!isBaseContract && (
            <div>
              <div className="text-[9.5px] font-bold text-[rgb(153,145,135)] uppercase tracking-[0.04em] mb-2">
                Resumo
              </div>
              {isReadOnly ? (
                <div className="w-full px-3 py-2 rounded-[6px] border bg-[rgb(250,247,242)] border-[rgb(229,222,212)] text-[12.5px] text-[rgb(51,46,41)] min-h-[68px]">
                  {docData?.object || docData?.resumo || '—'}
                </div>
              ) : (
                <textarea
                  rows={3}
                  placeholder="Descreva brevemente o que motivou e o que altera o aditivo."
                  {...register('object')}
                  className="w-full px-3 py-2 rounded-[6px] border border-[rgb(229,222,212)] bg-white text-[12.5px] text-[rgb(51,46,41)] placeholder:text-[rgb(153,145,135)] outline-none resize-none transition-colors"
                  style={{ '--tw-border-opacity': 1 } as React.CSSProperties}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.border
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgb(229,222,212)'
                  }}
                />
              )}
              {resumoWarning && (
                <span className="text-[11px] text-[rgb(217,153,26)] mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Recomendado preencher o resumo para identificação do
                  aditivo
                </span>
              )}
            </div>
            )}

            {/* Documento */}
            <div>
              <div className="text-[9.5px] font-bold text-[rgb(153,145,135)] uppercase tracking-[0.04em] mb-2">
                Documento Principal
              </div>
              {isReadOnly && hasFile ? (
                <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-[rgb(199,191,178)] bg-[rgb(250,247,242)]">
                  <Upload size={20} className="text-[rgb(115,107,97)]" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[12.5px] font-medium text-[rgb(31,28,26)] truncate">
                      {fileName}
                    </span>
                    <span className="text-[11px] text-[rgb(153,145,135)]">
                      {fileSize} · anexado
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const url = docData?.signedContractUrl
                        if (url) {
                          setPreviewUrl(url)
                          setShowPreview(true)
                        }
                      }}
                      className="w-7 h-7 rounded-[5px] inline-flex items-center justify-center text-[rgb(115,107,97)] hover:bg-[rgb(232,245,250)] hover:text-[rgb(26,112,140)] transition-colors"
                      title="Visualizar documento"
                    >
                      <Eye size={14} />
                    </button>
                    <span className="text-[11.5px] font-semibold text-[rgb(153,145,135)]">
                      anexado
                    </span>
                  </div>
                </div>
              ) : isReadOnly ? (
                <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-[rgb(229,222,212)] bg-[rgb(250,247,242)]">
                  <Upload size={20} className="text-[rgb(199,191,178)]" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[12.5px] font-medium text-[rgb(153,145,135)]">
                      Nenhum documento anexado
                    </span>
                    <span className="text-[11px] text-[rgb(199,191,178)]">
                      PDF assinado · até 20MB
                    </span>
                  </div>
                </div>
              ) : (
                <label
                  className="flex items-center gap-4 p-4 rounded-lg border border-dashed cursor-pointer transition-colors"
                  style={{
                    borderColor: 'rgb(199,191,178)',
                    background: 'rgb(250,247,242)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.border
                    e.currentTarget.style.background = theme.bg
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(199,191,178)'
                    e.currentTarget.style.background = 'rgb(250,247,242)'
                  }}
                >
                  <Upload size={20} style={{ color: theme.text }} />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[12.5px] font-medium text-[rgb(31,28,26)] truncate">
                      {file ? file.name : 'Solte o arquivo aqui ou clique para escolher'}
                    </span>
                    <span className="text-[11px] text-[rgb(153,145,135)]">
                      {file ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF assinado · até 20MB'}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {file && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const url = URL.createObjectURL(file)
                          setPreviewUrl(url)
                          setShowPreview(true)
                        }}
                        className="w-7 h-7 rounded-[5px] inline-flex items-center justify-center text-[rgb(115,107,97)] hover:bg-[rgb(232,245,250)] hover:text-[rgb(26,112,140)] transition-colors"
                        title="Visualizar documento"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    <span
                      className="text-[11.5px] font-semibold"
                      style={{ color: theme.text }}
                    >
                      {file ? 'Trocar' : 'Escolher'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const newFile = e.target.files?.[0] || null
                      setFile(newFile)
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl)
                        setPreviewUrl(null)
                        setShowPreview(false)
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {submitError && (
              <div className="p-3 rounded-[6px] bg-[rgba(229,77,64,0.07)] border border-[rgba(229,77,64,0.25)]">
                <div className="text-[11px] font-semibold text-[rgb(168,47,36)] mb-0.5">
                  {isBaseContract ? 'Erro ao homologar contrato' : 'Erro ao salvar aditivo'}
                </div>
                <div className="text-[11px] text-[rgb(168,47,36)]">{submitError}</div>
              </div>
            )}
          </div>

          {/* Footer — Modo NOVO / EDITAR */}
          {(isNovo || isEditar) && (
            <div className="flex items-center gap-2.5 px-[22px] py-3 bg-[rgb(250,247,242)] border-t border-[rgb(229,222,212)] shrink-0">
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-[7px] rounded-[6px] text-[11.5px] font-medium text-[rgb(115,107,97)] hover:bg-[rgb(242,237,229)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-[6px] text-[11.5px] font-semibold text-white transition-all hover:shadow-[0_4px_10px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: theme.button,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.buttonHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.button
                }}
                onClick={() => console.log('[AditiveModal] Botão Salvar Aditivo clicado')}
              >
                {isSubmitting
                  ? 'Salvando...'
                  : isBaseContract
                    ? 'Homologar Contrato'
                    : isEditar
                      ? 'Salvar Alterações'
                      : 'Salvar Aditivo'}
              </button>
            </div>
          )}
        </form>

        {/* Footer — Modo SELADO */}
        {isSelado && (
          <div className="flex items-center gap-2.5 px-[22px] py-3 bg-[rgb(250,247,242)] border-t border-[rgb(229,222,212)] shrink-0">
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded-[6px] text-[11.5px] font-semibold text-[rgb(168,47,36)] border border-[rgb(229,222,212)] hover:bg-[rgba(229,77,64,0.06)] hover:border-[rgba(229,77,64,0.35)] transition-all flex items-center gap-1.5"
            >
              <Trash2 size={13} /> Excluir
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-3.5 py-[7px] rounded-[6px] text-[11.5px] font-medium bg-white text-[rgb(51,46,41)] border border-[rgb(229,222,212)] hover:border-[rgb(199,191,178)] hover:bg-[rgb(250,247,242)] transition-all"
            >
              Fechar
            </button>
          </div>
        )}
        </div>

        {/* ═════ Right Panel — PDF Preview ═════ */}
        {showPreview && previewUrl && (
          <div className="flex-1 flex flex-col bg-[rgb(250,247,242)] border-l border-[rgb(229,222,212)] overflow-hidden">
            <div className="flex items-center justify-between px-4 h-[48px] bg-white border-b border-[rgb(229,222,212)] shrink-0">
              <span className="text-[12px] font-semibold text-[rgb(31,28,26)]">
                Visualização do Documento
              </span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="w-7 h-7 rounded-[5px] flex items-center justify-center text-[rgb(153,145,135)] hover:bg-[rgb(242,237,229)] hover:text-[rgb(51,46,41)] transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0 p-3">
              {previewUrl.startsWith('blob:') || previewUrl.startsWith('data:') || previewUrl.startsWith('http://') || previewUrl.startsWith('https://') ? (
                <embed
                  src={previewUrl}
                  type="application/pdf"
                  className="w-full h-full rounded-[8px] bg-white"
                  title="Preview do documento"
                />
              ) : (
                <div className="w-full h-full rounded-[8px] bg-white flex flex-col items-center justify-center gap-4 p-8">
                  <div className="w-16 h-16 rounded-full bg-[rgb(232,245,250)] flex items-center justify-center">
                    <FileText size={28} className="text-[rgb(26,112,140)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-semibold text-[rgb(31,28,26)] mb-1">
                      Documento anexado
                    </p>
                    <p className="text-[12px] text-[rgb(153,145,135)] max-w-[360px]">
                      O preview inline requer um servidor de arquivos configurado.
                      No ambiente de desenvolvimento, o documento está registrado mas
                      não pode ser pré-visualizado.
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-[6px] bg-[rgb(250,247,242)] border border-[rgb(229,222,212)]">
                    <span className="font-mono text-[11px] text-[rgb(115,107,97)] break-all">
                      {previewUrl}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
