import { downloadFile } from '@/services/files'
import { Button } from '@mui/material'
import { ClearIcon } from '@mui/x-date-pickers'
import { Fragment } from 'react'
import { TitleLabel } from '../layout/TitleLabel'

export type CustomFile = {
  id: number
  file?: File
  fileUrl?: string
}

export const FileItem = ({
  attachments,
  onRemoveFile,
  disabled,
}: {
  attachments: Array<CustomFile> | null
  onRemoveFile?: (id: number) => void
  disabled: boolean
}) => {
  if (!attachments) {
    return <TitleLabel>Nenhum anexo</TitleLabel>
  }

  return (
    <Fragment>
      {attachments.length > 0 ? (
        attachments.map((file, index) => (
          <Button
            key={index}
            size="small"
            variant="outlined"
            endIcon={
              <Fragment>
                {!disabled && onRemoveFile && (
                  <ClearIcon
                    sx={{
                      color: '#155366',
                      borderRadius: 9999,
                      padding: '1px',
                      ':hover': { backgroundColor: 'lightgray' },
                    }}
                    onClick={() => onRemoveFile(file.id)}
                    scale={2}
                  />
                )}
              </Fragment>
            }
            onClick={() => {
              if (file.fileUrl) {
                downloadFile(file?.fileUrl)
              }
            }}
            sx={{
              color: '#155366',
              borderColor: '#248DAD',
              ':disabled': { color: '#155366', borderColor: '#248DAD' },
              width: '170px',
              height: '40px',
              display: 'flex',
            }}
          >
            <p className="flex max-w-[150px] h-full whitespace-nowrap overflow-hidden items-center">
              {file.fileUrl?.split(/-(.*)/)[1] ?? file.file?.name}
            </p>
          </Button>
        ))
      ) : (
        <p>Nenhum anexo disponível.</p>
      )}
    </Fragment>
  )
}
