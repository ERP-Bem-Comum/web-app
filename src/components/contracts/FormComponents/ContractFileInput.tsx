import { CustomFile } from '@/components/files/fileItem'
import InputFileV2 from '@/components/files/InputFIleV2'
import { Grid } from '@mui/material'

interface ContractFileInput {
  onChange: (attachments: Array<CustomFile> | null) => void
  initialValue?: CustomFile[] | null
}

export const ContractFileInput = ({ onChange, initialValue }: ContractFileInput) => {
  return (
    <Grid item xs={12}>
      <InputFileV2 onChange={onChange} initialValue={initialValue} />
    </Grid>
  )
}
