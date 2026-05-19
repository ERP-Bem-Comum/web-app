import { OutlineButton } from '@/components/layout/Buttons/OutlineButton'
import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { Modal } from '@mui/material'
import { Fragment, useRef, useState } from 'react'

interface ModalBaseProps {
  open: boolean
  onClose: () => void
  onSubmit: (file: File) => void
  title: string
  text: string
  confirmButton: string
}

export const ModalAnnex = ({
  open,
  onClose,
  title,
  text,
  confirmButton,
  onSubmit,
}: ModalBaseProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [attachments, setAttachments] = useState<File | null>(null)

  const handleAddFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event?.target?.files[0]
      setAttachments(file)
    }
  }

  return (
    <Fragment>
      <Modal
        open={open}
        slotProps={{
          backdrop: {
            onClick: (e) => {
              e.stopPropagation()
              onClose()
            },
          },
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          className={`bg-white border border-solid border-[#155366] rounded-[10px] 
                flex flex-col justify-center items-center w-fit pt-2 px-9 pb-6 gap-8`}
        >
          <h1 className="text-[#000748] font-bold text-xl">{title}</h1>
          <p>{text}</p>
          <div className="flex h-fit gap-5 justify-between w-full">
            <input
              type="text"
              className="h-[40px] w-full border border-solid border-[#E0E0E0] rounded-md p-2"
              disabled
              value={attachments?.name}
            />
            <OutlineButton
              label="Buscar Arquivo"
              onClick={() => inputRef.current?.click()}
              disabled={false}
            />
          </div>
          <SubmitButton
            createLabel={confirmButton}
            edit={false}
            editLabel=""
            onClick={() => {
              if (attachments) {
                onSubmit(attachments)
              }
              onClose()
            }}
          />
          <input
            ref={inputRef}
            disabled={false}
            name="label"
            type="file"
            hidden
            onChange={handleAddFile}
            onClick={(e) => e.stopPropagation()}
            onAuxClick={(e) => e.stopPropagation()}
          />
        </div>
      </Modal>
    </Fragment>
  )
}
