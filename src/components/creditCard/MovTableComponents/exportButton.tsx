import { Button } from '@/components/ui/button'
import { Menu, MenuItem } from '@mui/material'
import { cn } from 'lib/utils'
import { Fragment, useState } from 'react'

interface ExportButtonMovimentationsProps {
  handleExportCSV: () => void
  handleExportPDF: () => void
  className?: string
}

const ExportButtonMov = ({
  handleExportCSV,
  handleExportPDF,
  className,
}: ExportButtonMovimentationsProps) => {
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
      <Button variant="outline" className={cn('mr-4', className)} onClick={handleClickListItem}>
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

export { ExportButtonMov }
