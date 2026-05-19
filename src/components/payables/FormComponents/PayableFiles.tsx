import InputFileV2, { CustomFile } from '@/components/files/InputFIleV2'
import { Grid } from '@mui/material'

interface PayableFilesProps {
  onChange: (attachments: Array<CustomFile> | null) => void
  currentFiles: CustomFile[] | undefined
  edit: boolean
}

export const PayableFiles = ({ onChange, currentFiles, edit }: PayableFilesProps) => {
  return (
    <Grid item xs={12}>
      <InputFileV2 onChange={onChange} initialValue={currentFiles} disabled={!edit} />
    </Grid>
  )
}
