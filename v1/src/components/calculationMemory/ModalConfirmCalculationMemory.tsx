import { ICostCenterSubCategory } from '@/types/subCategory'
import { IMonth } from '@/utils/dates'
import { Box, Modal } from '@mui/material'
import { MdCheckCircleOutline, MdOutlineClose } from 'react-icons/md'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  months: IMonth[]
  subCategory: ICostCenterSubCategory
  value: string
  yearBefore?: boolean
}

export function ModalConfirmCalculationMemory({
  open,
  onClose,
  months,
  subCategory,
  value,
  yearBefore = false,
}: Props) {
  const writeMonths = () => {
    let text = ''
    months.forEach((month, index) => {
      text += `${month.name}`
      if (index !== months.length - 1) {
        text += ', '
      }
    })
    return text
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white flex flex-col justify-center items-center w-80 pt-2 pb-6`}
      >
        <div className="w-full border-b border-b-[#E0E0E0] flex justify-between p-3">
          <div className="flex items-center">
            <MdCheckCircleOutline color={'#6FCF97'} size={32} />
            <div className="text-[#4d4d4d] ml-3">Alterações Salvas!</div>
          </div>
          <div>
            <MdOutlineClose size={16} color={'#828282'} onClick={onClose} />
          </div>
        </div>
        <div className="p-3">
          <div className="font-bold mb-5">{subCategory?.name}</div>
          {!yearBefore && <div className="mb-3 font-medium">Cálculo de {value}.</div>}
          {months?.length > 0 && <div>Aplicado aos meses {writeMonths()}.</div>}
        </div>
      </Box>
    </Modal>
  )
}
