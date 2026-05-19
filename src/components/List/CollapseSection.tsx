import { Collapse } from '@mui/material'
import { ReactNode } from 'react'

interface CollapseSectionProps<T> {
  isOpen: boolean
  data: T[]
  renderItem: (item: T, index: number) => ReactNode
}

const CollapseSection = <T,>({ isOpen, data, renderItem }: CollapseSectionProps<T>) => {
  return (
    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      {data.map((item, index) => renderItem(item, index))}
    </Collapse>
  )
}

export default CollapseSection
