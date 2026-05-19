import { Button } from '@/components/ui/button'
import { cn } from 'lib/utils'

interface GhostButtonProps {
  disabled: boolean
  onClick: () => void
  label: string
  className?: string
}

export const GhostButton = ({ disabled, onClick, label, className }: GhostButtonProps) => {
  return (
    <Button
      data-test="cancel"
      variant="ghost"
      className={cn('mr-4', className)}
      onClick={onClick}
      type="button"
      disabled={disabled}
    >
      {label}
    </Button>
  )
}
