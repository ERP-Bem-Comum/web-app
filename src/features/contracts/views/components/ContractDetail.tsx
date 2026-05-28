import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from '@tanstack/react-router'
import type { ContractRow } from '../../domain/types'
import { deriveStatus } from '../../domain/status'
import { formatContractNumber, formatAditiveNumber } from '../../domain/format'
import {
  ArrowLeft,
  Edit,
  FilePlus,
  Eye,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Upload,
  Trash2,
  AlertCircle,
  X,
  DollarSign,
  List,
  MoreHorizontal,
  FileText,
} from 'lucide-react'
import { AditiveModal } from './AditiveModal'
import { updateContract } from '@/server/contracts'

interface Props {
  contract: ContractRow
}

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */
function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string | Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function fmtDateShort(d: string | Date | null): string {
  if (!d) return ''
  const date = new Date(d)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

/* ═══════════════════════════════════════════════════════════
   Badges
   ═══════════════════════════════════════════════════════════ */
function TipoBadge({ tipo }: { tipo: string }) {
  const map: Record<string, string> = {
    base: 'text-white bg-[rgb(77,71,64)]',
    escopo: 'text-[rgb(77,71,64)] bg-[rgb(242,237,229)]',
    prazo: 'text-[rgb(26,112,140)] bg-[rgb(232,245,250)]',
    valor: 'text-[rgb(28,121,67)] bg-[rgba(51,178,102,0.10)]',
    outro: 'text-[rgb(115,107,97)] bg-[rgb(250,247,242)]',
    distrato: 'text-white bg-[rgb(168,47,36)]',
  }
  const label = tipo === 'base' ? 'Base' : tipo.charAt(0).toUpperCase() + tipo.slice(1)
  return (
    <span
      className={`inline-block text-[9px] font-bold tracking-[0.06em] px-[7px] py-[2px] rounded-[3px] uppercase text-center ${map[tipo] || map.outro}`}
    >
      {label}
    </span>
  )
}

function DocStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === 'homologado') {
    return (
      <span className="inline-flex items-center gap-[5px] text-[10px] font-semibold px-2 py-[2px] rounded-full text-[rgb(28,121,67)] bg-[rgba(51,178,102,0.10)]">
        <span className="w-[5px] h-[5px] rounded-full bg-[rgb(51,178,102)]" />
        {status}
      </span>
    )
  }
  if (s === 'vigente') {
    return (
      <span className="inline-flex items-center gap-[5px] text-[10px] font-semibold px-2 py-[2px] rounded-full text-[rgb(57,100,150)] bg-[rgba(57,100,150,0.10)]">
        <span className="w-[5px] h-[5px] rounded-full bg-[rgb(57,100,150)]" />
        {status}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-[5px] text-[10px] font-semibold px-2 py-[2px] rounded-full text-[rgb(154,84,2)] bg-[rgba(217,119,6,0.07)]">
      <span className="w-[5px] h-[5px] rounded-full bg-[rgb(217,119,6)]" />
      {status}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════
   Impacto do aditivo
   ═══════════════════════════════════════════════════════════ */
function Impacto({ child }: { child: any }) {
  if (child.tipo === 'base') {
    return (
      <span className="font-mono text-[11px] text-[rgb(51,46,41)] font-semibold text-right">
        R$ {fmtBRL(child.totalValue || 0)}
      </span>
    )
  }

  const isHomologado = child.aditivoStatus === 'Homologado'

  // Só mostra impacto visual quando homologado
  if (!isHomologado) {
    return (
      <span className="font-mono text-[11px] text-[rgb(153,145,135)] text-right italic">pendente</span>
    )
  }

  if (child.aditivoType === 'valor' && child.totalValue > 0) {
    return (
      <span className="font-mono text-[11px] text-[rgb(28,121,67)] text-right">
        + R$ {fmtBRL(child.totalValue)}
      </span>
    )
  }
  if (child.aditivoType === 'valor' && child.totalValue < 0) {
    return (
      <span className="font-mono text-[11px] text-[rgb(168,47,36)] text-right">
        - R$ {fmtBRL(Math.abs(child.totalValue))}
      </span>
    )
  }
  if (child.aditivoType === 'prazo') {
    return <span className="font-mono text-[11px] text-[rgb(57,100,150)] text-right">+ prazo</span>
  }
  if (child.aditivoType === 'distrato') {
    return <span className="font-mono text-[11px] text-[rgb(168,47,36)] text-right">distrato</span>
  }
  return (
    <span className="font-mono text-[11px] text-[rgb(115,107,97)] text-right">sem impacto</span>
  )
}

/* ═══════════════════════════════════════════════════════════
   Composição de valor (sidebar)
   ═══════════════════════════════════════════════════════════ */
function Composicao({ contract }: { contract: ContractRow }) {
  const original = contract.totalValue || 0
  const children = (contract.children || []) as any[]
  const sortedChildren = [...children].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  const homologados = sortedChildren.filter(
    (c) => c.aditivoType === 'valor' && c.aditivoStatus === 'Homologado',
  )
  const totalAditivos = homologados.reduce((sum, c) => sum + (c.totalValue || 0), 0)
  const atual = original + totalAditivos

  return (
    <div className="flex flex-col" style={{ fontVariantNumeric: 'tabular-nums' }}>
      <div className="flex justify-between items-baseline text-[11.5px] py-[5px]">
        <span className="text-[rgb(77,71,64)]">Valor Original</span>
        <span className="text-[rgb(51,46,41)] font-medium font-mono text-[11px]">
          R$ {fmtBRL(original)}
        </span>
      </div>
      {homologados.map((a, i) => {
        const isSupressao = (a.totalValue || 0) < 0
        return (
          <div key={i} className="flex justify-between items-baseline text-[11.5px] py-[5px]">
            <span className="text-[rgb(77,71,64)]">
              Aditivo {String(i + 1).padStart(2, '0')}
              <span className="font-mono text-[9.5px] text-[rgb(153,145,135)] ml-1.5">
                {a.contractCode}
              </span>
            </span>
            <span
              className={`font-mono text-[11px] ${
                isSupressao ? 'text-[rgb(168,47,36)]' : 'text-[rgb(28,121,67)]'
              }`}
            >
              {isSupressao ? '-' : '+'} R$ {fmtBRL(Math.abs(a.totalValue || 0))}
            </span>
          </div>
        )
      })}
      {/* Aditivos pendentes (não computados) */}
      {sortedChildren
        .filter((c) => c.aditivoType === 'valor' && c.aditivoStatus !== 'Homologado')
        .map((a, i) => (
          <div
            key={`p-${i}`}
            className="flex justify-between items-baseline text-[11.5px] py-[5px]"
          >
            <span className="text-[rgb(153,145,135)]">
              Aditivo {String(homologados.length + i + 1).padStart(2, '0')} · Pendente
              <span className="font-mono text-[9.5px] text-[rgb(153,145,135)] ml-1.5">
                não computado
              </span>
            </span>
            <span className="text-[rgb(153,145,135)] font-mono text-[11px]">R$ 0,00</span>
          </div>
        ))}
      <div className="flex justify-between items-baseline text-[11.5px] py-2 mt-1 border-t border-[rgb(229,222,212)]">
        <span className="text-[rgb(31,28,26)] font-bold text-[12px]">Valor Atual</span>
        <span className="text-[rgb(31,28,26)] font-bold text-[12.5px] font-mono">
          R$ {fmtBRL(atual)}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Barra de vigência (sidebar)
   ═══════════════════════════════════════════════════════════ */
function VigenciaBar({ contract }: { contract: ContractRow }) {
  const start = contract.contractPeriod?.start ? new Date(contract.contractPeriod.start) : null
  const end = contract.contractPeriod?.end ? new Date(contract.contractPeriod.end) : null
  const today = new Date()
  if (!start || !end) return null

  const totalDays = Math.max(1, end.getTime() - start.getTime())
  const elapsed = Math.max(0, today.getTime() - start.getTime())
  const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100))
  const remaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

  return (
    <div className="flex flex-col gap-[14px]">
      {/* Datas */}
      <div className="grid grid-cols-3 gap-[10px]">
        <div className="flex flex-col gap-[3px]">
          <span className="text-[9px] font-semibold text-[rgb(153,145,135)] tracking-[0.06em] uppercase">
            Início
          </span>
          <span className="font-mono text-[11.5px] font-medium text-[rgb(77,71,64)]">
            {fmt(start)}
          </span>
        </div>
        <div className="flex flex-col gap-[3px] items-center">
          <span className="text-[9px] font-semibold text-[rgb(153,145,135)] tracking-[0.06em] uppercase">
            Hoje
          </span>
          <span className="font-mono text-[11.5px] font-medium text-[rgb(26,112,140)]">
            {fmt(today)}
          </span>
        </div>
        <div className="flex flex-col gap-[3px] items-end">
          <span className="text-[9px] font-semibold text-[rgb(153,145,135)] tracking-[0.06em] uppercase">
            Fim
          </span>
          <span className="font-mono text-[11.5px] font-medium text-[rgb(28,121,67)] font-semibold">
            {fmt(end)}
          </span>
        </div>
      </div>

      {/* Barra */}
      <div
        className="relative h-[4px] bg-[rgb(229,222,212)] rounded-[2px]"
        style={{ margin: '8px 0 22px' }}
      >
        <div
          className="absolute left-0 top-0 h-full bg-[rgb(41,140,171)] rounded-[2px]"
          style={{ width: `${pct}%` }}
        />
        {/* Marcador início */}
        <span
          className="absolute top-1/2 w-2 h-2 rounded-full bg-white border-[1.5px] border-[rgb(115,107,97)]"
          style={{ left: '0%', transform: 'translate(-50%, -50%)' }}
        />
        {/* Marcador hoje */}
        <span
          className="absolute top-1/2 w-[10px] h-[10px] rounded-full bg-[rgb(41,140,171)] border-[1.5px] border-[rgb(41,140,171)]"
          style={{ left: `${pct}%`, transform: 'translate(-50%, -50%)' }}
        />
        {/* Marcador fim */}
        <span
          className="absolute top-1/2 w-2 h-2 rounded-full bg-[rgb(51,178,102)] border-[1.5px] border-[rgb(51,178,102)]"
          style={{ left: '100%', transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {remaining > 0 && (
        <div
          className={
            remaining <= 45
              ? 'viga-rem text-[10.5px] text-[rgb(154,84,2)] px-3 py-2 bg-[rgb(255,247,224)] border border-[rgb(217,153,26)] rounded-[6px] leading-[1.5]'
              : 'viga-rem text-[10.5px] text-[rgb(115,107,97)] px-3 py-2 bg-[rgb(250,247,242)] border border-[rgb(229,222,212)] rounded-[6px] leading-[1.5]'
          }
        >
          Faltam{' '}
          <strong className={remaining <= 45 ? 'text-[rgb(154,84,2)] font-semibold' : 'text-[rgb(31,28,26)] font-semibold'}>
            {remaining} dias
          </strong>{' '}
          para o término da vigência.
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Timeline sidebar (mais recente em cima = reverse cronológica)
   ═══════════════════════════════════════════════════════════ */
function SidebarTimeline({ contract }: { contract: ContractRow }) {
  const items: { date: string; text: string; status: 'current' | 'ok' | 'past'; nodeColor: string }[] = []

  // Cores por tipo de evento
  const COLORS = {
    contrato: '#1f1c1a',
    prazo: '#396496',
    valor: '#1c7943',
    escopo: '#6b4c9a',
    distrato: '#c93030',
    outro: '#d97706',
    pendente: '#999187',
  }

  // Mais antigo primeiro na array = mais recente aparece em cima na tela
  items.push({
    date: fmtDateShort(contract.createdAt),
    text: 'Contrato criado.',
    status: 'past',
    nodeColor: COLORS.contrato,
  })
  if (contract.dataAssinatura || contract.signedContractUrl) {
    items.push({
      date: fmtDateShort(contract.dataAssinatura || contract.createdAt),
      text: 'Contrato assinado.',
      status: 'past',
      nodeColor: COLORS.contrato,
    })
  }

  const children = [...(contract.children || [])].sort(
    (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  children.forEach((child: any, idx) => {
    const isHomologado = child.aditivoStatus === 'Homologado'
    const tipoLabel =
      child.aditivoType === 'prazo'
        ? 'prazo'
        : child.aditivoType === 'valor'
          ? 'valor'
          : child.aditivoType === 'escopo'
            ? 'escopo'
            : child.aditivoType === 'distrato'
              ? 'distrato'
              : 'alteração'
    const tipoKey =
      child.aditivoType === 'prazo'
        ? 'prazo'
        : child.aditivoType === 'valor'
          ? 'valor'
          : child.aditivoType === 'escopo'
            ? 'escopo'
            : child.aditivoType === 'distrato'
              ? 'distrato'
              : 'outro'
    const isLast = idx === children.length - 1
    items.push({
      date: fmtDateShort(child.createdAt),
      text: isHomologado
        ? `Aditivo de ${tipoLabel} homologado.`
        : `Aditivo de ${tipoLabel} incluído. Aguarda homologação.`,
      status: isLast ? 'current' : 'ok',
      nodeColor: isHomologado ? COLORS[tipoKey as keyof typeof COLORS] : COLORS.pendente,
    })
  })

  // Reverse para mostrar mais recente em cima
  const reversed = [...items].reverse()

  return (
    <div className="flex flex-col">
      {reversed.map((item, idx) => (
        <div
          key={idx}
          className={`relative pl-[18px] py-2 text-[11px] border-l-[1.5px] border-[rgb(229,222,212)] ml-[5px] ${idx === 0 ? 'pt-1' : ''} ${idx === reversed.length - 1 ? 'pb-1' : ''}`}
        >
          <span
            className="absolute top-[11px] left-0 w-2.5 h-2.5 rounded-full border-[1.5px] shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
            style={{
              transform: 'translate(-50%, -50%)',
              backgroundColor: item.nodeColor,
              borderColor: item.nodeColor,
            }}
          />
          <div
            className={`font-mono text-[10px] font-semibold mb-[2px] ${item.status === 'current' ? 'text-[rgb(31,28,26)]' : 'text-[rgb(153,145,135)]'}`}
          >
            {item.date}
          </div>
          <div
            className={`leading-[1.45] ${item.status === 'current' ? 'text-[rgb(31,28,26)] font-medium' : 'text-[rgb(51,46,41)]'}`}
          >
            {item.text}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Modal — Confirmar Exclusão
   ═══════════════════════════════════════════════════════════ */
function DeleteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(31,28,26,0.42)] backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.20)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-[22px] py-[18px] pb-[14px] border-b border-[rgb(229,222,212)] shrink-0">
          <h3
            className="text-[17px] font-bold text-[rgb(31,28,26)]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Excluir documento
          </h3>
          <button
            onClick={onClose}
            className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-[rgb(153,145,135)] hover:bg-[rgb(242,237,229)] hover:text-[rgb(51,46,41)] transition-colors text-[14px]"
          >
            ✕
          </button>
        </div>
        <div className="px-[22px] py-[18px] pb-[22px] space-y-4">
          <p className="text-[12.5px] text-[rgb(51,46,41)] leading-[1.5]">
            Esta ação remove o documento e registra um evento de exclusão na auditoria do contrato.
          </p>
          <div>
            <div className="text-[9.5px] font-bold text-[rgb(153,145,135)] uppercase tracking-[0.04em] mb-1.5">
              Motivo da exclusão
            </div>
            <textarea
              rows={4}
              placeholder="Descreva o motivo. Esse texto fica registrado permanentemente no histórico do contrato."
              className="w-full px-3 py-2 rounded-[6px] border border-[rgb(229,222,212)] bg-white text-[12.5px] text-[rgb(51,46,41)] placeholder:text-[rgb(153,145,135)] outline-none focus:border-[rgb(41,140,171)] resize-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-[22px] py-3 bg-[rgb(250,247,242)] border-t border-[rgb(229,222,212)] shrink-0">
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-3.5 py-[7px] rounded-[6px] text-[11.5px] font-medium text-[rgb(115,107,97)] hover:bg-[rgb(242,237,229)] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => alert('Excluir — mock')}
            className="px-4 py-2 rounded-[6px] text-[11.5px] font-semibold text-[rgb(168,47,36)] border border-[rgb(229,222,212)] hover:bg-[rgba(229,77,64,0.06)] hover:border-[rgba(229,77,64,0.35)] transition-all flex items-center gap-1.5"
          >
            <Trash2 size={13} /> Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Modal — Editar Contato (email, telefone, observações)
   ═══════════════════════════════════════════════════════════ */
function EditContactModal({ contract, onClose }: { contract: ContractRow; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: contract.email || '',
      telephone: contract.telephone || '',
      observations: contract.observations || '',
    },
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await updateContract({ data: { id: contract.id, ...data } })
      onClose()
      window.location.reload()
    } catch (err: any) {
      setSubmitError(err?.message || 'Erro ao atualizar')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(31,28,26,0.42)] backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[480px] bg-white rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.20)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-[22px] py-[18px] pb-[14px] border-b border-[rgb(229,222,212)] shrink-0">
          <h3
            className="text-[17px] font-bold text-[rgb(31,28,26)]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Editar Documento
          </h3>
          <button
            onClick={onClose}
            className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-[rgb(153,145,135)] hover:bg-[rgb(242,237,229)] hover:text-[rgb(51,46,41)] transition-colors text-[14px]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-[22px] py-[18px] pb-[22px] space-y-5">
          <div>
            <label className="block text-[9.5px] font-semibold tracking-[0.04em] text-[rgb(153,145,135)] uppercase mb-1.5">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 rounded-[6px] border border-[rgb(229,222,212)] bg-white text-[12.5px] text-[rgb(31,28,26)] outline-none focus:border-[rgb(41,140,171)] transition-colors"
              placeholder="contato@empresa.com.br"
            />
            {errors.email && (
              <span className="text-[11px] text-[rgb(168,47,36)] mt-1">
                {errors.email.message as string}
              </span>
            )}
          </div>

          <div>
            <label className="block text-[9.5px] font-semibold tracking-[0.04em] text-[rgb(153,145,135)] uppercase mb-1.5">
              Telefone
            </label>
            <input
              {...register('telephone')}
              className="w-full px-3 py-2 rounded-[6px] border border-[rgb(229,222,212)] bg-white text-[12.5px] text-[rgb(31,28,26)] outline-none focus:border-[rgb(41,140,171)] transition-colors"
              placeholder="(11) 91234-5678"
            />
          </div>

          <div>
            <label className="block text-[9.5px] font-semibold tracking-[0.04em] text-[rgb(153,145,135)] uppercase mb-1.5">
              Observações
            </label>
            <textarea
              {...register('observations')}
              rows={4}
              className="w-full px-3 py-2 rounded-[6px] border border-[rgb(229,222,212)] bg-white text-[12.5px] text-[rgb(31,28,26)] outline-none focus:border-[rgb(41,140,171)] resize-none transition-colors"
              placeholder="Adicione observações sobre o contrato..."
            />
          </div>

          {submitError && (
            <div className="text-[11px] text-[rgb(168,47,36)] bg-[rgba(229,77,64,0.06)] px-3 py-2 rounded-[6px]">
              {submitError}
            </div>
          )}
        </form>

        {/* Footer */}
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
            onClick={handleSubmit(onSubmit)}
            className="px-4 py-2 rounded-[6px] text-[11.5px] font-semibold bg-[rgb(41,140,171)] text-white hover:bg-[rgb(26,112,140)] transition-all hover:shadow-[0_4px_10px_rgba(41,140,171,0.25)] disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════ */
export function ContractDetail({ contract }: Props) {
  const navigate = useNavigate()
  const [modalMode, setModalMode] = useState<'novo' | 'selado' | 'editar' | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [selectedDocNumber, setSelectedDocNumber] = useState<string>('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[ContractDetail] pdfPreviewUrl mudou:', pdfPreviewUrl ? pdfPreviewUrl.slice(0, 60) + '...' : null)
  }, [pdfPreviewUrl])

  const derived = deriveStatus(contract, !!contract.children?.length)
  const statusKey = derived.key
  const statusLabel = derived.label
  const numberMasked = formatContractNumber(contract.contractCode || '')

  const statusBadgeStyle = (
    key: string,
  ): { text: string; bg: string; dot: string; shadow: string } => {
    const map: Record<string, { text: string; bg: string; dot: string; shadow: string }> = {
      'em-andamento': {
        text: 'text-[#176642]',
        bg: 'bg-[rgba(31,125,85,0.10)]',
        dot: 'bg-[#1f7d55]',
        shadow: 'shadow-[0_0_0_2px_rgba(31,125,85,0.10)]',
      },
      pendente: {
        text: 'text-[#9a5402]',
        bg: 'bg-[rgba(217,119,6,0.08)]',
        dot: 'bg-[#d97706]',
        shadow: 'shadow-[0_0_0_2px_rgba(217,119,6,0.08)]',
      },
      finalizado: {
        text: 'text-[#332e29]',
        bg: 'bg-[rgb(242,237,229)]',
        dot: 'bg-[#4d4740]',
        shadow: 'shadow-[0_0_0_2px_rgb(242,237,229)]',
      },
      distrato: {
        text: 'text-[rgb(168,47,36)]',
        bg: 'bg-[rgba(229,77,64,0.08)]',
        dot: 'bg-[rgb(229,77,64)]',
        shadow: 'shadow-[0_0_0_2px_rgba(229,77,64,0.08)]',
      },
    }
    return map[key] || map['em-andamento']
  }

  const s = statusBadgeStyle(statusKey)

  const contratado = contract.supplier || contract.financier || contract.collaborator
  const contratadoName = contratado?.name || '—'
  const contratadoDoc = contratado?.cnpj || contratado?.cpf || '—'
  const contratadoRole = contract.supplier?.name
    ? 'PJ · Fornecedor'
    : contract.financier?.name
      ? 'PJ · Financiador'
      : contract.collaborator?.name
        ? 'PF · Colaborador'
        : '—'

  const children = (contract.children || []) as any[]

  // Valor Atual (original + homologados)
  const valorOriginal = contract.totalValue || 0
  const valorAditivosHomologados = children
    .filter((c: any) => c.aditivoStatus === 'Homologado')
    .reduce((sum: number, c: any) => sum + (c.totalValue || 0), 0)
  const valorAtual = valorOriginal + valorAditivosHomologados

  const bancaryInfo = contratado?.bancaryInfo || contract.bancaryInfo || {}
  const pixInfo = contratado?.pixInfo || contract.pixInfo || {}

  // Documentos: aditivos do mais recente para o mais antigo, contrato base no fundo
  const baseDoc: any = {
    id: 'base',
    tipo: 'base',
    contractCode: contract.contractCode,
    createdAt: contract.createdAt,
    contractPeriod: contract.contractPeriod,
    totalValue: contract.totalValue,
    signedContractUrl: contract.signedContractUrl,
    aditivoStatus:
      statusKey === 'vigente' || statusKey === 'em-andamento' ? 'Vigente' : statusLabel,
  }
  const sortedChildrenDesc = [...children].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  // Remove duplicatas por id (segurança contra dados inconsistentes do backend)
  const seen = new Set<string | number>()
  const uniqueChildren = sortedChildrenDesc.filter((child) => {
    const key = child.id ?? child.contractCode ?? JSON.stringify(child)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  // Pre-calcular índice de numeração dos aditivos (mais recente = maior número)
  const totalAditivos = uniqueChildren.length
  const childrenWithIndex = uniqueChildren.map((child, idx) => ({
    ...child,
    _aditiveIndex: totalAditivos - idx,
  }))
  const docs = [...childrenWithIndex, baseDoc]

  return (
    <div className="h-full flex flex-col">
      {/* ═════════ TOPBAR ═════════ */}
      <div className="shrink-0 z-[100] bg-[rgba(255,255,255,0.85)] backdrop-blur-[14px] border-b border-[rgb(229,222,212)] h-[44px]">
        <div className="h-full flex items-center gap-3 px-6">
          <button
            onClick={() => navigate({ to: '/contratos' })}
            className="flex items-center justify-center w-7 h-7 rounded-[6px] text-[rgb(26,112,140)] text-[17px] hover:bg-[rgb(232,245,250)] transition-colors"
          >
            ←
          </button>
          <h1
            className="text-[14px] font-bold text-[rgb(31,28,26)] tracking-[-0.005em] flex items-baseline gap-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Contrato{' '}
            <span className="font-mono text-[12px] font-medium text-[rgb(77,71,64)] tracking-normal">
              {numberMasked}
            </span>
          </h1>
          <span
            className={`inline-flex items-center gap-[6px] px-[10px] py-[3px] rounded-full text-[10px] font-semibold tracking-[0.02em] ${s.text} ${s.bg}`}
          >
            <span className={`w-[5px] h-[5px] rounded-full ${s.dot} ${s.shadow}`} />
            {statusLabel}
          </span>
        </div>
      </div>

      {/* ═════════ BODY ═════════ */}
      <div
        className="flex-1 min-h-0 grid grid-cols-[1fr_360px] overflow-hidden bg-white"
        style={{ fontFamily: 'Nunito, sans-serif' }}
      >
        {/* ─── FORM COLUMN ─── */}
        <main className="min-w-0 px-8 py-[22px] pb-8 overflow-y-auto">
          {/* HERO Contratado */}
          <div className="flex items-end gap-6 pb-[18px] mb-[18px] border-b border-[rgb(229,222,212)]">
            <div className="min-w-0 flex-1">
              <div
                className="flex items-center gap-2 text-[9.5px] font-semibold tracking-[0.10em] text-[rgb(153,145,135)] uppercase mb-[6px]"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                Contratado
                <span
                  className="text-[9px] font-semibold tracking-[0.06em] text-[rgb(115,107,97)] bg-[rgb(242,237,229)] px-[7px] py-[2px] rounded-[3px] uppercase"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {contratadoRole}
                </span>
              </div>
              <h2
                className="text-[22px] font-medium text-[rgb(31,28,26)] tracking-[-0.012em] leading-[1.1]"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {contratadoName}
                {contratado?.fantasyName && (
                  <span className="text-[18px] text-[rgb(115,107,97)] font-medium ml-1.5">
                    · {contratado.fantasyName}
                  </span>
                )}
              </h2>
              <div
                className="flex items-center gap-3 mt-[6px] text-[10.5px] text-[rgb(115,107,97)]"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                <span>CNPJ {contratadoDoc}</span>
              </div>
            </div>
          </div>

          {/* DADOS VIGENTES */}
          <section className="py-[18px] border-b border-[rgb(229,222,212)]">
            <div className="flex items-center gap-3 mb-3">
              <h3
                className="text-[13px] font-bold text-[rgb(31,28,26)] tracking-[-0.005em]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Dados Vigentes
              </h3>
            </div>
            <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-3">
              <FieldReadOnly label="Valor Atual" mono calc>
                <span className="before:content-['Σ'] before:text-[10px] before:font-semibold before:text-[rgb(26,112,140)] before:mr-2 before:opacity-70">
                  R$ {fmtBRL(valorAtual)}
                </span>
              </FieldReadOnly>
              <FieldReadOnly label="Vigência Atual" mono calc>
                <span className="before:content-['Σ'] before:text-[10px] before:font-semibold before:text-[rgb(26,112,140)] before:mr-2 before:opacity-70">
                  {fmtDate(contract.contractPeriod?.start)} →{' '}
                  {fmtDate(contract.contractPeriod?.end)}
                </span>
              </FieldReadOnly>
              <FieldReadOnly label="Status Vigente" calc>
                <span className="before:content-['Σ'] before:text-[10px] before:font-semibold before:text-[rgb(26,112,140)] before:mr-2 before:opacity-70">
                  {statusLabel}
                </span>
              </FieldReadOnly>
            </div>
          </section>

          {/* DADOS DO CONTRATO */}
          <section className="py-[18px] border-b border-[rgb(229,222,212)]">
            <div className="flex items-center gap-3 mb-3">
              <h3
                className="text-[13px] font-bold text-[rgb(31,28,26)] tracking-[-0.005em]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Dados do Contrato
              </h3>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-3">
              <FieldReadOnly label="Classificação" value={contract.classification || '—'} />
              <FieldReadOnly label="Tipo" value={contract.contractType || '—'} />
              <FieldReadOnly label="Modelo" value={contract.contractModel || '—'} />
              <FieldReadOnly label="Origem" value={contract.origin || 'Manual'} />
            </div>

            <div className="grid grid-cols-1 gap-3 mb-3">
              <FieldReadOnly label="Objeto">
                <span>{contract.object || '—'}</span>
              </FieldReadOnly>
            </div>

            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-3 mb-3">
              <FieldReadOnly label="Valor Original" mono>
                <span>R$ {fmtBRL(contract.totalValue || 0)}</span>
              </FieldReadOnly>
              <FieldReadOnly
                label="Início Original"
                mono
                value={fmtDate(contract.contractPeriod?.start)}
              />
              <FieldReadOnly
                label="Fim Original"
                mono
                value={fmtDate(contract.originalContractPeriod?.end || contract.contractPeriod?.end)}
              />
              <FieldReadOnly
                label="Status Base"
                value={
                  statusKey === 'vigente' || statusKey === 'em-andamento' ? 'Vigente' : statusLabel
                }
              />
            </div>

            <div className="grid grid-cols-4 gap-3 mb-3">
              <FieldReadOnly label="Categoria" value={contract.categorizacao || '—'} />
              <FieldReadOnly label="Centro de Custo" value={contract.centroDeCusto || '—'} />
              <FieldReadOnly label="Programa" value={contract.program?.name || '—'} />
              <FieldReadOnly
                label="Plano Orçamentário"
                value={contract.budgetPlan?.scenarioName || '—'}
              />
            </div>
          </section>

          {/* DOCUMENTOS */}
          <section className="py-[18px] border-b border-[rgb(229,222,212)]">
            <div className="flex items-center gap-3 mb-3">
              <h3
                className="text-[13px] font-bold text-[rgb(31,28,26)] tracking-[-0.005em]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Documentos
              </h3>
              <button
                onClick={() => {
                  setSelectedDoc(null)
                  setModalMode('novo')
                }}
                className="ml-auto text-[11px] font-medium text-[rgb(41,140,171)] px-[10px] py-[5px] rounded-[5px] border border-[rgb(229,222,212)] bg-white hover:border-[rgb(140,199,222)] hover:bg-[rgb(232,245,250)] transition-all inline-flex items-center gap-[5px]"
              >
                + Novo Aditivo
              </button>
            </div>

            <div className="flex flex-col border border-[rgb(229,222,212)] rounded-[8px] overflow-hidden bg-white">
              {/* Header */}
              <div className="grid grid-cols-[110px_70px_90px_1fr_130px_100px_64px] items-center gap-3 px-[14px] py-[7px] bg-[rgb(250,247,242)] text-[9px] font-bold text-[rgb(153,145,135)] tracking-[0.06em] uppercase">
                <span>Nº</span>
                <span>Tipo</span>
                <span>Assinatura</span>
                <span>Resumo</span>
                <span className="text-right">Impacto</span>
                <span>Status</span>
                <span className="text-right">Doc</span>
              </div>
              {/* Rows */}
              {docs.map((doc: any, i: number) => {
                const isBase = doc.tipo === 'base'
                const aditiveIndex = isBase ? 0 : doc._aditiveIndex || i
                const hasSigned = isBase ? !!contract.signedContractUrl : !!doc.signedContractUrl
                const docStatus = isBase
                  ? statusKey === 'vigente' || statusKey === 'em-andamento'
                    ? 'Vigente'
                    : statusLabel
                  : doc.aditivoStatus || 'Pendente'
                const docUrl = isBase ? contract.signedContractUrl : doc.signedContractUrl
                return (
                  <div
                    key={doc.id || i}
                    onClick={() => {
                      setSelectedDoc(doc)
                      setSelectedDocNumber(
                        isBase
                          ? numberMasked
                          : formatAditiveNumber(contract.contractCode || '', aditiveIndex),
                      )
                      const isPending = isBase
                        ? !contract.signedContractUrl
                        : (doc.aditivoStatus || 'Pendente') === 'Pendente'
                      setModalMode(isPending ? 'editar' : 'selado')
                    }}
                    className={`grid grid-cols-[110px_70px_90px_1fr_130px_100px_64px] items-center gap-3 px-[14px] py-[10px] text-[11.5px] border-b border-[rgb(242,237,229)] last:border-b-0 transition-colors hover:bg-[rgb(250,247,242)] cursor-pointer ${isBase ? 'bg-[rgba(250,247,242,0.55)]' : ''}`}
                  >
                    <span
                      className="font-mono text-[10.5px] font-medium text-[rgb(51,46,41)]"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {isBase
                        ? numberMasked
                        : formatAditiveNumber(contract.contractCode || '', aditiveIndex)}
                    </span>
                    <span>
                      <TipoBadge tipo={isBase ? 'base' : doc.aditivoType || 'outro'} />
                    </span>
                    <span
                      className="font-mono text-[11px] text-[rgb(77,71,64)]"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {fmtDateShort(doc.dataAssinatura || doc.createdAt)}
                    </span>
                    <span className="text-[rgb(51,46,41)] whitespace-nowrap overflow-hidden text-ellipsis">
                      {isBase
                        ? contract.object || 'Contrato original'
                        : doc.object || doc.resumo || '—'}
                    </span>
                    <Impacto child={doc} />
                    <span>
                      <DocStatusBadge status={docStatus} />
                    </span>
                    <span className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className={`w-6 h-6 rounded-[5px] inline-flex items-center justify-center transition-colors ${
                          docUrl
                            ? 'text-[rgb(115,107,97)] hover:bg-[rgb(232,245,250)] hover:text-[rgb(26,112,140)]'
                            : 'text-[rgb(199,191,178)] cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // eslint-disable-next-line no-console
                          console.log('[ContractDetail] Eye clicked — docUrl:', docUrl ? docUrl.slice(0, 60) + '...' : null)
                          if (docUrl) setPdfPreviewUrl(docUrl)
                        }}
                        title={docUrl ? 'Preview do documento' : 'Documento não anexado'}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="w-6 h-6 rounded-[5px] inline-flex items-center justify-center text-[rgb(115,107,97)] hover:bg-[rgb(232,245,250)] hover:text-[rgb(26,112,140)] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          alert('Download PDF — mock')
                        }}
                        title="Baixar documento"
                      >
                        <Download size={13} />
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* DADOS BANCÁRIOS */}
          <section className="py-[18px] border-b border-[rgb(229,222,212)]">
            <div className="flex items-center gap-3 mb-1">
              <h3
                className="text-[13px] font-bold text-[rgb(31,28,26)] tracking-[-0.005em]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Dados Bancários
              </h3>
            </div>
            <p className="text-[10.5px] text-[rgb(153,145,135)] mb-3 leading-relaxed">
              Sincronização automática · Última atualização realizada no setor de Cadastro
              (onde a alteração é permitida) em:{' '}
              {fmtDateShort(contract.updatedAt || contract.createdAt)}
            </p>

            <div className="grid grid-cols-[1.4fr_0.7fr_1fr_0.4fr] gap-3 mb-3">
              <FieldReadOnly label="Banco" value={bancaryInfo.bank || '—'} />
              <FieldReadOnly
                label="Agência · DV"
                mono
                value={`${bancaryInfo.agency || ''}${bancaryInfo.dv ? '-' + bancaryInfo.dv : ''}`}
              />
              <FieldReadOnly label="Conta" mono value={bancaryInfo.accountNumber || '—'} />
              <FieldReadOnly label="DV" mono value={bancaryInfo.dv || '—'} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldReadOnly label="Tipo de chave PIX" value={pixInfo?.key_type || '—'} />
              <FieldReadOnly label="Chave PIX" mono value={pixInfo?.key || '—'} />
            </div>
          </section>

          {/* CONTATOS */}
          <section className="py-[18px]">
            <div className="flex items-center gap-3 mb-3">
              <h3
                className="text-[13px] font-bold text-[rgb(31,28,26)] tracking-[-0.005em]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Contatos
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <FieldReadOnly label="Email" mono value={contract.email || '—'} />
              <FieldReadOnly label="Telefone" mono value={contract.telephone || '—'} />
            </div>

            <FieldReadOnly label="Observações">
              <span>{contract.observations || '—'}</span>
            </FieldReadOnly>
          </section>
        </main>

        {/* ─── SIDEBAR ─── */}
        <aside
          className="min-w-0 px-[22px] py-6 overflow-y-auto bg-white flex flex-col gap-6"
          style={{ borderLeft: '0.5px solid rgb(229,222,212)' }}
        >
          {/* Valor Atual */}
          <div className="pb-[18px] border-b border-[rgb(229,222,212)]">
            <div
              className="text-[9.5px] font-semibold tracking-[0.10em] text-[rgb(153,145,135)] uppercase mb-2"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Valor Atual
            </div>
            <div
              className="flex items-baseline gap-1 text-[rgb(31,28,26)] leading-none"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span className="text-[13px] text-[rgb(115,107,97)] font-normal">R$</span>
              <span className="text-[26px] font-medium">
                {fmtBRL(valorAtual).split(',')[0]}
              </span>
              <span className="text-[15px] text-[rgb(77,71,64)]">
                ,{fmtBRL(valorAtual).split(',')[1]}
              </span>
            </div>
          </div>

          {/* Composição */}
          <div>
            <h4
              className="text-[10px] font-bold text-[rgb(153,145,135)] tracking-[0.08em] uppercase mb-[10px] flex items-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Composição
            </h4>
            <Composicao contract={contract} />
          </div>

          {/* Vigência */}
          <div>
            <h4
              className="text-[10px] font-bold text-[rgb(153,145,135)] tracking-[0.08em] uppercase mb-[10px] flex items-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Vigência Atual
            </h4>
            <VigenciaBar contract={contract} />
          </div>

          {/* Timeline */}
          <div>
            <h4
              className="text-[10px] font-bold text-[rgb(153,145,135)] tracking-[0.08em] uppercase mb-[10px] flex items-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Timeline
            </h4>
            <SidebarTimeline contract={contract} />
          </div>
        </aside>
      </div>

      {/* ═════════ BOTTOMBAR ═════════ */}
      <div className="shrink-0 z-[100] flex items-center gap-[14px] px-6 min-h-[56px] bg-[rgba(245,243,240,0.98)] backdrop-blur-[12px] border-t border-[#e5ded4] shadow-[0_-2px_12px_rgba(31,28,26,0.06)]">
        <div className="flex items-center gap-[10px] text-[11px] text-[#736b61]">
          <span
            className={`w-[6px] h-[6px] rounded-full ${s.dot}`}
            style={{ animation: 'subtle-pulse 2.4s ease-in-out infinite' }}
          />
          <span>Sincronizado</span>
          <span
            className={`${s.text} ${s.bg} px-[10px] py-[3px] rounded-[10px] text-[10px] font-semibold tracking-[0.02em]`}
          >
            {statusLabel}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-[12px] font-semibold bg-white text-[#736b61] border border-[#e5ded4] hover:bg-[#faf7f2] hover:border-[#c7bfb2] transition-colors"
          >
            <Edit size={13} /> Editar documento
          </button>
          <button
            onClick={() => alert('Novo contrato — mock')}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-[12px] font-semibold bg-[#396496] text-white hover:bg-[#2d4f75] transition-all hover:shadow-[0_4px_10px_rgba(57,100,150,0.25)]"
          >
            <FilePlus size={13} /> Novo contrato
          </button>
        </div>
      </div>

      {/* ═════════ MODALS ═════════ */}
      {modalMode && (
        <AditiveModal
          mode={modalMode}
          docData={selectedDoc || undefined}
          docNumber={selectedDocNumber}
          contractId={contract.id}
          onClose={() => {
            setModalMode(null)
            setSelectedDoc(null)
            setSelectedDocNumber('')
          }}
          onDelete={() => {
            setModalMode(null)
            setShowDeleteModal(true)
          }}
        />
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(31,28,26,0.70)] backdrop-blur-[6px] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPdfPreviewUrl(null)
          }}
        >
          <div className="relative w-full max-w-[600px] h-[80vh] bg-[rgb(250,247,242)] rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col border border-[rgb(229,222,212)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-[48px] bg-[rgb(57,100,150)] shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-white/70" />
                <span className="text-[13px] font-semibold text-white">Visualização do Documento</span>
              </div>
              <button
                type="button"
                onClick={() => setPdfPreviewUrl(null)}
                className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 p-3 bg-[rgb(242,237,229)]">
              {pdfPreviewUrl.startsWith('blob:') || pdfPreviewUrl.startsWith('data:') || pdfPreviewUrl.startsWith('http://') || pdfPreviewUrl.startsWith('https://') ? (
                <embed
                  src={pdfPreviewUrl}
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
                      {pdfPreviewUrl}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <DeleteModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} />

      {showEditModal && (
        <EditContactModal contract={contract} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Reusable field (read-only display)
   ═══════════════════════════════════════════════════════════ */
function FieldReadOnly({
  label,
  value,
  mono,
  calc,
  children,
}: {
  label: string
  value?: string
  mono?: boolean
  calc?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-[5px] min-w-0">
      <label className="text-[9.5px] font-semibold tracking-[0.04em] text-[rgb(153,145,135)] uppercase">
        {label}
      </label>
      <div
        className={`relative flex items-center border rounded-[6px] px-[11px] py-2 text-[12.5px] text-[rgb(31,28,26)] min-h-[34px] min-w-0 ${
          calc
            ? 'bg-[rgb(232,245,250)] border-[rgba(140,199,222,0.6)] cursor-default'
            : 'bg-white border-[rgb(229,222,212)]'
        } ${mono ? 'font-mono text-[12px] tracking-[0.01em]' : ''}`}
        style={mono ? { fontFamily: 'JetBrains Mono, monospace' } : undefined}
      >
        {children || <span className="truncate">{value}</span>}
      </div>
    </div>
  )
}
