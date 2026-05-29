import { ChevronDown, ChevronUp } from 'lucide-react'
import { Fragment, ReactNode } from 'react'

const ColumnWithToggle = ({
  children,
  isOpen,
  toggleIcon,
}: {
  children: ReactNode
  isOpen: boolean
  toggleIcon: boolean
}) => {
  return (
    <div className="flex w-full h-full">
      <div className="flex w-1/5 h-full justify-center items-center p-1 border-r-2">
        {toggleIcon && (isOpen ? <ChevronUp /> : <ChevronDown />)}
      </div>
      <div className="flex flex-col px-3 w-full h-full">{children}</div>
    </div>
  )
}

export default ColumnWithToggle
