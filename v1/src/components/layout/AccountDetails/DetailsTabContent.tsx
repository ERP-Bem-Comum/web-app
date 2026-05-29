import * as Tabs from '@radix-ui/react-tabs'
import { cn } from 'lib/utils'
import { MutableRefObject, ReactNode } from 'react'

interface DetailsTabContentProps {
  children: ReactNode
  value: string
  className?: string
  ref?: MutableRefObject<HTMLDivElement | null>
}
const DetailsTabContent = ({ children, value, className, ref }: DetailsTabContentProps) => {
  return (
    <Tabs.Content
      className={cn('px-2 py-10 rounded-b-lg bg-card text-card-foreground', className)}
      value={value}
      ref={ref}
    >
      {children}
    </Tabs.Content>
  )
}

export { DetailsTabContent }
