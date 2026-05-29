import { Button } from '@/components/ui/button'
import { Box, Modal } from '@mui/material'
import { cn } from 'lib/utils'
import { Loader2 } from 'lucide-react'
import { ReactNode, SetStateAction } from 'react'
import { Control, SubmitHandler } from 'react-hook-form'
import { MdOutlineClose } from 'react-icons/md'
import { ModalConfirm } from '../../modals/ModalConfirm'
import { Card, CardContent, CardFooter, CardHeader } from '../../ui/card'

type FieldValues = {
  [key: string]: any
}

interface Props<T extends FieldValues> {
  open: boolean
  control: Control<T>
  onClose: () => void
  onSubmit: SubmitHandler<T>
  children: ReactNode
  title: string
  edit: boolean
  errorMessage: string
  success: boolean
  isDisabled: boolean
  showModalConfirm: boolean
  setShowModalConfirm: (value: SetStateAction<boolean>) => void
}

export function ModalBase<T extends FieldValues>({
  open,
  onClose,
  onSubmit,
  control,
  children,
  title,
  edit,
  errorMessage,
  success,
  isDisabled,
  showModalConfirm,
  setShowModalConfirm,
}: Props<T>) {
  return (
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
      className=""
    >
      <Box className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 `}>
        <Card className="w-96 p-4">
          <CardHeader className="h-16 flex flex-row items-center justify-between border-b border-erp-neutrals mb-8 px-0">
            <div className="text-xl">
              {edit ? 'Editar ' : 'Adicionar '} {title}
            </div>
            <Button
              variant="ghost"
              size="none"
              data-test="close"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              disabled={isDisabled}
            >
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <form onSubmit={control.handleSubmit(onSubmit)}>
            <CardContent className={cn('flex w-full p-0 m-0')}>{children}</CardContent>
            <CardFooter className="flex flex-col items-stretch py-4 px-0">
              <Button
                data-test="submit"
                variant="erpPrimary"
                type="submit"
                disabled={isDisabled}
                onSubmit={(e) => e.stopPropagation()}
              >
                {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {edit ? 'Salvar ' : 'Adicionar '} {title}
              </Button>
              <Button
                data-test="cancel"
                className="mt-4"
                variant="ghost"
                disabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
              >
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
        <ModalConfirm
          open={showModalConfirm}
          onClose={() => {
            setShowModalConfirm(false)
            success && onClose()
          }}
          text={success ? `${title} ${edit ? 'alterada' : 'criada'} com sucesso!` : errorMessage}
          success={success}
        />
      </Box>
    </Modal>
  )
}
