import { HeadCell } from '@/types/global'
import { Grid } from '@mui/material'

interface ListHeaderProps {
  headCells: Array<HeadCell>
  sizes?: Array<number>
  columns?: number
}
const ListHeader = ({ headCells, sizes = [3, 3, 3, 3], columns = 12 }: ListHeaderProps) => {
  return (
    <Grid
      container
      columns={columns}
      sx={{
        backgroundColor: '#BFEDFC',
        color: 'black',
        fontWeight: 600,
        paddingY: 2,
        paddingLeft: 3,
        flexWrap: 'nowrap',
        width: 'max-content',
        minWidth: '100%',
      }}
    >
      {headCells.map((headCell, index) => (
        <Grid
          item
          key={headCell.id}
          xs={sizes[index] ?? 3}
          width={'100px'}
          minWidth={'fit-content'}
          padding={1}
        >
          <div
            style={{
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            {headCell.label}
          </div>
        </Grid>
      ))}
    </Grid>
  )
}

export default ListHeader
