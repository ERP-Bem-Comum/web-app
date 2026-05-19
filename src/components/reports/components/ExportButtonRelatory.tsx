import { Button } from '@/components/ui/button'
import { Menu, MenuItem } from '@mui/material'
import { Fragment, useState } from 'react'

interface ExportButtonReportsProps {
  handleExportCSV: () => void
  handleExportPDF?: () => void
}

const ExportButtonReports = ({ handleExportCSV, handleExportPDF }: ExportButtonReportsProps) => {
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

  return (
    <Fragment>
      <Button variant="outlinedSecondary" className="mr-4 font-bold" onClick={handleClickListItem}>
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
        {handleExportPDF && (
          <MenuItem disabled={false} onClick={handleExportPDF}>
            PDF
          </MenuItem>
        )}
      </Menu>
    </Fragment>
  )
}

export { ExportButtonReports }
