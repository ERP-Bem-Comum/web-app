import { Grid } from '@mui/material'
import { ReactNode } from 'react'

interface ReceivableRootProps {
  children: ReactNode
}

export const ReceivableRoot = ({ children }: ReceivableRootProps) => {
  return (
    <Grid container rowGap={3}>
      {children}
    </Grid>
  )
}
