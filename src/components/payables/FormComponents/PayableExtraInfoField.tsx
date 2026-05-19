import { ExtraInfoField } from '@/components/layout/financeiro/ExtraInfoField'
import { Payable } from '@/types/Payables'
import { Grid } from '@mui/material'

interface PayableExtraInfoFieldProps {
  values: Payable
}

export const PayableExtraInfoField = ({ values }: PayableExtraInfoFieldProps) => {
  return (
    <Grid item xs={12}>
      <ExtraInfoField
        totalValue={values.liquidValue + values.taxValue}
        recurrent={values.recurrent}
        recurrenceData={values.recurenceData}
        dueDate={values.dueDate}
      />
    </Grid>
  )
}
