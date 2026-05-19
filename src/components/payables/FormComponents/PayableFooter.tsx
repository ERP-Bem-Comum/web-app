import { GhostButton } from '@/components/layout/Buttons/GhostButton'
import { OutlineButton } from '@/components/layout/Buttons/OutlineButton'
import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { CardFooter } from '@/components/ui/card'
import { usePayableContext } from '@/hooks/usePayableContext'
import { useRouter } from 'next/navigation'
import { Fragment } from 'react'

interface PayableFooterProps {
  isDisabled: boolean
  onSubmit: () => void
  edit: boolean
  hasPayable: boolean
  isCreditCard?: boolean
  variant?: 'default' | 'document'
}

export const PayableFooter = ({
  isDisabled,
  onSubmit,
  hasPayable,
  edit,
  isCreditCard = false,
  variant = 'default',
}: PayableFooterProps) => {
  const router = useRouter()

  const {
    disclosure: { modalAlertDisclosure, modalQuestionDisclosure },
  } = usePayableContext()

  return (
    <Fragment>
      <CardFooter
        className={
          variant === 'document'
            ? 'bc-document-footer border-t border-[#e5ded4] flex justify-between px-0'
            : 'border-t border-[#C4DADF] mx-4 flex justify-between py-8 px-0'
        }
      >
        <div className="flex justify-between w-full">
          <OutlineButton
            disabled={!edit}
            label="Adicionar fornecedor"
            onClick={() => router.push('/fornecedores/adicionar')}
          />
          <section>
            {hasPayable && (
              <GhostButton disabled={!edit} label="Excluir" onClick={modalAlertDisclosure.onOpen} />
            )}
            <GhostButton
              disabled={isDisabled}
              label="Descartar"
              onClick={modalQuestionDisclosure.onOpen}
            />
            {!isCreditCard && (
              <SubmitButton
                createLabel="Programar pagamento"
                editLabel="Editar pagamento"
                edit={hasPayable}
                disabled={isDisabled}
                onClick={onSubmit}
              />
            )}
          </section>
        </div>
      </CardFooter>
    </Fragment>
  )
}
