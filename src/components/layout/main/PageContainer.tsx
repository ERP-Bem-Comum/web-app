import { ReactNode } from 'react'

export default function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full z-0 overflow-hidden">
      <div className="h-full w-full py-8 px-6">{children}</div>
    </div>
  )
}
