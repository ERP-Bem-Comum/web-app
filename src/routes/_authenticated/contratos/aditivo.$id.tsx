import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense } from 'react'
import { useContract } from '@/features/contracts/views/hooks/use-contract'
import { AditiveModal } from '@/features/contracts/views/components/AditiveModal'

export const Route = createFileRoute('/_authenticated/contratos/aditivo/$id')({
  component: AditivePage,
})

function AditivePage() {
  const { id } = Route.useParams()
  const numericId = Number(id)

  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 w-full min-w-0 h-full items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#32C6F4] border-t-transparent rounded-full animate-spin" />
          <span className="mt-3 text-[13px] text-[#999187]">Carregando...</span>
        </div>
      }
    >
      <AditiveLoader parentId={numericId} />
    </Suspense>
  )
}

function AditiveLoader({ parentId }: { parentId: number }) {
  const navigate = useNavigate()
  const { data: contract } = useContract(parentId)

  if (!contract) {
    return (
      <div className="flex flex-col flex-1 w-full min-w-0 h-full items-center justify-center">
        <p className="text-[15px] font-medium text-[#1f1c1a]">Contrato não encontrado</p>
        <p className="text-[12px] text-[#999187] mt-1">Verifique o número e tente novamente.</p>
      </div>
    )
  }

  const handleClose = () => {
    navigate({ to: '/contratos/detalhes/$id', params: { id: String(parentId) } })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header mínimo para contexto */}
      <div className="shrink-0 z-[100] bg-[rgba(255,255,255,0.85)] backdrop-blur-[14px] border-b border-[rgb(229,222,212)] h-[44px]">
        <div className="h-full flex items-center gap-3 px-6">
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-7 h-7 rounded-[6px] text-[rgb(26,112,140)] text-[17px] hover:bg-[rgb(232,245,250)] transition-colors"
          >
            ←
          </button>
          <h1 className="text-[14px] font-bold text-[rgb(31,28,26)] tracking-[-0.005em]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Novo Aditivo
          </h1>
          <span className="font-mono text-[12px] font-medium text-[rgb(77,71,64)] tracking-normal">
            {contract.contractCode}
          </span>
        </div>
      </div>

      {/* Modal centralizado */}
      <div className="flex-1 relative">
        <AditiveModal
          mode="novo"
          contractId={parentId}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
