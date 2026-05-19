import { cn } from 'lib/utils'
import { ReactNode } from 'react'

interface TitleLabelProps {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

export const TitleLabel = ({ children, size = 'md', className }: TitleLabelProps) => {
  return (
    <label className={cn(`text-black font-[400] text-${size} min-w-fit`, className)}>
      {children}
    </label>
  )
}
