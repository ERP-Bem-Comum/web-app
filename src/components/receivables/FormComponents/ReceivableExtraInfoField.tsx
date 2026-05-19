import { ExtraInfoField } from '@/components/layout/financeiro/ExtraInfoField'
import { Receivable } from '@/types/receivables'
import { Grid } from '@mui/material'

interface ReceivableExtraInfoFieldProps {
  values: Receivable
}

export const ReceivableExtraInfoField = ({ values }: ReceivableExtraInfoFieldProps) => {
  return (
    <Grid item xs={12}>
      <ExtraInfoField
        totalValue={values.totalValue}
        recurrent={values.recurrent}
        recurrenceData={values.recurenceData}
        dueDate={values.dueDate}
      />
    </Grid>
  )
}
