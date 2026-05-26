'use client'

import { Modal } from '@mui/material'
import { useState, useCallback } from 'react'
import {
  CalendarDays,
  CircleDollarSign,
  FileText,
  MoreHorizontal,
  Upload,
  X,
  AlertCircle,
  FileX,
} from 'lucide-react'

export interface AditivoFormData {
  tipo: 'prazo' | 'valor' | 'escopo' | 'outro' | 'distrato'
  impacto?: 'acrescimo' | 'supressao'
  novaDataFim?: string
  impactoValor?: string
  assinatura?: string
  dataRescisao?: string
  inicio?: string
  resumo: string
  file: File | null
  status: 'Rascunho' | 'Pendente' | 'Homologado'
}

interface Props {
  open: boolean
  onClose: () => void
  contractCode: string
  nextAditivoNum: string
  contractStartDate?: string
  onSubmit: (data: AditivoFormData) => void | Promise<void>
}

type TipoAditivo = 'prazo' | 'valor' | 'escopo' | 'outro' | 'distrato' | null

/* ═══ Helpers de máscara ═══ */
const maskDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

const maskMoneyInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10)
  const reais = Math.floor(num / 100)
  const centavos = String(num % 100).padStart(2, '0')
  return `R$ ${reais.toLocaleString('pt-BR')},${centavos}`
}

const handleDateChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (v: string) => void
) => {
  const masked = maskDateInput(e.target.value)
  setter(masked)
  if (masked !== e.target.value) {
    e.target.value = masked
  }
}

const handleMoneyChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (v: string) => void
) => {
  const masked = maskMoneyInput(e.target.value)
  setter(masked)
  if (masked !== e.target.value) {
    e.target.value = masked
  }
}

export const ModalNovoAditivo = ({
  open,
  onClose,
  contractCode,
  nextAditivoNum,
  contractStartDate,
  onSubmit,
}: Props) => {
  const [tipo, setTipo] = useState<TipoAditivo>(null)
  const [impacto, setImpacto] = useState<'acrescimo' | 'supressao'>('acrescimo')
  const [novaDataFim, setNovaDataFim] = useState('')
  const [impactoValor, setImpactoValor] = useState('')
  const [assinatura, setAssinatura] = useState('')
  const [dataRescisao, setDataRescisao] = useState('')
  const [inicio, setInicio] = useState('')
  const [resumo, setResumo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const tipos = [
    {
      key: 'prazo' as TipoAditivo,
      label: 'Prazo',
      desc: 'Prorrogação de vigência',
      icon: CalendarDays,
    },
    {
      key: 'valor' as TipoAditivo,
      label: 'Valor',
      desc: 'Acréscimo ou supressão',
      icon: CircleDollarSign,
    },
    {
      key: 'escopo' as TipoAditivo,
      label: 'Escopo',
      desc: 'Sem impacto financeiro',
      icon: FileText,
    },
    {
      key: 'outro' as TipoAditivo,
      label: 'Outro',
      desc: 'Reajuste, reequilíbrio…',
      icon: MoreHorizontal,
    },
    {
      key: 'distrato' as TipoAditivo,
      label: 'Distrato / Rescisão',
      desc: 'Encerramento antecipado do contrato',
      icon: FileX,
      distrato: true,
    },
  ]

  const resetForm = useCallback(() => {
    setTipo(null)
    setImpacto('acrescimo')
    setNovaDataFim('')
    setImpactoValor('')
    setAssinatura('')
    setDataRescisao('')
    setInicio('')
    setResumo('')
    setFile(null)
    setErrors({})
  }, [])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      // Limpa erro de assinatura se o arquivo foi anexado
      setErrors((prev) => {
        const next = { ...prev }
        delete next.assinatura
        return next
      })
    }
  }

  const validate = (mode: 'rascunho' | 'salvar'): boolean => {
    const nextErrors: Record<string, string> = {}

    if (mode === 'salvar') {
      if (!tipo) {
        nextErrors.tipo = 'Selecione o tipo do aditivo'
      }
      // Se tem arquivo, data de assinatura ou rescisão é obrigatória (homologação)
      if (file) {
        if (tipo === 'distrato' && !dataRescisao.trim()) {
          nextErrors.dataRescisao = 'Data de rescisão obrigatória quando há arquivo anexado'
        } else if (tipo !== 'distrato' && !assinatura.trim()) {
          nextErrors.assinatura = 'Data de assinatura obrigatória quando há arquivo anexado'
        }
      }

      // Validação: data de rescisão não pode ser retroativa à assinatura do contrato base
      if (tipo === 'distrato' && dataRescisao.trim() && contractStartDate) {
        const parseDate = (s: string) => {
          const [d, m, y] = s.split('/').map(Number)
          return new Date(y, m - 1, d)
        }
        const rescisao = parseDate(dataRescisao)
        const base = parseDate(contractStartDate)
        if (rescisao < base) {
          nextErrors.dataRescisao = `Data de rescisão não pode ser anterior à assinatura do contrato base (${contractStartDate})`
        }
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (mode: 'rascunho' | 'salvar') => {
    if (!validate(mode)) return

    let status: AditivoFormData['status']
    if (mode === 'rascunho') {
      status = 'Rascunho'
    } else {
      // mode === 'salvar'
      if (file) {
        status = 'Homologado'
      } else {
        status = 'Pendente'
      }
    }

    await onSubmit({
      tipo: tipo ?? 'outro',
      impacto,
      novaDataFim: novaDataFim || undefined,
      impactoValor: impactoValor || undefined,
      assinatura: assinatura || undefined,
      dataRescisao: dataRescisao || undefined,
      inicio: inicio || undefined,
      resumo: resumo || '',
      file,
      status,
    })

    resetForm()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
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
          width: '640px',
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
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '0.5px solid #e5ded4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 700,
                color: '#1f1c1a',
                letterSpacing: '-0.005em',
              }}
            >
              Novo Aditivo
            </h3>
            <span
              style={{
                fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                fontSize: '11px',
                fontWeight: 500,
                color: '#736b61',
              }}
            >
              {nextAditivoNum}
            </span>
          </div>
          <button
            onClick={handleClose}
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

        {/* Body */}
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
          {/* Tipo */}
          <div>
            <div
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#999187',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Tipo
              {errors.tipo && (
                <span style={{ color: '#e54d40', fontSize: '9px', fontWeight: 600 }}>
                  <AlertCircle size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                  {errors.tipo}
                </span>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
              }}
            >
              {tipos.map((t) => {
                const Icon = t.icon
                const isActive = tipo === t.key
                const theme: Record<string, { border: string; bg: string; text: string; icon: string }> = {
                  prazo:   { border: '#93c5fd', bg: '#eff6ff', text: '#1e40af', icon: '#2563eb' },
                  valor:   { border: '#86efac', bg: '#f0fdf4', text: '#166534', icon: '#22c55e' },
                  escopo:  { border: '#d9c9a8', bg: '#faf7f2', text: '#4d4740', icon: '#c7bfb2' },
                  outro:   { border: '#c7bfb2', bg: '#f2ede5', text: '#736b61', icon: '#999187' },
                  distrato:{ border: '#fca5a5', bg: '#fef2f2', text: '#991b1b', icon: '#dc2626' },
                }
                const th = theme[t.key || ''] || theme.outro
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      setTipo(t.key)
                      if (errors.tipo) {
                        setErrors((prev) => {
                          const next = { ...prev }
                          delete next.tipo
                          return next
                        })
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '14px 8px',
                      borderRadius: '8px',
                      border: isActive
                        ? `1.5px solid ${th.border}`
                        : errors.tipo
                          ? '1.5px solid #e54d40'
                          : '1px solid #e5ded4',
                      background: isActive ? th.bg : '#fff',
                      color: isActive ? th.text : '#332e29',
                      cursor: 'pointer',
                      transition: 'all 120ms',
                    }}
                  >
                    <Icon size={18} color={isActive ? th.icon : undefined} />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        lineHeight: 1,
                      }}
                    >
                      {t.label}
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 400,
                        color: isActive ? th.icon : '#736b61',
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

          {/* Conditional: Prazo */}
          {tipo === 'prazo' && (
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
                  onChange={(e) => handleDateChange(e, setNovaDataFim)}
                  style={{
                    padding: '8px 11px',
                    border: '1px solid #e5ded4',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Conditional: Valor */}
          {tipo === 'valor' && (
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
                        background:
                          impacto === 'acrescimo' ? '#f0fdf4' : '#fff',
                        color:
                          impacto === 'acrescimo' ? '#166534' : '#736b61',
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
                        background:
                          impacto === 'supressao' ? '#f0fdf4' : '#fff',
                        color:
                          impacto === 'supressao' ? '#166534' : '#736b61',
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
                    value={impactoValor}
                    onChange={(e) => handleMoneyChange(e, setImpactoValor)}
                    style={{
                      padding: '8px 11px',
                      border: '1px solid #e5ded4',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                      outline: 'none',
                    }}
                  />
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
              {tipo === 'distrato' ? 'Data de Rescisão' : 'Datas'}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: tipo === 'distrato' ? '1fr' : '1fr 1fr',
                gap: '12px',
              }}
            >
              {tipo === 'distrato' ? (
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
                    Data de Rescisão
                    {file && (
                      <span style={{ color: '#e54d40', fontSize: '9px' }}>*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="dd/mm/aaaa"
                    value={dataRescisao}
                    onChange={(e) => {
                      handleDateChange(e, setDataRescisao)
                      if (errors.dataRescisao) {
                        setErrors((prev) => {
                          const next = { ...prev }
                          delete next.dataRescisao
                          return next
                        })
                      }
                    }}
                    style={{
                      padding: '8px 11px',
                      border: errors.dataRescisao
                        ? '1.5px solid #e54d40'
                        : '1px solid #e5ded4',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                      outline: 'none',
                    }}
                  />
                  {errors.dataRescisao && (
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
                      {errors.dataRescisao}
                    </span>
                  )}
                </div>
              ) : (
                <>
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
                      }}
                    >
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
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Resumo / Justificativa */}
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
              {tipo === 'distrato' ? 'Justificativa da Rescisão' : 'Resumo'}
            </div>
            <textarea
              placeholder={
                tipo === 'distrato'
                  ? 'Descreva a justificativa jurídica e os motivos que levaram ao encerramento antecipado do contrato.'
                  : 'Descreva brevemente o que motivou e o que altera o aditivo. Esse resumo aparece na lista do contrato e na timeline.'
              }
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

          {/* Documento */}
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
              {tipo === 'distrato' ? 'Termo de Distrato' : 'Documento Principal'}
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
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#332e29',
                  }}
                >
                  {file ? file.name : 'Solte o arquivo aqui ou clique para escolher'}
                </div>
                <div
                  style={{
                    fontSize: '10.5px',
                    color: '#999187',
                    marginTop: '2px',
                  }}
                >
                  {tipo === 'distrato' ? 'Termo de Distrato Assinado · PDF · até 20MB' : 'PDF assinado · até 20MB'}
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
              <input
                type="file"
                accept=".pdf"
                hidden
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
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
          <button
            onClick={handleClose}
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
            onClick={() => handleSubmit('rascunho')}
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
            Salvar como rascunho
          </button>
          <button
            onClick={() => handleSubmit('salvar')}
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
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = '#2d4f75')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = '#396496')
            }
          >
            Salvar Aditivo
          </button>
        </div>
      </div>
    </Modal>
  )
}
