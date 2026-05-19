import { AutoComplete } from '@/components/layout/AutoComplete'
import { CustomTextField } from '@/components/layout/TextField'
import { useOptions } from '@/hooks/useOptions'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Grid, Modal } from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ModalConfirm } from '../ModalConfirm'
import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { CreateCreditCard, CreditCard } from '@/types/creditCard'
import { creditCardSchema } from '@/validators/creditCard'
import useCreditCard from '@/hooks/useCreditCard'
import { GhostButton } from '@/components/layout/Buttons/GhostButton'
import { OutlineButton } from '@/components/layout/Buttons/OutlineButton'
import { ModalQuestion } from '../ModalQuestion'
import { Options } from '@/types/global'
import { useRouter } from 'next/navigation'

interface Props {
  open: boolean
  onClose: () => void
  creditCard: CreditCard | null
}

export function ModalCreditCard({ open, onClose, creditCard }: Props) {
  const [isDeleting, setIsdeleting] = useState(false)
  const {
    options: { bankOptions, Accounts },
  } = useOptions()

  const { errorMessage, isDisabled, form, modals } = useCreditCard()

  const router = useRouter()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCreditCard>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: creditCard?.name ?? '',
      lastDigits: creditCard?.lastDigits ?? '',
      responsible: creditCard?.responsible ?? '',
      instituition: creditCard?.instituition ?? '063 - Banco Bradescard S.A.',
    },
  })

  useEffect(() => {
    reset({
      name: creditCard?.name ?? '',
      lastDigits: creditCard?.lastDigits ?? '',
      responsible: creditCard?.responsible ?? '',
      instituition: creditCard?.instituition ?? '063 - Banco Bradescard S.A.',
      accountId: creditCard?.accountId,
      dueDay: creditCard?.dueDay,
    })
  }, [creditCard, reset])

  return (
    <Modal open={open} onClose={onClose} className="flex items-center justify-center pt-10">
      <Fragment>
        <Box
          className={`bg-white text-black border-[1px] border-solid min-w-80 w-3/4 flex flex-col justify-center items-start p-5 gap-[20px] rounded`}
        >
          <label>Dados do cartão</label>
          <Grid container columnSpacing={1} rowSpacing={2}>
            <Grid item xs={12 / 3}>
              <CustomTextField
                control={control}
                editable
                label="Nome do cartão"
                name="name"
                error={errors.name?.message}
              />
            </Grid>
            <Grid item xs={12 / 3}>
              <CustomTextField
                control={control}
                editable
                label="Quatro últimos dígitos"
                error={errors.lastDigits?.message}
                name="lastDigits"
                maxLength={4}
              />
            </Grid>

            <Grid item xs={12 / 3}>
              <CustomTextField
                control={control}
                label="Nome do responsável"
                name="responsible"
                error={errors.responsible?.message}
                editable
              />
            </Grid>

            <Grid item xs={12 / 3}>
              <AutoComplete
                control={control}
                label="Instituição emissora"
                name="instituition"
                options={bankOptions}
                error={errors.instituition?.message}
                editable={false}
              />
            </Grid>
            <Grid item xs={12 / 3}>
              <AutoComplete
                control={control}
                label="Conta de faturamento"
                name="accountId"
                options={Accounts()}
                error={errors.accountId?.message}
                editable={true}
              />
            </Grid>
            <Grid item xs={12 / 3}>
              <AutoComplete
                error={errors.dueDay?.message}
                control={control}
                editable={true}
                options={
                  Array.from(Array(31).keys()).flatMap((key) => ({
                    id: key + 1,
                    name: String(key + 1),
                  })) as Options[]
                }
                name={'dueDay'}
                label="Dia vencimento:"
              />
            </Grid>
          </Grid>
          <div className="flex gap-5 justify-end w-full">
            {creditCard && (
              <OutlineButton
                label="Deletar cartão"
                onClick={modals.onOpenModalQuestion}
                disabled={false}
              />
            )}
            <GhostButton
              disabled={false}
              label="Descartar"
              onClick={() => {
                onClose()
                reset()
              }}
            />

            <SubmitButton
              createLabel="Adicionar"
              editLabel="Editar"
              edit={!!creditCard?.id}
              disabled={isDisabled}
              onClick={handleSubmit(
                (data, e) =>
                  creditCard?.id
                    ? form.updateCreditCard({ e, id: creditCard.id, data })
                    : form.createCreditCard({ e, data }),
                (errors) => console.error(errors),
              )}
            />
          </div>
        </Box>
        <ModalConfirm
          open={modals.isOpenModalShowConfirm}
          onClose={() => {
            modals.onCloseModalShowConfirm()
            modals.onCloseModalQuestion()
            !errorMessage && onClose()
            if (isDeleting && !errorMessage) {
              router.push('/cartao')
            }
            setIsdeleting(false)
          }}
          text={(() => {
            if (errorMessage) return errorMessage
            if (isDeleting) return 'Cartão excluído com sucesso!'

            if (creditCard?.id) return 'Cartão editado com sucesso!'
            return 'Cartão criado com sucesso'
          })()}
          success={!errorMessage}
        />
        <ModalQuestion
          open={modals.isOpenModalQuestion}
          onClose={modals.onCloseModalQuestion}
          text={
            'Tem certeza de que deseja excluir este cartão? Todos os lançamentos relacionados a ele também serão excluidos'
          }
          onConfirm={handleSubmit(
            (data, e) => {
              form.deleteCreditCard({ e, id: creditCard?.id })
              setIsdeleting(true)
            },
            (errors) => console.error(errors),
          )}
        />
      </Fragment>
    </Modal>
  )
}
