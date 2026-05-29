import TableHeadCellStyled from '@/components/table/TableHeadCellStyled'
import { HeadCell } from '@/types/global'
import { TableHead, TableRow } from '@mui/material'
import sortButton from '../../../public/images/Sorting.svg'
import Image from 'next/image'
import { ReactNode } from 'react'

interface EnhancedTableHeadProps {
  headCells: Array<HeadCell>
  selectComponent?: ReactNode
}

export const EnhancedTableHead = ({ headCells, selectComponent }: EnhancedTableHeadProps) => {
  return (
    <TableHead>
      <TableRow>
        {selectComponent && (
          <TableHeadCellStyled key={'defaultSelector'} align={'center'}>
            <div
              style={{
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              {selectComponent}
            </div>
          </TableHeadCellStyled>
        )}
        {headCells.map((headCell) => {
          const justifyContent =
            headCell.align === 'center'
              ? 'center'
              : headCell.align === 'right'
                ? 'flex-end'
                : 'space-between'
          return (
            <TableHeadCellStyled key={headCell.id} align={headCell.align} width={headCell.width}>
              <div
                style={{
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent,
                }}
              >
                {headCell.label}
                {headCell.sortable && headCell.onSort && (
                  <Image
                    src={sortButton}
                    alt="teste"
                    className="aspect-square object-cover cursor-pointer"
                    onClick={headCell.onSort}
                  />
                )}
              </div>
            </TableHeadCellStyled>
          )
        })}
      </TableRow>
    </TableHead>
  )
}
