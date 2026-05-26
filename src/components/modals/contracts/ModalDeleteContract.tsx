import { Modal } from '@mui/material'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  contractCode?: string
}

export function ModalDeleteContract({ open, onClose, onConfirm, contractCode }: Props) {
  return (
    <Modal
      open={open}
      slotProps={{
        backdrop: {
          onClick: (e) => {
            e.stopPropagation()
            onClose()
          },
          style: { backgroundColor: 'rgba(31, 28, 26, 0.45)', backdropFilter: 'blur(4px)' },
        },
      }}
      aria-labelledby="modal-delete-title"
      aria-describedby="modal-delete-description"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] rounded-lg border border-[#e5ded4] bg-white shadow-[0_16px_48px_rgba(31,28,26,0.18)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede8]">
          <h2 id="modal-delete-title" className="text-[13px] font-bold text-[#332e29] tracking-wide">
            EXCLUIR CONTRATO
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#999187] hover:text-[#332e29] hover:bg-[#faf7f2] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#fff7e0] flex items-center justify-center mb-4">
            <AlertTriangle size={22} color="#d97706" />
          </div>
          <p id="modal-delete-description" className="text-[12.5px] text-[#332e29] leading-relaxed max-w-[280px]">
            Você está prestes a excluir o contrato{' '}
            <span className="font-semibold font-mono">{contractCode || ''}</span>.
            Esta ação não pode ser desfeita.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#f0ede8] bg-[#faf7f2]">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-md border border-[#e5ded4] bg-white text-[11.5px] font-semibold text-[#736b61] hover:border-[#999187] hover:bg-white transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onConfirm()
            }}
            className="flex-1 h-9 rounded-md bg-[#a83a2e] text-white text-[11.5px] font-semibold hover:bg-[#8c2e24] transition-all shadow-sm"
          >
            Sim, excluir
          </button>
        </div>
      </div>
    </Modal>
  )
}
