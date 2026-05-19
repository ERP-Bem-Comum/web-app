import { ReactNode } from 'react'

interface ReportsRootProps {
  children: ReactNode
}

const ReportsRoot = ({ children }: ReportsRootProps) => {
  return <div className="w-full h-full p-2 bg-[#FEFFFF] rounded">{children}</div>
}

export default ReportsRoot
