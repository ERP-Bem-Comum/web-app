import { Button } from '@/components/ui/button'
import { getReceivablesCsv, getReceivablesPDF } from '@/services/receivable'
import { ParamsReceivables } from '@/types/receivables'
import { Menu, MenuItem } from '@mui/material'
import { saveAs } from 'file-saver'
import { Fragment, useState } from 'react'

interface ReceivablesExportButtonProps {
  currentParams: ParamsReceivables
}

const ReceivablesExportButton = ({ currentParams }: ReceivablesExportButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleExportCSV = async () => {
    const resp = await getReceivablesCsv(currentParams)
    if (resp.data) {
      saveAs(resp.data, `receivables.csv`)
    }
  }

  const handleExportPDF = async () => {
    const resp = await getReceivablesPDF(currentParams)
    if (resp.data) {
      saveAs(resp.data, `receivables.pdf`)
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
      <Button variant="erpSecondary" className="mr-4" onClick={handleClickListItem}>
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

export { ReceivablesExportButton }
