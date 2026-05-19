import { ReactNode } from 'react'

const MovRoot = ({ children }: { children: ReactNode }) => {
  return <div className="w-full h-full">{children}</div>
}

export { MovRoot }
