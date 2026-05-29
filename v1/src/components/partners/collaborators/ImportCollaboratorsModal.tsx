import { Modal, Box, CircularProgress } from '@mui/material'
import { Button } from '@/components/ui/button'
import { MdCheckCircleOutline, MdOutlineInfo } from 'react-icons/md'
import { AiOutlineCloudDownload } from 'react-icons/ai'

export type ImportStatus =
  | 'idle'
  | 'inProgress'
  | 'success'
  | 'partial'
  | 'fail'
  | 'fileError'
  | 'fileTooLarge'

export type ImportPhase = 'validating' | 'processing' | null

export type ImportSummary = {
  total?: number
  success?: number
  failed?: number
  message?: string | null
  limitMb?: number | null
  errorFileName?: string
}

type Props = {
  open: boolean
  status: ImportStatus
  phase?: ImportPhase
  summary?: ImportSummary | null
  message?: string | null
  errors?: Array<{ line: number; message: string; rowData?: Record<string, any> }>
  onClose: () => void
  onDownloadErrors?: () => void
  isDownloadingErrors?: boolean
}

const statusLabels: Record<Exclude<ImportStatus, 'idle'>, string> = {
  inProgress: 'IMPORTAÇÃO EM ANDAMENTO',
  success: 'IMPORTAÇÃO FINALIZADA COM SUCESSO',
  partial: 'IMPORTAÇÃO PARCIALMENTE REALIZADA. VERIFIQUE OS DADOS INCONSISTENTES',
  fail: 'ERRO AO IMPORTAR DADOS. VERIFIQUE O SEU ARQUIVO',
  fileError: 'FALHA NO ARQUIVO',
  fileTooLarge: 'ARQUIVO ULTRAPASSA LIMITE PARA IMPORTAÇÃO',
}

const iconByStatus: Partial<Record<ImportStatus, JSX.Element>> = {
  success: <MdCheckCircleOutline className="text-erp-success" size={32} />,
  partial: <MdOutlineInfo className="text-erp-info" size={32} />,
  fail: <MdOutlineInfo className="text-erp-danger" size={32} />,
  fileError: <MdOutlineInfo className="text-erp-danger" size={32} />,
  fileTooLarge: <MdOutlineInfo className="text-erp-danger" size={32} />,
}

export function ImportCollaboratorsModal({
  open,
  status,
  summary,
  message,
  errors = [],
  onClose,
  onDownloadErrors,
  isDownloadingErrors = false,
}: Props) {
  const isBlocking = status === 'inProgress'
  const isFinalStatus =
    status === 'success' ||
    status === 'partial' ||
    status === 'fail' ||
    status === 'fileError' ||
    status === 'fileTooLarge'

  if (!open) return null

  const canClose = isFinalStatus && !isBlocking
  const label = status === 'idle' ? 'IMPORTAÇÃO EM ANDAMENTO' : statusLabels[status] || ''
  const showDownloadErrors = !!onDownloadErrors && (status === 'partial' || status === 'fail')
  const primaryActionLabel = status === 'success' ? 'Concluir' : 'Fechar'

  const renderStatusIcon = () => {
    if (status === 'inProgress') {
      return <CircularProgress size={32} className="text-erp-primary" />
    }

    return iconByStatus[status] || null
  }

  const handleClose = () => {
    if (canClose) onClose()
  }

  return (
    <Modal
      open={open}
      onClose={(_, reason) => {
        if (!canClose || reason === 'backdropClick') return
        onClose()
      }}
      disableEscapeKeyDown={!canClose}
      aria-labelledby="collaborators-import-modal"
      BackdropProps={{
        className: 'bg-black/40 backdrop-blur-[1px]',
      }}
    >
      <Box
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-lg shadow-lg px-6 py-6 flex flex-col gap-4"
        id="collaborators-import-modal"
      >
        <div className="flex flex-col items-center text-center gap-3">
          {renderStatusIcon()}
          <h2 className="text-lg font-semibold text-slate-700 text-center leading-tight">
            {label}
          </h2>
          {message && <p className="text-sm text-slate-700">{message}</p>}
          {summary?.limitMb && status === 'fileTooLarge' && (
            <p className="text-xs text-slate-500">
              Limite permitido: até {summary.limitMb} MB por arquivo.
            </p>
          )}
        </div>


        {errors.length > 0 && (status === 'partial' || status === 'fail') && (
          <div className="border border-slate-200 rounded-md p-3 max-h-64 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              Detalhes dos Erros ({errors.length})
            </p>
            <div className="space-y-2">
              {errors.slice(0, 10).map((error, idx) => (
                <details key={idx} className="text-xs border-l-2 border-erp-error pl-2 py-1">
                  <summary className="text-slate-600 cursor-pointer hover:text-slate-800">
                    <span className="font-semibold">Linha {error.line}:</span> {error.message}
                  </summary>
                  {error.rowData && (
                    <div className="mt-2 ml-2 p-2 bg-slate-50 rounded text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {Object.entries(error.rowData)
                          .map(([key, value]) => `${key}: ${value ?? '(vazio)'}`)
                          .join('\n')}
                      </pre>
                    </div>
                  )}
                </details>
              ))}
              {errors.length > 10 && (
                <p className="text-xs text-slate-500 italic">
                  ... e mais {errors.length - 10} erro(s). Baixe o arquivo completo para ver todos.
                </p>
              )}
            </div>
          </div>
        )}

        {isBlocking && (
          <p className="text-xs text-center text-slate-500">
            A importação está em andamento. Aguarde sem fechar ou navegar até a conclusão.
          </p>
        )}

        {!isBlocking && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {(showDownloadErrors || errors.length > 0) && (
              <Button
                type="button"
                variant="erpSecondary"
                onClick={onDownloadErrors}
                disabled={isDownloadingErrors || (!onDownloadErrors && errors.length === 0)}
                className="gap-2"
              >
                <AiOutlineCloudDownload size={18} />
                {isDownloadingErrors
                  ? 'Preparando erros...'
                  : errors.length > 0
                    ? `Baixar ${errors.length} linha(s) com erro`
                    : 'Baixar linhas com erro'}
              </Button>
            )}
            <Button type="button" variant="erpPrimary" onClick={handleClose}>
              {primaryActionLabel}
            </Button>
          </div>
        )}
      </Box>
    </Modal>
  )
}

