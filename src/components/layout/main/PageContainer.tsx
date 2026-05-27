import { ReactNode } from 'react'

export default function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full z-0 overflow-hidden min-w-0">
      <div className="h-full w-full py-8 px-4 min-w-0">{children}</div>
    </div>
  )
}
