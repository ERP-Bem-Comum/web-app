import { CustomTextField } from '@/components/layout/TextField'
import { CardFooter } from '@/components/ui/card'
import { useApproval } from '@/contexts/approvalsContext'
import { approval } from '@/types/approvals'
import { IEditPayable } from '@/types/Payables'
import { approvalSchema } from '@/validators/approval'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import FormPayable from '../FormPayable'
import { GhostButton } from '@/components/layout/Buttons/GhostButton'
import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { useRouter } from 'next/navigation'

interface ApprovePayableProps {
  payable: IEditPayable | null
}

export const ApprovePayable = ({ payable }: ApprovePayableProps) => {
  const router = useRouter()
  const { onApprove, credentials, isSubmitting, modalConfirmDisclosure, errorMessage, success } =
    useApproval()

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<approval>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      payableId: credentials?.payableId,
      password: credentials?.password,
      obs: '',
    },
  })

  return (
    <div
      className={`bg-[url(../../public/images/backgroundLogin.png)] bg-cover w-screen h-full p-20 `}
    >
      <div className="rounded flex items-center flex-col justify-center bg-white">
        <FormPayable payable={payable} edit={false} approving></FormPayable>
        <CardFooter className="border-t border-[#C4DADF] flex justify-between py-8 w-full  ">
          <form
            onSubmit={handleSubmit(onApprove, (error) => console.error(error))}
            className="w-full"
          >
            <div className="flex justify-between w-full gap-5">
              <CustomTextField
                control={control}
                name="obs"
                label="Observação:"
                editable={true}
                error={errors.obs?.message}
                maxLength={200}
              />

              <section className="flex">
                <GhostButton
                  disabled={isSubmitting}
                  label="Reprovar"
                  onClick={() => setValue('approved', false)}
                />
                <SubmitButton
                  edit={false}
                  createLabel="Aprovar"
                  editLabel=""
                  disabled={isSubmitting}
                  onClick={() => setValue('approved', true)}
                />
              </section>
            </div>
          </form>
          <ModalConfirm
            open={modalConfirmDisclosure.isOpen}
            onClose={() => {
              modalConfirmDisclosure.onClose()
              success && router.push('/login')
            }}
            text={
              success
                ? `Pagamento ${watch('approved') ? 'aprovado' : 'reprovado'} com sucesso!`
                : errorMessage
            }
            success={success}
          />
        </CardFooter>
      </div>
    </div>
  )
}
