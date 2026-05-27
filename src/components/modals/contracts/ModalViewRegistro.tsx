'use client'

import { Modal } from '@mui/material'
import {
  X,
  FileText,
  CalendarDays,
  CircleDollarSign,
  ArrowRight,
  Upload,
  AlertCircle,
  Save,
  Trash2,
  FileX,
  CalendarDays as IconCalendar,
  CircleDollarSign as IconMoney,
  FileText as IconScope,
  MoreHorizontal as IconDots,
} from 'lucide-react'
import { ContractStatus } from '@/enums/contracts'
import { IContract } from '@/types/contracts'
import { formatDate } from '@/utils/dates'
import { maskMonetaryValue } from '@/utils/masks'
import { useState, useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  data: IContract | null
  isBase: boolean
  seqNum?: number
  contractStatus?: ContractStatus
  onUpdate?: (id: number, updates: Partial<IContract>, file?: File | null) => void
  onDelete?: (id: number) => void
}

/* ═══ Helpers de máscara ═══ */
const maskMoneyInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10)
  const reais = Math.floor(num / 100)
  const centavos = String(num % 100).padStart(2, '0')
  return `R$ ${reais.toLocaleString('pt-BR')},${centavos}`
}

const unmaskMoney = (masked: string): number => {
  const digits = masked.replace(/\D/g, '')
  return digits ? parseInt(digits, 10) / 100 : 0
}

const maskDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

const parseDateStr = (str: string): Date | undefined => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return undefined
  const [d, m, y] = str.split('/').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getDate() !== d || date.getMonth() !== m - 1 || date.getFullYear() !== y)
    return undefined
  return date
}

const formatDateToBR = (date: Date | string | undefined): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return formatDate(d) ?? ''
}

export const ModalViewRegistro = ({
  open,
  onClose,
  data,
  isBase,
  seqNum,
  contractStatus,
  onUpdate,
  onDelete,
}: Props) => {
  const [editMode, setEditMode] = useState(false)

  /* Estados de edição */
  const [tipo, setTipo] = useState<'prazo' | 'valor' | 'escopo' | 'outro' | 'distrato'>('valor')
  const [impacto, setImpacto] = useState<'acrescimo' | 'supressao'>('acrescimo')
  const [resumo, setResumo] = useState('')
  const [assinatura, setAssinatura] = useState('')
  const [inicio, setInicio] = useState('')
  const [novaDataFim, setNovaDataFim] = useState('')
  const [valorInput, setValorInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const baseIsRascunho = isBase && contractStatus === ContractStatus.RASCUNHO
  const canEdit = onUpdate && data && (baseIsRascunho || (!isBase && data.aditivoStatus !== 'Homologado'))
  const isHomologado = !isBase && data?.aditivoStatus === 'Homologado'

  /* Inicializa estados quando abre */
  useEffect(() => {
    if (open && data) {
      const shouldEdit = baseIsRascunho || (!isBase && data.aditivoStatus !== 'Homologado')
      setEditMode(shouldEdit)

      setTipo((data.aditivoType as 'prazo' | 'valor' | 'escopo' | 'outro' | 'distrato') ?? 'valor')
      setImpacto((data.totalValue ?? 0) < 0 ? 'supressao' : 'acrescimo')
      setResumo(data.object ?? '')
      setAssinatura(data.dataAssinatura ?? '')
      setInicio(formatDateToBR(data.contractPeriod?.start))
      setNovaDataFim(formatDateToBR(data.contractPeriod?.end))
      setValorInput(data.totalValue ? maskMoneyInput(String(Math.round(Math.abs(data.totalValue) * 100))) : '')
      setFile(null)
      setErrors({})
    }
  }, [open, data, isBase])

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void
  ) => {
    const masked = maskDateInput(e.target.value)
    setter(masked)
    // Força o DOM a refletir o valor mascarado imediatamente
    if (masked !== e.target.value) {
      e.target.value = masked
    }
  }

  const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskMoneyInput(e.target.value)
    setValorInput(masked)
    if (masked !== e.target.value) {
      e.target.value = masked
    }
    if (errors.valor) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.valor
        return next
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      if (errors.assinatura) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.assinatura
          return next
        })
      }
    }
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (file && !parseDateStr(assinatura)) {
      nextErrors.assinatura = 'Data de assinatura obrigatória quando há arquivo anexado'
    }
    // Aditivos exigem valor/prazo; registro base em rascunho não exige
    if (!isBase) {
      if (tipo === 'valor' && unmaskMoney(valorInput) === 0) {
        nextErrors.valor = 'Informe o valor do aditivo'
      }
      if (tipo === 'prazo' && !parseDateStr(novaDataFim)) {
        nextErrors.novaDataFim = 'Informe a nova data fim'
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = () => {
    if (!data || !onUpdate) return
    if (!validate()) return

    const updates: Partial<IContract> = {}

    // Resumo / Objeto
    updates.object = resumo.trim() || data.object

    // Datas
    const dtAssinatura = parseDateStr(assinatura)
    const dtInicio = parseDateStr(inicio)
    const dtFim = parseDateStr(novaDataFim)

    updates.contractPeriod = {
      start: dtInicio ?? data.contractPeriod?.start ?? new Date(),
      end: dtFim ?? data.contractPeriod?.end ?? new Date(),
    }

    // Data assinatura
    updates.dataAssinatura = assinatura || undefined

    if (isBase) {
      // Registro base: segue regras de Pendente / Em Andamento
      if (tipo === 'valor') {
        const valorCents = unmaskMoney(valorInput)
        updates.totalValue = impacto === 'supressao' ? -valorCents : valorCents
      }
      if (file && dtAssinatura) {
        updates.contractStatus = ContractStatus.ONGOING
        updates.signedContractUrl = URL.createObjectURL(file)
      } else {
        updates.contractStatus = ContractStatus.PENDING
      }
    } else {
      // Aditivo: mantém comportamento original
      updates.aditivoType = tipo
      if (tipo === 'valor') {
        const valorCents = unmaskMoney(valorInput)
        updates.totalValue = impacto === 'supressao' ? -valorCents : valorCents
      } else {
        updates.totalValue = 0
      }
      if (file && dtAssinatura) {
        updates.aditivoStatus = 'Homologado'
        updates.signedContractUrl = URL.createObjectURL(file)
      } else if (data.aditivoStatus === 'Rascunho') {
        updates.aditivoStatus = 'Pendente'
      }
    }

    onUpdate(data.id, updates, file)
    setEditMode(false)
    onClose()
  }

  const handleDelete = () => {
    if (!data || !onDelete) return
    onDelete(data.id)
    onClose()
  }

  if (!data) return null

  /* ─── Labels visuais ─── */
  const tipoLabel = isBase
    ? 'Base'
    : data.aditivoType === 'prazo'
      ? 'Prazo'
      : data.aditivoType === 'valor'
        ? 'Valor'
        : data.aditivoType === 'escopo'
          ? 'Escopo'
          : data.aditivoType === 'outro'
            ? 'Outro'
            : data.aditivoType === 'distrato'
              ? 'Distrato'
              : 'Aditivo'

  const tipoColor = isBase
    ? '#332e29'
    : data.aditivoType === 'prazo'
      ? '#2d4f75'
      : data.aditivoType === 'valor'
        ? '#176642'
        : data.aditivoType === 'escopo'
          ? '#4d4740'
          : data.aditivoType === 'distrato'
            ? '#a82f24'
            : '#736b61'

  const tipoBg = isBase
    ? '#e5ded4'
    : data.aditivoType === 'prazo'
      ? '#e8eef5'
      : data.aditivoType === 'valor'
        ? 'rgba(31, 125, 85, 0.10)'
        : data.aditivoType === 'escopo'
          ? '#f2ede5'
          : data.aditivoType === 'distrato'
            ? 'rgba(229, 77, 64, 0.10)'
            : '#e5ded4'

  const statusLabel = isBase
    ? data.signedContractUrl &&
      contractStatus !== ContractStatus.FINISHED &&
      contractStatus !== ContractStatus.DISTRATO
      ? 'Homologado'
      : contractStatus === ContractStatus.PENDING
        ? 'Pendente'
        : contractStatus === ContractStatus.FINISHED
          ? 'Finalizado'
          : contractStatus === ContractStatus.DISTRATO
            ? 'Distrato'
            : 'Rascunho'
    : data.aditivoStatus ?? '—'

  const statusColor =
    statusLabel === 'Homologado'
      ? '#176642'
      : statusLabel === 'Pendente'
        ? '#9a5402'
        : statusLabel === 'Finalizado'
          ? '#332e29'
          : statusLabel === 'Distrato'
            ? '#c0392b'
            : '#736b61'

  const statusBg =
    statusLabel === 'Homologado'
      ? 'rgba(31, 125, 85, 0.10)'
      : statusLabel === 'Pendente'
        ? 'rgba(217, 119, 6, 0.07)'
        : statusLabel === 'Finalizado'
          ? 'rgb(242, 237, 229)'
          : statusLabel === 'Distrato'
            ? 'rgba(229, 77, 64, 0.10)'
            : '#faf7f2'

  const start = formatDate(data.contractPeriod?.start)
  const end = formatDate(data.contractPeriod?.end)

  const valorSinal = (data.totalValue ?? 0) >= 0 ? '+' : ''
  const valorText = `${valorSinal}${maskMonetaryValue(data.totalValue ?? 0)}`
  const isNegativo = (data.totalValue ?? 0) < 0

  /* Cards de tipo para edição */
  const tipoCards = [
    { key: 'prazo' as const, label: 'Prazo', desc: 'Prorrogação de vigência', icon: IconCalendar },
    { key: 'valor' as const, label: 'Valor', desc: 'Acréscimo ou supressão', icon: IconMoney },
    { key: 'escopo' as const, label: 'Escopo', desc: 'Sem impacto financeiro', icon: IconScope },
    { key: 'outro' as const, label: 'Outro', desc: 'Reajuste, reequilíbrio…', icon: IconDots },
    { key: 'distrato' as const, label: 'Distrato / Rescisão', desc: 'Encerramento antecipado', icon: FileX },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            background: 'rgba(31, 28, 26, 0.45)',
            backdropFilter: 'blur(4px)',
          },
        },
      }}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          width: '600px',
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: '12px',
          border: '0.5px solid #e5ded4',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ═════════ HEADER ═════════ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '0.5px solid #e5ded4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 700,
                color: '#1f1c1a',
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
              }}
            >
              {isBase
                ? 'Contrato Base'
                : isHomologado
                  ? `Documento · Aditivo ${seqNum ?? ''}`
                  : `Editar Aditivo ${seqNum ?? ''}`}
            </h3>
            <span
              style={{
                fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                fontSize: '11px',
                fontWeight: 500,
                color: '#736b61',
                flexShrink: 0,
              }}
            >
              {data.contractCode}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {canEdit && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#396496',
                  padding: '5px 12px',
                  borderRadius: '5px',
                  border: '0.5px solid #e5ded4',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'all 120ms',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = '#e8eef5')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = '#fff')
                }
              >
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#736b61',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = '#faf7f2')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'none')
              }
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ═════════ BODY ═════════ */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          {/* ─── Tipo + Status ─── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: '3px',
                color: tipoColor,
                background: tipoBg,
              }}
            >
              {tipoLabel}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '999px',
                color: statusColor,
                background: statusBg,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background:
                    statusLabel === 'Homologado'
                      ? '#1f7d55'
                      : statusLabel === 'Pendente'
                        ? '#d97706'
                        : statusLabel === 'Finalizado'
                          ? '#999187'
                          : statusLabel === 'Distrato'
                            ? '#e54d40'
                            : '#999187',
                }}
              />
              {statusLabel}
            </span>
          </div>

          {/* ═════════ MODO EDIÇÃO ═════════ */}
          {editMode && canEdit && (
            <>
              {/* Seletor de Tipo — somente para aditivos */}
              {!isBase && (
                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#999187',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                    }}
                  >
                    Tipo
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {tipoCards.map((t) => {
                      const Icon = t.icon
                      const isActive = tipo === t.key
                      return (
                        <button
                          key={t.key}
                          onClick={() => setTipo(t.key)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '14px 8px',
                            borderRadius: '8px',
                            border: isActive ? '1.5px solid #396496' : '1px solid #e5ded4',
                            background: isActive ? '#e8eef5' : '#fff',
                            color: isActive ? '#2d4f75' : '#332e29',
                            cursor: 'pointer',
                            transition: 'all 120ms',
                          }}
                        >
                          <Icon size={18} />
                          <span style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1 }}>
                            {t.label}
                          </span>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 400,
                              color: isActive ? '#396496' : '#736b61',
                              lineHeight: 1.2,
                              textAlign: 'center',
                            }}
                          >
                            {t.desc}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Resumo -->
              <div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#999187',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  Resumo
                </div>
                <textarea
                  value={resumo}
                  onChange={(e) => setResumo(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5ded4',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontFamily: 'inherit',
                    color: '#332e29',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Condicional: Prazo — somente para aditivos */}
              {!isBase && tipo === 'prazo' && (
                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#999187',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                    }}
                  >
                    Detalhes do Prazo
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        color: '#999187',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Nova Data Fim
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/aaaa"
                      value={novaDataFim}
                      onChange={(e) => {
                        handleDateChange(e, setNovaDataFim)
                        if (errors.novaDataFim) {
                          setErrors((prev) => {
                            const next = { ...prev }
                            delete next.novaDataFim
                            return next
                          })
                        }
                      }}
                      style={{
                        padding: '8px 11px',
                        border: errors.novaDataFim
                          ? '1.5px solid #e54d40'
                          : '1px solid #e5ded4',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                    {errors.novaDataFim && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#e54d40',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <AlertCircle size={10} />
                        {errors.novaDataFim}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Condicional: Valor — somente para aditivos */}
              {!isBase && tipo === 'valor' && (
                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#999187',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                    }}
                  >
                    Detalhes do Valor
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 600,
                          color: '#999187',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Impacto
                      </label>
                      <div
                        style={{
                          display: 'flex',
                          border: '1px solid #e5ded4',
                          borderRadius: '6px',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => setImpacto('acrescimo')}
                          style={{
                            flex: 1,
                            padding: '7px',
                            fontSize: '11.5px',
                            fontWeight: impacto === 'acrescimo' ? 600 : 400,
                            background: impacto === 'acrescimo' ? '#e8eef5' : '#fff',
                            color: impacto === 'acrescimo' ? '#2d4f75' : '#736b61',
                            border: 'none',
                            cursor: 'pointer',
                            borderRight: '1px solid #e5ded4',
                          }}
                        >
                          Acréscimo
                        </button>
                        <button
                          onClick={() => setImpacto('supressao')}
                          style={{
                            flex: 1,
                            padding: '7px',
                            fontSize: '11.5px',
                            fontWeight: impacto === 'supressao' ? 600 : 400,
                            background: impacto === 'supressao' ? '#e8eef5' : '#fff',
                            color: impacto === 'supressao' ? '#2d4f75' : '#736b61',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Supressão
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 600,
                          color: '#999187',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Valor
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="R$ 0,00"
                        value={valorInput}
                        onChange={handleMoneyChange}
                        style={{
                          padding: '8px 11px',
                          border: errors.valor
                            ? '1.5px solid #e54d40'
                            : '1px solid #e5ded4',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                          outline: 'none',
                          width: '100%',
                        }}
                      />
                      {errors.valor && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#e54d40',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <AlertCircle size={10} />
                          {errors.valor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Datas */}
              <div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#999187',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  Datas
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        color: '#999187',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CalendarDays size={10} />
                      Data da Assinatura
                      {file && (
                        <span style={{ color: '#e54d40', fontSize: '9px' }}>*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/aaaa"
                      value={assinatura}
                      onChange={(e) => {
                        handleDateChange(e, setAssinatura)
                        if (errors.assinatura) {
                          setErrors((prev) => {
                            const next = { ...prev }
                            delete next.assinatura
                            return next
                          })
                        }
                      }}
                      style={{
                        padding: '8px 11px',
                        border: errors.assinatura
                          ? '1.5px solid #e54d40'
                          : '1px solid #e5ded4',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                    {errors.assinatura && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#e54d40',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <AlertCircle size={10} />
                        {errors.assinatura}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        color: '#999187',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CalendarDays size={10} />
                      Início do Efeito
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/aaaa"
                      value={inicio}
                      onChange={(e) => handleDateChange(e, setInicio)}
                      style={{
                        padding: '8px 11px',
                        border: '1px solid #e5ded4',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Upload */}
              <div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#999187',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  Documento Principal
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: '11px', color: '#c7811a', background: '#fef9ef', padding: '6px 10px', borderRadius: 6, border: '0.5px solid #f2dca6' }}>
                  <AlertCircle size={12} />
                  O documento assinado é obrigatório para a homologação.
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    border: '1px dashed #c7bfb2',
                    borderRadius: '8px',
                    background: '#faf7f2',
                    cursor: 'pointer',
                    transition: 'all 120ms',
                  }}
                >
                  <Upload size={18} color="#736b61" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#332e29' }}>
                      {file ? file.name : 'Solte o arquivo aqui ou clique para escolher'}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#999187', marginTop: '2px' }}>
                      PDF assinado · até 20MB
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#396496',
                      padding: '5px 12px',
                      borderRadius: '5px',
                      background: '#e8eef5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file ? 'Trocar' : 'Escolher'}
                  </span>
                  <input type="file" accept=".pdf" hidden onChange={handleFileChange} />
                </label>
              </div>
            </>
          )}

          {/* ═════════ MODO VISUALIZAÇÃO ═════════ */}
          {!editMode && (
            <>
              {/* Resumo / Objeto */}
              <div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#999187',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  {isBase ? 'Objeto' : 'Resumo'}
                </div>
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#faf7f2',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    color: '#332e29',
                    lineHeight: 1.5,
                    border: '0.5px solid #e5ded4',
                  }}
                >
                  {data.object}
                </div>
              </div>

              {/* Datas */}
              <div>
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#999187',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  Datas
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      padding: '10px 12px',
                      background: '#faf7f2',
                      borderRadius: '6px',
                      border: '0.5px solid #e5ded4',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        color: '#999187',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <CalendarDays size={11} />
                      Início
                    </div>
                    <div
                      style={{
                        fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                        fontSize: '12.5px',
                        color: '#332e29',
                        fontWeight: 500,
                      }}
                    >
                      {start ?? '-'}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      padding: '10px 12px',
                      background: '#faf7f2',
                      borderRadius: '6px',
                      border: '0.5px solid #e5ded4',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        color: '#999187',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <CalendarDays size={11} />
                      Fim / Vigência
                    </div>
                    <div
                      style={{
                        fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                        fontSize: '12.5px',
                        color: '#332e29',
                        fontWeight: 500,
                      }}
                    >
                      {end ?? '-'}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      padding: '10px 12px',
                      background: '#faf7f2',
                      borderRadius: '6px',
                      border: '0.5px solid #e5ded4',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        color: '#999187',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <CalendarDays size={11} />
                      Assinatura
                    </div>
                    <div
                      style={{
                        fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                        fontSize: '12.5px',
                        color: '#332e29',
                        fontWeight: 500,
                      }}
                    >
                      {data.dataAssinatura ?? '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Valor */}
              {!isBase && data.aditivoType === 'valor' && (
                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#999187',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                    }}
                  >
                    Valor
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      background: isNegativo
                        ? 'rgba(229, 77, 64, 0.06)'
                        : 'rgba(31, 125, 85, 0.06)',
                      borderRadius: '6px',
                      border: `0.5px solid ${isNegativo ? 'rgba(229, 77, 64, 0.25)' : 'rgba(31, 125, 85, 0.25)'}`,
                    }}
                  >
                    <CircleDollarSign
                      size={16}
                      color={isNegativo ? '#e54d40' : '#1f7d55'}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: isNegativo ? '#e54d40' : '#176642',
                        }}
                      >
                        {valorText}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#736b61', marginTop: '2px' }}>
                        {isNegativo
                          ? 'Supressão de valor no contrato'
                          : 'Acréscimo de valor no contrato'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Valor Base */}
              {isBase && (
                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#999187',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                    }}
                  >
                    Valor Original
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      background: 'rgba(31, 125, 85, 0.06)',
                      borderRadius: '6px',
                      border: '0.5px solid rgba(31, 125, 85, 0.25)',
                    }}
                  >
                    <CircleDollarSign size={16} color="#1f7d55" />
                    <div
                      style={{
                        fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#176642',
                      }}
                    >
                      {maskMonetaryValue(data.totalValue ?? 0)}
                    </div>
                  </div>
                </div>
              )}

              {/* Documento */}
              {data.signedContractUrl && (
                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#999187',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                    }}
                  >
                    Documento
                  </div>
                  <a
                    href={data.signedContractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      background: '#faf7f2',
                      borderRadius: '6px',
                      border: '0.5px solid #e5ded4',
                      textDecoration: 'none',
                      color: '#332e29',
                      cursor: 'pointer',
                      transition: 'all 120ms',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.background = '#f2ede5'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.background = '#faf7f2'
                    }}
                  >
                    <FileText size={16} color="#736b61" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {data.contractCode}.pdf
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#736b61' }}>
                        Clique para abrir o documento
                      </div>
                    </div>
                    <ArrowRight size={14} color="#736b61" />
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═════════ FOOTER ═════════ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '12px 20px',
            borderTop: '0.5px solid #e5ded4',
            background: '#faf7f2',
          }}
        >
          {/* Excluir — apenas Homologado com permissão */}
          {isHomologado && onDelete && (
            <button
              onClick={handleDelete}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 500,
                color: '#e54d40',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 120ms',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginRight: 'auto',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(229, 77, 64, 0.06)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')
              }
            >
              <Trash2 size={13} />
              Excluir
            </button>
          )}

          {editMode && canEdit && (
            <>
              <button
                onClick={() => setEditMode(false)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  color: '#736b61',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 120ms',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = '#f2ede5')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')
                }
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#fff',
                  background: '#396496',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 120ms',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = '#2d4f75')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = '#396496')
                }
              >
                <Save size={13} />
                Salvar
              </button>
            </>
          )}

          {!editMode && (
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 500,
                color: '#332e29',
                background: '#fff',
                border: '0.5px solid #e5ded4',
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = '#faf7f2')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = '#fff')
              }
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
