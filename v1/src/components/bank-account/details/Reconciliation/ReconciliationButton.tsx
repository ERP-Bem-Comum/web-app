import { cn } from 'lib/utils'
import { Loader2 } from 'lucide-react'
import { Button } from '../../../ui/button'

interface ReconciliationButtonsProps {
  reconciled: boolean
  isReconciliating: boolean
  isUnlinking: boolean
  isDisabled: boolean
  onUnlink: () => void
  onReconciliate: () => void
}

const ReconciliationButtons = ({
  reconciled,
  isReconciliating,
  isUnlinking,
  isDisabled,
  onUnlink,
  onReconciliate,
}: ReconciliationButtonsProps) => {
  return (
    <div
      className={cn(
        'flex flex-col justify-center px-10 gap-2 h-full',
        'border rounded-lg',
        reconciled ? 'border-erp-positive' : 'border-transparent',
      )}
    >
      {!reconciled && (
        <Button
          variant={'erpPositive'}
          className="min-w-[115px] flex justify-center items-center"
          onClick={onReconciliate}
          disabled={isDisabled}
        >
          {isReconciliating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Conciliar'}
        </Button>
      )}
      <Button
        variant={'ghost'}
        className="min-w-[115px] flex justify-center items-center"
        onClick={onUnlink}
        disabled={isDisabled}
      >
        {isUnlinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Desvincular'}
      </Button>
    </div>
  )
}

export { ReconciliationButtons }
