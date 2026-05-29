import { useRef, useState } from 'react'
import { MdOutlineUpload } from 'react-icons/md'
import { Box, ButtonBase, InputAdornment, TextField, useTheme } from '@mui/material'

type Props = {
  label: string
  onChange: any
  error: any
  initialValue?: any
  acceptFile: string
  disabled?: boolean
}

const InputFile = ({
  label,
  onChange,
  error,
  initialValue = null,
  acceptFile,
  disabled = false,
}: Props) => {
  // const ref = useRef()
  const theme = useTheme()
  // const classes = useStyles();
  const [attachment, setAttachment] = useState<any>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event?.target?.files[0]
      setAttachment(file)
      if (onChange) onChange({ target: { files: [file] } })
    }
  }

  return (
    <div className="col d-flex">
      <Box
        position="relative"
        className="col"
        height={38}
        color={error ? theme.palette.error.main : theme.palette.background.paper}
      >
        <Box position="absolute" top={0} bottom={0} left={0} right={0}>
          <TextField
            // className={classes.field}
            sx={{
              '& .MuiFormLabel-root.Mui-disabled': {
                color: theme.palette.text.secondary,
                fontSize: '14px',
              },
              '& .MuiFormLabel-root': {
                paddingRight: '30px',
              },
            }}
            margin="none"
            size="small"
            fullWidth
            disabled
            label={label}
            value={attachment?.name || initialValue}
            error={!!error}
            helperText={error?.message || false}
            InputLabelProps={{
              shrink: !!attachment?.name || !!initialValue,
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <MdOutlineUpload size={20} className="text-erp-primary" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <ButtonBase
          // className={classes.button}
          data-test="label"
          sx={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
          component="label"
          onKeyDown={(e) => e.keyCode === 32}
          disabled={disabled}
        >
          <input
            disabled={disabled}
            // ref={ref}
            name="label"
            type="file"
            accept={acceptFile}
            hidden
            onChange={handleChange}
          />
        </ButtonBase>
      </Box>
    </div>
  )
}

export default InputFile
