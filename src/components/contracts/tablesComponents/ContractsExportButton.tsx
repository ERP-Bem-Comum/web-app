import { Button } from '@/components/ui/button'
import { getContractsPDF, getCotnractsCSV } from '@/services/contracts'
import { ParamsContracts } from '@/types/contracts'
import { Menu, MenuItem } from '@mui/material'
import { saveAs } from 'file-saver'
import { Fragment, useState } from 'react'

interface ContractsExportButtonProps {
  currentParams: ParamsContracts
}

const ContractsExportButton = ({ currentParams }: ContractsExportButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleExportCSV = async () => {
    const resp = await getCotnractsCSV(currentParams)
    if (resp.data) {
      saveAs(resp.data, 'contratos.csv')
    }
  }

  const handleExportPDF = async () => {
    const resp = await getContractsPDF(currentParams)
    if (resp.data) {
      saveAs(resp.data, 'contratos.pdf')
    }
  }

  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(null)
  }

  return (
    <Fragment>
      <Button variant="erpSecondary" onClick={handleClickListItem}>
        Exportar
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
        <MenuItem disabled={false} onClick={handleExportCSV}>
          CSV
        </MenuItem>
        <MenuItem disabled={false} onClick={handleExportPDF}>
          PDF
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export { ContractsExportButton }
