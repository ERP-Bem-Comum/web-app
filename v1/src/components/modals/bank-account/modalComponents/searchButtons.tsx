import { GhostButton } from '@/components/layout/Buttons/GhostButton'
import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { Box } from '@mui/material'

interface SearchButtonsProps {
  onClose: () => void
  onSubmit: () => void
}

const SearchButtons = ({ onClose, onSubmit }: SearchButtonsProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'end',
        width: '100%',
        height: 'fit-content',
        paddingY: 3,
      }}
    >
      <GhostButton label="Fechar" onClick={onClose} disabled={false} />
      <SubmitButton
        createLabel="Confirmar Selecionado"
        edit={false}
        editLabel=""
        onClick={onSubmit}
      />
    </Box>
  )
}

export default SearchButtons
