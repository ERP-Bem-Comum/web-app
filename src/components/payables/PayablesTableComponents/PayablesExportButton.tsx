import { Button } from '@/components/ui/button'
import { getPayablesCsv, getPayablesPDF } from '@/services/payables'
import { ParamsPayables } from '@/types/Payables'
import { Menu, MenuItem } from '@mui/material'
import { saveAs } from 'file-saver'
import { Fragment, useState } from 'react'

interface PayablesExportButtonProps {
  currentParams: ParamsPayables
  onExportCNAB: () => void
}

const PayablesExportButton = ({ currentParams, onExportCNAB }: PayablesExportButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleExportCSV = async () => {
    const resp = await getPayablesCsv(currentParams)
    if (resp.data) {
      saveAs(resp.data, 'pagamentos.csv')
    }
  }

  const handleExportPDF = async () => {
    const resp = await getPayablesPDF(currentParams)
    if (resp.data) {
      saveAs(resp.data, 'pagamentos.pdf')
    }
  }

  const handleExportCNAB = async () => {
    await onExportCNAB()
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
        <MenuItem disabled={false} onClick={handleExportCNAB}>
          CNAB
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export { PayablesExportButton }
