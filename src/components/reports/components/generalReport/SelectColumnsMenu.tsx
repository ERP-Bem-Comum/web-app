import { Button } from '@/components/ui/button'
import { DISPONIBLE_COLUMNS } from '@/enums/generalReport'
import { filterReportParamsWithColumns } from '@/types/reports/filters'
import { Checkbox, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import { Fragment, useState } from 'react'
import { UseFormSetValue } from 'react-hook-form'

interface SelectColumnsMenuProps {
  setValue: UseFormSetValue<filterReportParamsWithColumns>
  values: filterReportParamsWithColumns
}

const SelectColumnsMenu = ({ setValue, values }: SelectColumnsMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(null)
  }

  const handleAddColumn = (column: keyof typeof DISPONIBLE_COLUMNS, checked: boolean) => {
    if (!checked) {
      setValue(
        'columns',
        values.columns?.filter((item) => item !== column),
      )
    } else {
      setValue('columns', [...(values.columns ?? []), column])
    }
  }

  return (
    <Fragment>
      <Button variant="outlinedSecondary" className="mr-4 font-bold" onClick={handleClickListItem}>
        Colunas
      </Button>
      <Menu
        id="lock-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'lock-button',
          role: 'listbox',
        }}
      >
        {Object.entries(DISPONIBLE_COLUMNS).map(([key, value], index) => (
          <MenuItem disabled={false} key={'item' + index}>
            <ListItemIcon>
              <Checkbox
                onChange={(e) =>
                  handleAddColumn(key as keyof typeof DISPONIBLE_COLUMNS, e.target.checked)
                }
                checked={values.columns?.includes(key as keyof typeof DISPONIBLE_COLUMNS)}
              />
            </ListItemIcon>
            <ListItemText>{value}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Fragment>
  )
}

export { SelectColumnsMenu }
