import { Fragment, ReactNode } from 'react'

interface TableRowCollapseProps<T> {
  isOpen: boolean
  data: T[]
  renderItem: (item: T, index: number) => ReactNode
}

const TableRowCollapse = <T,>({ isOpen, data, renderItem }: TableRowCollapseProps<T>) => {
  return (
    <Fragment>
      {data.map(
        (item, index) => isOpen && <Fragment key={index}>{renderItem(item, index)}</Fragment>,
      )}
    </Fragment>
  )
}

export default TableRowCollapse
