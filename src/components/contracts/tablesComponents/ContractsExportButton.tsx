import { Button } from '@/components/ui/button'
import { getContractsPDF, getCotnractsCSV } from '@/services/contracts'
import { ParamsContracts } from '@/types/contracts'
import { Menu, MenuItem } from '@mui/material'
import { saveAs } from 'file-saver'
import { Fragment, ReactNode, useState } from 'react'
import styles from '../contractsGrid.module.css'

interface ContractsExportButtonProps {
  currentParams: ParamsContracts
  icon?: ReactNode
}

const ContractsExportButton = ({ currentParams, icon }: ContractsExportButtonProps) => {
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
      <Button variant="ghost" className={styles.secondaryAction} onClick={handleClickListItem}>
        {icon}
        Exportar
      </Button>
      <Menu
        id="export-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'export-button',
            role: 'listbox',
          },
        }}
        slotProps={{
          paper: {
            sx: {
              border: '0.5px solid #e5ded4',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
              padding: '4px',
              minWidth: '140px',
            },
          },
        }}
      >
        <MenuItem
          disabled={false}
          onClick={handleExportCSV}
          sx={{
            fontSize: '12px',
            color: '#332e29',
            borderRadius: '4px',
            padding: '7px 10px',
            '&:hover': {
              background: '#e8eef5',
            },
          }}
        >
          CSV
        </MenuItem>
        <MenuItem
          disabled={false}
          onClick={handleExportPDF}
          sx={{
            fontSize: '12px',
            color: '#332e29',
            borderRadius: '4px',
            padding: '7px 10px',
            '&:hover': {
              background: '#e8eef5',
            },
          }}
        >
          PDF
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export { ContractsExportButton }
