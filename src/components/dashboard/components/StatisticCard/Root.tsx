import { ReactNode } from 'react'

interface RootProps {
  children: ReactNode
}

export const StatisticCardRoot = ({ children }: RootProps) => {
  return (
    <div className="flex items-center justify-between w-full px-4 py-[19px] gap-6 bg-white rounded-[16px] shadow-sm">
      {children}
    </div>
  )
}
