import { cn } from 'lib/utils'
import { ReactNode } from 'react'

interface TitleLabelProps {
  children: ReactNode
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

export const Label = ({ children, icon, size = 'md', className }: TitleLabelProps) => {
  return (
    <label className={cn('text-black', `text-${size} flex items-center gap-3`, className)}>
      {icon}
      {''}
      {children}
    </label>
  )
}
