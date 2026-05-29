'use client'

import TableCellStyled from '@/components/table/TableCellStyled'
import { TeamData } from '@/types/reports/team'
import { TableRow } from '@mui/material'
import { useRouter } from 'next/navigation'

export const SetRow = (row: TeamData, index: number) => {
  const router = useRouter()

  const labelId = `enhanced-table-checkbox-${index}`
  return (
    <TableRow
      id={'collaborator' + row.id}
      key={labelId}
      tabIndex={-1}
      className="hover:bg-[#F6FAFB]"
      onClick={() => router.push(`/colaboradores/detalhes/${row?.id}`)}
    >
      <TableCellStyled border={false}>{row.name}</TableCellStyled>
      <TableCellStyled>{row.dateOfBirth}</TableCellStyled>
      <TableCellStyled>{row.occupationArea}</TableCellStyled>
      <TableCellStyled>{row.role}</TableCellStyled>
      <TableCellStyled>{row.employmentRelationship}</TableCellStyled>
      <TableCellStyled>{row.genderIdentity}</TableCellStyled>
      <TableCellStyled>{row.race}</TableCellStyled>
      <TableCellStyled>{row.education}</TableCellStyled>
    </TableRow>
  )
}
