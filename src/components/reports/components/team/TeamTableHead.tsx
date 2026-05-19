import TableHeadCellStyled from '@/components/table/TableHeadCellStyled'
import { TeamData } from '@/types/reports/team'
import { TableHead, TableRow } from '@mui/material'

interface HeadCell {
  id: keyof TeamData
  label: string
  align: any
}

const headCells: readonly HeadCell[] = [
  {
    id: 'name',
    align: 'left',
    label: 'Nome',
  },
  {
    id: 'dateOfBirth',
    align: 'left',
    label: 'Idade',
  },
  {
    id: 'occupationArea',
    align: 'left',
    label: 'ÁREA DE ATUAÇÃO',
  },
  {
    id: 'role',
    align: 'left',
    label: 'Função',
  },
  {
    id: 'employmentRelationship',
    align: 'left',
    label: 'Vínculo',
  },
  {
    id: 'genderIdentity',
    align: 'left',
    label: 'Identidade de gênero',
  },
  {
    id: 'race',
    align: 'left',
    label: 'Raça/cor',
  },
  {
    id: 'education',
    align: 'left',
    label: 'Escolaridade',
  },
]

export function TeamTableHead() {
  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableHeadCellStyled key={headCell.id} align={headCell.align}>
            <div style={{ fontWeight: 600 }}>{headCell.label}</div>
          </TableHeadCellStyled>
        ))}
      </TableRow>
    </TableHead>
  )
}
