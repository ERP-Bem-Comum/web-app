import * as Tabs from '@radix-ui/react-tabs'
import { cn } from 'lib/utils'

interface DetailsTabProps {
  name: string
  value: string
  className?: string
  onClick?: () => void
}
const DetailsTab = ({ name, value, className, onClick }: DetailsTabProps) => {
  return (
    <Tabs.Trigger
      className={cn(
        'rounded-t-lg data-[state=active]:bg-card data-[state=inactive]:bg-erp-disabled text-card-foreground shadow-sm py-4 px-10',
        className,
      )}
      value={value}
      onClick={onClick}
    >
      {name}
    </Tabs.Trigger>
  )
}

export { DetailsTab }
