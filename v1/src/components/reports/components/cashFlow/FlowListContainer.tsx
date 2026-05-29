import { cn } from 'lib/utils'
import { ReactNode } from 'react'

interface FlowListContainerProps {
  id?: string
  children: ReactNode
  className?: string
}

const FlowListContainer = ({ id, className, children }: FlowListContainerProps) => {
  return (
    <div id={id} className={cn('w-full pb-5', className)}>
      {children}
    </div>
  )
}

export default FlowListContainer
