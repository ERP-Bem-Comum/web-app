import { GhostButton } from '@/components/layout/Buttons/GhostButton'
import { OutlineButton } from '@/components/layout/Buttons/OutlineButton'
import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { CardFooter } from '@/components/ui/card'
import { useReceivableContext } from '@/hooks/useReceivableContext'
import { useRouter } from 'next/navigation'
import { Fragment } from 'react'

interface ReceivableFooterProps {
  editable: boolean
  onSubmit: () => void
  hasReceivable: boolean
}

export const ReceivableFooter = ({ editable, onSubmit, hasReceivable }: ReceivableFooterProps) => {
  const router = useRouter()

  const {
    disclosure: { modalAlertDisclosure, modalQuestionDisclosure },
    disabled: { isDisabled },
  } = useReceivableContext()

  return (
    <Fragment>
      <CardFooter className="border-t border-[#C4DADF] mx-4 flex justify-between py-8 px-0">
        <div className="flex justify-between w-full">
          <OutlineButton
            disabled={!editable}
            label="Adicionar um financiador"
            onClick={() => router.push('/financiadores/adicionar')}
          />
          <section>
            {hasReceivable && (
              <GhostButton
                disabled={!editable}
                label="Excluir"
                onClick={modalAlertDisclosure.onOpen}
              />
            )}
            <GhostButton
              disabled={isDisabled}
              label="Descartar"
              onClick={modalQuestionDisclosure.onOpen}
            />
            <SubmitButton
              createLabel="Adicionar Recebimento"
              editLabel="Editar Recebimento"
              edit={hasReceivable}
              disabled={isDisabled}
              onClick={onSubmit}
            />
          </section>
        </div>
      </CardFooter>
    </Fragment>
  )
}
