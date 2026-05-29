import type { ContractRow } from '../../domain/types'
import {
  deriveStatus,
  getMostRecentChild,
  statusBadgeClass,
  tipoBadgeClass,
  avatarBadgeClass,
  programaShort,
} from '../../domain/status'
import { formatContractNumber, downloadPaymentHistoryDocument, downloadSettlementDocument } from '../../domain/format'
import { maskCNPJ, maskCPF, maskMonetaryValue } from '@/utils/masks'
import { formatDate } from '@/utils/dates'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { MoreHorizontal, Trash2, FileText, AlertTriangle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteContract } from '@/server/contracts'
import { contractKeys } from '../../adapters/queries'

interface Props {
  row: ContractRow
  index: number
}

function getContractSubject(data: ContractRow) {
  let name = 'Desconhecido'
  let document = '-'

  if (data.supplier?.name) {
    name = data.supplier.name
    document = data.supplier.cnpj ? maskCNPJ(data.supplier.cnpj) : '-'
  } else if (data.collaborator?.name) {
    name = data.collaborator.name
    document = data.collaborator.cpf ? maskCPF(data.collaborator.cpf) : '-'
  } else if (data.financier?.name) {
    name = data.financier.name
    document = data.financier.cnpj ? maskCNPJ(data.financier.cnpj) : '-'
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return { name, document, initials }
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border border-[#e5ded4] bg-[#faf7f2] shadow-[0_8px_30px_rgba(31,28,26,0.12)] max-w-[420px] p-0 gap-0 overflow-hidden rounded-lg">
        {/* Header com ícone */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-[#ffe8e8] border border-[#ffb3b3] flex items-center justify-center mt-0.5">
            <AlertTriangle size={18} className="text-[#c93030]" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <AlertDialogTitle className="text-[15px] font-bold text-[#1f1c1a] leading-snug">
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-[#736b61] leading-relaxed m-0">
              Tem certeza que deseja excluir este contrato? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </div>
        </div>

        {/* Footer com botões */}
        <AlertDialogFooter className="flex flex-row justify-end gap-2 px-5 py-4 bg-white border-t border-[#e5ded4]">
          <AlertDialogCancel
            disabled={isLoading}
            className="h-9 px-4 text-[12.5px] font-semibold rounded-md border border-[#e5ded4] bg-white text-[#736b61] hover:bg-[#faf7f2] hover:border-[#c7bfb2] hover:text-[#4d4740] transition-colors shadow-none"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
            className="h-9 px-4 text-[12.5px] font-semibold rounded-md bg-[#c93030] text-white hover:bg-[#a82525] transition-colors shadow-none"
          >
            {isLoading ? 'Excluindo…' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ActionMenu({ row }: { row: ContractRow }) {
  const qc = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const mostRecent = getMostRecentChild(row)
  const derived = deriveStatus(mostRecent, !!row.children?.length)
  const statusKey = derived.key

  const deleteMutation = useMutation({
    mutationFn: () => deleteContract({ data: { id: row.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.lists() })
      setShowDeleteDialog(false)
    },
  })

  const handlePaymentHistory = useCallback(() => {
    downloadPaymentHistoryDocument(row)
  }, [row])

  const handleSettlement = useCallback(() => {
    downloadSettlementDocument(row)
  }, [row])

  const canDelete = statusKey === 'pendente'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-[26px] h-[26px] rounded-[5px] inline-flex items-center justify-center text-[#736b61] hover:bg-[#e8eef5] hover:text-[#2d4f75] transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          {canDelete && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteDialog(true)
              }}
              className="text-red-600 focus:text-red-700 cursor-pointer"
            >
              <Trash2 size={14} className="mr-2" />
              Excluir
            </DropdownMenuItem>
          )}
          {!canDelete && (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handlePaymentHistory()
                }}
                className="cursor-pointer"
              >
                <FileText size={14} className="mr-2" />
                Histórico de pagamentos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleSettlement()
                }}
                className="cursor-pointer"
              >
                <FileText size={14} className="mr-2" />
                Termo de Quitação
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}

export default function ContractRowComponent({ row, index }: Props) {
  const [mostRecentInfo, setMostRecentInfo] = useState<ContractRow>(row)
  const navigate = useNavigate()

  useEffect(() => {
    setMostRecentInfo(getMostRecentChild(row))
  }, [row])

  if (!mostRecentInfo) {
    return <tr className="h-[58px] border-b border-[#f0ede8]"><td colSpan={11} /></tr>
  }

  const subject = getContractSubject(mostRecentInfo)
  const aditivosCount = row.childrenCount ?? row.children?.length ?? 0

  const aditivosValorSum =
    row.children
      ?.filter(
        (child) =>
          (child as any).aditivoStatus === 'Homologado' &&
          (!(child as any).aditivoType || (child as any).aditivoType === 'valor')
      )
      .reduce((acc, child) => acc + ((child.totalValue as number) ?? 0), 0) ?? 0
  const valorAtual = ((row.totalValue as number) ?? 0) + aditivosValorSum

  const paidValue = (mostRecentInfo as any).paidValue ?? (() => {
    const status = deriveStatus(mostRecentInfo, !!row.children?.length).key
    if (status === 'pendente') return 0
    if (status === 'encerrado') return valorAtual
    if (status === 'distrato') return valorAtual * 0.5
    return valorAtual * 0.4
  })()
  const saldo = valorAtual - paidValue

  const derived = deriveStatus(mostRecentInfo, !!row.children?.length)
  const statusClass = statusBadgeClass(derived.key)
  const tipoClass = tipoBadgeClass(row.contractType as string)
  const avatarClass = avatarBadgeClass(row.contractType as string)

  const handleRowClick = () => {
    navigate({ to: '/contratos/detalhes/$id', params: { id: String(row.id) } })
  }

  return (
    <tr
      onClick={handleRowClick}
      className="h-[58px] border-b border-[#f0ede8] text-[13px] text-[#332e29] cursor-pointer transition-all duration-100 hover:bg-[#faf7f2] hover:shadow-[inset_3px_0_0_#396496]"
    >
      {/* Número — padrão brand: JetBrains Mono 11px weight 500 ink-2 */}
      <td className="px-4 whitespace-nowrap font-mono text-[11px] font-medium text-[#332e29]">
        {formatContractNumber(row.contractCode as string)}
      </td>

      {/* Contratado */}
      <td className="px-4">
        <div className="flex items-center gap-[10px] min-w-0">
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold tracking-wide flex-shrink-0 ${avatarClass}`}>
            {subject.initials}
          </span>
          <div className="flex flex-col gap-[1px] min-w-0">
            <span className="text-[13.5px] font-medium text-[#1f1c1a] whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {subject.name}
            </span>
            <span className="font-mono text-[11px] text-[#999187] whitespace-nowrap overflow-hidden text-ellipsis">
              {subject.document}
            </span>
          </div>
        </div>
      </td>

      {/* Objeto */}
      <td className="px-4">
        <div className="max-w-[360px] text-[13px] text-[#332e29] whitespace-normal overflow-hidden text-ellipsis line-clamp-2 leading-[1.35]">
          {row.object}
        </div>
      </td>

      {/* Tipo */}
      <td className="px-4 text-center">
        <span className={`inline-block text-[9px] font-bold tracking-[0.06em] px-[7px] py-[3px] rounded-[3px] uppercase text-center whitespace-nowrap ${tipoClass}`}>
          {row.contractType}
        </span>
      </td>

      {/* Programa — padrão brand: JetBrains Mono 11px weight 600 ink-2 letter-spacing 0.02em */}
      <td className="px-4 text-center font-mono text-[11px] font-semibold text-[#332e29] tracking-[0.02em]">
        {programaShort(row.program?.name)}
      </td>

      {/* Valor Atual — padrão brand: JetBrains Mono 12px weight normal ink-3 tabular-nums */}
      <td className="px-4 text-right font-mono text-[12px] tabular-nums text-[#4d4740]">
        {maskMonetaryValue(valorAtual)}
      </td>

      {/* Saldo — mesmo padrão do Valor Atual + semibold */}
      <td className="px-4 text-right font-mono text-[12px] font-semibold tabular-nums text-[#4d4740]">
        {maskMonetaryValue(saldo)}
      </td>

      {/* Período / Vigência — padrão brand: JetBrains Mono 11.5px ink-3 */}
      <td className="px-4 text-center whitespace-nowrap font-mono text-[11.5px] text-[#4d4740]">
        {row.contractPeriod?.start ? formatDate(row.contractPeriod.start) : '-'}
        {' → '}
        {row.contractPeriod?.end ? formatDate(row.contractPeriod.end) : '-'}
      </td>

      {/* Aditivos */}
      <td className="px-4 text-center">
        {aditivosCount > 0 ? (
          <span
            className="inline-flex items-center gap-[2px] bg-[rgb(232,245,250)] border-[0.5px] border-[rgb(140,199,222)] text-[rgb(26,112,140)] font-mono text-[10.5px] font-bold px-[7px] py-[2px] rounded-[4px] tracking-[-0.01em]"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            +{aditivosCount}
          </span>
        ) : (
          <span className="text-[rgb(153,145,135)] text-[12px] font-normal">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 text-center">
        <span className={`inline-block text-[10px] font-bold tracking-[0.06em] px-[7px] py-[3px] rounded-[3px] uppercase text-center whitespace-nowrap ${statusClass}`}>
          {derived.label}
        </span>
      </td>

      {/* Ações */}
      <td className="px-4 text-center" onClick={(e) => e.stopPropagation()}>
        <ActionMenu row={row} />
      </td>
    </tr>
  )
}
