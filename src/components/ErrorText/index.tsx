import { cn } from 'lib/utils'

interface Params {
  children: any
  className?: string
}

export default function ErrorText({ children, className }: Params) {
  return <div className={cn('text-erp-danger text-xs mt-0.5', className)}>{children}</div>
}
