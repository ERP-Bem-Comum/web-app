import InputFileV2, { CustomFile } from '@/components/files/InputFIleV2'
import { Grid } from '@mui/material'

interface ReceivableFilesProps {
  onChange: (attachments: Array<CustomFile> | null) => void
  currentFiles: CustomFile[] | undefined
  edit: boolean
}

export const ReceivableFiles = ({ onChange, currentFiles, edit }: ReceivableFilesProps) => {
  return (
    <Grid item xs={12}>
      <InputFileV2 onChange={onChange} initialValue={currentFiles} disabled={!edit} />
    </Grid>
  )
}
