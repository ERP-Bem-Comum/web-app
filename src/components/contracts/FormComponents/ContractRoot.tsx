import { Grid } from '@mui/material'
import { ReactNode } from 'react'

interface ContractRootProps {
  children: ReactNode
}

export const ContractRoot = ({ children }: ContractRootProps) => {
  return (
    <Grid container rowSpacing={2} columnSpacing={2}>
      {children}
    </Grid>
  )
}
