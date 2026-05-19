import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface SubmitButtonProps {
  disabled?: boolean
  onClick: () => void
  edit: boolean
  editLabel: string
  createLabel: string
}

export const SubmitButton = ({
  disabled = false,
  onClick,
  editLabel,
  createLabel,
  edit,
}: SubmitButtonProps) => {
  return (
    <Button
      data-test="submit"
      variant="erpPrimary"
      type="submit"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      disabled={disabled}
    >
      <div className="flex items-center min-w-[80px] justify-center">
        {disabled && <Loader2 className="h-4 w-4 animate-spin" />}
        {edit ? editLabel : createLabel}
      </div>
    </Button>
  )
}
