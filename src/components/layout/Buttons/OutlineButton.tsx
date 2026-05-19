import { Button, ButtonProps } from '@/components/ui/button'

interface OutlineButtonProps extends ButtonProps {
  disabled: boolean
  onClick: () => void
  label: string
}

export const OutlineButton = ({ disabled, onClick, label, ...rest }: OutlineButtonProps) => {
  return (
    <Button
      {...rest}
      data-test="cancel"
      variant="outline"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      type="button"
      disabled={disabled}
      className="min-w-[80px]"
    >
      {label}
    </Button>
  )
}
