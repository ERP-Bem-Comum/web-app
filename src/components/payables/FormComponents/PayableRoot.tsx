import { Grid } from '@mui/material'
import { ReactNode } from 'react'

interface PayableRootProps {
  children: ReactNode
}

export const PayableRoot = ({ children }: PayableRootProps) => {
  return (
    <Grid container rowGap={3}>
      {children}
    </Grid>
  )
}
