import { Button } from '@/components/ui/button'
import { disabledList } from '@/utils/enums'
import { Autocomplete, Box, Modal, TextField } from '@mui/material'
import { MdOutlineWarning } from 'react-icons/md'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  onConfirm: any
  textConfirm?: string
  textCancel?: string
  disableBy: string | null
  setDisableBy: any
}

export function ModalDisabledCollaborator({
  open,
  onClose,
  onConfirm,
  textConfirm = 'Entendi',
  textCancel = 'Cancelar',
  disableBy,
  setDisableBy,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-[1px] border-solid border-erp-danger rounded-[10px] flex flex-col justify-center items-center w-80 pt-2 px-9 pb-6`}
      >
        <MdOutlineWarning color={'#FF5353'} size={32} className="mb-4" />
        <div className="text-center mb-5">Qual o motivo para desativar esse colaborador?</div>
        <Autocomplete
          id="disableBy"
          size="small"
          noOptionsText="Motivo"
          fullWidth
          value={disableBy}
          options={Object.keys(disabledList)}
          getOptionLabel={(options) => disabledList[options]}
          onChange={(_event, newValue) => {
            setDisableBy(newValue)
          }}
          renderInput={(params) => (
            <TextField
              // size="small"
              {...params}
              label="Motivo"
              error={!disableBy}
              helperText={!disableBy ? 'Campo Obrigatório' : ''}
            />
          )}
        />
        <Button
          data-test="modalConfirmDisable"
          className="w-full mb-4 mt-12"
          variant="destructive"
          onClick={onConfirm}
          disabled={!disableBy}
        >
          {textConfirm}
        </Button>
        <Button
          data-test="modalCancelDisable"
          className="w-full"
          variant="erpSecondary"
          onClick={onClose}
        >
          {textCancel}
        </Button>
      </Box>
    </Modal>
  )
}
