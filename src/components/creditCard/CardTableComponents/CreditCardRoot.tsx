import { Card } from '@/components/ui/card'
import { ReactNode } from 'react'

const Root = ({ children }: { children: ReactNode }) => {
  return <Card className="overflow-hidden">{children}</Card>
}

export { Root }
